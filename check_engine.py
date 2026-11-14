"""Quality checks for the calculation engine.

Run with:  .venv/bin/python check_engine.py
Every check compares a result with a range that published references or plain
logic say it must fall in. If one fails, the engine is wrong and must be fixed
before anything is shown to a farmer or a judge.
"""

import itertools

import nasa_power
import rotation
import water
from crops import CROPS

passed, failed = 0, 0


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
    else:
        failed += 1
        print(f"FAILED  {name}  {detail}")


for zone_name, zone in nasa_power.ZONES.items():
    daily, _ = nasa_power.load(zone_name)

    # 1. Reference evapotranspiration: tropical lowlands sit between 3 and 6.5 mm/day.
    et0 = water.reference_et(daily, zone["lat"], zone["elev"])
    check(f"{zone_name}: ET0 mean in 3-6.5 mm/day", 3 <= et0.mean() <= 6.5, f"{et0.mean():.2f}")
    check(f"{zone_name}: ET0 has no gaps inside the record",
          et0[: et0.last_valid_index()].isna().sum() == 0)

    for soil, month in itertools.product(("clay", "loam", "sandy"), (1, 4, 7, 10)):
        needs = water.crop_needs(daily, zone, soil, month)
        label = f"{zone_name}/{soil}/month {month}"

        # 2. Flooded rice: literature gives roughly 9,000-25,000 m3 per hectare per cycle.
        rice_ha = needs["rice"]["typical_m3"] * water.TAREAS_PER_HECTARE
        check(f"{label}: rice 9,000-25,000 m3/ha", 9000 <= rice_ha <= 25000, f"{rice_ha:.0f}")

        # 3. Every other crop must need less water than rice, and a dry year more than a typical one.
        for key, need in needs.items():
            if key != "rice":
                check(f"{label}: {key} needs less than rice",
                      need["typical_m3"] < needs["rice"]["typical_m3"])
            check(f"{label}: {key} dry year >= typical", need["dry_m3"] >= need["typical_m3"] - 1e-6)
            check(f"{label}: {key} uses 20+ years of data", need["years"] >= 20)

        for allocation, priority, rice_allowed in itertools.product(
            (0, 0.3, 0.6, 1.0), ("water", "soil", "income"), (True, False)
        ):
            result = rotation.compare(daily, zone, soil, month, 100, allocation, priority, rice_allowed)
            for s in result["strategies"]:
                tag = f"{label}/water {allocation}/{priority}/{s['key']}"
                planted = sum(p["tareas"] for p in s["plots"])
                # 4. Never plant more land than the farm has, never use more water than delivered.
                check(f"{tag}: land within farm", planted <= 100 + 1e-6, f"{planted:.1f}")
                check(f"{tag}: water within budget",
                      s["water_m3"] <= result["budget_m3"] + 1e-6,
                      f"{s['water_m3']:.0f} > {result['budget_m3']:.0f}")
                # 5. Scores stay between 0 and 100.
                check(f"{tag}: scores 0-100",
                      all(-1e-6 <= v <= 100 + 1e-6 for v in s["scores"].values()), str(s["scores"]))
                # 6. No rice when rice is prohibited.
                if not rice_allowed:
                    check(f"{tag}: no rice when prohibited",
                          all(p["crop"] != "rice" for p in s["plots"]))
            # 7. An empty farm must never be the best option when there is water.
            best = result["strategies"][0]
            if allocation >= 0.3:
                check(f"{label}/water {allocation}/{priority}: best strategy plants something",
                      len(best["plots"]) > 0)

# 8. Crop table is complete.
for key, crop in CROPS.items():
    check(f"{key}: has both names", bool(crop["es"]) and bool(crop["en"]))
    check(f"{key}: Kc values plausible", all(0.2 <= k <= 1.3 for k in crop["kc"]))

print(f"{passed} checks passed, {failed} failed")
raise SystemExit(1 if failed else 0)
