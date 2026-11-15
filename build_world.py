"""Prepare the offline data of the world prototype.

Run with:  .venv/bin/python build_world.py [cache_folder]
It downloads (or reads from cache_folder, if the files are already there):
  * Natural Earth 1:110m countries (public domain)
    https://github.com/nvkelso/natural-earth-vector
  * FAOSTAT "Crops and livestock products", harvested area (element 5312)
    https://www.fao.org/faostat/en/#data/QCL  (bulk file, CC BY 4.0)
  * NASA Blue Marble shaded relief and bathymetry, through NASA GIBS (public domain)
    https://gibs.earthdata.nasa.gov
and writes:
  web/world_data.js  countries (outline, ISO code) and each one's 12 crops with the
                     largest harvested area in the latest FAOSTAT year
  web/earth.jpg      2048 x 1024 picture of the Earth used to paint the globe
  web/world_rivers.js  Natural Earth 1:10m rivers (public domain), thinned, drawn on
                     the 3D relief of a province (loaded only in the world mode)
Provinces and climate are not stored: the page asks geoBoundaries and NASA POWER
for them when a country or province is opened (internet needed).
"""

import csv
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
WEB = ROOT / "web"
NE_URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
          "geojson/ne_110m_admin_0_countries.geojson")
FAO_URL = ("https://bulks-faostat.fao.org/production/"
           "Production_Crops_Livestock_E_All_Data_(Normalized).zip")
EARTH_URL = ("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap"
             "&VERSION=1.3.0&LAYERS=BlueMarble_ShadedRelief_Bathymetry&CRS=EPSG:4326"
             "&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&FORMAT=image/jpeg")
RIVERS_URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
              "geojson/ne_10m_rivers_lake_centerlines.geojson")
TOP = 12  # crops kept per country

# FAOSTAT item -> water profile (crops.py, crops_fao.py). None = no FAO-56 profile here.
PROFILE = {
    "Maize (corn)": "maize", "Wheat": "wheat", "Barley": "wheat", "Oats": "wheat", "Rye": "wheat",
    "Triticale": "wheat", "Rice": "rice", "Potatoes": "potato", "Sorghum": "sorghum",
    "Cassava, fresh": "cassava", "Beans, dry": "beans", "Bananas": "banana",
    "Plantains and cooking bananas": "banana", "Groundnuts, excluding shelled": "peanut",
    "Sugar cane": "sugarcane", "Soya beans": "soybean", "Sunflower seed": "sunflower",
    "Seed cotton, unginned": "cotton", "Millet": "millet", "Sweet potatoes": "sweet_potato",
    "Sugar beet": "sugar_beet", "Tomatoes": "tomato", "Cow peas, dry": "cowpea", "Peas, dry": "peas_dry",
    "Sesame seed": "sesame", "Pumpkins, squash and gourds": "squash", "Cabbages": "cabbage",
    "Watermelons": "watermelon", "Cucumbers and gherkins": "cucumber", "Oranges": "citrus",
    "Lemons and limes": "citrus", "Tangerines, mandarins, clementines": "citrus",
    "Pomelos and grapefruits": "citrus", "Lentils, dry": "lentil",
    "Onions and shallots, dry (excluding dehydrated)": "onion", "Eggplants (aubergines)": "eggplant",
    "Lettuce and chicory": "lettuce", "Cantaloupes and other melons": "melon",
    "Green corn (maize)": "sweet_corn", "Carrots and turnips": "carrot", "Pigeon peas, dry": "pigeon_pea",
    "Chillies and peppers, green (Capsicum spp. and Pimenta spp.)": "pepper",
    "Other beans, green": "green_bean", "String beans": "green_bean",
    "Broad beans and horse beans, dry": "broad_bean",
}
# Spanish names (translation of the FAOSTAT item names, no figures).
SPANISH = {
    "Maize (corn)": "Maíz", "Wheat": "Trigo", "Barley": "Cebada", "Oats": "Avena", "Rye": "Centeno",
    "Triticale": "Triticale", "Rice": "Arroz", "Potatoes": "Papa", "Sorghum": "Sorgo",
    "Cassava, fresh": "Yuca", "Beans, dry": "Frijol / habichuela seca", "Bananas": "Guineo / banano",
    "Plantains and cooking bananas": "Plátano", "Groundnuts, excluding shelled": "Maní",
    "Sugar cane": "Caña de azúcar", "Soya beans": "Soya", "Sunflower seed": "Girasol",
    "Seed cotton, unginned": "Algodón", "Millet": "Mijo", "Sweet potatoes": "Batata / camote",
    "Sugar beet": "Remolacha azucarera", "Tomatoes": "Tomate", "Cow peas, dry": "Caupí",
    "Peas, dry": "Arveja seca", "Sesame seed": "Ajonjolí", "Pumpkins, squash and gourds": "Auyama / calabaza",
    "Cabbages": "Repollo", "Watermelons": "Sandía", "Cucumbers and gherkins": "Pepino",
    "Oranges": "Naranja", "Lemons and limes": "Limón", "Tangerines, mandarins, clementines": "Mandarina",
    "Pomelos and grapefruits": "Toronja", "Lentils, dry": "Lenteja",
    "Onions and shallots, dry (excluding dehydrated)": "Cebolla", "Eggplants (aubergines)": "Berenjena",
    "Lettuce and chicory": "Lechuga", "Cantaloupes and other melons": "Melón", "Green corn (maize)": "Maíz tierno",
    "Carrots and turnips": "Zanahoria", "Pigeon peas, dry": "Guandul",
    "Chillies and peppers, green (Capsicum spp. and Pimenta spp.)": "Ají / pimiento",
    "Other beans, green": "Vainitas", "String beans": "Vainitas", "Broad beans and horse beans, dry": "Haba seca",
    "Rape or colza seed": "Colza", "Coconuts, in shell": "Coco", "Grapes": "Uva", "Coffee, green": "Café",
    "Oil palm fruit": "Palma aceitera", "Cocoa beans": "Cacao", "Olives": "Aceituna", "Apples": "Manzana",
    "Yams": "Ñame", "Natural rubber in primary forms": "Caucho", "Dates": "Dátil", "Taro": "Malanga / taro",
    "Mangoes, guavas and mangosteens": "Mango y guayaba", "Chick peas, dry": "Garbanzo",
    "Almonds, in shell": "Almendra", "Okra": "Molondrón / okra", "Cashew nuts, in shell": "Anacardo / cajuil",
    "Hazelnuts, in shell": "Avellana", "Cauliflowers and broccoli": "Coliflor y brócoli", "Tea leaves": "Té",
    "Avocados": "Aguacate", "Lupins": "Altramuz", "Pineapples": "Piña", "Plums and sloes": "Ciruela",
    "Linseed": "Linaza", "Papayas": "Lechosa / papaya", "Pistachios, in shell": "Pistacho",
    "Peaches and nectarines": "Durazno", "Spinach": "Espinaca", "Unmanufactured tobacco": "Tabaco",
    "Chestnuts, in shell": "Castaña", "Apricots": "Albaricoque", "Jute, raw or retted": "Yute",
    "Peas, green": "Arveja verde", "Pears": "Pera", "Areca nuts": "Nuez de areca", "Mustard seed": "Mostaza",
    "Cherries": "Cereza", "Walnuts, in shell": "Nuez", "Figs": "Higo", "Quinoa": "Quinua",
    "Yautia": "Yautía", "Ginger, raw": "Jengibre", "Buckwheat": "Alforfón", "Safflower seed": "Cártamo",
    "Vanilla, raw": "Vainilla", "Blueberries": "Arándano", "Castor oil seeds": "Higuerilla",
    "Kiwi fruit": "Kiwi", "Pepper (Piper spp.), raw": "Pimienta", "Cloves (whole stems), raw": "Clavo",
    "Fonio": "Fonio", "Bambara beans, dry": "Guisante bambara", "Abaca, manila hemp, raw": "Abacá",
    "Mixed grain": "Granos mixtos", "Vetches": "Veza", "Flax, raw or retted": "Lino",
    "Onions and shallots, green": "Cebollín", "Broad beans and horse beans, green": "Haba verde",
    "Melonseed": "Semilla de melón", "Other vegetables, fresh n.e.c.": "Otras hortalizas",
    "Other fruits, n.e.c.": "Otras frutas", "Other pulses n.e.c.": "Otras leguminosas",
    "Other tropical fruits, n.e.c.": "Otras frutas tropicales", "Cereals n.e.c.": "Otros cereales",
    "Other oil seeds, n.e.c.": "Otras oleaginosas",
    "Edible roots and tubers with high starch or inulin content, n.e.c., fresh": "Otras raíces y tubérculos",
    "Other nuts (excluding wild edible nuts and groundnuts), in shell, n.e.c.": "Otros frutos secos",
    "Other stimulant, spice and aromatic crops, n.e.c.": "Otras especias",
    "Nutmeg, mace, cardamoms, raw": "Nuez moscada y cardamomo", "Other fibre crops, raw, n.e.c.": "Otras fibras",
    "Chillies and peppers, dry (Capsicum spp., Pimenta spp.), raw": "Ají seco",
    "Other citrus fruit, n.e.c.": "Otros cítricos", "Agave fibres, raw, n.e.c.": "Fibra de agave",
    "Anise, badian, coriander, cumin, caraway, fennel and juniper berries, raw": "Anís, cilantro y comino",
    "Cinnamon and cinnamon-tree flowers, raw": "Canela", "Green garlic": "Ajo tierno",
    "Karite nuts (sheanuts)": "Karité", "Maté leaves": "Yerba mate", "Persimmons": "Caqui",
    "Other berries and fruits of the genus vaccinium n.e.c.": "Arándanos y similares",
    "Sour cherries": "Guinda",
}
GROUP_WORDS = ("Primary", "Total", "Equivalent", ", primary")  # FAOSTAT aggregates, not crops


def fetch(url, path):
    if not path.exists():
        req = urllib.request.Request(url, headers={"User-Agent": "groundtruth-build/1.0"})
        with urllib.request.urlopen(req, timeout=300) as r:
            path.write_bytes(r.read())
    return path


def ring_points(ring):
    # 1:110m outlines are already coarse; two decimals (about 1 km) is plenty.
    return [[round(x, 2), round(y, 2)] for x, y in ring]


def thin(line, min_step=0.03):
    """Keep a point only when it is at least min_step degrees (about 3 km) from the last."""
    out = [line[0]]
    for x, y in line[1:-1]:
        if abs(x - out[-1][0]) + abs(y - out[-1][1]) >= min_step:
            out.append([x, y])
    out.append(line[-1])
    return [[round(x, 2), round(y, 2)] for x, y in out]


def write_rivers(cache):
    geo = json.loads(fetch(RIVERS_URL, cache / "rivers_10m.geojson").read_text(encoding="utf-8"))
    rivers = []
    for feature in geo["features"]:
        geometry, p = feature["geometry"], feature["properties"]
        if not geometry:
            continue
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        lines = [thin(line) for line in lines if len(line) > 1]
        if lines:
            rivers.append({"n": p.get("name") or "", "r": p.get("scalerank", 10), "l": lines})
    (WEB / "world_rivers.js").write_text(
        "// Generated by build_world.py. Rivers: Natural Earth 1:10m (public domain).\n"
        "window.GT_WORLD_RIVERS = " + json.dumps(rivers, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    print(len(rivers), "rivers")


def main():
    cache = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "world_cache"
    cache.mkdir(parents=True, exist_ok=True)
    ne = json.loads(fetch(NE_URL, cache / "countries.geojson").read_text(encoding="utf-8"))
    fao_zip = fetch(FAO_URL, cache / "qcl.zip")
    earth = fetch(EARTH_URL, cache / "bm.jpg")

    # Harvested area (ha) by country (M49 code) and item, latest two years.
    area, years = {}, {}
    with zipfile.ZipFile(fao_zip) as z:
        name = [n for n in z.namelist() if "All_Data" in n][0]
        with z.open(name) as f:
            for row in csv.DictReader(io.TextIOWrapper(f, encoding="utf-8", errors="replace")):
                if row["Element Code"] != "5312" or row["Year"] not in ("2023", "2024"):
                    continue
                item = row["Item"]
                if any(word in item for word in GROUP_WORDS):
                    continue
                try:
                    value = float(row["Value"])
                except ValueError:
                    continue
                m49 = row["Area Code (M49)"].strip("'").lstrip("0")
                area.setdefault(m49, {}).setdefault(row["Year"], {})[item] = value

    items, item_index, countries = [], {}, []
    for feature in ne["features"]:
        p = feature["properties"]
        m49 = str(p.get("ISO_N3_EH") or p.get("ISO_N3") or "").lstrip("0")
        iso3 = p.get("ISO_A3_EH") if p.get("ISO_A3_EH") not in (None, "-99") else p.get("ADM0_A3")
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        rings = [ring_points(poly[0]) for poly in polygons]
        by_year = area.get(m49, {})
        year = "2024" if "2024" in by_year else ("2023" if "2023" in by_year else None)
        crops = []
        if year:
            for item, hectares in sorted(by_year[year].items(), key=lambda t: -t[1])[:TOP]:
                if hectares <= 0:
                    continue
                if item not in item_index:
                    item_index[item] = len(items)
                    items.append({"en": item, "es": SPANISH.get(item, item), "w": PROFILE.get(item)})
                crops.append([item_index[item], round(hectares)])
        countries.append({"es": p.get("NAME_ES") or p["NAME"], "en": p.get("NAME_EN") or p["NAME"],
                          "iso3": iso3, "rings": rings, "crops": crops, "year": year})
    countries.sort(key=lambda c: c["es"])
    data = {"countries": countries, "items": items,
            "sources": {"countries": "Natural Earth 1:110m admin 0 (public domain)",
                        "crops": "FAOSTAT QCL, element 5312 area harvested (ha), CC BY 4.0"}}
    (WEB / "world_data.js").write_text(
        "// Generated by build_world.py. Countries: Natural Earth (public domain).\n"
        "// Crops: FAOSTAT harvested area (CC BY 4.0). Do not edit by hand.\n"
        "window.GT_WORLD = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    (WEB / "earth.jpg").write_bytes(earth.read_bytes())
    write_rivers(cache)
    with_crops = sum(1 for c in countries if c["crops"])
    print(len(countries), "countries,", with_crops, "with FAOSTAT crops,", len(items), "crop items")
    missing = sorted({i["en"] for i in items if i["es"] == i["en"]})
    print("no Spanish name:", missing)


if __name__ == "__main__":
    main()
