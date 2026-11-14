"""NASA POWER data for the Cibao zones.

Downloads daily climate data from NASA POWER (https://power.larc.nasa.gov),
keeps a saved copy in the data/ folder so the app also works without internet,
and summarizes the daily values by month and by year.

Run "python nasa_power.py" to refresh the saved copy of every zone.
"""

import json
import unicodedata
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
FIRST_DAY = "20010101"
NORMAL_YEARS = ("2001", "2025")  # the 25 complete years used everywhere in the project
LAST_PLANTING_YEAR = 2025  # crops planted after this year are not counted
DATA_DIR = Path(__file__).parent / "data"

# NASA POWER describes ~50 km squares. Temperature falls about 6.5 C for every
# 1000 m of elevation, so we adjust it from the square's average elevation to
# the real elevation of each zone.
LAPSE_RATE_C_PER_KM = 6.5

# NASA POWER parameter name -> column name used in this app
PARAMETERS = {
    "T2M": "temp",  # mean air temperature, C
    "T2M_MAX": "tmax",  # daily maximum temperature, C
    "T2M_MIN": "tmin",  # daily minimum temperature, C
    "PRECTOTCORR": "rain",  # rainfall, mm/day
    "ALLSKY_SFC_SW_DWN": "solar",  # solar radiation, MJ/m2/day
    "RH2M": "humidity",  # relative air humidity, %
    "GWETROOT": "soil_root",  # root-zone soil wetness, 0 (dry) to 1 (saturated)
    "GWETTOP": "soil_top",  # surface soil wetness, 0 to 1
    "WS2M": "wind",  # wind speed at 2 m, m/s
}

# Rice-growing zones of the Dominican Republic. Elevation is in meters above sea level.
# "basin" is the river system that supplies the irrigation water.
ZONES = {
    "Santiago (Navarrete)": {"lat": 19.56, "lon": -70.87, "elev": 150, "basin": "Yaque del Norte"},
    "Valverde (Mao - Esperanza)": {"lat": 19.55, "lon": -71.08, "elev": 80, "basin": "Yaque del Norte"},
    "Montecristi (Villa Vásquez)": {"lat": 19.74, "lon": -71.45, "elev": 30, "basin": "Yaque del Norte"},
    "La Vega": {"lat": 19.22, "lon": -70.53, "elev": 100, "basin": "Yuna - Camú"},
    "Duarte (Villa Riva)": {"lat": 19.17, "lon": -69.91, "elev": 20, "basin": "Yuna - Camú"},
    "Sánchez Ramírez (Cotuí)": {"lat": 19.05, "lon": -70.15, "elev": 70, "basin": "Yuna - Camú"},
    "María Trinidad Sánchez (Nagua)": {"lat": 19.38, "lon": -69.85, "elev": 10, "basin": "Nagua - Boba"},
    # Rice zones outside the Cibao core. Locations and elevations are approximate
    # and must be validated by the team.
    "Monseñor Nouel (Bonao)": {"lat": 18.94, "lon": -70.41, "elev": 170, "basin": "Yuna - Camú"},
    "Samaná (Sánchez)": {"lat": 19.23, "lon": -69.61, "elev": 10, "basin": "Yuna - Camú"},
    "Dajabón": {"lat": 19.55, "lon": -71.70, "elev": 35, "basin": "Masacre"},
    "San Juan de la Maguana": {"lat": 18.81, "lon": -71.23, "elev": 415, "basin": "Yaque del Sur"},
    "Barahona (Vicente Noble)": {"lat": 18.38, "lon": -71.18, "elev": 30, "basin": "Yaque del Sur"},
    "El Seibo (Miches)": {"lat": 18.98, "lon": -69.05, "elev": 10, "basin": "Este"},
    "Monte Plata (Bayaguana)": {"lat": 18.75, "lon": -69.63, "elev": 50, "basin": "Ozama"},
}


def _file_name(zone_name):
    """'Montecristi (Villa Vásquez)' -> 'montecristi_villa_vasquez'."""
    plain = unicodedata.normalize("NFKD", zone_name).encode("ascii", "ignore").decode()
    words = "".join(c if c.isalnum() else " " for c in plain.lower()).split()
    return "_".join(words)


def download(lat, lon):
    """Ask NASA POWER for every day since 2001. Returns (daily table, info)."""
    yesterday = date.today() - timedelta(days=1)
    response = requests.get(
        POWER_URL,
        params={
            "parameters": ",".join(PARAMETERS),
            "community": "AG",
            "latitude": lat,
            "longitude": lon,
            "start": FIRST_DAY,
            "end": yesterday.strftime("%Y%m%d"),
            "format": "JSON",
        },
        timeout=60,
    )
    response.raise_for_status()
    answer = response.json()

    daily = pd.DataFrame(answer["properties"]["parameter"]).rename(columns=PARAMETERS)
    daily.index = pd.to_datetime(daily.index, format="%Y%m%d")
    daily.index.name = "date"
    # NASA POWER writes -999 when it has no value for a day.
    daily = daily.replace(answer["header"]["fill_value"], np.nan)

    info = {
        "cell_elevation": answer["geometry"]["coordinates"][2],
        "downloaded": date.today().isoformat(),
    }
    return daily, info


def refresh(zone_name):
    """Download a zone from NASA POWER and replace its saved copy."""
    zone = ZONES[zone_name]
    daily, info = download(zone["lat"], zone["lon"])
    DATA_DIR.mkdir(exist_ok=True)
    name = _file_name(zone_name)
    daily.to_csv(DATA_DIR / f"{name}.csv")
    (DATA_DIR / f"{name}.json").write_text(json.dumps(info))


def load(zone_name):
    """Daily data for a zone, from the saved copy (downloads it if missing).

    Temperatures are adjusted to the zone's real elevation.
    """
    name = _file_name(zone_name)
    if not (DATA_DIR / f"{name}.csv").exists():
        refresh(zone_name)
    daily = pd.read_csv(DATA_DIR / f"{name}.csv", index_col="date", parse_dates=True)
    info = json.loads((DATA_DIR / f"{name}.json").read_text())

    height_difference_km = (info["cell_elevation"] - ZONES[zone_name]["elev"]) / 1000
    info["temp_adjustment"] = LAPSE_RATE_C_PER_KM * height_difference_km
    for column in ("temp", "tmax", "tmin"):
        daily[column] = daily[column] + info["temp_adjustment"]
    return daily, info


def monthly(daily):
    """One row per complete month: rain total (mm) and the average of the rest."""
    by_month = daily.resample("MS").mean()
    by_month["rain"] = by_month["rain"] * by_month.index.days_in_month
    # Drop the current month if it is not finished yet.
    last_day = daily["temp"].last_valid_index()
    first_incomplete = (last_day + pd.Timedelta(days=1)).to_period("M").start_time
    return by_month[by_month.index < first_incomplete]


def normals(by_month):
    """Typical value of each calendar month (1-12) in the reference period."""
    reference = by_month.loc[NORMAL_YEARS[0] : NORMAL_YEARS[1]]
    return reference.groupby(reference.index.month).mean()


def yearly(by_month):
    """One row per complete year: rain total (mm) and the average of the rest."""
    months_per_year = by_month["temp"].groupby(by_month.index.year).count()
    complete_years = months_per_year[months_per_year == 12].index
    by_month = by_month[by_month.index.year.isin(complete_years)]
    by_year = by_month.groupby(by_month.index.year).mean()
    by_year["rain"] = by_month["rain"].groupby(by_month.index.year).sum()
    by_year.index.name = "year"
    return by_year


def trend_line(series):
    """Straight line through yearly values. Returns (line values, change per decade)."""
    slope, start = np.polyfit(series.index, series.values, 1)
    return slope * series.index + start, slope * 10


if __name__ == "__main__":
    for zone_name in ZONES:
        refresh(zone_name)
        print("saved", zone_name)
