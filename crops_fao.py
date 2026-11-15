"""More crops for the water calculator, taken straight from FAO-56.

Source: Allen, Pereira, Raes & Smith (1998), FAO Irrigation and Drainage Paper 56,
chapter 6, https://www.fao.org/4/x0490e/x0490e0b.htm
  * Table 11: days in each growth stage (initial, development, mid, late).
  * Table 12: water-use coefficient Kc (initial, mid, end).
When Table 12 leaves Kc ini blank for a crop, FAO-56 uses the value printed on the
crop's group row; that is what is used here. When Table 12 gives a range, the middle
of the range is used. When Table 11 lists several planting periods, the row named in
"row" was chosen (tropical rows first when FAO-56 has one).

These crops are used only to say how much irrigation water each one needs in a zone
and month. They are NOT part of the rice rotation strategies in rotation.py, because
their heat limits, soil tolerance and market have not been reviewed.
"""

FAO_CROPS = {
    "tomato": {"es": "Tomate", "en": "Tomato",
               "stages": (30, 40, 40, 25), "kc": (0.60, 1.15, 0.80),
               "row": "T11 Tomato, January, Arid Region; T12 Kc end 0.70-0.90 (middle 0.80)"},
    "pepper": {"es": "Ají / pimiento", "en": "Sweet pepper",
               "stages": (25, 35, 40, 20), "kc": (0.60, 1.05, 0.90),
               "row": "T11 Sweet peppers, April/June, Europe and Medit. (initial 25 of 25/30)"},
    "eggplant": {"es": "Berenjena", "en": "Eggplant",
                 "stages": (30, 40, 40, 20), "kc": (0.60, 1.05, 0.90),
                 "row": "T11 Egg plant, October, Arid Region"},
    "onion": {"es": "Cebolla", "en": "Onion",
              "stages": (15, 25, 70, 40), "kc": (0.70, 1.05, 0.75),
              "row": "T11 Onion (dry), April, Mediterranean"},
    "cabbage": {"es": "Repollo", "en": "Cabbage",
                "stages": (40, 60, 50, 15), "kc": (0.70, 1.05, 0.95),
                "row": "T11 Cabbage, Sept, Calif. Desert"},
    "carrot": {"es": "Zanahoria", "en": "Carrot",
               "stages": (30, 40, 60, 20), "kc": (0.70, 1.05, 0.95),
               "row": "T11 Carrots, Feb/Mar, Mediterranean"},
    "lettuce": {"es": "Lechuga", "en": "Lettuce",
                "stages": (20, 30, 15, 10), "kc": (0.70, 1.00, 0.95),
                "row": "T11 Lettuce, April, Mediterranean"},
    "celery": {"es": "Apio", "en": "Celery",
               "stages": (25, 40, 45, 15), "kc": (0.70, 1.05, 1.00),
               "row": "T11 Celery, April, Mediterranean"},
    "cucumber": {"es": "Pepino", "en": "Cucumber",
                 "stages": (20, 30, 40, 15), "kc": (0.60, 1.00, 0.75),
                 "row": "T11 Cucumber, June/Aug, Arid Region; T12 fresh market"},
    "watermelon": {"es": "Sandía", "en": "Watermelon",
                   "stages": (20, 30, 30, 30), "kc": (0.40, 1.00, 0.75),
                   "row": "T11 Water melons, April, Italy"},
    "melon": {"es": "Melón", "en": "Melon",
              "stages": (25, 35, 40, 20), "kc": (0.50, 1.05, 0.75),
              "row": "T11 Sweet melons, May, Mediterranean"},
    "zucchini": {"es": "Calabacín", "en": "Zucchini",
                 "stages": (25, 35, 25, 15), "kc": (0.50, 0.95, 0.75),
                 "row": "T11 Squash, Zucchini, Apr; Dec., Medit.; Arid Reg."},
    "cassava": {"es": "Yuca (primer año)", "en": "Cassava (year 1)",
                "stages": (20, 40, 90, 60), "kc": (0.30, 0.80, 0.30),
                "row": "T11 Cassava year 1, rainy season, Tropical regions"},
    "potato": {"es": "Papa", "en": "Potato",
               "stages": (25, 30, 45, 30), "kc": (0.50, 1.15, 0.75),
               "row": "T11 Potato, Jan/Nov, (Semi) Arid Climate (130-day row)"},
    "sweet_potato": {"es": "Batata", "en": "Sweet potato",
                     "stages": (15, 30, 50, 30), "kc": (0.50, 1.15, 0.65),
                     "row": "T11 Sweet potato, rainy season, Tropical regions"},
    "green_bean": {"es": "Vainitas", "en": "Green beans",
                   "stages": (20, 30, 30, 10), "kc": (0.50, 1.05, 0.90),
                   "row": "T11 Beans (green), Feb/Mar, Calif., Mediterranean"},
    "peanut": {"es": "Maní", "en": "Peanut",
               "stages": (25, 35, 45, 25), "kc": (0.40, 1.15, 0.60),
               "row": "T11 Groundnut, dry season, West Africa"},
    "soybean": {"es": "Soya", "en": "Soybean",
                "stages": (15, 15, 40, 15), "kc": (0.40, 1.15, 0.50),
                "row": "T11 Soybeans, Dec, Tropics"},
    "sweet_corn": {"es": "Maíz dulce", "en": "Sweet corn",
                   "stages": (20, 20, 30, 10), "kc": (0.30, 1.15, 1.05),
                   "row": "T11 Maize (sweet), March, Philippines"},
    "sesame": {"es": "Ajonjolí", "en": "Sesame",
               "stages": (20, 30, 40, 20), "kc": (0.35, 1.10, 0.25),
               "row": "T11 Sesame, June, China"},
    "banana": {"es": "Plátano y guineo (primer año)", "en": "Plantain and banana (year 1)",
               "stages": (120, 90, 120, 60), "kc": (0.50, 1.10, 1.00),
               "row": "T11 Banana 1st yr, Mar, Mediterranean (FAO-56 has no plantain row)"},
    "sugarcane": {"es": "Caña de azúcar (planta)", "en": "Sugarcane (plant crop)",
                  "stages": (50, 70, 220, 140), "kc": (0.40, 1.25, 0.75),
                  "row": "T11 Sugarcane virgin, Tropics"},
    "citrus": {"es": "Cítricos (naranja, limón)", "en": "Citrus (orange, lime)",
               "stages": (60, 90, 120, 95), "kc": (0.65, 0.60, 0.65),
               "row": "T11 Citrus, Jan, Mediterranean; T12 no ground cover, 50% canopy"},
}

for _crop in FAO_CROPS.values():
    _crop["flooded"] = False
