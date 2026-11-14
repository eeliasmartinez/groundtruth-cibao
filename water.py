"""How much irrigation water each crop needs, computed from NASA POWER data.

Method: FAO Irrigation and Drainage Paper 56 (Allen et al., 1998).
  1. Reference evapotranspiration (ET0): the water a well-watered grass field
     loses in a day, from temperature, sun, humidity and wind (Penman-Monteith).
  2. Crop water use = ET0 x Kc, where Kc depends on the crop and its growth stage.
  3. Irrigation need = crop water use - the part of the rain the crop can use.
The calculation is repeated for every planting year from 2001 to 2025, so the answer comes with
a typical year (median) and a dry year (8 out of 10 years need less than this).
"""

import numpy as np
import pandas as pd

from nasa_power import LAST_PLANTING_YEAR

from crops import (
    CROPS,
    RICE_PERCOLATION_MM_PER_DAY,
    RICE_SATURATION_MM,
    RICE_WATER_LAYER_MM,
)

TAREA_M2 = 628.86  # one Dominican tarea in square meters
M3_PER_TAREA_PER_MM = TAREA_M2 / 1000  # 1 mm of water over one tarea, in m3
TAREAS_PER_HECTARE = 10000 / TAREA_M2
PLANTING_DAY = 15  # crops are assumed planted on the 15th of the chosen month


def reference_et(daily, latitude, elevation):
    """Daily ET0 in mm/day (FAO-56 Penman-Monteith, equation 6)."""
    tmax, tmin = daily["tmax"], daily["tmin"]
    tmean = (tmax + tmin) / 2
    wind = daily["wind"].interpolate(limit_direction="both")
    humidity = daily["humidity"].interpolate(limit_direction="both")
    # Fill the few days without a solar value with the usual value for that date.
    solar = daily["solar"].fillna(
        daily["solar"].groupby(daily.index.dayofyear).transform("mean")
    )

    def saturation_pressure(temp):  # kPa
        return 0.6108 * np.exp(17.27 * temp / (temp + 237.3))

    es = (saturation_pressure(tmax) + saturation_pressure(tmin)) / 2
    ea = es * humidity / 100
    slope = 4098 * saturation_pressure(tmean) / (tmean + 237.3) ** 2
    pressure = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
    gamma = 0.000665 * pressure

    # Sunshine reaching the top of the atmosphere for this latitude and date
    day = daily.index.dayofyear.values
    lat = np.radians(latitude)
    distance = 1 + 0.033 * np.cos(2 * np.pi * day / 365)
    declination = 0.409 * np.sin(2 * np.pi * day / 365 - 1.39)
    sunset = np.arccos(-np.tan(lat) * np.tan(declination))
    top_of_atmosphere = (24 * 60 / np.pi) * 0.0820 * distance * (
        sunset * np.sin(lat) * np.sin(declination)
        + np.cos(lat) * np.cos(declination) * np.sin(sunset)
    )
    clear_sky = (0.75 + 2e-5 * elevation) * top_of_atmosphere

    net_shortwave = 0.77 * solar
    cloudiness = (solar / clear_sky).clip(0.3, 1.0)
    net_longwave = (
        4.903e-9
        * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4)
        / 2
        * (0.34 - 0.14 * np.sqrt(ea))
        * (1.35 * cloudiness - 0.35)
    )
    net_radiation = net_shortwave - net_longwave

    et0 = (
        0.408 * slope * net_radiation
        + gamma * 900 / (tmean + 273) * wind * (es - ea)
    ) / (slope + gamma * (1 + 0.34 * wind))
    return et0.clip(lower=0).rename("et0")


def usable_rain(daily):
    """Daily rain the crop can actually use, in mm/day.

    FAO Training Manual No. 3 rule, applied to each month's total:
    usable = 0.8 x rain - 25 if the month has more than 75 mm, else 0.6 x rain - 10.
    The monthly amount is then spread evenly over the days of that month.
    """
    month_start = daily.index.to_period("M").start_time
    monthly_rain = daily["rain"].fillna(0).groupby(month_start).transform("sum")
    usable = np.where(monthly_rain > 75, 0.8 * monthly_rain - 25, 0.6 * monthly_rain - 10)
    usable = np.clip(usable, 0, None)
    return pd.Series(usable / daily.index.days_in_month, index=daily.index, name="usable_rain")


def kc_curve(crop):
    """Water-use coefficient for every day of the crop's season."""
    initial, development, mid, late = crop["stages"]
    kc_ini, kc_mid, kc_end = crop["kc"]
    return np.concatenate(
        [
            np.full(initial, kc_ini),
            np.linspace(kc_ini, kc_mid, development, endpoint=False),
            np.full(mid, kc_mid),
            np.linspace(kc_mid, kc_end, late),
        ]
    )


def season_needs(daily, et0, rain, crop_key, soil, planting_month):
    """Irrigation need of one crop for every year on record.

    Returns a table with one row per planting year: crop water use, usable rain,
    net irrigation need (all in mm) and the average daily maximum temperature.
    """
    crop = CROPS[crop_key]
    kc = kc_curve(crop)
    percolation = RICE_PERCOLATION_MM_PER_DAY[soil] if crop["flooded"] else 0
    rows = []
    for year in range(daily.index[0].year, LAST_PLANTING_YEAR + 1):
        start = pd.Timestamp(year, planting_month, PLANTING_DAY)
        end = start + pd.Timedelta(days=len(kc) - 1)
        if end > et0.last_valid_index():
            break
        crop_use = et0[start:end].values * kc
        rain_used = rain[start:end].values
        # Rain is only useful up to what the field needs that day.
        net = np.clip(crop_use + percolation - rain_used, 0, None).sum()
        if crop["flooded"]:
            net += RICE_SATURATION_MM + RICE_WATER_LAYER_MM
        rows.append(
            {
                "year": year,
                "crop_use_mm": crop_use.sum(),
                "usable_rain_mm": rain_used.sum(),
                "net_mm": net,
                "tmax": daily["tmax"][start:end].mean(),
            }
        )
    return pd.DataFrame(rows).set_index("year")


def crop_needs(daily, zone, soil, planting_month, et0=None, rain=None):
    """Summary for every crop: water per tarea in a typical and a dry year.

    Returns {crop: {days, typical_m3, dry_m3, crop_use_mm, usable_rain_mm,
    rain_share, tmax, years}}. rain_share is the fraction of the crop's water
    use that rain alone covers in a typical year.
    et0 and rain can be passed in when they were already computed for the zone.
    """
    if et0 is None:
        et0 = reference_et(daily, zone["lat"], zone["elev"])
    if rain is None:
        rain = usable_rain(daily)
    summary = {}
    for key, crop in CROPS.items():
        years = season_needs(daily, et0, rain, key, soil, planting_month)
        crop_use = years["crop_use_mm"].median()
        summary[key] = {
            "days": sum(crop["stages"]),
            "typical_m3": years["net_mm"].median() * M3_PER_TAREA_PER_MM,
            "dry_m3": years["net_mm"].quantile(0.8) * M3_PER_TAREA_PER_MM,
            "crop_use_mm": crop_use,
            "usable_rain_mm": years["usable_rain_mm"].median(),
            "rain_share": min(1.0, years["usable_rain_mm"].median() / crop_use),
            "tmax": years["tmax"].median(),
            "years": len(years),
        }
    return summary
