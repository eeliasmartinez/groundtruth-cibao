"""Rotation strategies for a rice farm when irrigation water is limited.

Given the farm (zone, soil, area), the cycle (planting month) and the water the
irrigation authority will deliver, this module builds four strategies and
scores each one on water, soil and income:

  current   keep planting only rice, on as much land as the water allows
  mixed     rice on part of the land, a legume on the rest
  rotation  skip rice this cycle and plant a low-water crop to sell
  green     skip rice this cycle and grow a green manure to rebuild the soil

"allocation" is the share of the water a full rice crop would need that the
farmer will actually receive (1.0 = all of it, 0.6 = 60%).
The scores are a transparent guide for comparing options, not a prediction.
"""

import water
from crops import CASH_CROPS, CROPS, LEGUMES

MIN_ROTATION_SHARE = 0.25  # "mixed" always rotates at least a quarter of the land
NITROGEN_TARGET_KG_HA = 100  # nitrogen per hectare that earns the full soil score
UREA_NITROGEN = 0.46  # urea fertilizer is 46% nitrogen
UREA_SACK_KG = 45.4  # one 100-lb sack
PRIORITY_WEIGHT = 0.5  # weight of the farmer's top priority; the other two share the rest

# Basin-wide estimate. Rice area nationwide: about 1.5 million tareas planted
# (elDinero, 25 Mar 2026). Each basin's area is that total times the share of
# national rice production of its provinces (same source).
# ASSUMPTION: area is proportional to production. To be validated.
# Dam capacities in millions of m3: INDRHI figures reported by Diario Libre, 11 Aug 2026.
NATIONAL_RICE_TAREAS = 1_500_000
BASINS = {
    "Yaque del Norte": {
        # Montecristi 17.5% + Valverde 6.62% + Santiago 0.90%
        "rice_share": 0.175 + 0.0662 + 0.0090,
        "dams": {"Tavera": 131.77, "Bao": 187.76, "Monción": 330.13},
    },
    "Yuna - Camú": {
        # Duarte 29.5% + La Vega 14.2% + Sánchez Ramírez 9.4% + Monseñor Nouel 2.18%
        "rice_share": 0.295 + 0.142 + 0.094 + 0.0218,
        "dams": {"Hatillo": 374.88, "Rincón": 59.40},
    },
    "Yaque del Sur": {
        # Whole "Sur" region: 4.98% of national rice production (province split not published)
        "rice_share": 0.0498,
        "dams": {"Sabana Yegua": 341.84, "Sabaneta": 56.5},
    },
}


def suitability(crop_key, need, soil, salty):
    """How well a crop fits this place and season, from 0 (poor) to 1 (good).

    Returns (score, warning codes).
    """
    crop = CROPS[crop_key]
    warnings = []

    heat = 1 - (need["tmax"] - crop["heat_limit"]) / 5
    heat = max(0.0, min(1.0, heat))
    if heat < 1:
        warnings.append("heat")

    if soil == "clay":
        ground = 0.25 + 0.15 * crop["heavy_soil"]
        if crop["heavy_soil"] <= 2:
            warnings.append("heavy_soil")
    elif soil == "sandy" and crop["flooded"]:
        ground = 0.7
        warnings.append("sandy_rice")
    else:
        ground = 1.0

    salt = 1.0
    if salty and crop["salt_limit"] < 3:
        salt = 0.6
        warnings.append("salt")

    return heat * ground * salt, warnings


def best_crop(candidates, needs, fit, priority):
    """Pick the candidate that best serves the farmer's priority."""

    def value(key):
        if priority == "water":
            return fit[key][0] / max(needs[key]["typical_m3"], 1)
        if priority == "soil":
            return fit[key][0] * (CROPS[key]["nitrogen"] + 10)
        return fit[key][0] * CROPS[key]["market"]

    return max(candidates, key=value)


def _strategy(key, plots, area, needs, fit, baseline_m3, budget_m3, priority, alternative=None):
    """Add up water, nitrogen and scores for a list of (crop, tareas) plots."""
    plots = [(crop, tareas) for crop, tareas in plots if tareas > 0.005]
    planted = sum(tareas for _, tareas in plots)
    water_m3 = sum(needs[crop]["typical_m3"] * tareas for crop, tareas in plots)
    water_dry_m3 = sum(needs[crop]["dry_m3"] * tareas for crop, tareas in plots)
    nitrogen_kg = sum(
        CROPS[crop]["nitrogen"] * tareas / water.TAREAS_PER_HECTARE for crop, tareas in plots
    )
    rotated = sum(tareas for crop, tareas in plots if crop != "rice")

    hectares = area / water.TAREAS_PER_HECTARE
    # Saving water only counts on land that is kept producing: an empty field
    # "saves" water but helps nobody.
    saved_share = 1 - water_m3 / baseline_m3 if baseline_m3 else 0
    water_score = 100 * saved_share * planted / area
    soil_score = 100 * (
        0.5 * min(1, nitrogen_kg / (hectares * NITROGEN_TARGET_KG_HA)) + 0.5 * rotated / area
    )
    income_score = 100 * sum(
        tareas * CROPS[crop]["market"] * fit[crop][0] for crop, tareas in plots
    ) / (area * 5)

    scores = {"water": water_score, "soil": soil_score, "income": income_score}
    other = (1 - PRIORITY_WEIGHT) / 2
    scores["overall"] = sum(
        value * (PRIORITY_WEIGHT if name == priority else other)
        for name, value in scores.items()
    )

    warnings = []
    for crop, _ in plots:
        for code in fit[crop][1]:
            if code not in warnings:
                warnings.append(code)
    if area - planted > 0.005:
        warnings.append("idle_land")
    if any(CROPS[crop]["market"] <= 2 for crop, _ in plots if crop != "sesbania"):
        warnings.append("weak_market")
    if plots and all(CROPS[crop]["market"] == 0 for crop, _ in plots):
        warnings.append("no_income")
    if water_dry_m3 > budget_m3 * 1.02:
        warnings.append("short_in_dry_year")

    return {
        "key": key,
        "alternative": alternative,
        "plots": [
            {"crop": crop, "tareas": tareas, "water_m3": needs[crop]["typical_m3"] * tareas}
            for crop, tareas in plots
        ],
        "idle_tareas": area - planted,
        "water_m3": water_m3,
        "water_dry_m3": water_dry_m3,
        "saved_m3": baseline_m3 - water_m3,
        "saved_share": 1 - water_m3 / baseline_m3 if baseline_m3 else 0,
        "nitrogen_kg": nitrogen_kg,
        "urea_sacks": nitrogen_kg / UREA_NITROGEN / UREA_SACK_KG,
        "scores": scores,
        "warnings": warnings,
    }


def compare(daily, zone, soil, planting_month, area, allocation, priority,
            rice_allowed=True, salty=False):
    """Build and rank the four strategies. Returns a dictionary with everything
    the screen needs: water per crop, the water budget and the strategies."""
    needs = water.crop_needs(daily, zone, soil, planting_month)
    return compare_needs(needs, soil, area, allocation, priority, rice_allowed, salty)


def compare_needs(needs, soil, area, allocation, priority, rice_allowed=True, salty=False):
    """Same as compare(), starting from water needs that were already computed.
    The web page repeats exactly this calculation in the browser."""
    fit = {key: suitability(key, needs[key], soil, salty) for key in CROPS}

    rice_need = needs["rice"]["typical_m3"]
    baseline_m3 = rice_need * area  # water for rice on the whole farm
    budget_m3 = allocation * baseline_m3

    def affordable(crop, tareas, budget):
        """Largest area of a crop (up to 'tareas') the budget can irrigate."""
        return min(tareas, budget / needs[crop]["typical_m3"])

    legume = best_crop(LEGUMES, needs, fit, priority)
    cash = best_crop(CASH_CROPS, needs, fit, priority)

    # current: rice only
    rice_only = affordable("rice", area, budget_m3) if rice_allowed else 0
    common = (area, needs, fit, baseline_m3, budget_m3, priority)
    current = _strategy("current", [("rice", rice_only)], *common)

    # mixed: fill the land with rice + legume without exceeding the budget
    legume_need = needs[legume]["typical_m3"]
    if rice_allowed:
        rice_part = (budget_m3 - area * legume_need) / (rice_need - legume_need)
        rice_part = max(0, min(rice_part, area * (1 - MIN_ROTATION_SHARE)))
    else:
        rice_part = 0
    legume_part = affordable(legume, area - rice_part, budget_m3 - rice_part * rice_need)
    mixed = _strategy(
        "mixed", [("rice", rice_part), (legume, legume_part)], *common, alternative=legume
    )

    # rotation: low-water crop to sell on the whole farm
    rotation = _strategy(
        "rotation", [(cash, affordable(cash, area, budget_m3))], *common, alternative=cash
    )

    # green: green manure on the whole farm
    green = _strategy(
        "green", [("sesbania", affordable("sesbania", area, budget_m3))],
        *common, alternative="sesbania",
    )

    strategies = sorted(
        [current, mixed, rotation, green], key=lambda s: s["scores"]["overall"], reverse=True
    )
    return {
        "needs": needs,
        "fit": fit,
        "baseline_m3": baseline_m3,
        "budget_m3": budget_m3,
        "strategies": strategies,
    }


def basin_savings(basin, rice_need_m3, other_need_m3, share):
    """Water saved if a share of a basin's rice land rotates one cycle.

    Returns the saving measured at the fields, in millions of m3, and that
    saving as a fraction of each dam's capacity. This is a conservative figure:
    the dams release more than the fields receive (irrigation efficiency in the
    Yaque del Norte is under 30%, UNCCD 2024), so the real saving at the dam is larger.
    """
    rice_tareas = NATIONAL_RICE_TAREAS * BASINS[basin]["rice_share"]
    field = share * rice_tareas * (rice_need_m3 - other_need_m3) / 1e6
    return {
        "tareas": share * rice_tareas,
        "field_million_m3": field,
        "dam_share": {name: field / size for name, size in BASINS[basin]["dams"].items()},
    }
