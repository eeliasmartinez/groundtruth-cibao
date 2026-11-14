"""Crop table: what each option needs and what it gives back.

IMPORTANT - these are reference values, not local measurements. They must be
checked by the team against the sources below and with a local agronomist:

  * Season stages and Kc (water-use coefficients): FAO Irrigation and Drainage
    Paper 56, "Crop evapotranspiration" (Allen et al., 1998), Tables 11 and 12.
  * Rice field water (saturation, water layer, percolation): FAO Irrigation
    Water Management Training Manual No. 3, "Irrigation water needs" (1986).
  * Salt tolerance: FAO Irrigation and Drainage Paper 29, "Water quality for
    agriculture" (Ayers & Westcot, 1985), Table 4.
  * Nitrogen left for the next crop, heat limits, tolerance to heavy soil and
    market ratings: conservative general-literature values. TO BE VALIDATED.

Fields
  stages     days in each growth stage (initial, development, mid, late)
  kc         water-use coefficient at (initial, mid, end)
  flooded    True for paddy rice (needs standing water)
  nitrogen   kg of nitrogen per hectare left in the soil for the next crop
  heat_limit average daily maximum temperature (C) above which the crop suffers
  heavy_soil tolerance to heavy, poorly drained rice soil, 1 (poor) to 5 (good)
  salt_limit soil salinity (dS/m) where yield starts to fall
  market     how sure the farmer is of selling it, 0 (not sold) to 5 (guaranteed)
"""

CROPS = {
    "rice": {
        "es": "Arroz", "en": "Rice",
        "stages": (25, 30, 50, 25), "kc": (1.05, 1.20, 0.90), "flooded": True,
        "nitrogen": 0, "heat_limit": 35, "heavy_soil": 5, "salt_limit": 3.0, "market": 5,
    },
    "beans": {
        "es": "Habichuela", "en": "Beans",
        "stages": (15, 25, 35, 15), "kc": (0.40, 1.15, 0.35), "flooded": False,
        "nitrogen": 30, "heat_limit": 31, "heavy_soil": 2, "salt_limit": 1.0, "market": 4,
    },
    # Short-cycle pigeon pea. FAO-56 has no pigeon pea row: Kc uses the general
    # "legumes" group values. Very sensitive to waterlogged soil.
    "pigeon_pea": {
        "es": "Guandul (ciclo corto)", "en": "Pigeon pea (short cycle)",
        "stages": (25, 35, 45, 30), "kc": (0.40, 1.15, 0.55), "flooded": False,
        "nitrogen": 40, "heat_limit": 36, "heavy_soil": 1, "salt_limit": 1.5, "market": 4,
    },
    "cowpea": {
        "es": "Caupí (frijol de vaca)", "en": "Cowpea",
        "stages": (15, 25, 25, 15), "kc": (0.40, 1.05, 0.50), "flooded": False,
        "nitrogen": 50, "heat_limit": 35, "heavy_soil": 3, "salt_limit": 4.9, "market": 2,
    },
    "maize": {
        "es": "Maíz", "en": "Maize",
        "stages": (20, 35, 40, 30), "kc": (0.30, 1.20, 0.50), "flooded": False,
        "nitrogen": 0, "heat_limit": 33, "heavy_soil": 2, "salt_limit": 1.7, "market": 3,
    },
    "sorghum": {
        "es": "Sorgo", "en": "Sorghum",
        "stages": (20, 35, 40, 30), "kc": (0.30, 1.05, 0.55), "flooded": False,
        "nitrogen": 0, "heat_limit": 38, "heavy_soil": 3, "salt_limit": 6.8, "market": 2,
    },
    "squash": {
        "es": "Auyama", "en": "Squash",
        "stages": (20, 30, 30, 20), "kc": (0.50, 1.00, 0.80), "flooded": False,
        "nitrogen": 0, "heat_limit": 32, "heavy_soil": 2, "salt_limit": 3.2, "market": 3,
    },
    "sesbania": {
        "es": "Abono verde (sesbania)", "en": "Green manure (sesbania)",
        "stages": (15, 25, 15, 0), "kc": (0.40, 1.05, 1.05), "flooded": False,
        "nitrogen": 100, "heat_limit": 38, "heavy_soil": 5, "salt_limit": 2.3, "market": 0,
    },
}

LEGUMES = ("beans", "pigeon_pea", "cowpea")  # grain crops that also feed the soil
CASH_CROPS = ("maize", "sorghum", "squash")  # low-water crops grown to sell

# Extra water a flooded rice field needs (FAO Training Manual No. 3)
RICE_SATURATION_MM = 200  # to soak the soil before planting
RICE_WATER_LAYER_MM = 100  # to build the standing water layer
RICE_PERCOLATION_MM_PER_DAY = {"clay": 4, "loam": 6, "sandy": 8}  # water lost downward
