# GroundTruth Cibao — The rice farmer's Plan B

NASA Space Apps Challenge 2026 (Santiago, Dominican Republic) ·
Challenge: **Field Shift: Adapting Farms with NASA Data**

**Live tool:** https://eeliasmartinez.github.io/groundtruth-cibao/

When irrigation water runs short in the Cibao valley, rice farmers are told not
to plant. This decision-support tool shows what they can still grow with the
water they are allocated. It compares four rotation strategies (rice only,
rice + legume, a low-water crop to sell, green manure) and explains, for each
one, why it is suggested, the evidence, the benefits, the information gaps and
the risks to review with a local expert.

It supports the farmer's decision; it does not replace the farmer or the
agricultural expert.

## How NASA data is used

Daily data from **NASA POWER** (2001–2025) for fourteen rice zones across the country: temperature
(mean, max, min), solar radiation, relative humidity, wind speed, precipitation
and soil wetness. From it the engine computes:

1. Reference evapotranspiration (FAO-56 Penman-Monteith).
2. Irrigation water each crop needs per *tarea* (628.86 m²), for every year on
   record, giving a typical year (median) and a dry year (80th percentile).
3. The strategies that fit the water allocated to the farm, scored on water,
   soil and income.
4. A basin-wide estimate of the water saved if a share of rice farmers rotate.

## What is in this repository

| Path | What it is |
|---|---|
| `web/` | The interactive page (open `web/index.html`; works offline) |
| `web/crops_local.js` | Dominican crop directory and sourced 2025 national production figures |
| `web/copy.js` | Spanish and English interface text |
| `web/storage.js` | Optional farm-plan storage on the current device only |
| `nasa_power.py` | Downloads NASA POWER data and keeps a saved copy in `data/` |
| `water.py` | Crop water needs (FAO-56) |
| `crops.py` | Crop table with its sources |
| `build_world.py` | Builds `web/world_data.js` (Natural Earth countries + FAOSTAT harvested area) and `web/earth.jpg` (NASA Blue Marble via GIBS) for the world prototype |
| `web/world.js` | World prototype: turning globe, provinces (geoBoundaries, online), NASA POWER monthly climate (online) and FAO-56 water per crop |
| `crops_fao.py` | 23 more crops for the water calculator (FAO-56 Tables 11 and 12, row chosen for each) |
| `rotation.py` | Builds and scores the rotation strategies |
| `build_web.py` | Runs the engine and writes the data the page uses |
| `build_provinces.py` | Simplifies the 32 province outlines for the offline map |
| `check_engine.py`, `check_web.js` | Automatic quality checks |
| `app.py`, `charts.py` | Streamlit "data lab" with the NASA climate charts |
| `docs/` | Team research notes (Spanish) |

## Run it

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python nasa_power.py      # refresh NASA POWER data (optional)
.venv/bin/python build_web.py       # rebuild the page data
.venv/bin/python check_engine.py    # engine checks
node check_web.js                   # page-vs-engine check
open web/index.html
```

## Limits

- NASA POWER describes squares about 50 km wide; it is not a weather station on
  the farm. Temperature is adjusted for elevation (6.5 °C per 1000 m).
- NASA POWER rainfall can be lower than local rain-gauge records.
- The income score does not use prices or yields yet.
- Crop values (FAO references), heat limits, tolerance to heavy rice soils and
  market ratings still need validation by a local agronomist.
- The crop directory lists 39 named crops/products from official 2025 statistics and
  the existing engine. The automatic irrigation and rotation planner is still rice-centered;
  the directory is not a crop-specific recommendation engine for every listed product.
- The basin's rice area is estimated from each province's share of national
  production.

## Sources

- NASA POWER, NASA Langley Research Center — https://power.larc.nasa.gov/
- FAO Irrigation and Drainage Paper 56, *Crop evapotranspiration* (Allen et al., 1998)
- FAO Irrigation Water Management Training Manual No. 3, *Irrigation water needs* (1986)
- FAO Irrigation and Drainage Paper 29, *Water quality for agriculture* (Ayers & Westcot, 1985)
- elDinero (25 Mar 2026), rice production by region and province
- UNCCD (23 Aug 2024), water pressure and irrigation efficiency in the Yaque del Norte
- El Caribe (15 Sep 2019), INDRHI ban on winter rice planting
- Diario Libre (11 Aug 2026), dam capacities and levels reported by INDRHI
- Montecristi 24 Horas (28 Aug 2026), irrigation by turns

Full links are listed in the page's "Sources" section and in `docs/investigacion.md`.
Built with Python, pandas, NumPy, requests, Streamlit and Altair (open source).
Map coastline: Natural Earth (public domain). Map rivers: © OpenStreetMap contributors (ODbL).
Typefaces: Big Shoulders Display and Archivo (SIL Open Font License), via Fontsource.
Elevation: Terrain Tiles on AWS Open Data (Mapzen), derived mainly from NASA SRTM.
Satellite photo: NASA Worldview Snapshots, MODIS Terra corrected reflectance, 18 Feb 2026.
Province boundaries: geoBoundaries ADM1, Dominican Republic (represented year 2022, public domain).
Soil texture by feel: USDA NRCS guide (S. J. Thien, 1979).

## Use of AI

The code, the texts and the analysis in this repository were produced with the
assistance of AI (Claude Code by Anthropic and OpenAI Codex), directed and reviewed by the team.

NASA does not endorse any non-U.S. Government entity or this project.
