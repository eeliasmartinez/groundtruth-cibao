"""GroundTruth Cibao - Crop rotation decision-support tool.

NASA Space Apps Challenge 2026 - "Field Shift: Adapting Farms with NASA Data".
Code written with the assistance of Claude Code (Anthropic).

The farmer describes the farm (zone, current crop, soil, priority) and the page
shows the local climate measured by NASA POWER. Rotation strategies are added
in a later step.
"""

import pandas as pd
import streamlit as st

import charts
import nasa_power
from nasa_power import ZONES

st.set_page_config(page_title="GroundTruth Cibao", page_icon="🌱", layout="wide")

# ---------------------------------------------------------------------------
# Reference data (edit these lists to add or remove options)
# ---------------------------------------------------------------------------

# Crops commonly grown in the Cibao: key -> name in each language.
CROPS = {
    "rice": {"es": "Arroz", "en": "Rice"},
    "plantain": {"es": "Plátano", "en": "Plantain"},
    "tobacco": {"es": "Tabaco", "en": "Tobacco"},
    "cassava": {"es": "Yuca", "en": "Cassava"},
    "beans": {"es": "Habichuela", "en": "Beans"},
    "pigeon_pea": {"es": "Guandul", "en": "Pigeon pea"},
    "maize": {"es": "Maíz", "en": "Maize"},
    "tomato": {"es": "Tomate", "en": "Tomato"},
    "squash": {"es": "Auyama", "en": "Squash"},
    "pepper": {"es": "Ají", "en": "Pepper"},
    "sweet_potato": {"es": "Batata", "en": "Sweet potato"},
}

SOILS = {
    "clay": {"es": "Arcilloso (pesado, retiene agua)", "en": "Clay (heavy, holds water)"},
    "loam": {"es": "Franco (equilibrado)", "en": "Loam (balanced)"},
    "sandy": {"es": "Arenoso (suelto, drena rápido)", "en": "Sandy (loose, drains fast)"},
}

PRIORITIES = {
    "water": {"es": "Ahorrar agua", "en": "Save water"},
    "soil": {"es": "Recuperar el suelo", "en": "Restore soil health"},
    "income": {"es": "Mejorar el ingreso", "en": "Improve income"},
}

MONTHS = {
    "es": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
}

# Every sentence shown on screen, in both languages.
TEXT = {
    "es": {
        "tagline": "Rotación de cultivos para fincas del Cibao, guiada por datos de la NASA.",
        "farm": "Tu finca",
        "zone": "Zona",
        "crop": "Cultivo actual",
        "soil": "Tipo de suelo",
        "priority": "¿Qué es más importante para ti?",
        "priority_short": "Prioridad",
        "summary": "Resumen de tu finca",
        "elevation": "Altitud",
        "location": "Ubicación",
        "refresh": "Actualizar datos desde NASA",
        "refreshing": "Descargando de NASA POWER...",
        "refresh_ok": "Datos actualizados.",
        "refresh_fail": "No se pudo conectar con NASA POWER. Se usa la copia guardada.",
        "climate": "Clima de tu zona (NASA POWER)",
        "source": (
            "Fuente: NASA POWER, datos diarios desde 2001. "
            "Descargados el {downloaded}. Último mes completo: {last_month}."
        ),
        "m_rain": "Lluvia (12 meses)",
        "m_temp": "Temperatura media",
        "m_soil": "Humedad del suelo",
        "m_warming": "Tendencia por década",
        "vs_normal": "vs. normal",
        "points": "puntos",
        "tab_recent": "Últimos 12 meses",
        "tab_history": "Desde 2001",
        "recent": "Últimos 12 meses",
        "normal": "Normal 2001–2020",
        "c_rain": "Lluvia por mes",
        "c_temp": "Temperatura media por mes",
        "c_soil": "Humedad del suelo donde están las raíces",
        "c_humidity": "Humedad del aire",
        "soil_unit": "% de saturación",
        "c_year_temp": "Temperatura media de cada año",
        "c_year_rain": "Lluvia total de cada año",
        "year_value": "Valor del año",
        "trend": "Tendencia",
        "average": "Promedio 2001–2020",
        "limits_title": "Qué tan confiables son estos datos",
        "limits": (
            "- **Son datos de satélite y modelos, no de una estación en tu finca.** "
            "NASA POWER describe cuadros de unos 50 km, así que zonas vecinas "
            "pueden compartir los mismos valores.\n"
            "- **Temperatura ajustada por altitud.** El cuadro de NASA tiene una "
            "altitud promedio de {cell_elev:.0f} m y esta zona está a {site_elev} m. "
            "Ajustamos la temperatura {adjust:+.1f} °C (6.5 °C por cada 1000 m).\n"
            "- **La lluvia puede estar subestimada** frente a los pluviómetros "
            "locales, y en estos datos los años desde 2016 aparecen más lluviosos. "
            "Compara con registros de ONAMET o de tu propia finca.\n"
            "- **La humedad del suelo es una estimación** del modelo de NASA para "
            "la zona de raíces, no una medición directa en tu terreno."
        ),
        "strategies": "Estrategias de rotación",
        "coming": "Esta sección se conecta en el próximo paso.",
        "disclaimer": (
            "Esta herramienta apoya la decisión del agricultor; no la reemplaza. "
            "Consulta siempre con un técnico agrícola local antes de cambiar tu rotación."
        ),
    },
    "en": {
        "tagline": "Crop rotation for farms in the Cibao valley, guided by NASA data.",
        "farm": "Your farm",
        "zone": "Zone",
        "crop": "Current crop",
        "soil": "Soil type",
        "priority": "What matters most to you?",
        "priority_short": "Priority",
        "summary": "Your farm at a glance",
        "elevation": "Elevation",
        "location": "Location",
        "refresh": "Update data from NASA",
        "refreshing": "Downloading from NASA POWER...",
        "refresh_ok": "Data updated.",
        "refresh_fail": "Could not reach NASA POWER. Using the saved copy.",
        "climate": "Your local climate (NASA POWER)",
        "source": (
            "Source: NASA POWER, daily data since 2001. "
            "Downloaded on {downloaded}. Last complete month: {last_month}."
        ),
        "m_rain": "Rainfall (12 months)",
        "m_temp": "Mean temperature",
        "m_soil": "Soil moisture",
        "m_warming": "Trend per decade",
        "vs_normal": "vs. normal",
        "points": "points",
        "tab_recent": "Last 12 months",
        "tab_history": "Since 2001",
        "recent": "Last 12 months",
        "normal": "Normal 2001–2020",
        "c_rain": "Rainfall by month",
        "c_temp": "Mean temperature by month",
        "c_soil": "Soil moisture in the root zone",
        "c_humidity": "Air humidity",
        "soil_unit": "% of saturation",
        "c_year_temp": "Mean temperature of each year",
        "c_year_rain": "Total rainfall of each year",
        "year_value": "Yearly value",
        "trend": "Trend",
        "average": "2001–2020 average",
        "limits_title": "How reliable is this data",
        "limits": (
            "- **This is satellite and model data, not a weather station on your "
            "farm.** NASA POWER describes squares about 50 km wide, so neighboring "
            "zones can share the same values.\n"
            "- **Temperature is adjusted for elevation.** The NASA square has an "
            "average elevation of {cell_elev:.0f} m and this zone sits at "
            "{site_elev} m. We adjust temperature by {adjust:+.1f} °C "
            "(6.5 °C per 1000 m).\n"
            "- **Rainfall may be underestimated** compared with local rain gauges, "
            "and in this dataset the years since 2016 look wetter. Compare with "
            "ONAMET records or your own farm records.\n"
            "- **Soil moisture is an estimate** from NASA's model for the root "
            "zone, not a direct measurement in your field."
        ),
        "strategies": "Rotation strategies",
        "coming": "This section is connected in the next step.",
        "disclaimer": (
            "This tool supports the farmer's decision; it does not replace it. "
            "Always check with a local agricultural expert before changing your rotation."
        ),
    },
}


@st.cache_data(show_spinner=False)
def load_zone(zone_name):
    """Daily NASA POWER data for a zone (kept in memory after the first read)."""
    return nasa_power.load(zone_name)


# ---------------------------------------------------------------------------
# Sidebar: language and the farmer's answers
# ---------------------------------------------------------------------------

with st.sidebar:
    lang_label = st.radio("Idioma / Language", ["Español", "English"], horizontal=True)
    lang = "es" if lang_label == "Español" else "en"
    t = TEXT[lang]

    st.header(t["farm"])
    zone = st.selectbox(t["zone"], list(ZONES))
    crop = st.selectbox(t["crop"], list(CROPS), format_func=lambda k: CROPS[k][lang])
    soil = st.selectbox(t["soil"], list(SOILS), format_func=lambda k: SOILS[k][lang])
    priority = st.radio(
        t["priority"], list(PRIORITIES), format_func=lambda k: PRIORITIES[k][lang]
    )

    st.divider()
    if st.button(t["refresh"]):
        try:
            with st.spinner(t["refreshing"]):
                nasa_power.refresh(zone)
            load_zone.clear()
            st.success(t["refresh_ok"])
        except Exception:
            st.warning(t["refresh_fail"])

# ---------------------------------------------------------------------------
# Farm summary
# ---------------------------------------------------------------------------

place = ZONES[zone]

st.title("🌱 GroundTruth Cibao")
st.subheader(t["tagline"])

st.header(t["summary"])
left, right = st.columns([1, 1])

with left:
    # Plain text rows: long names are never cut off, even on a small screen.
    rows = [
        (t["zone"], zone),
        (t["elevation"], f"{place['elev']} m"),
        (t["location"], f"{place['lat']:.2f}°N, {abs(place['lon']):.2f}°W"),
        (t["crop"], CROPS[crop][lang]),
        (t["soil"], SOILS[soil][lang]),
        (t["priority_short"], PRIORITIES[priority][lang]),
    ]
    for label, value in rows:
        st.markdown(f"**{label}:** {value}")

with right:
    st.map(pd.DataFrame([{"lat": place["lat"], "lon": place["lon"]}]), zoom=8, height=300)

# ---------------------------------------------------------------------------
# Climate measured by NASA POWER
# ---------------------------------------------------------------------------

st.header(t["climate"])

daily, info = load_zone(zone)
by_month = nasa_power.monthly(daily)
normal = nasa_power.normals(by_month)
by_year = nasa_power.yearly(by_month)

recent = by_month.tail(12)  # last 12 complete months
recent_normal = normal.loc[recent.index.month]  # the normal for those same months
month_labels = [MONTHS[lang][day.month - 1] for day in recent.index]
last_month = f"{MONTHS[lang][recent.index[-1].month - 1]} {recent.index[-1].year}"

st.caption(t["source"].format(downloaded=info["downloaded"], last_month=last_month))

# Four headline numbers
rain_total = recent["rain"].sum()
rain_normal = recent_normal["rain"].sum()
temp_difference = recent["temp"].mean() - recent_normal["temp"].mean()
soil_difference = 100 * (recent["soil_root"].mean() - recent_normal["soil_root"].mean())
temp_trend, temp_per_decade = nasa_power.trend_line(by_year["temp"])

tiles = st.columns(4)
tiles[0].metric(
    t["m_rain"],
    f"{rain_total:,.0f} mm",
    f"{100 * (rain_total / rain_normal - 1):+.0f}% {t['vs_normal']}",
    delta_color="off",
)
tiles[1].metric(
    t["m_temp"],
    f"{recent['temp'].mean():.1f} °C",
    f"{temp_difference:+.1f} °C {t['vs_normal']}",
    delta_color="off",
)
tiles[2].metric(
    t["m_soil"],
    f"{100 * recent['soil_root'].mean():.0f}%",
    f"{soil_difference:+.0f} {t['points']} {t['vs_normal']}",
    delta_color="off",
)
tiles[3].metric(t["m_warming"], f"{temp_per_decade:+.2f} °C")

# A switch (not tabs) so only the visible charts are drawn, at the right width.
view = st.radio(
    t["climate"],
    [t["tab_recent"], t["tab_history"]],
    horizontal=True,
    label_visibility="collapsed",
)

if view == t["tab_recent"]:
    left, right = st.columns(2)
    with left:
        st.markdown(f"**{t['c_rain']}**")
        st.altair_chart(
            charts.bars_vs_reference(
                month_labels, recent["rain"], recent_normal["rain"],
                t["recent"], t["normal"], "mm",
            ),
            use_container_width=True,
        )
        st.markdown(f"**{t['c_soil']}**")
        st.altair_chart(
            charts.lines_vs_reference(
                month_labels, 100 * recent["soil_root"], 100 * recent_normal["soil_root"],
                t["recent"], t["normal"], t["soil_unit"],
            ),
            use_container_width=True,
        )
    with right:
        st.markdown(f"**{t['c_temp']}**")
        st.altair_chart(
            charts.lines_vs_reference(
                month_labels, recent["temp"], recent_normal["temp"],
                t["recent"], t["normal"], "°C",
            ),
            use_container_width=True,
        )
        st.markdown(f"**{t['c_humidity']}**")
        st.altair_chart(
            charts.lines_vs_reference(
                month_labels, recent["humidity"], recent_normal["humidity"],
                t["recent"], t["normal"], "%",
            ),
            use_container_width=True,
        )

else:
    years =[str(year) for year in by_year.index]
    rain_average = by_year.loc[2001:2020, "rain"].mean()
    left, right = st.columns(2)
    with left:
        st.markdown(f"**{t['c_year_temp']}**")
        st.altair_chart(
            charts.lines_vs_reference(
                years, by_year["temp"], temp_trend,
                t["year_value"], t["trend"], "°C", x_type="O",
            ),
            use_container_width=True,
        )
    with right:
        st.markdown(f"**{t['c_year_rain']}**")
        st.altair_chart(
            charts.bars_vs_reference(
                years, by_year["rain"], [rain_average] * len(years),
                t["year_value"], t["average"], "mm", x_type="O",
            ),
            use_container_width=True,
        )

with st.expander(t["limits_title"]):
    st.markdown(
        t["limits"].format(
            cell_elev=info["cell_elevation"],
            site_elev=place["elev"],
            adjust=info["temp_adjustment"],
        )
    )

# ---------------------------------------------------------------------------
# Rotation strategies (next step)
# ---------------------------------------------------------------------------

st.header(t["strategies"])
st.info(t["coming"])

st.divider()
st.caption(t["disclaimer"])
