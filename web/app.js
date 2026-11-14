// GroundTruth Cibao - Plan B. Page behavior.
// Reads the farmer's answers, asks engine.js for the strategies and draws them.
// Code written with the assistance of Claude Code (Anthropic) and OpenAI Codex.
(function () {
  "use strict";
  var D = window.GT_DATA;
  var E = window.GTEngine;
  var $ = function (id) { return document.getElementById(id); };

  // ------------------------------------------------------------------
  // The farmer's answers
  // ------------------------------------------------------------------
  var nextMonth = (new Date().getMonth() + 1) % 12 + 1;
  var state = {
    lang: "es",
    zone: 1, // Valverde (Mao - Esperanza)
    soil: "clay",
    month: nextMonth,
    area: 100,
    priority: "income",
    allocation: 0.6,
    riceAllowed: true,
    salty: false,
    selected: null, // strategy the user clicked; null = show the best one
    basinShare: 0.25,
    layer: "basins", // what the map shows: basins, balance, soil or heat
    whyTab: "why", // which explanation of the plan is open
    view: "home", // which section of the app is on screen
    gstep: 0, // question of the guided walkthrough (5 = the result)
    farmPlaced: false,
    guideWithScene: false,
    journeyBeat: 1
  };

  var STRATEGY_ORDER = ["current", "mixed", "rotation", "green"];
  // Every screen the person leaves is remembered here so "Back" can return to it.
  var trail = [];
  var ready = false; // becomes true once the first screen is on
  var browserSteps = 0; // how many of those screens the browser's own Back button knows about

  // Schematic map of the northern Dominican Republic. Points are [longitude, latitude],
  // placed by hand from general geographic knowledge: good for orientation, not surveyed.
  var MAP = { w: 760, h: 546, lon0: -72.1, lat0: 20.05, k: 206, cos: 0.947 };
  var mapRenderCount = 0;
  var NAV_VIEWS = ["home", "plan", "rotation", "options", "map", "data", "help"];
  var VIEWS = NAV_VIEWS.concat(["guide", "zone"]); // the walkthrough is opened from Home, not from the menu
  // Small drawings for the soil question: water stays on clay, sinks through sand.
  var SOIL_ART = {
    clay: '<svg viewBox="0 0 120 64" aria-hidden="true"><rect width="120" height="64" rx="10" fill="#7a4a2b"/><path d="M0 26h120M0 46h120" stroke="#5d3518" stroke-width="2"/><path d="M34 8v18M72 26v20M98 46v18M18 46v18" stroke="#5d3518" stroke-width="2"/><ellipse cx="60" cy="9" rx="38" ry="6" fill="#6db8f7"/></svg>',
    loam: '<svg viewBox="0 0 120 64" aria-hidden="true"><rect width="120" height="64" rx="10" fill="#8f6238"/><g fill="#6f4a27"><circle cx="20" cy="40" r="4"/><circle cx="52" cy="50" r="5"/><circle cx="88" cy="38" r="4"/><circle cx="104" cy="54" r="3"/><circle cx="36" cy="56" r="3"/></g><path d="M60 30V10m0 8c-7-1-11-5-12-11m12 9c7-1 11-5 12-11" fill="none" stroke="#2f9e52" stroke-width="3.5" stroke-linecap="round"/><path d="M60 30c-3 6-8 9-12 10m12-10c3 6 8 9 12 10" fill="none" stroke="#e9d3b0" stroke-width="2" stroke-linecap="round"/></svg>',
    sandy: '<svg viewBox="0 0 120 64" aria-hidden="true"><rect width="120" height="64" rx="10" fill="#dcb97c"/><g fill="#c39a58"><circle cx="16" cy="18" r="2.5"/><circle cx="40" cy="34" r="2.5"/><circle cx="70" cy="20" r="2.5"/><circle cx="96" cy="40" r="2.5"/><circle cx="26" cy="50" r="2.5"/><circle cx="60" cy="52" r="2.5"/><circle cx="108" cy="14" r="2.5"/></g><g fill="#4fa3f0"><path d="M50 6c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8z"/><path d="M76 26c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8z"/><path d="M60 44c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8z"/></g></svg>'
  };
  var PRIORITY_ICONS = {
    water: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4 5 6.5 8.5 6.5 12a6.5 6.5 0 0 1-13 0c0-3.5 2.5-7 6.5-12z"/></svg>',
    soil: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9M12 13c-4 0-6-2.5-6.5-6 4 0 6 2.5 6.5 6zM12 10c0-3.5 2-5.5 6-6 0 3.5-2 6-6 6zM4 21h16"/></svg>',
    income: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10l2 12H5zM9 8c0-3 1.5-4 3-4s3 1 3 4M9.5 14h5"/></svg>'
  };
  // Line icons drawn for this page, one stroke weight everywhere.
  var VIEW_ICONS = {
    home: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>',
    plan: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
    rotation: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9a8 8 0 0 1 14-3l2-2v6h-6l2.5-2.5A5 5 0 0 0 7 10M20 15a8 8 0 0 1-14 3l-2 2v-6h6l-2.5 2.5A5 5 0 0 0 17 14"/></svg>',
    options: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    map: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    data: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/></svg>',
    help: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>'
  };
  // Coastline and rivers come from geo.js (Natural Earth and OpenStreetMap).
  var GEO = {
    // where each dam's name goes
    damLabels: {
      "Tavera - Bao": { dx: -9, dy: 4, anchor: "end" }, "Monción": { dx: -9, dy: 4, anchor: "end" },
      "Hatillo": { dx: -8, dy: 16, anchor: "end" }, "Rincón": { dx: 8, dy: -6, anchor: "start" },
      "Sabana Yegua": { dx: 9, dy: 4, anchor: "start" }, "Sabaneta": { dx: -9, dy: 4, anchor: "end" }
    },
    // where each zone's name goes (zones not listed get their name to the right)
    labels: {
      "Santiago (Navarrete)": { dx: 0, dy: -12, anchor: "middle" },
      "Valverde (Mao - Esperanza)": { dx: 0, dy: 20, anchor: "middle" },
      "Montecristi (Villa Vásquez)": { dx: 0, dy: -12, anchor: "middle" },
      "La Vega": { dx: -11, dy: 4, anchor: "end" },
      "Duarte (Villa Riva)": { dx: 0, dy: -12, anchor: "middle" },
      "Sánchez Ramírez (Cotuí)": { dx: 11, dy: 13, anchor: "start" },
      "Monseñor Nouel (Bonao)": { dx: -11, dy: 12, anchor: "end" },
      "Samaná (Sánchez)": { dx: 8, dy: 16, anchor: "start" },
      "Dajabón": { dx: 0, dy: 20, anchor: "middle" },
      "San Juan de la Maguana": { dx: -11, dy: 12, anchor: "end" },
      "Barahona (Vicente Noble)": { dx: -11, dy: 4, anchor: "end" },
      "Monte Plata (Bayaguana)": { dx: 0, dy: 20, anchor: "middle" }
    }
  };
  // A small hand-drawn icon for each crop (24 x 24 line drawings).
  var ICONS = {
    rice: '<path d="M12 22V9c1-4 4-6 7-5"/><path d="M14 7l-1-2M16.5 5.5l-.5-2M19 4.5l.5-2"/><path d="M12 17c-3-.5-5-2.5-5.5-5.5M12 19c3-.5 5-2.5 5.5-5.5"/>',
    beans: '<path d="M5 17C5 10 10 5 18 5c1 7-4 13-11 13-1.2 0-2-.3-2-1z"/><circle cx="10" cy="14" r="1"/><circle cx="13.5" cy="10.5" r="1"/>',
    pigeon_pea: '<path d="M4 15c2-3 4-3 5-1 1-3 4-3 5-1 1-3 4-3 6-1-1 4-4 6-8 6s-7-1-8-3z"/><path d="M12 9V4M12 6c-2 0-3-1-3.5-2.5M12 6c2 0 3-1 3.5-2.5"/>',
    cowpea: '<path d="M7 4c-2 6-1 12 2 17M13 3c-2 6-1 12 2 18"/><path d="M18 6c1 3 1 6 0 9"/>',
    maize: '<path d="M12 3c3 3 4 8 3 13-1 3-5 3-6 0-1-5 0-10 3-13z"/><path d="M9 16c-3-1-4-4-4-7M15 16c3-1 4-4 4-7M12 19v3"/><path d="M10.5 8h3M10 11h4M10.5 14h3"/>',
    sorghum: '<path d="M12 22V12"/><ellipse cx="12" cy="7.5" rx="3.5" ry="5"/><path d="M12 17c-3 0-5-1.5-6-4M12 19c3 0 5-1.5 6-4"/>',
    squash: '<path d="M12 7c-5 0-8 3-8 7s3 6 8 6 8-2 8-6-3-7-8-7z"/><path d="M12 7c-2 3-2 10 0 13M12 7c2 3 2 10 0 13M12 7V4c0-1 1-1.5 2-1.5"/>',
    sesbania: '<path d="M12 22V4"/><path d="M12 8c-2-.5-3.5-2-4-4M12 8c2-.5 3.5-2 4-4M12 13c-2.5-.5-4-2-4.5-4M12 13c2.5-.5 4-2 4.5-4M12 18c-2.5-.5-4-2-4.5-4M12 18c2.5-.5 4-2 4.5-4"/>'
  };
  function cropIcon(crop) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[crop] + "</svg>";
  }
  // colored square with the crop's icon, used in lists
  function cropBadge(crop) {
    return '<i class="cb ' + role(crop) + '">' + cropIcon(crop) + "</i>";
  }

  // one-hue color steps, light to dark, for each map layer
  var RAMPS = {
    balance: ["#fde3d3", "#f9c0a0", "#f29a6b", "#e6753d", "#c9541f"],
    soil: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#1c5cab"],
    heat: ["#fbd9d9", "#f5aeae", "#ec8080", "#dc5252", "#b93131"]
  };
  var MONTHS = {
    es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };
  var MONTHS_SHORT = {
    es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };

  var SOURCES = [
    ["NASA POWER (Prediction Of Worldwide Energy Resources), NASA Langley Research Center", "https://power.larc.nasa.gov/"],
    ["Province boundaries: geoBoundaries ADM1, Dominican Republic, represented 2022 (public domain)", "https://www.geoboundaries.org/api/current/gbOpen/DOM/ADM1/"],
    ["FAO Irrigation and Drainage Paper 56: Crop evapotranspiration (Allen et al., 1998)", "https://www.fao.org/4/x0490e/x0490e00.htm"],
    ["FAO Irrigation Water Management Training Manual No. 3: Irrigation water needs (1986)", "https://www.fao.org/4/s2022e/s2022e00.htm"],
    ["FAO Irrigation and Drainage Paper 29: Water quality for agriculture (Ayers & Westcot, 1985)", "https://www.fao.org/4/t0234e/t0234e00.htm"],
    ["elDinero, 25 Mar 2026: La región Norte concentra el 91.5% de la producción nacional de arroz", "https://eldinero.com.do/359496/la-region-norte-concentra-el-91-5-de-la-produccion-nacional-de-arroz/"],
    ["UNCCD, 23 Aug 2024: Dominican Republic: restoring land to secure clean water for millions", "https://www.unccd.int/news-stories/stories/dominican-republic-restoring-land-secure-clean-water-millions"],
    ["El Caribe, 15 Sep 2019: INDRHI confirma prohibición de siembra de arroz de invierno", "https://www.elcaribe.com.do/2019/09/15/director-del-indrhi-confirma-prohibicion-siembra-de-arroz-de-invierno-en-provincias-del-cibao-central-y-linea-noroeste-por-sequia/"],
    ["Diario Libre, 11 Aug 2026: condiciones de las presas y ríos (INDRHI)", "https://www.diariolibre.com/planeta/clima/2026/08/11/45--menos-lluvias-estas-son-las-condiciones-de-las-presas-y-rios/3625695"],
    ["Montecristi 24 Horas, 28 Aug 2026: Racionan el agua para la agricultura por falta de lluvias", "https://montecristi24horas.com/2026/08/racionan-el-agua-para-la-agricultura-por-falta-de-lluvias/"],
    ["Presidencia de la República Dominicana: INDRHI informa sobre volúmenes en el sistema nacional de presas", "https://presidencia.gob.do/noticias/indrhi-informa-sobre-volumenes-en-sistema-nacional-de-presas"],
    ["Map rivers: © OpenStreetMap contributors (ODbL)", "https://www.openstreetmap.org/copyright"],
    ["Autopista Duarte route reference: OpenStreetMap contributors via OSRM (ODbL)", "https://www.openstreetmap.org/copyright"],
    ["Autopista Duarte official corridor description: MOPC / RD Vial", "https://rdvial.gob.do/wp-content/uploads/2024/02/SIMVFOP-003-P2-PS-11231.pdf"],
    ["Map coastline: Natural Earth (public domain)", "https://www.naturalearthdata.com/"],
    ["Typefaces: Big Shoulders Display and Archivo (SIL Open Font License), via Fontsource", "https://fontsource.org/"],
    ["Satellite photo: NASA Worldview Snapshots, MODIS Terra corrected reflectance, 18 Feb 2026", "https://wvs.earthdata.nasa.gov/"],
    ["Elevation: Terrain Tiles on AWS Open Data (Mapzen), derived mainly from NASA SRTM", "https://registry.opendata.aws/terrain-tiles/"],
    ["Soil by feel: USDA NRCS, Guide to Texture by Feel (S. J. Thien, 1979)", "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/guide-to-texture-by-feel"]
  ];

  // ------------------------------------------------------------------
  // Every sentence on the page, in both languages
  // ------------------------------------------------------------------
  var T = {
    es: {
      hero_title: "Si falta el agua, ¿qué se siembra?",
      hero_map_note: "Toca tu zona para empezar",
      why_title: "El Plan B del arrocero dominicano",
      stamp: "Plan B",
      hero_lead: "Cuando el agua de riego no alcanza, al productor le dicen que no siembre arroz. Esta herramienta le muestra qué sí puede sembrar con el agua que le toca, usando 25 años de datos de la NASA (2001–2025).",
      facts: [
        ["91.5%", "del arroz dominicano se produce en el Cibao, casi todo bajo riego.", 4],
        ["96%", "del agua del río Yaque del Norte ya está comprometida.", 5],
        ["2019", "el INDRHI prohibió la siembra de arroz de invierno por sequía. En 2026 volvió el riego por turnos.", [6, 8]]
      ],
      source: "fuente",
      farm: "Tu finca en 3 pasos",
      zone: "Zona arrocera",
      month: "Mes de siembra",
      area: "Tareas",
      soil: "Tipo de suelo",
      soils: { clay: "Arcilloso", loam: "Franco", sandy: "Arenoso" },
      priority: "¿Qué te importa más?",
      priorities: { water: "Agua", soil: "Suelo", income: "Ingreso" },
      allocation: "Agua que te asignaron",
      allocation_hint: "Es la parte del agua que necesitaría toda tu finca sembrada de arroz. La anuncia el INDRHI o tu junta de regantes antes de cada ciclo.",
      rice_banned: "Este ciclo está prohibido sembrar arroz",
      salty: "Mi suelo tiene problemas de sal",
      headline: "Con el <b>{alloc}%</b> del agua, lo que mejor encaja con tu prioridad es <b>{name}</b>: {mix}.",
      headline_none: "Sin agua de riego no hay cultivo viable en este ciclo: la lluvia cubre apenas el <b>{rain}%</b> de lo que consume el cultivo.",
      strategies: "Cuatro maneras de usar la misma agua",
      strategies_sub: "Cada cuadro es el 1% de tu finca. Mueve el control de agua y mira cómo cambian. Toca una tarjeta para ver el porqué.",
      best: "Mejor para tu prioridad",
      names: { current: "Solo arroz", mixed: "Arroz + leguminosa", rotation: "Rotación para vender", green: "Abono verde" },
      name_legume_only: "Leguminosa",
      roles: { rice: "Arroz", legume: "Leguminosa", cash: "Cultivo para vender", green: "Abono verde", idle: "Sin sembrar" },
      tareas: "tareas",
      tareas_of: "tareas de",
      idle: "sin sembrar",
      nothing: "Nada sembrado",
      assigned: "asignada",
      uses: "Usa <b>{used} m³</b> de {budget} m³",
      score_water: "Agua", score_soil: "Suelo", score_income: "Ingreso",
      sacks: "≈ {n} sacos de urea al suelo",
      chips: {
        heat: "Calor", heavy_soil: "Suelo pesado", sandy_rice: "Suelo arenoso", salt: "Sal",
        idle_land: "Tierra vacía", weak_market: "Mercado incierto", no_income: "Sin ingreso",
        short_in_dry_year: "Justo en año seco"
      },
      why: "Por qué se sugiere", evidence: "Evidencia", benefits: "Beneficios",
      gaps: "Información que falta", risks: "Riesgos a revisar con un técnico",
      why_text: {
        current: "Es lo que haces hoy: sembrar solo arroz en la tierra que el agua permita.",
        mixed: "Repartir el agua: menos tareas de arroz y, con lo que sobra, {alt} en el resto. Así toda la finca produce.",
        mixed_banned: "Sin arroz este ciclo, {alt} mantiene la finca produciendo y le devuelve nitrógeno al suelo.",
        rotation: "Descansar del arroz este ciclo y sembrar {alt}, que pide mucha menos agua y se puede vender.",
        green: "Descansar del arroz este ciclo y sembrar {alt} para devolverle nitrógeno y materia orgánica al suelo."
      },
      ev_rice: "El arroz necesita {m3} m³ de riego por tarea en {zone} sembrando en {month} (NASA POWER 2001–2025, método FAO-56).",
      ev_alt: "{alt} necesita {m3} m³ por tarea: {ratio} veces menos que el arroz.",
      ev_rain: "En ese ciclo la lluvia cubre solo el {rain}% del agua que consume el arroz.",
      ev_use: "Este plan usa {used} m³ de los {budget} m³ asignados.",
      ev_dry: "En un año seco (2 de cada 10) el mismo plan pediría {dry} m³.",
      ben_market: "Mercado y precio conocidos.",
      ben_same: "No cambias de manejo ni de equipos.",
      ben_full: "Ninguna tarea queda vacía.",
      ben_saved: "Usa {saved}% menos agua que sembrar toda la finca de arroz.",
      ben_nitrogen: "Deja nitrógeno equivalente a unos {n} sacos de urea para el próximo arroz.",
      ben_break: "Cortar el arroz en esa tierra ayuda a romper el ciclo de malezas y plagas del monocultivo.",
      ben_organic: "Mejora la materia orgánica y la estructura del suelo.",
      gap_prices: "No usamos precios ni rendimientos reales: la nota de ingreso solo mide qué tan segura es la venta.",
      gap_cell: "Los datos de la NASA describen cuadros de unos 50 km, no tu finca exacta.",
      gap_crops: "Los valores de cada cultivo son referencias generales de FAO; falta validarlos en el Cibao.",
      risk: {
        heat: "Calor: la máxima media del ciclo ronda {tmax} °C y {crop} sufre por encima de {limit} °C.",
        heavy_soil: "Suelo pesado: {crop} no tolera bien los suelos arcillosos que se encharcan.",
        sandy_rice: "Suelo arenoso: el arroz pierde mucha agua por filtración.",
        salt: "Sal: {crop} es sensible a la salinidad del suelo.",
        idle_land: "{n} tareas quedan sin sembrar y sin ingreso.",
        weak_market: "Mercado: la venta de {crop} no está asegurada. Confirma comprador antes de sembrar.",
        no_income: "Este ciclo no deja ingreso por venta.",
        short_in_dry_year: "En un año seco, el agua asignada no alcanzaría para todo el plan.",
        mono: "Seguir solo con arroz mantiene el monocultivo y no aporta nitrógeno nuevo.",
        always: "Consulta con un técnico agrícola antes de cambiar tu rotación."
      },
      share_wa: "Enviar plan por WhatsApp", share_copy: "Copiar plan", copied: "Copiado",
      needs_title: "Agua de riego por tarea",
      needs_sub: "{zone}, suelo {soil}, siembra en {month}.",
      needs_note: "Calculado para cada año de 2001 a 2025 con temperatura, sol, humedad, viento y lluvia de NASA POWER.",
      typical: "Año típico", dry: "Año seco (2 de cada 10)",
      climate_title: "Balance de agua mes a mes",
      climate_sub: "Lluvia contra el agua que pierde el campo, en mm por mes. Promedio 2001–2025 en {zone}.",
      rain: "Lluvia", shortfall: "Falta de agua (la pone el riego)",
      et0: "Agua que pierde el campo (evapotranspiración)", cycle: "Meses del ciclo elegido",
      tip_rain: "lluvia", tip_et0: "pierde el campo", tip_gap: "faltan", tip_tmax: "máxima media",
      strip: "Franja de abajo: temperatura máxima media de cada mes, en °C. Más oscuro: más calor.",
      climate_note: "En tu ciclo ({from} a {to}) llueven unos {rain} mm y el campo pierde unos {et0} mm: faltan unos {gap} mm, que tiene que poner el riego. En todo el año llueven {rain_year} mm y el campo pierde {et0_year} mm.",
      heat_title: "Calor durante el ciclo: ¿lo aguanta cada cultivo?",
      heat_sub: "Temperatura máxima media durante el ciclo de cada cultivo, sembrando en {month} en {zone} (NASA POWER 2001–2025), contra el límite de referencia del cultivo.",
      heat_ok: "bajo su límite de {limit} °C",
      heat_over: "+{n} °C sobre su límite de {limit} °C",
      heat_dot: "Máxima media del ciclo", heat_tick: "Límite del cultivo", heat_zone: "Exceso de calor",
      heat_note: "Los límites son valores de referencia generales que un agrónomo debe validar. La temperatura de la NASA está ajustada por altitud y no se ha comparado con una estación local.",
      listen: "Escuchar el plan", stop: "Detener la voz", print: "Imprimir ficha",
      say_plan: "Plan: {name}. {mix}.",
      say_none: "Sin agua de riego no hay cultivo viable en este ciclo.",
      say_water: "Usa {used} metros cúbicos de agua de riego, {saved} por ciento menos que sembrar toda la finca de arroz.",
      say_n: "Deja en el suelo nitrógeno equivalente a unos {n} sacos de urea.",
      say_risks: "Para revisar con un técnico:",
      say_degrees: "grados",
      faq_title: "Preguntas frecuentes",
      faq_sub: "Respuestas escritas por el equipo, con los números de tu finca. No hay una IA respondiendo.",
      faq: [
        { q: "¿Por qué una leguminosa en vez de más arroz?",
          a: "Porque con el agua que hay no alcanza para sembrar toda la finca de arroz. En {zone}, sembrando en {month}, el arroz pide {rice_m3} m³ de riego por tarea y {alt} pide {alt_m3} m³: {ratio} veces menos. Además, las leguminosas toman nitrógeno del aire y dejan una parte en el suelo. En el plan de arroz con leguminosa eso equivale a unos {sacks} sacos de urea." },
        { q: "¿Qué pasa si dejo parte de la tierra sin sembrar?",
          a: "Con solo arroz y el {alloc}% del agua quedarían vacías {idle} de tus {area} tareas. Esa tierra no da ingreso, y un suelo desnudo queda expuesto al sol, a la lluvia fuerte y a las malezas. Un cultivo de poca agua o un abono verde la mantiene cubierta y produciendo.",
          a_none: "Con el agua que tienes asignada, la estrategia de solo arroz no deja tierra vacía. Si el agua baja, la tierra que quede sin sembrar no da ingreso y queda expuesta al sol, a la lluvia fuerte y a las malezas." },
        { q: "¿Cómo calculan el agua con datos de la NASA?",
          a: "Usamos NASA POWER, que da para cada día de 2001 a 2025 la temperatura, el sol, la humedad, el viento y la lluvia de tu zona. Con eso calculamos cuánta agua pierde el campo cada día (método FAO-56) y la ajustamos a lo que consume cada cultivo en cada etapa. Al restar la lluvia que se aprovecha queda el riego necesario. Repetimos la cuenta para cada año y mostramos el año típico y el año seco." },
        { q: "¿Esto es una caja negra?",
          a: "No. La recomendación sale de fórmulas fijas que cualquiera puede revisar: con los mismos datos siempre da el mismo resultado. No hay un modelo de inteligencia artificial decidiendo qué sembrar. La IA ayudó al equipo a escribir el código y los textos, y eso está declarado. El cálculo pasa más de 31,000 verificaciones automáticas." },
        { q: "¿Qué tan seguros son estos números?",
          a: "Son una guía, no una medición en tu finca. La NASA describe cuadros de unos 50 km y su lluvia suele salir más baja que la de los pluviómetros. Los valores de cada cultivo son referencias generales de FAO que falta validar en el Cibao. Por eso cada estrategia trae sus riesgos y pide consultar con un técnico agrícola." },
        { q: "¿La luna o las mareas influyen?",
          a: "Esta herramienta no usa la fase de la luna: no conocemos evidencia científica sólida de que cambie el agua que necesita un cultivo. Lo que sí puede afectar cerca de la costa es la sal: cuando el río baja con poca agua, el agua de mar puede entrar por la desembocadura. Si tu suelo tiene problemas de sal, marca esa casilla y la herramienta avisa cuáles cultivos son sensibles." }
      ],
      sheet_title: "Ficha de siembra",
      sheet_water: "Agua de riego del plan", sheet_dry: "En un año seco (2 de cada 10)",
      sheet_saved: "Ahorro frente a sembrar todo de arroz", sheet_n: "Nitrógeno que recibe el suelo",
      sheet_sacks: "sacos de urea", sheet_land: "Tareas sembradas",
      sheet_heat: "Meses del ciclo y su temperatura máxima media",
      eyebrow: "NASA Space Apps 2026 · República Dominicana",
      nav: { home: "Inicio", plan: "Mi plan", rotation: "Rotación", options: "Opciones", map: "Mapa", data: "Datos", help: "Ayuda" },
      install: "Instalar app",
      back: "← Atrás",
      g_step: "Pregunta {n} de 5", g_done: "Tu plan",
      g_q: ["¿Dónde está tu finca?", "¿Cuándo siembras y cuánta tierra tienes?", "¿Cómo es tu suelo?",
        "¿Cuánta agua te toca este ciclo?", "¿Qué te importa más?"],
      g_sub: ["Toca una provincia o zona arrocera. Elegimos el punto arrocero más cercano; el clima de NASA es regional.",
        "El mes cambia el calor y la lluvia que va a recibir el cultivo.",
        "El suelo decide cuánta agua se pierde y qué cultivos aguantan.",
        "Es lo que anuncia el INDRHI o tu junta de regantes antes de sembrar.",
        "Con eso elegimos cuál de los planes va primero."],
      g_next: "Siguiente", g_back: "Atrás", g_see: "Ver mi plan",
      g_result: "Este es tu plan", g_full: "Ver mi plan completo", g_rot: "Ver la rotación", g_restart: "Empezar de nuevo",
      g_zone: "Tu zona:", g_month: "Mes de siembra", g_area: "Tareas de tu finca",
      g_scene_label: "Tu zona arrocera sigue a la vista. La casita marca una referencia ilustrativa, no el lindero real.",
    journey_title: "Del cielo a la parcela",
    journey_intro: "Sigue el recorrido: una señal del clima se convierte en una decisión de siembra.",
    journey_kicker_1: "01 · OBSERVAR",
    journey_kicker_2: "02 · MEDIR EL AGUA",
    journey_kicker_3: "03 · CAMBIAR EL CICLO",
    journey_copy_1: "NASA POWER aporta el contexto climático de la zona seleccionada.",
    journey_copy_2: "La lluvia y el agua asignada cambian cuánto arroz cabe en el plan.",
    journey_copy_3: "El calendario compara cultivos entre ciclos en los mismos lotes.",
    journey_step_1: "El clima de tu zona",
    journey_text_1: "Temperatura y lluvia históricas ayudan a entender el momento de siembra.",
    journey_step_2: "El agua que llega",
    journey_text_2: "Comparamos la lluvia y la necesidad estimada del cultivo con el agua disponible.",
    journey_step_3: "La tierra vuelve a producir",
    journey_text_3: "Explora cómo alternar cultivos para que cada lote tenga otro siguiente ciclo.",
    field_water: "Agua disponible",
    field_water_target: "del objetivo de riego",
    field_area: "Área modelada",
    field_weather: "Este mes en la zona",
    field_rain: "lluvia media",
    field_soil: "Suelo elegido",
      g_fit: "Con esa agua alcanza para {n} de tus {area} tareas de arroz.",
      g_fit_ban: "Este ciclo no se puede sembrar arroz.",
      how: [["Dime tu finca", "Zona, mes de siembra, tareas y tipo de suelo."],
        ["Dime tu agua", "Normal, tandeo o veda: lo que anunció el INDRHI o tu junta de regantes."],
        ["Mira tu plan", "Qué sembrar, cuánta agua usa y cómo rotar en el ciclo siguiente."]],
      go_rotation: "Ver la rotación en 2 ciclos", go_options: "Comparar las 4 opciones",
      name_switch: "Cambiar a {crop}",
      rotation_title: "La rotación en dos ciclos",
      rotation_sub: "Rotar es cambiar de cultivo en la misma tierra de un ciclo al siguiente. Así queda tu finca con el plan elegido.",
      rot_cycle: "Ciclo {n} · siembra en {month}",
      rot_lot: "Lote {n} · {tareas} tareas",
      rot_swap: "En el ciclo 2 el arroz se siembra donde estuvo {alt} y aprovecha el nitrógeno que dejó: unos {n} sacos de urea. A su vez, {alt} pasa a la tierra donde estuvo el arroz.",
      rot_back: "En el ciclo 2 el arroz vuelve a la tierra donde estuvo {alt}.",
      rot_back_n: "En el ciclo 2 el arroz vuelve a la tierra donde estuvo {alt} y aprovecha el nitrógeno que dejó: unos {n} sacos de urea.",
      rot_none: "Con solo arroz no hay rotación: el mismo cultivo se repite en la misma tierra, sin nitrógeno nuevo y con las mismas malezas y plagas.",
      rot_water: "Agua del ciclo {c}: {used} m³ de {budget} m³ asignados.",
      rot_over: "En el ciclo 2 el agua no alcanzaría para este reparto: habría que sembrar menos arroz.",
      rot_note: "El ciclo 2 supone que te asignan el mismo {alloc}% de agua y que se puede sembrar arroz. Las fechas son aproximadas: dependen de la variedad y del día de siembra.",
      start_btn: "Empezar con mi finca",
      step1: "¿Dónde y cuándo siembras?", step2: "¿Cuánta agua te toca?", step3: "¿Qué te importa más?",
      what_is: "¿Qué significa esto?", what_scores: "¿Qué significan las notas de agua, suelo e ingreso?",
      month_help: "Sembrando en {month}, el calor del ciclo ronda {tmax} °C de máxima y la lluvia cubre solo el {rain}% del agua del arroz.",
      soil_help: {
        clay: "Arcilloso: guarda el agua. Bueno para el arroz; la habichuela y el maíz sufren si se encharca.",
        loam: "Franco: equilibrado. Sirve para casi todos los cultivos.",
        sandy: "Arenoso: el agua se filtra rápido. El arroz gasta mucha más agua."
      },
      water_help: {
        normal: "Hay agua para toda la finca de arroz. Rotar una parte igual ahorra agua y cuida el suelo.",
        tandeo: "El agua no alcanza para toda la finca de arroz. Combinando cultivos siembras más tierra con la misma agua.",
        veda: "No se puede sembrar arroz. Un cultivo de poca agua mantiene la finca produciendo."
      },
      priority_help: {
        water: "Gana el plan que ahorra más agua sin dejar tierra vacía.",
        soil: "Gana el plan que deja más nitrógeno y le da descanso al suelo.",
        income: "Gana el plan con cultivos de venta más segura."
      },
      score_help: "Cada nota va de 0 a 100. Agua: cuánta agua ahorras manteniendo la tierra sembrada. Suelo: cuánto nitrógeno recibe y cuánta tierra descansa del arroz. Ingreso: qué tan segura es la venta de lo que siembras (no usa precios).",
      tabs: { why: "Por qué", evidence: "Evidencia", benefits: "Beneficios", gaps: "Falta saber", risks: "Riesgos" },
      why_title: "¿Por qué este plan?",
      data_title: "Entender los datos",
      data_sub: "Abre solo lo que quieras ver. Cada sección dice qué mide y cómo afecta a tus cultivos.",
      needs_fx: "Cuánta agua pide cada cultivo. Mientras menos pide, más tareas siembras con tu asignación.",
      climate_fx: "Lo que llueve contra lo que el campo pierde. La diferencia es el agua que tiene que poner el riego.",
      heat_fx: "Qué cultivos aguantan el calor de este ciclo y cuáles pueden perder flores o rendimiento.",
      basin_fx: "Cuánta agua se ahorra en las presas si muchos productores rotan a la vez.",
      trust_fx: "De dónde salen los números, cómo se calculan y qué les falta.",
      basin_title: "De tu finca a la cuenca",
      basin_q: "¿Y si el {share}% de los arroceros de la cuenca {basin} sembrara {alt} en vez de arroz este ciclo?",
      basin_big: "{n} millones de m³",
      basin_small: "de agua que no habría que sacar de las presas, en unas {tareas} tareas.",
      basin_of: "de la capacidad de {dam}",
      basin_cap: "{n} millones de m³",
      basin_note: "Cifra conservadora: solo cuenta el agua ahorrada en las fincas. El área de arroz de la cuenca se estimó repartiendo el área nacional según la producción de cada provincia.",
      basin_none: "No tenemos datos de presas para la cuenca {basin}. El cálculo a nivel de cuenca está disponible para el Yaque del Norte, el Yuna - Camú y el Yaque del Sur.",
      trust_title: "Qué tan confiable es esto",
      limits_title: "Límites y vacíos de información",
      limits: [
        "Es una herramienta de apoyo. No reemplaza al productor ni al técnico agrícola.",
        "Los datos son de satélites y modelos de la NASA, en cuadros de unos 50 km. No son mediciones de una estación en la finca.",
        "La temperatura se ajusta por altitud ({adjust} °C en esta zona: el cuadro de NASA promedia {cell} m y la zona está a {elev} m).",
        "La lluvia de NASA POWER puede quedar por debajo de la que miden los pluviómetros locales. Eso haría que el riego calculado sea algo mayor que el real.",
        "Las notas de agua, suelo e ingreso son una guía para comparar opciones, no una predicción de cosecha ni de ganancia.",
        "La nota de ingreso no usa precios ni rendimientos; falta incorporarlos.",
        "Qué cultivos aguantan un suelo arrocero y sus límites de calor son valores generales que un agrónomo local debe validar."
      ],
      method_title: "Cómo se calcula",
      method: [
        "Agua que pierde el campo cada día: método FAO-56 Penman-Monteith con temperatura, radiación solar, humedad y viento de NASA POWER.",
        "Agua de cada cultivo: esa pérdida diaria por el coeficiente del cultivo en cada etapa (tablas de FAO-56).",
        "Arroz inundado: se suman 200 mm para saturar el suelo, 100 mm de lámina y la filtración diaria según el suelo (manual de riego de FAO).",
        "Riego necesario: agua del cultivo menos la lluvia aprovechable, para cada año de 2001 a 2025. Se muestra el año típico (mediana) y el año seco (percentil 80).",
        "Estrategias: con el agua asignada se reparte la finca sin pasarse del agua ni de la tierra disponible."
      ],
      sources_title: "Fuentes",
      foot_support: "Herramienta de apoyo a la decisión. Consulta siempre con un técnico agrícola local antes de cambiar tu rotación.",
      foot_ai: "Equipo GroundTruth Cibao · NASA Space Apps Challenge 2026, Santiago. Código, textos y análisis elaborados con asistencia de Claude Code (Anthropic) y OpenAI Codex.",
      foot_nasa: "Usa datos de NASA POWER. La NASA no avala a ninguna entidad no gubernamental ni este producto.",
      plan_title: "Plan B del arrocero · GroundTruth Cibao",
      plan_farm: "Finca: {area} tareas en {zone}, suelo {soil}. Siembra: {month}.",
      plan_water: "Agua asignada: {alloc}%.",
      plan_strategy: "Estrategia: {name}",
      plan_use: "Agua: {used} m³ ({saved}% menos que todo arroz).",
      plan_n: "Nitrógeno al suelo: unos {n} sacos de urea.",
      plan_risks: "Revisar: {list}.",
      plan_foot: "Datos NASA POWER + FAO-56. Es una guía: consulta a tu técnico agrícola.",
      pedro_btn: "Ver el caso de Don Pedro en Mao: 100 tareas, 60% del agua",
      pedro_note: "Don Pedro es un caso de ejemplo, no una persona real.",
      light: { normal: "Normal", tandeo: "Tandeo", veda: "Veda" },
      light_desc: { normal: "Riego completo", tandeo: "Riego por turnos", veda: "Arroz prohibido" },
      light_note: "El semáforo es una guía nuestra con los términos del riego dominicano. Los porcentajes no son cifras oficiales del INDRHI: ajústalos con el control.",
      map_title: "El arroz dominicano visto por la NASA",
      map_sub: "Toca una provincia o zona arrocera. Elegimos el punto arrocero más cercano. Límites: geoBoundaries (2022). Cada cuadro NASA POWER mide unos 50 km.",
      layers: { basins: "Ríos y presas", sat: "Foto satelital", balance: "Falta de agua", soil: "Humedad del suelo", heat: "Calor" },
      back_plan: "← Volver a mi plan", back_map: "← Volver al mapa",
      z_sub: "Cuenca {basin}. Relieve real en 3D de unos 90 km de ancho. Arrastra para girarlo.",
      z_note: "Relieve: NASA SRTM, altura exagerada 8×. Ríos y Autopista Duarte: © OpenStreetMap. Los carros son ilustrativos; no muestran tráfico en vivo. Clima: NASA POWER, 2001–2025.",
      z_plan: "Planificar mi finca aquí",
      z_continue: "Continuar con esta finca",
      z_farm_note: "Toca el botón para colocar una marca de finca en esta zona.",
      z_farm_placed: "Finca colocada en esta zona arrocera. Su ubicación y tamaño son ilustrativos.",
      rice_region: "Zona arrocera de referencia; no representa parcelas individuales.",
      province_boundary: "Límites provinciales (geoBoundaries, 2022)",
      z_elev: "altitud de la zona", z_high: "punto más alto cerca", z_heat: "máxima media en {month}, el mes más caliente",
      z_temp: "temperatura media del año", z_rain: "de lluvia al año", z_et0: "pierde el campo al año",
      z_hum: "humedad del aire", z_wind: "viento medio", z_soilw: "humedad del suelo en las raíces",
      z_rivers: "Ríos cerca", z_dams: "Presas cerca", z_none: "ninguno dentro de la ventana",
      z_soil_title: "Tipo de suelo",
      z_soil: "No tenemos el tipo de suelo de cada lugar: la base mundial que probamos no respondió de forma confiable. Reconócelo tú con la guía de suelos.",
      z_soil_btn: "Ver la guía de suelos",
      soilg_title: "Cómo reconocer tu suelo",
      soilg_sub: "La prueba de la cinta toma dos minutos y no necesita laboratorio.",
      soilg_how: "Toma un puñado de tierra sin piedras ni raíces. Mójala poco a poco y amásala hasta que quede como masilla. Apriétala entre el pulgar y el índice, empujando hacia arriba, para sacar una cinta.",
      soilg_head: ["Suelo", "Cómo se siente", "La cinta", "El agua", "Qué significa para tu finca"],
      soilg_rows: {
        clay: ["Pegajoso y liso cuando está mojado. Duro y agrietado cuando se seca.", "Larga: más de 5 cm sin romperse.", "Se queda encima un día o más.", "Guarda el agua: bueno para arroz inundado. La habichuela, el maíz y el guandul necesitan buen drenaje."],
        loam: ["Suave, un poco áspero. Forma una bola que no se pega mucho.", "Corta: se rompe antes de 2.5 cm.", "Baja en unas horas.", "Sirve para casi todos los cultivos. Es el más fácil para rotar."],
        sandy: ["Áspero, como azúcar. La bola se desmorona.", "No sale cinta.", "Se cuela en minutos.", "El arroz gasta mucha más agua. Convienen cultivos de poca agua."]
      },
      soilg_note: "Método: guía de textura al tacto del USDA (Thien, 1979). Entre 2.5 y 5 cm de cinta es un suelo intermedio (franco arcilloso). Los dibujos son ilustrativos: conviene agregar fotos de suelos de la zona.",
      g_soil_link: "¿No sabes cuál es? Así se reconoce",
      layer_desc: {
        basins: "Ríos Yaque del Norte, Yuna y Yaque del Sur con sus presas.",
        sat: "Foto real tomada por el satélite Terra de la NASA (instrumento MODIS) el 18 de febrero de 2026.",
        balance: "Lluvia menos el agua que pierde el campo, en mm por año. Más oscuro: falta más agua.",
        soil: "Humedad en la zona de raíces, en % de saturación. Más oscuro: más húmedo.",
        heat: "Temperatura máxima media del mes más caliente. Más oscuro: más calor."
      },
      layer_source: "NASA POWER, promedio 2001–2025.",
      river: "Río", dam: "Presa", zone_dot: "Zona arrocera", selected_dot: "Tu zona",
      map_aria: "Mapa de la República Dominicana con las zonas arroceras",
      map_note: "Costa: Natural Earth. Ríos y Autopista Duarte: © OpenStreetMap (ODbL). Carros animados: ilustración, no tráfico en vivo. Los puntos arroceros son referencias regionales.",
      ocean: "Océano Atlántico", haiti: "Haití", caribbean: "Mar Caribe",
      parcel_title: "Tu finca desde arriba",
      parcel_sub: "{name}. Cada cuadro es el 1% de tus {area} tareas.",
      impact_n: "sacos de urea que el suelo recibe sin comprarlos",
      impact_water: "m³ de agua menos que sembrar todo de arroz",
      impact_land: "tareas sembradas, sin suelo desnudo"
    },
    en: {
      hero_title: "When the water runs short, what do you plant?",
      hero_map_note: "Tap your zone to start",
      why_title: "Plan B for the Dominican rice farmer",
      stamp: "Plan B",
      hero_lead: "When irrigation water runs short, rice farmers are told not to plant. This tool shows what they can still grow with the water they are given, using 25 years of NASA data (2001–2025).",
      facts: [
        ["91.5%", "of Dominican rice is grown in the Cibao valley, almost all of it irrigated.", 4],
        ["96%", "of the Yaque del Norte river's water is already committed.", 5],
        ["2019", "the water authority banned winter rice planting because of drought. In 2026 irrigation by turns came back.", [6, 8]]
      ],
      source: "source",
      farm: "Your farm in 3 steps",
      zone: "Rice zone",
      month: "Planting month",
      area: "Tareas",
      soil: "Soil type",
      soils: { clay: "Clay", loam: "Loam", sandy: "Sandy" },
      priority: "What matters most?",
      priorities: { water: "Water", soil: "Soil", income: "Income" },
      allocation: "Water you were allocated",
      allocation_hint: "The share of the water your whole farm would need if planted with rice. The water authority (INDRHI) or your irrigation board announces it before each cycle.",
      rice_banned: "Rice planting is banned this cycle",
      salty: "My soil has salt problems",
      headline: "With <b>{alloc}%</b> of the water, the best match for your priority is <b>{name}</b>: {mix}.",
      headline_none: "With no irrigation water, no crop is viable this cycle: rain covers only <b>{rain}%</b> of what the crop uses.",
      strategies: "Four ways to use the same water",
      strategies_sub: "Each square is 1% of your farm. Move the water control and watch them change. Tap a card to see why.",
      best: "Best for your priority",
      names: { current: "Rice only", mixed: "Rice + legume", rotation: "Rotation to sell", green: "Green manure" },
      name_legume_only: "Legume",
      roles: { rice: "Rice", legume: "Legume", cash: "Crop to sell", green: "Green manure", idle: "Not planted" },
      tareas: "tareas",
      tareas_of: "tareas of",
      idle: "not planted",
      nothing: "Nothing planted",
      assigned: "allocated",
      uses: "Uses <b>{used} m³</b> of {budget} m³",
      score_water: "Water", score_soil: "Soil", score_income: "Income",
      sacks: "≈ {n} sacks of urea for the soil",
      chips: {
        heat: "Heat", heavy_soil: "Heavy soil", sandy_rice: "Sandy soil", salt: "Salt",
        idle_land: "Idle land", weak_market: "Uncertain market", no_income: "No income",
        short_in_dry_year: "Tight in a dry year"
      },
      why: "Why it is suggested", evidence: "Evidence", benefits: "Benefits",
      gaps: "Information gaps", risks: "Risks to review with an expert",
      why_text: {
        current: "It is what you do today: plant only rice on the land the water allows.",
        mixed: "Split the water: fewer tareas of rice and, with what is left, {alt} on the rest. The whole farm keeps producing.",
        mixed_banned: "With no rice this cycle, {alt} keeps the farm producing and returns nitrogen to the soil.",
        rotation: "Rest from rice this cycle and plant {alt}, which needs far less water and can be sold.",
        green: "Rest from rice this cycle and grow {alt} to return nitrogen and organic matter to the soil."
      },
      ev_rice: "Rice needs {m3} m³ of irrigation per tarea in {zone} when planted in {month} (NASA POWER 2001–2025, FAO-56 method).",
      ev_alt: "{alt} needs {m3} m³ per tarea: {ratio} times less than rice.",
      ev_rain: "In that cycle rain covers only {rain}% of the water rice uses.",
      ev_use: "This plan uses {used} m³ of the {budget} m³ allocated.",
      ev_dry: "In a dry year (2 out of 10) the same plan would need {dry} m³.",
      ben_market: "Known market and price.",
      ben_same: "No change in practices or equipment.",
      ben_full: "No tarea is left empty.",
      ben_saved: "Uses {saved}% less water than planting the whole farm with rice.",
      ben_nitrogen: "Leaves nitrogen worth about {n} sacks of urea for the next rice crop.",
      ben_break: "Taking rice off that land helps break the weed and pest cycle of monoculture.",
      ben_organic: "Improves soil organic matter and structure.",
      gap_prices: "We do not use real prices or yields: the income score only measures how sure the sale is.",
      gap_cell: "NASA data describes squares about 50 km wide, not your exact farm.",
      gap_crops: "Crop values are general FAO references; they still need validation in the Cibao.",
      risk: {
        heat: "Heat: the average daily maximum in the cycle is about {tmax} °C and {crop} suffers above {limit} °C.",
        heavy_soil: "Heavy soil: {crop} does not tolerate clay soils that stay waterlogged.",
        sandy_rice: "Sandy soil: rice loses a lot of water through seepage.",
        salt: "Salt: {crop} is sensitive to soil salinity.",
        idle_land: "{n} tareas are left unplanted and without income.",
        weak_market: "Market: selling {crop} is not guaranteed. Confirm a buyer before planting.",
        no_income: "This cycle brings no income from sales.",
        short_in_dry_year: "In a dry year, the allocated water would not cover the whole plan.",
        mono: "Staying with rice only keeps the monoculture and adds no new nitrogen.",
        always: "Check with a local agricultural expert before changing your rotation."
      },
      share_wa: "Send plan by WhatsApp", share_copy: "Copy plan", copied: "Copied",
      needs_title: "Irrigation water per tarea",
      needs_sub: "{zone}, {soil} soil, planting in {month}.",
      needs_note: "Computed for every year from 2001 to 2025 with temperature, sunshine, humidity, wind and rain from NASA POWER.",
      typical: "Typical year", dry: "Dry year (2 out of 10)",
      climate_title: "Water balance month by month",
      climate_sub: "Rain against the water the field loses, in mm per month. 2001–2025 average in {zone}.",
      rain: "Rain", shortfall: "Water shortfall (irrigation must supply it)",
      et0: "Water the field loses (evapotranspiration)", cycle: "Months of the chosen cycle",
      tip_rain: "rain", tip_et0: "field loses", tip_gap: "short by", tip_tmax: "average maximum",
      strip: "Bottom strip: average daily maximum temperature of each month, in °C. Darker: hotter.",
      climate_note: "In your cycle ({from} to {to}) it rains about {rain} mm and the field loses about {et0} mm: about {gap} mm are missing, and irrigation must supply them. Over the whole year it rains {rain_year} mm and the field loses {et0_year} mm.",
      heat_title: "Heat during the cycle: can each crop take it?",
      heat_sub: "Average daily maximum during each crop's cycle, planting in {month} in {zone} (NASA POWER 2001–2025), against the crop's reference limit.",
      heat_ok: "below its {limit} °C limit",
      heat_over: "+{n} °C above its {limit} °C limit",
      heat_dot: "Average maximum of the cycle", heat_tick: "Crop limit", heat_zone: "Excess heat",
      heat_note: "The limits are general reference values that an agronomist must validate. NASA temperature is adjusted for elevation and has not been compared with a local station.",
      listen: "Listen to the plan", stop: "Stop the voice", print: "Print planting sheet",
      say_plan: "Plan: {name}. {mix}.",
      say_none: "With no irrigation water, no crop is viable this cycle.",
      say_water: "It uses {used} cubic meters of irrigation water, {saved} percent less than planting the whole farm with rice.",
      say_n: "It leaves nitrogen in the soil worth about {n} sacks of urea.",
      say_risks: "To review with an expert:",
      say_degrees: "degrees",
      faq_title: "Frequently asked questions",
      faq_sub: "Answers written by the team, using your farm's numbers. No AI is answering.",
      faq: [
        { q: "Why a legume instead of more rice?",
          a: "Because the water available is not enough to plant the whole farm with rice. In {zone}, planting in {month}, rice needs {rice_m3} m³ of irrigation per tarea and {alt} needs {alt_m3} m³: {ratio} times less. Legumes also take nitrogen from the air and leave part of it in the soil. In the rice plus legume plan that is worth about {sacks} sacks of urea." },
        { q: "What happens if I leave part of the land unplanted?",
          a: "With rice only and {alloc}% of the water, {idle} of your {area} tareas would stay empty. That land brings no income, and bare soil is exposed to sun, heavy rain and weeds. A low-water crop or a green manure keeps it covered and producing.",
          a_none: "With the water you were allocated, the rice-only strategy leaves no land empty. If the water drops, any land left unplanted brings no income and is exposed to sun, heavy rain and weeds." },
        { q: "How do you calculate water with NASA data?",
          a: "We use NASA POWER, which gives the temperature, sunshine, humidity, wind and rain of your zone for every day from 2001 to 2025. From that we compute how much water the field loses each day (FAO-56 method) and adjust it to what each crop uses at each stage. Subtracting the usable rain leaves the irrigation needed. We repeat this for every year and show the typical year and the dry year." },
        { q: "Is this a black box?",
          a: "No. The recommendation comes from fixed formulas anyone can review: the same data always gives the same result. No artificial intelligence model decides what to plant. AI helped the team write the code and the texts, and that is disclosed. The calculation passes more than 31,000 automatic checks." },
        { q: "How reliable are these numbers?",
          a: "They are a guide, not a measurement on your farm. NASA describes squares about 50 km wide and its rainfall tends to be lower than rain-gauge records. Crop values are general FAO references that still need validation in the Cibao. That is why every strategy lists its risks and asks you to check with an agricultural expert." },
        { q: "Do the moon or the tides matter?",
          a: "This tool does not use the phase of the moon: we know of no solid scientific evidence that it changes how much water a crop needs. What can matter near the coast is salt: when the river runs low, sea water can enter through its mouth. If your soil has salt problems, tick that box and the tool flags the crops that are sensitive." }
      ],
      sheet_title: "Planting sheet",
      sheet_water: "Irrigation water for the plan", sheet_dry: "In a dry year (2 out of 10)",
      sheet_saved: "Saving compared with planting all rice", sheet_n: "Nitrogen the soil receives",
      sheet_sacks: "sacks of urea", sheet_land: "Tareas planted",
      sheet_heat: "Months of the cycle and their average daily maximum",
      eyebrow: "NASA Space Apps 2026 · Dominican Republic",
      nav: { home: "Home", plan: "My plan", rotation: "Rotation", options: "Options", map: "Map", data: "Data", help: "Help" },
      install: "Install app",
      back: "← Back",
      g_step: "Question {n} of 5", g_done: "Your plan",
      g_q: ["Where is your farm?", "When do you plant and how much land do you have?", "What is your soil like?",
        "How much water do you get this cycle?", "What matters most to you?"],
      g_sub: ["Tap a province or rice zone. We choose the nearest rice point; NASA climate data is regional.",
        "The month changes the heat and rain the crop will get.",
        "Soil decides how much water is lost and which crops cope.",
        "It is what the water authority or your irrigation board announces before planting.",
        "With that we choose which plan goes first."],
      g_next: "Next", g_back: "Back", g_see: "See my plan",
      g_result: "This is your plan", g_full: "See my full plan", g_rot: "See the rotation", g_restart: "Start again",
      g_zone: "Your zone:", g_month: "Planting month", g_area: "Tareas on your farm",
      g_scene_label: "Your rice-growing zone stays in view. The house is an illustrative marker, not a surveyed farm boundary.",
    journey_title: "From sky to field",
    journey_intro: "Follow the path: a climate signal becomes a planting decision.",
    journey_kicker_1: "01 · OBSERVE",
    journey_kicker_2: "02 · MEASURE WATER",
    journey_kicker_3: "03 · CHANGE THE CYCLE",
    journey_copy_1: "NASA POWER provides climate context for the selected zone.",
    journey_copy_2: "Rain and allocated water change how much rice fits the plan.",
    journey_copy_3: "The calendar compares crops across cycles on the same plots.",
    journey_step_1: "Your zone’s climate",
    journey_text_1: "Historical temperature and rainfall help explain the planting window.",
    journey_step_2: "Water that reaches the farm",
    journey_text_2: "We compare rainfall and estimated crop needs with available irrigation.",
    journey_step_3: "Keep the land in production",
    journey_text_3: "Explore how crops can alternate so each plot changes in the next cycle.",
    field_water: "Water available",
    field_water_target: "of irrigation target",
    field_area: "Modeled area",
    field_weather: "This month in the zone",
    field_rain: "average rain",
    field_soil: "Selected soil",
      g_fit: "That water is enough for {n} of your {area} tareas of rice.",
      g_fit_ban: "Rice cannot be planted this cycle.",
      how: [["Tell us your farm", "Zone, planting month, tareas and soil type."],
        ["Tell us your water", "Normal, turns or ban: what the water authority or your irrigation board announced."],
        ["See your plan", "What to plant, how much water it uses and how to rotate in the next cycle."]],
      go_rotation: "See the 2-cycle rotation", go_options: "Compare the 4 options",
      name_switch: "Switch to {crop}",
      rotation_title: "The rotation over two cycles",
      rotation_sub: "Rotating means changing the crop on the same land from one cycle to the next. This is your farm with the chosen plan.",
      rot_cycle: "Cycle {n} · planting in {month}",
      rot_lot: "Plot {n} · {tareas} tareas",
      rot_swap: "In cycle 2 rice is planted where {alt} grew and uses the nitrogen it left: about {n} sacks of urea. In turn, {alt} moves to the land where rice grew.",
      rot_back: "In cycle 2 rice returns to the land where {alt} grew.",
      rot_back_n: "In cycle 2 rice returns to the land where {alt} grew and uses the nitrogen it left: about {n} sacks of urea.",
      rot_none: "With rice only there is no rotation: the same crop repeats on the same land, with no new nitrogen and the same weeds and pests.",
      rot_water: "Water in cycle {c}: {used} m³ of {budget} m³ allocated.",
      rot_over: "In cycle 2 the water would not be enough for this split: less rice would have to be planted.",
      rot_note: "Cycle 2 assumes you are allocated the same {alloc}% of water and that rice may be planted. Dates are approximate: they depend on the variety and the planting day.",
      start_btn: "Start with my farm",
      step1: "Where and when do you plant?", step2: "How much water do you get?", step3: "What matters most?",
      what_is: "What does this mean?", what_scores: "What do the water, soil and income scores mean?",
      month_help: "Planting in {month}, the cycle's heat is around {tmax} °C at its daily maximum and rain covers only {rain}% of the water rice uses.",
      soil_help: {
        clay: "Clay: it holds water. Good for rice; beans and maize suffer if it stays waterlogged.",
        loam: "Loam: balanced. It suits almost every crop.",
        sandy: "Sandy: water seeps away fast. Rice uses much more water."
      },
      water_help: {
        normal: "There is water for the whole farm in rice. Rotating part of it still saves water and cares for the soil.",
        tandeo: "The water is not enough for the whole farm in rice. Combining crops plants more land with the same water.",
        veda: "Rice cannot be planted. A low-water crop keeps the farm producing."
      },
      priority_help: {
        water: "The plan that saves the most water without leaving land empty wins.",
        soil: "The plan that leaves the most nitrogen and rests the soil wins.",
        income: "The plan with the crops that are surest to sell wins."
      },
      score_help: "Each score goes from 0 to 100. Water: how much water you save while keeping the land planted. Soil: how much nitrogen it receives and how much land rests from rice. Income: how sure the sale of what you plant is (it does not use prices).",
      tabs: { why: "Why", evidence: "Evidence", benefits: "Benefits", gaps: "Gaps", risks: "Risks" },
      why_title: "Why this plan?",
      data_title: "Understand the data",
      data_sub: "Open only what you want to see. Each section says what it measures and how it affects your crops.",
      needs_fx: "How much water each crop needs. The less it needs, the more tareas you plant with your allocation.",
      climate_fx: "What it rains against what the field loses. The difference is the water irrigation must supply.",
      heat_fx: "Which crops can take this cycle's heat and which may lose flowers or yield.",
      basin_fx: "How much water the dams keep if many farmers rotate at the same time.",
      trust_fx: "Where the numbers come from, how they are computed and what they lack.",
      basin_title: "From your farm to the river basin",
      basin_q: "What if {share}% of the rice farmers in the {basin} basin planted {alt} instead of rice this cycle?",
      basin_big: "{n} million m³",
      basin_small: "of water that would not have to leave the dams, on about {tareas} tareas.",
      basin_of: "of {dam}'s capacity",
      basin_cap: "{n} million m³",
      basin_note: "Conservative figure: it only counts water saved on the farms. The basin's rice area was estimated by splitting the national area according to each province's production.",
      basin_none: "We have no dam data for the {basin} basin. The basin-wide estimate is available for the Yaque del Norte, the Yuna - Camú and the Yaque del Sur.",
      trust_title: "How reliable is this",
      limits_title: "Limits and information gaps",
      limits: [
        "This is a decision-support tool. It does not replace the farmer or the agricultural expert.",
        "The data comes from NASA satellites and models, in squares about 50 km wide. It is not a weather station on the farm.",
        "Temperature is adjusted for elevation ({adjust} °C in this zone: the NASA square averages {cell} m and the zone sits at {elev} m).",
        "NASA POWER rainfall can be lower than what local rain gauges record. That would make the computed irrigation somewhat higher than the real one.",
        "The water, soil and income scores are a guide for comparing options, not a forecast of harvest or profit.",
        "The income score does not use prices or yields; they still need to be added.",
        "Which crops tolerate a rice soil, and their heat limits, are general values a local agronomist must validate."
      ],
      method_title: "How it is calculated",
      method: [
        "Water the field loses each day: FAO-56 Penman-Monteith method with temperature, solar radiation, humidity and wind from NASA POWER.",
        "Water for each crop: that daily loss times the crop coefficient of each growth stage (FAO-56 tables).",
        "Flooded rice: plus 200 mm to saturate the soil, a 100 mm water layer and daily seepage depending on the soil (FAO irrigation manual).",
        "Irrigation need: crop water minus usable rain, for every year from 2001 to 2025. We show the typical year (median) and the dry year (80th percentile).",
        "Strategies: the allocated water is split across the farm without exceeding the water or the land available."
      ],
      sources_title: "Sources",
      foot_support: "Decision-support tool. Always check with a local agricultural expert before changing your rotation.",
      foot_ai: "Team GroundTruth Cibao · NASA Space Apps Challenge 2026, Santiago. Code, text and analysis produced with AI assistance Claude Code (Anthropic) and OpenAI Codex.",
      foot_nasa: "Uses NASA POWER data. NASA does not endorse any non-U.S. Government entity or this product.",
      plan_title: "The rice farmer's Plan B · GroundTruth Cibao",
      plan_farm: "Farm: {area} tareas in {zone}, {soil} soil. Planting: {month}.",
      plan_water: "Water allocated: {alloc}%.",
      plan_strategy: "Strategy: {name}",
      plan_use: "Water: {used} m³ ({saved}% less than all rice).",
      plan_n: "Nitrogen for the soil: about {n} sacks of urea.",
      plan_risks: "To review: {list}.",
      plan_foot: "NASA POWER data + FAO-56. This is a guide: check with your agricultural expert.",
      pedro_btn: "See Don Pedro's case in Mao: 100 tareas, 60% of the water",
      pedro_note: "Don Pedro is an example case, not a real person.",
      light: { normal: "Normal", tandeo: "Turns", veda: "Ban" },
      light_desc: { normal: "Full irrigation", tandeo: "Irrigation by turns", veda: "Rice banned" },
      light_note: "The traffic light is our own guide using Dominican irrigation terms (tandeo = turns, veda = ban). The percentages are not official INDRHI figures: adjust them with the control.",
      map_title: "Dominican rice as NASA sees it",
      map_sub: "Tap a province or rice zone. We choose the nearest rice point. Boundaries: geoBoundaries (2022). NASA POWER squares are about 50 km wide.",
      layers: { basins: "Rivers and dams", sat: "Satellite photo", balance: "Water shortfall", soil: "Soil moisture", heat: "Heat" },
      back_plan: "← Back to my plan", back_map: "← Back to the map",
      z_sub: "{basin} basin. Real 3D relief about 90 km wide. Drag to turn it.",
      z_note: "Relief: NASA SRTM, height exaggerated 8×. Rivers and Autopista Duarte: © OpenStreetMap. Cars are illustrative; they do not show live traffic. Climate: NASA POWER, 2001–2025.",
      z_plan: "Plan my farm here",
      z_continue: "Continue with this farm",
      z_farm_note: "Tap the button to place a farm marker in this zone.",
      z_farm_placed: "Farm placed in this rice-growing zone. Its location and size are illustrative.",
      rice_region: "Representative rice-growing zone; individual fields are not mapped.",
      province_boundary: "Province boundaries (geoBoundaries, 2022)",
      z_elev: "elevation of the zone", z_high: "highest point nearby", z_heat: "average maximum in {month}, the hottest month",
      z_temp: "average temperature of the year", z_rain: "of rain per year", z_et0: "lost by the field per year",
      z_hum: "air humidity", z_wind: "average wind", z_soilw: "soil moisture in the root zone",
      z_rivers: "Rivers nearby", z_dams: "Dams nearby", z_none: "none inside the window",
      z_soil_title: "Soil type",
      z_soil: "We do not have the soil type of each place: the world database we tried did not answer reliably. Identify it yourself with the soil guide.",
      z_soil_btn: "See the soil guide",
      soilg_title: "How to recognize your soil",
      soilg_sub: "The ribbon test takes two minutes and needs no laboratory.",
      soilg_how: "Take a handful of soil with no stones or roots. Wet it little by little and knead it until it feels like putty. Squeeze it between thumb and forefinger, pushing upward, to form a ribbon.",
      soilg_head: ["Soil", "How it feels", "The ribbon", "Water", "What it means for your farm"],
      soilg_rows: {
        clay: ["Sticky and smooth when wet. Hard and cracked when dry.", "Long: more than 5 cm without breaking.", "Stays on top for a day or more.", "It holds water: good for flooded rice. Beans, maize and pigeon pea need good drainage."],
        loam: ["Soft, slightly gritty. Forms a ball that is not very sticky.", "Short: breaks before 2.5 cm.", "Sinks in within hours.", "Suits almost every crop. The easiest soil to rotate on."],
        sandy: ["Gritty, like sugar. The ball falls apart.", "No ribbon forms.", "Drains away in minutes.", "Rice uses much more water. Low-water crops fit better."]
      },
      soilg_note: "Method: USDA guide to texture by feel (Thien, 1979). A ribbon between 2.5 and 5 cm is an in-between soil (clay loam). The drawings are illustrative: photos of local soils should be added.",
      g_soil_link: "Not sure which one? How to tell",
      layer_desc: {
        basins: "Yaque del Norte, Yuna and Yaque del Sur rivers with their dams.",
        sat: "Real photo taken by NASA's Terra satellite (MODIS instrument) on 18 February 2026.",
        balance: "Rain minus the water the field loses, in mm per year. Darker: larger shortfall.",
        soil: "Moisture in the root zone, in % of saturation. Darker: wetter.",
        heat: "Average daily maximum of the hottest month. Darker: hotter."
      },
      layer_source: "NASA POWER, 2001–2025 average.",
      river: "River", dam: "Dam", zone_dot: "Rice zone", selected_dot: "Your zone",
      map_aria: "Map of the Dominican Republic with the rice zones",
      map_note: "Coastline: Natural Earth. Rivers and Autopista Duarte: © OpenStreetMap (ODbL). Moving cars are illustrative, not live traffic. Rice points are regional references.",
      ocean: "Atlantic Ocean", haiti: "Haiti", caribbean: "Caribbean Sea",
      parcel_title: "Your farm from above",
      parcel_sub: "{name}. Each square is 1% of your {area} tareas.",
      impact_n: "sacks of urea the soil gets without buying them",
      impact_water: "m³ less water than planting everything with rice",
      impact_land: "tareas planted, no bare soil"
    }
  };

  // ------------------------------------------------------------------
  // Small helpers
  // ------------------------------------------------------------------
  function tr(key, vars) {
    var text = T[state.lang][key];
    return vars ? fill(text, vars) : text;
  }
  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, function (_, name) { return vars[name]; });
  }
  function num(value, digits) {
    return new Intl.NumberFormat(state.lang === "es" ? "es-DO" : "en-US", {
      maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0
    }).format(value);
  }
  function tareasText(value) {
    return num(value, value < 20 && value % 1 ? 1 : 0);
  }
  function cropName(key) {
    return D.crops[key][state.lang];
  }
  function lower(text) {
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
  function role(crop) {
    if (crop === "rice") return "rice";
    if (crop === "sesbania") return "green";
    return D.legumes.indexOf(crop) >= 0 ? "legume" : "cash";
  }
  function zone() { return D.zones[state.zone]; }
  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function strategyName(s) {
    if (s.key === "mixed" && s.plots.length && !s.plots.some(function (p) { return p.crop === "rice"; }))
      return tr("name_legume_only");
    if (s.key === "rotation" && s.alternative) return tr("name_switch", { crop: lower(cropName(s.alternative)) });
    return T[state.lang].names[s.key];
  }
  function mixText(s) {
    if (!s.plots.length) return lower(tr("nothing"));
    return s.plots.map(function (p) {
      return tareasText(p.tareas) + " " + tr("tareas_of") + " " + lower(cropName(p.crop));
    }).join(" + ");
  }

  // ------------------------------------------------------------------
  // Calculation for the current answers
  // ------------------------------------------------------------------
  function calculate() {
    var needs = D.needs[zone().name + "|" + state.soil + "|" + state.month];
    return E.compare(D, needs, state.soil, state.area, state.allocation, state.priority,
      state.riceAllowed, state.salty);
  }

  // ------------------------------------------------------------------
  // Drawing
  // ------------------------------------------------------------------
  function drawStatic() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-t]").forEach(function (el) {
      el.textContent = tr(el.getAttribute("data-t"));
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === state.lang);
    });

    $("facts").innerHTML = T[state.lang].facts.map(function (f) {
      var links = [].concat(f[2]).map(function (index) {
        return "<a href=\"" + SOURCES[index][1] + "\" target=\"_blank\" rel=\"noopener\">" + tr("source") + "</a>";
      }).join(" · ");
      return "<li><b>" + f[0] + "</b><span>" + esc(f[1]) + "</span> " + links + "</li>";
    }).join("");
    $("nav").innerHTML = NAV_VIEWS.map(function (view) {
      return "<button type=\"button\" data-go=\"" + view + "\">" + T[state.lang].nav[view] + "</button>";
    }).join("");
    $("tabbar").innerHTML = NAV_VIEWS.map(function (view) {
      return "<button type=\"button\" data-go=\"" + view + "\"><i>" + VIEW_ICONS[view] + "</i>" + T[state.lang].nav[view] + "</button>";
    }).join("");

    $("zone").innerHTML = D.zones.map(function (z, i) {
      return "<option value=\"" + i + "\">" + esc(z.name) + "</option>";
    }).join("");
    $("zone").value = state.zone;
    $("month").innerHTML = MONTHS[state.lang].map(function (m, i) {
      return "<option value=\"" + (i + 1) + "\">" + m.charAt(0).toUpperCase() + m.slice(1) + "</option>";
    }).join("");
    $("month").value = state.month;

    segmented("soil", T[state.lang].soils, "soil");
    segmented("priority", T[state.lang].priorities, "priority");
    segmented("layers", T[state.lang].layers, "layer");
    var parcel = "";
    for (var c = 0; c < 100; c++) parcel += "<span></span>";
    $("parcel").innerHTML = parcel;

    var roles = T[state.lang].roles;
    $("legend").innerHTML = ["rice", "legume", "cash", "green", "idle"].map(function (r) {
      return "<span><i class=\"" + r + "\"></i>" + roles[r] + "</span>";
    }).join("");

    // Strategy cards are created once; later only their contents change, so
    // the squares can animate from one crop to another.
    $("cards").innerHTML = STRATEGY_ORDER.map(function (key) {
      var cells = "";
      for (var i = 0; i < 100; i++) cells += "<span></span>";
      return "<button type=\"button\" class=\"card\" data-key=\"" + key + "\">" +
        "<span class=\"badge\">" + tr("best") + "</span>" +
        "<h3></h3><div class=\"plot\" aria-hidden=\"true\">" + cells + "</div>" +
        "<div class=\"mix\"></div>" +
        "<div><div class=\"meter\"><div class=\"fill\"></div><div class=\"cap\"></div></div></div>" +
        "<div class=\"meter-text\"></div><div class=\"scores\"></div><div class=\"chips\"></div></button>";
    }).join("");

    $("faq").innerHTML = T[state.lang].faq.map(function (item, i) {
      return "<details><summary>" + esc(item.q) + "</summary><p id=\"faq-" + i + "\"></p></details>";
    }).join("");
    $("soil-guide").innerHTML = soilGuide();
    $("method").innerHTML = T[state.lang].method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
    $("sources").innerHTML = SOURCES.map(function (s) {
      return "<li><a href=\"" + s[1] + "\" target=\"_blank\" rel=\"noopener\">" + esc(s[0]) + "</a></li>";
    }).join("");
    setJourneyBeat(state.journeyBeat);
  }

  function setJourneyBeat(beat) {
    state.journeyBeat = beat;
    var L = T[state.lang];
    $("journey-visual").setAttribute("data-beat", beat);
    $("journey-kicker").textContent = L["journey_kicker_" + beat];
    $("journey-copy").textContent = L["journey_copy_" + beat];
    document.querySelectorAll(".journey-chapter").forEach(function (chapter) {
      chapter.classList.toggle("current", +chapter.getAttribute("data-beat") === beat);
    });
  }

  function initJourney() {
    var chapters = document.querySelectorAll(".journey-chapter");
    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      var active = entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (active) setJourneyBeat(+active.target.getAttribute("data-beat"));
    }, { rootMargin: "-28% 0px -38% 0px", threshold: [0, 0.15, 0.35, 0.6] });
    chapters.forEach(function (chapter) { observer.observe(chapter); });
  }

  function segmented(id, labels, field) {
    $(id).innerHTML = Object.keys(labels).map(function (key) {
      return "<button type=\"button\" data-value=\"" + key + "\" class=\"" +
        (state[field] === key ? "on" : "") + "\">" + labels[key] + "</button>";
    }).join("");
  }

  function draw() {
    var result = calculate();
    var best = result.ranked[0];
    var byKey = {};
    result.strategies.forEach(function (s) { byKey[s.key] = s; });
    var selected = byKey[state.selected] || best;

    prepareGuide();
    $("zone").value = state.zone;
    $("month").value = state.month;
    if (document.activeElement !== $("area")) $("area").value = state.area;
    $("salty").checked = state.salty;
    $("allocation-out").textContent = Math.round(state.allocation * 100) + "%";
    $("allocation").value = Math.round(state.allocation * 100);
    document.querySelectorAll("#soil button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-value") === state.soil);
    });
    document.querySelectorAll("#priority button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-value") === state.priority);
    });

    $("rice-banned").checked = !state.riceAllowed;
    drawLight();
    drawMap();
    drawParcel(selected);
    drawHeadline(result, best);
    result.strategies.forEach(function (s) { drawCard(s, result, s === best, s === selected); });
    drawDetail(selected, result);
    drawNeeds(result);
    drawClimate(result);
    drawHeat(result);
    drawFaq(result, byKey);
    drawSheet(selected, result);
    drawHelp(result);
    drawRotation(selected, result);
    updateGuide(result, best, byKey);
    drawZoneInfo();
    drawSceneContexts();
    drawBasin(selected, result, byKey);
    drawLimits();
  }

  function drawHeadline(result, best) {
    if (!best.plots.length) {
      $("headline").innerHTML = tr("headline_none", { rain: Math.round(result.needs.rice.rain_share * 100) });
      return;
    }
    $("headline").innerHTML = tr("headline", {
      alloc: Math.round(state.allocation * 100), name: esc(strategyName(best)), mix: esc(mixText(best))
    });
  }

  function drawCard(s, result, isBest, isSelected) {
    var card = document.querySelector(".card[data-key=\"" + s.key + "\"]");
    card.classList.toggle("best", isBest && s.plots.length > 0);
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.querySelector("h3").textContent = strategyName(s);

    paintCells(card.querySelectorAll(".plot span"), s);

    var lines = s.plots.map(function (p) {
      return "<span>" + cropBadge(p.crop) + "<b>" + tareasText(p.tareas) + "</b> " +
        tr("tareas") + " · " + esc(cropName(p.crop)) + "</span>";
    });
    if (s.idle_tareas > 0.005) {
      lines.push("<span><i class=\"dot idle\"></i><b>" + tareasText(s.idle_tareas) + "</b> " +
        tr("tareas") + " · " + tr("idle") + "</span>");
    }
    card.querySelector(".mix").innerHTML = lines.join("");

    var usedShare = result.baseline_m3 ? s.water_m3 / result.baseline_m3 : 0;
    card.querySelector(".fill").style.width = (100 * usedShare) + "%";
    var cap = card.querySelector(".cap");
    cap.style.left = "calc(" + (100 * state.allocation) + "% - 1px)";
    cap.setAttribute("data-label", tr("assigned"));
    card.querySelector(".meter-text").innerHTML = tr("uses", {
      used: num(s.water_m3), budget: num(result.budget_m3)
    });

    card.querySelector(".scores").innerHTML = ["water", "soil", "income"].map(function (name) {
      var value = Math.round(s.scores[name]);
      return "<div class=\"score" + (name === state.priority ? " main" : "") + "\"><span>" +
        tr("score_" + name) + "</span><div class=\"bar\"><i style=\"width:" + value + "%\"></i></div><b>" +
        value + "</b></div>";
    }).join("");

    var chips = [];
    if (s.urea_sacks >= 0.5) chips.push("<span class=\"chip good\">" + tr("sacks", { n: num(s.urea_sacks) }) + "</span>");
    s.warnings.forEach(function (code) {
      chips.push("<span class=\"chip\">" + T[state.lang].chips[code] + "</span>");
    });
    card.querySelector(".chips").innerHTML = chips.join("");
  }

  function riskList(s, result) {
    var R = T[state.lang].risk;
    var risks = [];
    s.plots.forEach(function (p) {
      result.fit[p.crop][1].forEach(function (code) {
        risks.push(fill(R[code], {
          crop: lower(cropName(p.crop)), tmax: num(result.needs[p.crop].tmax, 1),
          limit: D.crops[p.crop].heat_limit
        }));
      });
      if (p.crop !== "sesbania" && D.crops[p.crop].market <= 2)
        risks.push(fill(R.weak_market, { crop: lower(cropName(p.crop)) }));
    });
    if (s.warnings.indexOf("idle_land") >= 0) risks.push(fill(R.idle_land, { n: tareasText(s.idle_tareas) }));
    if (s.warnings.indexOf("no_income") >= 0) risks.push(R.no_income);
    if (s.warnings.indexOf("short_in_dry_year") >= 0) risks.push(R.short_in_dry_year);
    if (s.key === "current" && s.plots.length) risks.push(R.mono);
    risks.push(R.always);
    return risks;
  }

  function drawDetail(s, result) {
    var L = T[state.lang];
    stopVoice();
    var alt = s.alternative ? cropName(s.alternative) : "";
    var hasRice = s.plots.some(function (p) { return p.crop === "rice"; });
    var whyKey = s.key === "mixed" && !hasRice ? "mixed_banned" : s.key;

    var evidence = [tr("ev_rice", {
      m3: num(result.needs.rice.typical_m3), zone: zone().name, month: MONTHS[state.lang][state.month - 1]
    })];
    if (s.alternative) {
      evidence.push(tr("ev_alt", {
        alt: alt, m3: num(result.needs[s.alternative].typical_m3),
        ratio: num(result.needs.rice.typical_m3 / result.needs[s.alternative].typical_m3, 1)
      }));
    }
    evidence.push(tr("ev_rain", { rain: Math.round(result.needs.rice.rain_share * 100) }));
    evidence.push(tr("ev_use", { used: num(s.water_m3), budget: num(result.budget_m3) }));
    if (s.plots.length) evidence.push(tr("ev_dry", { dry: num(s.water_dry_m3) }));

    var benefits = [];
    if (hasRice && s.key === "current") { benefits.push(L.ben_market); benefits.push(L.ben_same); }
    if (s.key !== "current" && s.plots.length) {
      if (s.idle_tareas <= 0.005) benefits.push(L.ben_full);
      if (s.saved_share > 0.01) benefits.push(tr("ben_saved", { saved: Math.round(s.saved_share * 100) }));
      if (s.urea_sacks >= 0.5) benefits.push(tr("ben_nitrogen", { n: num(s.urea_sacks) }));
      benefits.push(L.ben_break);
      if (s.key === "green") benefits.push(L.ben_organic);
    }
    if (!benefits.length) benefits.push("—");

    // One explanation at a time, chosen with the tabs.
    var content = {
      why: [fill(L.why_text[whyKey], { alt: lower(alt) })],
      evidence: evidence,
      benefits: benefits,
      gaps: [L.gap_prices, L.gap_cell, L.gap_crops],
      risks: riskList(s, result)
    };
    $("detail").innerHTML =
      "<h2>" + L.why_title + "</h2><p class=\"sub\">" + esc(strategyName(s)) + ": " + esc(mixText(s)) + "</p>" +
      "<div class=\"tabs\" role=\"tablist\">" + Object.keys(L.tabs).map(function (key) {
        return "<button type=\"button\" role=\"tab\" data-tab=\"" + key + "\" aria-selected=\"" + (state.whyTab === key) +
          "\" class=\"" + (state.whyTab === key ? "on" : "") + "\">" + L.tabs[key] + "</button>";
      }).join("") + "</div><ul>" + content[state.whyTab].map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";

    var plan = planText(s, result);
    $("plan-actions").innerHTML =
      "<a class=\"btn primary\" target=\"_blank\" rel=\"noopener\" href=\"https://wa.me/?text=" +
      encodeURIComponent(plan) + "\">" + L.share_wa + "</a>" +
      "<button type=\"button\" class=\"btn\" id=\"copy-plan\">" + L.share_copy + "</button>" +
      (window.speechSynthesis ? "<button type=\"button\" class=\"btn\" id=\"listen-plan\">" + L.listen + "</button>" : "") +
      "<button type=\"button\" class=\"btn\" id=\"print-plan\">" + L.print + "</button>";
    $("copy-plan").onclick = function () {
      var button = this;
      var done = function () { button.textContent = L.copied; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(plan).then(done, done);
    };
    if ($("listen-plan")) {
      $("listen-plan").onclick = function () { toggleVoice(spokenText(s, result), this); };
    }
    $("print-plan").onclick = function () {
      document.body.classList.add("sheet-mode");
      window.print();
    };
  }

  // One short sentence under each control: what it is and how it affects the crops.
  function drawHelp(result) {
    var L = T[state.lang];
    $("month-help").textContent = tr("month_help", {
      month: MONTHS[state.lang][state.month - 1], tmax: num(result.needs.rice.tmax, 1),
      rain: Math.round(result.needs.rice.rain_share * 100)
    });
    $("soil-help").textContent = L.soil_help[state.soil];
    $("water-help").textContent = L.water_help[waterStatus()];
    $("priority-help").textContent = L.priority_help[state.priority];
  }

  // ------------------------------------------------------------------
  // Voice, frequently asked questions and the printable planting sheet
  // ------------------------------------------------------------------

  // The plan in plain sentences, written to be read aloud.
  function spokenText(s, result) {
    var L = T[state.lang];
    if (!s.plots.length) return L.say_none;
    var parts = [tr("say_plan", { name: strategyName(s), mix: mixText(s).replace(/ \+ /g, state.lang === "es" ? " y " : " and ") })];
    parts.push(tr("say_water", { used: num(s.water_m3), saved: Math.round(s.saved_share * 100) }));
    if (s.urea_sacks >= 0.5) parts.push(tr("say_n", { n: num(s.urea_sacks) }));
    parts.push(L.say_risks);
    riskList(s, result).forEach(function (risk) { parts.push(risk.replace(/°C/g, L.say_degrees)); });
    return parts.join(" ");
  }

  var speaking = false;
  function stopVoice() {
    if (speaking && window.speechSynthesis) window.speechSynthesis.cancel();
    speaking = false;
  }
  // Reads the text with a voice installed on this device (works without internet).
  function toggleVoice(text, button) {
    var L = T[state.lang];
    if (speaking) {
      stopVoice();
      button.textContent = L.listen;
      return;
    }
    var speech = new SpeechSynthesisUtterance(text);
    var wanted = state.lang === "es" ? ["es-do", "es-us", "es-mx", "es-419", "es"] : ["en-us", "en"];
    var voices = window.speechSynthesis.getVoices();
    var voice = null;
    wanted.forEach(function (code) {
      if (voice) return;
      voices.forEach(function (v) {
        if (!voice && v.lang.toLowerCase().replace("_", "-").indexOf(code) === 0) voice = v;
      });
    });
    if (voice) speech.voice = voice;
    speech.lang = voice ? voice.lang : (state.lang === "es" ? "es-US" : "en-US");
    speech.rate = 0.95;
    speech.onend = speech.onerror = function () {
      speaking = false;
      button.textContent = L.listen;
    };
    speaking = true;
    button.textContent = L.stop;
    window.speechSynthesis.speak(speech);
  }

  function drawFaq(result, byKey) {
    var mixed = byKey.mixed, current = byKey.current, alt = mixed.alternative;
    var vars = {
      zone: zone().name, month: MONTHS[state.lang][state.month - 1],
      rice_m3: num(result.needs.rice.typical_m3), alt: lower(cropName(alt)),
      alt_m3: num(result.needs[alt].typical_m3),
      ratio: num(result.needs.rice.typical_m3 / result.needs[alt].typical_m3, 1),
      sacks: num(mixed.urea_sacks), alloc: Math.round(state.allocation * 100),
      idle: tareasText(current.idle_tareas), area: tareasText(state.area)
    };
    T[state.lang].faq.forEach(function (item, i) {
      var text = item.a_none && current.idle_tareas <= 0.005 ? item.a_none : item.a;
      $("faq-" + i).textContent = fill(text, vars);
    });
  }

  // One-page summary of the chosen plan, shown only when printing.
  function drawSheet(s, result) {
    var L = T[state.lang];
    var cells = "";
    for (var i = 0; i < 100; i++) cells += "<span></span>";
    var plots = s.plots.map(function (p) {
      return "<li><i class=\"dot " + role(p.crop) + "\"></i><b>" + tareasText(p.tareas) + "</b> " + tr("tareas") +
        " · " + esc(cropName(p.crop)) + "</li>";
    });
    if (s.idle_tareas > 0.005) {
      plots.push("<li><i class=\"dot idle\"></i><b>" + tareasText(s.idle_tareas) + "</b> " + tr("tareas") + " · " + tr("idle") + "</li>");
    }
    var shares = cycleShares(result.needs.rice.days);
    var months = [];
    for (var k = 0; k < 12; k++) {
      var m = (state.month - 1 + k) % 12;
      if (shares[m]) months.push(MONTHS_SHORT[state.lang][m] + " " + num(zone().climate.tmax[m]) + " °C");
    }
    function row(label, value) { return "<tr><td>" + label + "</td><td><b>" + value + "</b></td></tr>"; }
    $("sheet").innerHTML =
      "<p class=\"sheet-brand\">GroundTruth Cibao · " + new Date().toLocaleDateString(state.lang === "es" ? "es-DO" : "en-US") + "</p>" +
      "<h1>" + L.sheet_title + ": " + esc(strategyName(s)) + "</h1>" +
      "<p>" + esc(tr("plan_farm", {
        area: tareasText(state.area), zone: zone().name, soil: lower(L.soils[state.soil]),
        month: MONTHS[state.lang][state.month - 1]
      })) + " " + esc(tr("plan_water", { alloc: Math.round(state.allocation * 100) })) + "</p>" +
      "<div class=\"sheet-grid\"><div><div class=\"plot\">" + cells + "</div><ul class=\"sheet-plots\">" + plots.join("") + "</ul></div>" +
      "<table>" +
      row(L.sheet_water, num(s.water_m3) + " m³") +
      row(L.sheet_dry, num(s.water_dry_m3) + " m³") +
      row(L.sheet_saved, num(Math.max(0, s.saved_m3)) + " m³ (" + Math.round(s.saved_share * 100) + "%)") +
      row(L.sheet_n, "≈ " + num(s.urea_sacks) + " " + L.sheet_sacks) +
      row(L.sheet_land, tareasText(state.area - s.idle_tareas) + " / " + tareasText(state.area)) +
      row(L.sheet_heat, months.join(" · ")) +
      "</table></div>" +
      "<h2>" + L.risks + "</h2><ul>" + riskList(s, result).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      "<h2>" + L.gaps + "</h2><ul><li>" + esc(L.gap_prices) + "</li><li>" + esc(L.gap_cell) + "</li><li>" + esc(L.gap_crops) + "</li></ul>" +
      "<p class=\"sheet-foot\">" + esc(L.plan_foot) + " " + esc(L.foot_ai) + " " + esc(L.foot_nasa) + "</p>";
    paintCells($("sheet").querySelectorAll(".plot span"), s);
  }

  function planText(s, result) {
    var L = T[state.lang];
    var lines = [
      L.plan_title,
      tr("plan_farm", {
        area: tareasText(state.area), zone: zone().name, soil: lower(L.soils[state.soil]),
        month: MONTHS[state.lang][state.month - 1]
      }),
      tr("plan_water", { alloc: Math.round(state.allocation * 100) }),
      tr("plan_strategy", { name: strategyName(s) })
    ];
    s.plots.forEach(function (p) {
      lines.push("- " + cropName(p.crop) + ": " + tareasText(p.tareas) + " " + tr("tareas"));
    });
    if (s.idle_tareas > 0.005) lines.push("- " + L.roles.idle + ": " + tareasText(s.idle_tareas) + " " + tr("tareas"));
    lines.push(tr("plan_use", { used: num(s.water_m3), saved: Math.round(s.saved_share * 100) }));
    if (s.urea_sacks >= 0.5) lines.push(tr("plan_n", { n: num(s.urea_sacks) }));
    if (s.warnings.length) {
      lines.push(tr("plan_risks", {
        list: s.warnings.map(function (c) { return lower(L.chips[c]); }).join(", ")
      }));
    }
    lines.push(L.plan_foot);
    return lines.join("\n");
  }

  function drawNeeds(result) {
    var L = T[state.lang];
    $("needs-sub").textContent = tr("needs_sub", {
      zone: zone().name, soil: lower(L.soils[state.soil]), month: MONTHS[state.lang][state.month - 1]
    });
    var keys = Object.keys(result.needs).sort(function (a, b) {
      return result.needs[b].typical_m3 - result.needs[a].typical_m3;
    });
    var max = result.needs[keys[0]].dry_m3;
    $("needs").innerHTML = keys.map(function (key) {
      var n = result.needs[key];
      return "<div class=\"need-row\" title=\"" + esc(cropName(key)) + ": " + num(n.typical_m3) + " m³ · " +
        L.dry + ": " + num(n.dry_m3) + " m³ · " + n.days + " d\"><span>" + esc(cropName(key)) +
        "</span><div class=\"track\"><i style=\"width:" + (100 * n.typical_m3 / max) + "%\"></i>" +
        "<u style=\"left:calc(" + (100 * n.dry_m3 / max) + "% - 2px)\"></u></div><b>" +
        num(n.typical_m3) + " m³</b></div>";
    }).join("") + "<div class=\"key\"><span><i class=\"k-bar\"></i>" + L.typical +
      "</span><span><i class=\"k-tick\"></i>" + L.dry + "</span></div>";
  }

  // Share of each calendar month covered by a crop planted on the 15th.
  function cycleShares(days) {
    var shares = {};
    for (var d = 0; d < days; d++) {
      var m = (state.month - 1 + Math.floor((14 + d) / 30.4)) % 12;
      shares[m] = (shares[m] || 0) + 1 / 30.4;
    }
    return shares;
  }

  // Water balance: rain (bars) against the water the field loses (line).
  // The red block between them is the water irrigation has to supply.
  function drawClimate(result) {
    var L = T[state.lang];
    var c = zone().climate;
    $("climate-sub").textContent = tr("climate_sub", { zone: zone().name });

    var W = 520, H = 246, left = 34, right = 8, top = 10, plotH = 172;
    var plotBottom = top + plotH, stripY = plotBottom + 26, stripH = 22;
    var plotW = W - left - right;
    var max = Math.ceil(Math.max.apply(null, c.et0.concat(c.rain)) / 50) * 50;
    var step = plotW / 12;
    var y = function (v) { return top + plotH - plotH * v / max; };
    var shares = cycleShares(result.needs.rice.days);
    var svg = "<svg viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"" + esc(L.climate_title) + "\">";

    Object.keys(shares).forEach(function (m) {
      svg += "<rect x=\"" + (left + m * step) + "\" y=\"" + top + "\" width=\"" + step + "\" height=\"" + plotH + "\" fill=\"#e8edfb\"/>";
    });
    for (var g = 0; g <= max; g += 50) {
      svg += "<line x1=\"" + left + "\" x2=\"" + (W - right) + "\" y1=\"" + y(g) + "\" y2=\"" + y(g) + "\" stroke=\"#d9dde6\"/>" +
        "<text x=\"" + (left - 5) + "\" y=\"" + (y(g) + 4) + "\" text-anchor=\"end\">" + g + "</text>";
    }
    var points = [];
    c.rain.forEach(function (rain, i) {
      var x = left + i * step, et0 = c.et0[i], gap = et0 - rain;
      var tip = MONTHS[state.lang][i] + " · " + L.tip_rain + " " + num(rain) + " mm · " + L.tip_et0 + " " + num(et0) + " mm" +
        (gap > 0 ? " · " + L.tip_gap + " " + num(gap) + " mm" : "");
      if (gap > 0) {
        svg += "<rect x=\"" + (x + step * 0.22) + "\" y=\"" + y(et0) + "\" width=\"" + (step * 0.56) + "\" height=\"" +
          (y(rain) - y(et0) - 2) + "\" rx=\"3\" fill=\"#f5aeae\"><title>" + tip + "</title></rect>";
      }
      svg += "<rect x=\"" + (x + step * 0.22) + "\" y=\"" + y(rain) + "\" width=\"" + (step * 0.56) + "\" height=\"" +
        (plotBottom - y(rain)) + "\" rx=\"3\" fill=\"#1238a8\"><title>" + tip + "</title></rect>" +
        "<text x=\"" + (x + step / 2) + "\" y=\"" + (plotBottom + 15) + "\" text-anchor=\"middle\">" + MONTHS_SHORT[state.lang][i] + "</text>";
      points.push((x + step / 2) + "," + y(et0));
    });
    svg += "<polyline points=\"" + points.join(" ") + "\" fill=\"none\" stroke=\"#10131a\" stroke-width=\"2\"/>";
    c.et0.forEach(function (et0, i) {
      svg += "<circle cx=\"" + (left + i * step + step / 2) + "\" cy=\"" + y(et0) + "\" r=\"3.5\" fill=\"#10131a\" stroke=\"#fff\" stroke-width=\"1.5\"/>";
    });

    // Heat strip: average daily maximum of each month (28 C light to 38 C dark).
    svg += "<text x=\"" + (left - 5) + "\" y=\"" + (stripY + 15) + "\" text-anchor=\"end\">°C</text>";
    c.tmax.forEach(function (tmax, i) {
      var shade = RAMPS.heat[Math.max(0, Math.min(4, Math.floor((tmax - 28) / 2)))];
      svg += "<rect x=\"" + (left + i * step + 1) + "\" y=\"" + stripY + "\" width=\"" + (step - 2) + "\" height=\"" + stripH +
        "\" rx=\"3\" fill=\"" + shade + "\"><title>" + MONTHS[state.lang][i] + " · " + L.tip_tmax + " " + num(tmax, 1) + " °C</title></rect>" +
        "<text class=\"strip\" x=\"" + (left + i * step + step / 2) + "\" y=\"" + (stripY + 15) + "\" text-anchor=\"middle\">" + num(tmax) + "</text>";
    });
    svg += "</svg>";

    $("climate").innerHTML = "<div class=\"key\"><span><i class=\"k-bar\"></i>" + L.rain +
      "</span><span><i class=\"k-gap\"></i>" + L.shortfall + "</span><span><i class=\"k-line\"></i>" + L.et0 +
      "</span><span><i class=\"k-band\"></i>" + L.cycle + "</span></div>" + svg +
      "<p class=\"note\">" + esc(L.strip) + "</p>";

    var rainCycle = 0, et0Cycle = 0;
    Object.keys(shares).forEach(function (m) {
      rainCycle += shares[m] * c.rain[m];
      et0Cycle += shares[m] * c.et0[m];
    });
    var lastMonth = (state.month - 1 + Math.floor((14 + result.needs.rice.days - 1) / 30.4)) % 12;
    $("climate-note").textContent = tr("climate_note", {
      from: MONTHS[state.lang][state.month - 1], to: MONTHS[state.lang][lastMonth],
      rain: num(rainCycle), et0: num(et0Cycle), gap: num(Math.max(0, et0Cycle - rainCycle)),
      rain_year: num(total(c.rain)), et0_year: num(total(c.et0))
    });
  }

  // Heat alert: the average daily maximum of each crop's cycle against the
  // crop's reference limit (the same test the engine uses for its heat warning).
  function drawHeat(result) {
    var L = T[state.lang];
    $("heat-sub").textContent = tr("heat_sub", { month: MONTHS[state.lang][state.month - 1], zone: zone().name });
    var low = 26, high = 40;
    function at(temp) { return 100 * (Math.max(low, Math.min(high, temp)) - low) / (high - low); }
    $("heat").innerHTML = Object.keys(result.needs).map(function (key) {
      var tmax = result.needs[key].tmax, limit = D.crops[key].heat_limit;
      var hot = tmax > limit;
      var status = hot ? "▲ " + tr("heat_over", { n: num(tmax - limit, 1), limit: limit })
        : "✓ " + tr("heat_ok", { limit: limit });
      return "<div class=\"heat-row" + (hot ? " hot" : "") + "\"><span>" + esc(cropName(key)) + "</span><div class=\"track\">" +
        (hot ? "<em style=\"left:" + at(limit) + "%;width:" + (at(tmax) - at(limit)) + "%\"></em>" : "") +
        "<u style=\"left:calc(" + at(limit) + "% - 1px)\"></u><i style=\"left:calc(" + at(tmax) + "% - 6px)\"></i></div>" +
        "<b>" + num(tmax, 1) + " °C</b><small>" + esc(status) + "</small></div>";
    }).join("");
    $("heat-key").innerHTML = "<span><i class=\"k-dot\"></i>" + L.heat_dot + "</span><span><i class=\"k-tick\"></i>" +
      L.heat_tick + "</span><span><i class=\"k-gap\"></i>" + L.heat_zone + "</span>";
  }

  function drawBasin(selected, result, byKey) {
    var basin = zone().basin;
    if (!D.basins[basin]) {
      $("basin").innerHTML = "<p class=\"sub\">" + esc(tr("basin_none", { basin: basin })) + "</p>";
      return;
    }
    var alt = selected.alternative || byKey.mixed.alternative;
    var saving = E.basinSavings(D, basin, result.needs.rice.typical_m3, result.needs[alt].typical_m3, state.basinShare);
    var dams = Object.keys(saving.dam_share).map(function (name) {
      var share = saving.dam_share[name];
      return "<div class=\"dam\"><div class=\"tank\"><i style=\"height:" + Math.min(100, 100 * share) + "%\"></i><b>" +
        Math.round(100 * share) + "%</b></div><strong>" + esc(name) + "</strong>" +
        esc(tr("basin_of", { dam: name })) + " (" + tr("basin_cap", { n: num(D.basins[basin].dams[name], 0) }) + ")</div>";
    }).join("");

    $("basin").innerHTML =
      "<div class=\"basin-head\"><div><p class=\"basin-q\">" + esc(tr("basin_q", {
        share: Math.round(state.basinShare * 100), basin: basin, alt: lower(cropName(alt))
      })) + "</p><input id=\"basin-share\" type=\"range\" min=\"0\" max=\"100\" step=\"5\" value=\"" +
      Math.round(state.basinShare * 100) + "\" aria-label=\"%\"></div>" +
      "<p class=\"basin-big\">" + tr("basin_big", { n: num(saving.field_million_m3) }) + "<small>" +
      esc(tr("basin_small", { tareas: num(saving.tareas) })) + "</small></p></div>" +
      "<div class=\"dams\">" + dams + "</div><p class=\"note\">" + esc(tr("basin_note")) + "</p>";
    $("basin-share").oninput = function () {
      state.basinShare = this.value / 100;
      drawBasin(selected, result, byKey);
      $("basin-share").focus();
    };
  }

  function drawLimits() {
    var z = zone();
    $("limits").innerHTML = T[state.lang].limits.map(function (text) {
      return "<li>" + esc(fill(text, {
        adjust: (z.temp_adjustment > 0 ? "+" : "") + num(z.temp_adjustment, 1), cell: num(z.cell_elev), elev: z.elev
      })) + "</li>";
    }).join("");
  }

  // ------------------------------------------------------------------
  // Water traffic light, map of the Cibao and the farm seen from above
  // ------------------------------------------------------------------

  // 100 squares: each crop gets its share of the farm, the rest stays empty.
  function paintCells(cells, s, withIcons) {
    var index = 0;
    function paint(cell, kind, crop) {
      cell.className = kind;
      if (!withIcons || cell.getAttribute("data-crop") === (crop || "")) return;
      cell.setAttribute("data-crop", crop || "");
      cell.innerHTML = crop ? cropIcon(crop) : "";
    }
    s.plots.forEach(function (p) {
      var count = Math.round(100 * p.tareas / state.area);
      for (var n = 0; n < count && index < 100; n++) paint(cells[index++], role(p.crop), p.crop);
    });
    while (index < 100) paint(cells[index++], "idle", null);
  }

  // Normal: most of the water. Tandeo: water by turns. Veda: rice is banned.
  function waterStatus() {
    if (!state.riceAllowed) return "veda";
    return state.allocation >= 0.8 ? "normal" : "tandeo";
  }

  function drawLight() {
    var L = T[state.lang];
    var status = waterStatus();
    $("light").innerHTML = ["normal", "tandeo", "veda"].map(function (key) {
      return "<button type=\"button\" data-light=\"" + key + "\" class=\"" + key + (status === key ? " on" : "") +
        "\" aria-pressed=\"" + (status === key) + "\"><i></i><b>" + L.light[key] + "</b><span>" +
        L.light_desc[key] + "</span></button>";
    }).join("");
    if ($("g-light")) $("g-light").innerHTML = $("light").innerHTML;
  }

  function mx(lon) { return (lon - MAP.lon0) * MAP.cos * MAP.k; }
  function my(lat) { return (MAP.lat0 - lat) * MAP.k; }
  function mapPath(points, close) {
    return "M" + points.map(function (p) {
      return mx(p[0]).toFixed(1) + "," + my(p[1]).toFixed(1);
    }).join("L") + (close ? "Z" : "");
  }
  function total(list) { return list.reduce(function (a, b) { return a + b; }, 0); }

  // The number each map layer shows for a zone, all from NASA POWER (2001-2025).
  function layerValue(z, layer) {
    if (layer === "balance") return total(z.climate.rain) - total(z.climate.et0);
    if (layer === "soil") return total(z.climate.soil) / 12;
    if (layer === "heat") return Math.max.apply(null, z.climate.tmax);
    return null;
  }
  function layerText(value, layer) {
    if (layer === "balance") return num(value) + " mm";
    if (layer === "soil") return num(value) + "%";
    return num(value, 1) + " °C";
  }
  function shortName(name) {
    var inside = name.match(/\((.*)\)/);
    return inside ? inside[1] : name;
  }

  function nearestZoneToMapPoint(event) {
    var svg = event.target.closest("svg") || event.currentTarget.querySelector("svg");
    if (!svg) return state.zone;
    var rect = svg.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width * MAP.w;
    var y = (event.clientY - rect.top) / rect.height * MAP.h;
    var lon = x / (MAP.cos * MAP.k) + MAP.lon0, lat = MAP.lat0 - y / MAP.k;
    var best = 0, distance = Infinity;
    D.zones.forEach(function (z, index) {
      var dx = (z.lon - lon) * Math.cos(lat * Math.PI / 180), dy = z.lat - lat;
      var d = dx * dx + dy * dy;
      if (d < distance) { distance = d; best = index; }
    });
    return best;
  }

  function drawMap() {
    var L = T[state.lang];
    var G = window.GT_GEO;
    var layer = state.layer;
    var plain = layer === "basins" || layer === "sat"; // layers that do not color the NASA squares
    document.querySelectorAll("#layers button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-value") === layer);
    });

    // Group the zones by the NASA POWER square (0.5 x 0.625 degrees) they fall in.
    var squares = {};
    D.zones.forEach(function (z, i) {
      var lat = Math.round(z.lat / 0.5) * 0.5;
      var lon = Math.round(z.lon / 0.625) * 0.625;
      var key = lat + "|" + lon;
      if (!squares[key]) squares[key] = { lat: lat, lon: lon, zones: [] };
      squares[key].zones.push(i);
    });
    var values = D.zones.map(function (z) { return layerValue(z, layer); });
    var low = Math.min.apply(null, values), high = Math.max.apply(null, values);
    function color(value) {
      var share = high > low ? (value - low) / (high - low) : 0;
      if (layer === "balance") share = 1 - share; // a bigger shortfall is darker
      return RAMPS[layer][Math.min(4, Math.floor(share * 5))];
    }
    function rings(list) { return list.map(function (ring) { return mapPath(ring, true); }).join(""); }
    var provinceLayer = (window.GT_PROVINCES || []).map(function (province, index) {
      var d = province.rings.map(function (ring) { return mapPath(ring, true); }).join("");
      return "<path class=\"province-line\" data-province=\"" + index + "\" d=\"" + d + "\" aria-label=\"" +
        esc(province.name) + "\"><title>" + esc(province.name) + " · " + esc(L.province_boundary) + "</title></path>";
    }).join("");

    var svg = "<svg viewBox=\"0 0 " + MAP.w + " " + MAP.h + "\" role=\"group\" aria-label=\"" + esc(L.map_aria) + "\">" +
      "<defs><clipPath id=\"landclip\"><path d=\"" + rings(G.land) + "\"/></clipPath><linearGradient id=\"sea\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d5e9fb\"/><stop offset=\"1\" stop-color=\"#a9d0f5\"/></linearGradient>" +
      "<linearGradient id=\"landfill\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f6f3e4\"/><stop offset=\"1\" stop-color=\"#dfead0\"/></linearGradient>" +
      "<filter id=\"coast\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\"><feDropShadow dx=\"0\" dy=\"3\" stdDeviation=\"4\" flood-color=\"#1c4f8a\" flood-opacity=\"0.3\"/></filter></defs>" +
      "<rect class=\"sea\" width=\"" + MAP.w + "\" height=\"" + MAP.h + "\"/>" + oceanWaves() +
      "<path d=\"" + rings(G.haiti) + "\" class=\"neighbor\"/>" +
      "<path d=\"" + rings(G.land) + "\" class=\"land-side\" transform=\"translate(0 6)\"/>" +
      "<path d=\"" + rings(G.land) + "\" class=\"land\"/>" +
      (layer === "sat" ? "<image class=\"sat-img\" href=\"sat.jpg\" width=\"" + MAP.w + "\" height=\"" + MAP.h + "\" preserveAspectRatio=\"none\"/>" : "") +
      "<text class=\"place\" x=\"" + mx(-70.75) + "\" y=\"" + my(19.99) + "\">" + L.ocean + "</text>" +
      "<text class=\"place\" x=\"" + mx(-72.07) + "\" y=\"" + my(19.20) + "\">" + L.haiti + "</text>" +
      "<text class=\"place\" x=\"" + mx(-70.25) + "\" y=\"" + my(17.85) + "\">" + L.caribbean + "</text>";

    Object.keys(squares).forEach(function (key) {
      var sq = squares[key];
      var x = mx(sq.lon - 0.3125), y = my(sq.lat + 0.25);
      var w = 0.625 * MAP.cos * MAP.k, h = 0.5 * MAP.k;
      var mine = sq.zones.indexOf(state.zone) >= 0;
      var value = plain ? null :
        total(sq.zones.map(function (i) { return values[i]; })) / sq.zones.length;
      svg += "<rect class=\"sq\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\" fill=\"" +
        (value === null ? "none" : color(value)) + "\" fill-opacity=\"0.9\" clip-path=\"url(#landclip)\" stroke=\"" +
        (mine ? "#e2231a" : "#1238a8") + "\" stroke-width=\"" + (mine ? 2.2 : 0.8) + "\"" +
        (mine ? "" : " stroke-dasharray=\"3 4\"") + "/>";
      if (value !== null) {
        var atLeft = sq.lon < -71;
        svg += "<text class=\"value\" text-anchor=\"" + (atLeft ? "start" : "end") + "\" x=\"" +
          (atLeft ? x + 6 : x + w - 6) + "\" y=\"" + (y + h - 7) + "\">" + layerText(value, layer) + "</text>";
      }
    });

    svg += provinceLayer;

    // Real river courses. The three main rivers also get moving white dashes.
    var flow = "";
    G.rivers.forEach(function (river) {
      river.lines.forEach(function (line) {
        var d = mapPath(line);
        svg += "<path class=\"rv" + (river.main ? " main" : "") + "\" d=\"" + d + "\"><title>" + esc(river.name) + "</title></path>";
        if (river.main) flow += "<path class=\"rv-flow\" d=\"" + d + "\"/>";
      });
    });
    svg += flow +
      "<text class=\"river\" x=\"" + mx(-71.72) + "\" y=\"" + my(19.60) + "\">" + L.river + " Yaque del Norte</text>" +
      "<text class=\"river\" x=\"" + mx(-69.88) + "\" y=\"" + my(19.06) + "\">" + L.river + " Yuna</text>" +
      "<text class=\"river\" x=\"" + mx(-70.98) + "\" y=\"" + my(18.50) + "\">" + L.river + " Yaque del Sur</text>";

    // The route follows the named Autopista Duarte segments in an OSRM route
    // over OpenStreetMap. The two tiny cars are an illustration, not live traffic.
    if (window.GT_ROADS && window.GT_ROADS.duarte) {
      var routeId = "duarte-route-" + (++mapRenderCount), routeD = mapPath(window.GT_ROADS.duarte);
      svg += "<path id=\"" + routeId + "\" class=\"highway-casing\" d=\"" + routeD + "\" clip-path=\"url(#landclip)\"><title>Autopista Duarte</title></path>" +
        "<path class=\"highway\" d=\"" + routeD + "\" clip-path=\"url(#landclip)\" pointer-events=\"none\"/>" +
        "<text class=\"highway-label\" x=\"" + mx(-70.27) + "\" y=\"" + my(18.80) + "\">Autopista Duarte</text>";
      if (!reduceMotion) {
        function car(color, begin, reverse) {
          return "<g class=\"map-car\" aria-hidden=\"true\"><animateMotion dur=\"64s\" begin=\"" + begin + "s\" repeatCount=\"indefinite\" rotate=\"auto\"" +
            (reverse ? " keyPoints=\"1;0\" keyTimes=\"0;1\" calcMode=\"linear\"" : "") + "><mpath href=\"#" + routeId + "\"/></animateMotion>" +
            "<g transform=\"translate(-7 -3.5)\"><rect x=\"1\" y=\"0\" width=\"12\" height=\"7\" rx=\"2.2\" fill=\"" + color + "\" stroke=\"#10131a\" stroke-width=\".7\"/>" +
            "<rect x=\"4\" y=\"1\" width=\"5\" height=\"5\" rx=\"1.3\" fill=\"#f7f4e8\"/><circle cx=\"3\" cy=\"1\" r=\"1\"/><circle cx=\"11\" cy=\"1\" r=\"1\"/><circle cx=\"3\" cy=\"6\" r=\"1\"/><circle cx=\"11\" cy=\"6\" r=\"1\"/></g></g>";
        }
        svg += car("#e2231a", "0", false) + car("#1238a8", "-32", true);
      }
    }

    G.dams.forEach(function (dam) {
      var x = mx(dam.lon), y = my(dam.lat), at = GEO.damLabels[dam.name] || { dx: 9, dy: 4, anchor: "start" };
      svg += "<rect x=\"" + (x - 4.5) + "\" y=\"" + (y - 4.5) + "\" width=\"9\" height=\"9\" class=\"dam-mark\" transform=\"rotate(45 " +
        x + " " + y + ")\"/><text class=\"dam-name\" text-anchor=\"" + at.anchor + "\" x=\"" + (x + at.dx) + "\" y=\"" + (y + at.dy) + "\">" + dam.name + "</text>";
    });

    D.zones.forEach(function (z, i) {
      var x = mx(z.lon), y = my(z.lat), label = GEO.labels[z.name] || { dx: 11, dy: 4, anchor: "start" }, mine = i === state.zone;
      svg += "<g class=\"zone" + (mine ? " mine" : "") + "\" data-zone=\"" + i + "\" tabindex=\"0\" role=\"button\" aria-label=\"" +
        esc(z.name) + "\"><circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"16\" fill=\"transparent\"/>" +
        "<ellipse class=\"rice-shadow\" cx=\"" + (x - 7) + "\" cy=\"" + (y + 1) + "\" rx=\"5\" ry=\"1.7\"/><path class=\"rice-sprout\" d=\"M" + (x - 7) + " " + (y + 1) + "v-7m0 4-3-3m3 1 3-4\"/>" +
        (mine ? "<circle class=\"pulse\" cx=\"" + x + "\" cy=\"" + y + "\" r=\"9\"/>" : "") +
        "<circle class=\"dot\" cx=\"" + x + "\" cy=\"" + y + "\" r=\"" + (mine ? 8 : 5.5) + "\"/>" +
        "<text text-anchor=\"" + label.anchor + "\" x=\"" + (x + label.dx) + "\" y=\"" + (y + label.dy) + "\">" +
        esc(shortName(z.name)) + "</text><title>" + esc(z.name + " · " + L.rice_region) + "</title></g>";
    });
    // Each copy of the map needs its own name for the land outline it is clipped to.
    svg += "</svg>";
    $("map").innerHTML = svg;
    if ($("g-map")) $("g-map").innerHTML = svg.replace(/landclip/g, "landclip-g");
    $("h-map").innerHTML = svg.replace(/landclip/g, "landclip-h");
    if ($("j-map")) {
      $("j-map").innerHTML = svg.replace(/landclip/g, "landclip-j").replace(/ tabindex="0"/g, "").replace(/ role="button"/g, "");
      $("j-map").setAttribute("aria-hidden", "true");
    }

    var key = "<span><i class=\"k-zone\"></i>" + L.zone_dot + "</span><span><i class=\"k-zone mine\"></i>" + L.selected_dot + "</span>";
    if (plain) {
      key += "<span><i class=\"k-river\"></i>" + L.river + "</span><span><i class=\"k-dam\"></i>" + L.dam + "</span>";
    } else {
      var ramp = RAMPS[layer].slice();
      var from = layer === "balance" ? high : low, to = layer === "balance" ? low : high;
      key += "<span class=\"k-ramp\">" + layerText(from, layer) + " " + ramp.map(function (c) {
        return "<i style=\"background:" + c + "\"></i>";
      }).join("") + " " + layerText(to, layer) + "</span>";
    }
    $("map-key").innerHTML = key + "<span class=\"k-text\">" + esc(L.layer_desc[layer]) +
      (plain ? "" : " " + esc(L.layer_source)) + "</span>";
  }

  // ------------------------------------------------------------------
  // Guided walkthrough: one question per screen, then the plan
  // ------------------------------------------------------------------

  // Builds the screen of the current question (only when the question changes,
  // so its entrance animation plays once and typing is never interrupted).
  function prepareGuide() {
    var L = T[state.lang], step = state.gstep, stage = $("g-stage");
    var tag = step + "|" + state.lang;
    var showZoneScene = state.guideWithScene && step > 0;
    $("g-scene-panel").hidden = !showZoneScene;
    $("guide").classList.toggle("with-scene", showZoneScene);
    if (stage.getAttribute("data-step") === tag) return;
    var body;
    if (step === 0) {
      body = "<div id=\"g-map\" class=\"g-map\"></div><p class=\"g-pick\">" + L.g_zone + " <b id=\"g-zone\"></b></p>";
    } else if (step === 1) {
      body = "<p class=\"g-label\">" + L.g_month + "</p><div class=\"g-months\">" + MONTHS_SHORT[state.lang].map(function (m, i) {
        return "<button type=\"button\" data-g-month=\"" + (i + 1) + "\">" + m + "</button>";
      }).join("") + "</div><p class=\"help\" id=\"g-month-help\"></p><p class=\"g-label\">" + L.g_area + "</p>" +
        "<div class=\"g-area\"><button type=\"button\" data-g-area=\"-10\" aria-label=\"-10\">−</button>" +
        "<input id=\"g-area\" type=\"number\" min=\"1\" max=\"20000\" inputmode=\"decimal\">" +
        "<button type=\"button\" data-g-area=\"10\" aria-label=\"+10\">+</button></div>";
    } else if (step === 2) {
      body = "<div class=\"g-options\">" + ["clay", "loam", "sandy"].map(function (key) {
        return "<button type=\"button\" class=\"g-option\" data-g-soil=\"" + key + "\">" + SOIL_ART[key] + "<b>" + L.soils[key] + "</b></button>";
      }).join("") + "</div><p class=\"help\" id=\"g-soil-help\"></p>" +
        "<label class=\"check\"><input id=\"g-salty\" type=\"checkbox\"><span>" + L.salty + "</span></label>" +
        "<details class=\"more\"><summary>" + L.g_soil_link + "</summary>" + soilGuide() + "</details>";
    } else if (step === 3) {
      body = "<div class=\"g-water\"><div class=\"g-tank\" aria-hidden=\"true\"><div class=\"g-level\" id=\"g-level\">" +
        "<svg class=\"g-wave\" viewBox=\"0 0 240 16\" preserveAspectRatio=\"none\"><path d=\"M0 8c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0v8H0z\"/></svg></div>" +
        "<b id=\"g-pct\"></b></div><div class=\"g-water-side\"><input id=\"g-alloc\" type=\"range\" min=\"0\" max=\"100\" step=\"5\" aria-label=\"" + esc(L.allocation) + "\">" +
        "<div class=\"light\" id=\"g-light\"></div><p class=\"help\" id=\"g-water-help\"></p><p class=\"g-fit\" id=\"g-fit\"></p></div></div>";
    } else if (step === 4) {
      body = "<div class=\"g-options\">" + ["water", "soil", "income"].map(function (key) {
        return "<button type=\"button\" class=\"g-option\" data-g-priority=\"" + key + "\"><i>" + PRIORITY_ICONS[key] + "</i><b>" +
          L.priorities[key] + "</b><span>" + esc(L.priority_help[key]) + "</span></button>";
      }).join("") + "</div>";
    } else {
      var cells = "";
      for (var i = 0; i < 100; i++) {
        // squares appear as a diagonal wave, with a little irregularity so it does not look mechanical
        cells += "<span style=\"animation-delay:" + ((Math.floor(i / 10) + i % 10) * 22 + (i * 7) % 5 * 9) + "ms\"></span>";
      }
      body = "<div class=\"stamp\" aria-hidden=\"true\"><span>" + L.stamp + "</span></div>" +
        "<div class=\"g-result\"><div class=\"plot big\" id=\"g-parcel\" aria-hidden=\"true\">" + cells + "</div>" +
        "<div class=\"plan-side\"><div class=\"mix\" id=\"g-mix\"></div><div class=\"impact\" id=\"g-impact\"></div><div class=\"actions\">" +
        "<button type=\"button\" class=\"btn primary\" data-go=\"plan\">" + L.g_full + "</button>" +
        "<button type=\"button\" class=\"btn\" data-go=\"rotation\">" + L.g_rot + "</button>" +
        "<button type=\"button\" class=\"btn\" data-g-restart>" + L.g_restart + "</button></div></div></div>";
    }
    stage.innerHTML = "<h2 class=\"g-q\">" + (step < 5 ? L.g_q[step] : L.g_result) + "</h2><p class=\"g-sub\" id=\"g-sub\">" +
      (step < 5 ? esc(L.g_sub[step]) : "") + "</p><div class=\"g-body\">" + body + "</div>";
    stage.setAttribute("data-step", tag);
    $("guide").setAttribute("data-step", step);
  }

  // Fills the current screen with the farmer's answers and their consequences.
  function updateGuide(result, best, byKey) {
    var L = T[state.lang], step = state.gstep;
    $("g-count").textContent = step < 5 ? tr("g_step", { n: step + 1 }) : L.g_done;
    $("g-bar").style.width = (100 * Math.min(step + 1, 6) / 6) + "%";
    var back = document.querySelector("[data-g-back]"), next = document.querySelector("[data-g-next]");
    back.textContent = L.g_back;
    next.textContent = step === 4 ? L.g_see : L.g_next;
    next.hidden = step >= 5;
    function mark(selector, attribute, value) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.classList.toggle("on", el.getAttribute(attribute) === String(value));
      });
    }
    if (step === 0) {
      $("g-zone").textContent = zone().name;
    } else if (step === 1) {
      mark("[data-g-month]", "data-g-month", state.month);
      $("g-month-help").textContent = $("month-help").textContent;
      if (document.activeElement !== $("g-area")) $("g-area").value = state.area;
    } else if (step === 2) {
      mark("[data-g-soil]", "data-g-soil", state.soil);
      $("g-soil-help").textContent = L.soil_help[state.soil];
      $("g-salty").checked = state.salty;
    } else if (step === 3) {
      $("g-level").style.height = (100 * state.allocation) + "%";
      $("g-pct").textContent = Math.round(state.allocation * 100) + "%";
      $("g-alloc").value = Math.round(state.allocation * 100);
      $("g-water-help").textContent = L.water_help[waterStatus()];
      var rice = byKey.current.plots.length ? byKey.current.plots[0].tareas : 0;
      $("g-fit").textContent = state.riceAllowed
        ? tr("g_fit", { n: tareasText(rice), area: tareasText(state.area) }) : L.g_fit_ban;
    } else if (step === 4) {
      mark("[data-g-priority]", "data-g-priority", state.priority);
    } else {
      $("g-sub").innerHTML = $("headline").innerHTML;
      paintCells($("g-parcel").children, best, true);
      $("g-mix").innerHTML = $("plan-mix").innerHTML;
      $("g-impact").innerHTML = $("impact").innerHTML;
    }
  }

  // Table that teaches how to tell clay, loam and sandy soil apart by feel.
  function soilGuide() {
    var L = T[state.lang];
    return "<p class=\"soil-how\">" + esc(L.soilg_how) + "</p><div class=\"soil-table\"><table><thead><tr>" +
      L.soilg_head.map(function (head) { return "<th>" + head + "</th>"; }).join("") + "</tr></thead><tbody>" +
      ["clay", "loam", "sandy"].map(function (key) {
        return "<tr><th>" + SOIL_ART[key] + "<b>" + L.soils[key] + "</b></th>" +
          L.soilg_rows[key].map(function (cell) { return "<td>" + esc(cell) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div><p class=\"note\">" + esc(L.soilg_note) + "</p>";
  }

  // Lines of waves that drift across the sea (built once).
  var wavesCache = null;
  function oceanWaves() {
    if (wavesCache) return wavesCache;
    var out = "<g class=\"waves\">";
    for (var row = 0; row < 11; row++) {
      var y = 24 + row * 50, d = "M-120 " + y;
      for (var x = -120; x < MAP.w + 120; x += 40) d += "q10 -5 20 0t20 0";
      out += "<path class=\"wave w" + (row % 3) + "\" d=\"" + d + "\"/>";
    }
    wavesCache = out + "</g>";
    return wavesCache;
  }

  // ------------------------------------------------------------------
  // Zone explorer: zoom into a zone and show its real relief in 3D
  // ------------------------------------------------------------------
  var RELIEF = (function () {
    var r = window.GT_RELIEF, bytes = atob(r.data), heights = new Uint16Array(bytes.length / 2);
    for (var i = 0; i < heights.length; i++) heights[i] = bytes.charCodeAt(2 * i) | (bytes.charCodeAt(2 * i + 1) << 8);
    return { west: r.west, north: r.north, step: r.step, columns: r.columns, rows: r.rows, heights: heights };
  })();
  // Elevation in meters at any point, blended from the four nearest grid values.
  function elevationAt(lon, lat) {
    var x = Math.max(0, Math.min(RELIEF.columns - 1.001, (lon - RELIEF.west) / RELIEF.step));
    var y = Math.max(0, Math.min(RELIEF.rows - 1.001, (RELIEF.north - lat) / RELIEF.step));
    var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, c = RELIEF.columns, h = RELIEF.heights;
    return (h[j * c + i] * (1 - fx) + h[j * c + i + 1] * fx) * (1 - fy) +
      (h[(j + 1) * c + i] * (1 - fx) + h[(j + 1) * c + i + 1] * fx) * fy;
  }

  var WINDOW = { lon: 0.44, lat: 0.33 }; // half-size, in degrees, of the area shown around the zone
  var HEIGHT_BOOST = 8; // mountains are drawn 8 times taller so the relief can be seen
  var TINTS = [[0, [255, 255, 255]], [120, [240, 244, 254]], [500, [196, 209, 246]], [1200, [134, 157, 232]], [2400, [78, 104, 204]]];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scene = { frame: 0, start: 0, angle: -0.35, dragged: false, pointer: null, model: null, zone: -1 };

  function terrainColor(height, shade) {
    if (height <= 0.5) return null; // sea
    var k = 0;
    while (k < TINTS.length - 2 && height > TINTS[k + 1][0]) k++;
    var a = TINTS[k], b = TINTS[k + 1], t = Math.max(0, Math.min(1, (height - a[0]) / (b[0] - a[0])));
    var rgb = [0, 1, 2].map(function (n) { return Math.round(Math.min(255, (a[1][n] + (b[1][n] - a[1][n]) * t) * shade)); });
    return "rgb(" + rgb.join(",") + ")";
  }

  // Everything the 3D view needs for one zone: the ground as small squares,
  // the rivers lying on it, the dams and the zones that fall inside the window.
  function buildScene(index) {
    var z = D.zones[index], step = RELIEF.step;
    var cols = Math.round(2 * WINDOW.lon / step), rows = Math.round(2 * WINDOW.lat / step);
    var west = z.lon - WINDOW.lon, north = z.lat + WINDOW.lat;
    var kmLon = 111 * Math.cos(z.lat * Math.PI / 180);
    function place(lon, lat, lift) {
      return { x: (lon - z.lon) * kmLon, y: (lat - z.lat) * 111, h: Math.max(0, elevationAt(lon, lat)) + (lift || 0) };
    }
    function inside(lon, lat) { return Math.abs(lon - z.lon) <= WINDOW.lon && Math.abs(lat - z.lat) <= WINDOW.lat; }

    var points = [], highest = 0, i, j;
    for (j = 0; j <= rows; j++) {
      for (i = 0; i <= cols; i++) {
        var p = place(west + i * step, north - j * step);
        highest = Math.max(highest, p.h);
        points.push(p);
      }
    }
    var quads = [];
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var a = j * (cols + 1) + i, b = a + 1, c = a + cols + 2, d = a + cols + 1;
        var mean = (points[a].h + points[b].h + points[c].h + points[d].h) / 4;
        // light comes from the north-west: ground that rises toward the south-east faces it
        var rise = (points[b].h - points[a].h + points[c].h - points[d].h) / 2 + (points[d].h - points[a].h + points[c].h - points[b].h) / 2;
        quads.push({ a: a, b: b, c: c, d: d, color: terrainColor(mean, Math.max(0.58, Math.min(1.1, 0.95 + rise / 520))) });
      }
    }

    var provinceLines = [];
    (window.GT_PROVINCES || []).forEach(function (province) {
      province.rings.forEach(function (ring) {
        var run = [];
        ring.forEach(function (point) {
          if (!inside(point[0], point[1])) {
            if (run.length > 1) provinceLines.push(run);
            run = [];
          } else run.push(place(point[0], point[1], 5));
        });
        if (run.length > 1) provinceLines.push(run);
      });
    });
    var roadRuns = [], roadRun = [];
    ((window.GT_ROADS && window.GT_ROADS.duarte) || []).forEach(function (point) {
      if (!inside(point[0], point[1])) {
        if (roadRun.length > 1) roadRuns.push(roadRun);
        roadRun = [];
      } else roadRun.push(place(point[0], point[1], 14));
    });
    if (roadRun.length > 1) roadRuns.push(roadRun);
    roadRuns = roadRuns.map(function (run) {
      var distances = [0];
      for (var n = 1; n < run.length; n++) distances.push(distances[n - 1] + Math.hypot(run[n].x - run[n - 1].x, run[n].y - run[n - 1].y));
      return { points: run, distances: distances, length: distances[distances.length - 1] };
    }).filter(function (run) { return run.length > 0.5; });
    var rivers = [], names = [];
    window.GT_GEO.rivers.forEach(function (river) {
      river.lines.forEach(function (line) {
        var run = [];
        for (var n = 0; n < line.length; n++) {
          var lon = line[n][0], lat = line[n][1];
          if (!inside(lon, lat)) { if (run.length > 1) rivers.push({ main: river.main, points: run }); run = []; continue; }
          if (run.length) { // add points in between so the river follows the ground
            var prev = line[n - 1], pieces = Math.ceil(Math.hypot((lon - prev[0]) * kmLon, (lat - prev[1]) * 111) / 1.5);
            for (var s = 1; s < pieces; s++) run.push(place(prev[0] + (lon - prev[0]) * s / pieces, prev[1] + (lat - prev[1]) * s / pieces, 12));
          }
          run.push(place(lon, lat, 12));
          if (names.indexOf(river.name) < 0) names.push(river.name);
        }
        if (run.length > 1) rivers.push({ main: river.main, points: run });
      });
    });
    var dams = window.GT_GEO.dams.filter(function (dam) { return inside(dam.lon, dam.lat); }).map(function (dam) {
      var spot = place(dam.lon, dam.lat, 30); spot.name = dam.name; return spot;
    });
    var zones = [];
    D.zones.forEach(function (other, n) {
      if (!inside(other.lon, other.lat)) return;
      var spot = place(other.lon, other.lat, 30); spot.name = shortName(other.name); spot.mine = n === index; zones.push(spot);
    });
    return { points: points, quads: quads, provinceLines: provinceLines, roads: roadRuns, rivers: rivers, dams: dams, zones: zones, riverNames: names,
      highest: highest, widthKm: 2 * WINDOW.lon * kmLon };
  }

  function visibleSceneCanvas() {
    return state.view === "guide" && state.guideWithScene && state.gstep > 0 ? $("g-canvas") : $("z-canvas");
  }
  function sceneVisible() {
    return state.view === "zone" || (state.view === "guide" && state.guideWithScene && state.gstep > 0);
  }

  function drawScene(now) {
    var canvas = visibleSceneCanvas(), m = scene.model;
    if (!m || !canvas.width) return;
    var ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height, ratio = W / canvas.clientWidth;
    var seconds = (now - scene.start) / 1000;
    var grow = reduceMotion ? 1 : 1 - Math.pow(1 - Math.min(1, seconds / 1.6), 3); // the land rises as the view tilts
    if (!scene.dragged && !reduceMotion) scene.angle = -0.35 + 0.3 * Math.sin(seconds / 5);
    var tilt = 0.98 * grow, cosA = Math.cos(scene.angle), sinA = Math.sin(scene.angle);
    var cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    var scale = W / (m.widthKm * 1.04), cx = W / 2, cy = H * (0.5 + 0.1 * grow);
    var lift = HEIGHT_BOOST * grow / 1000; // meters to exaggerated kilometers

    var sx = new Float32Array(m.points.length), sy = new Float32Array(m.points.length), depth = new Float32Array(m.points.length);
    function project(p) {
      var xr = p.x * cosA - p.y * sinA, yr = p.x * sinA + p.y * cosA;
      return [cx + xr * scale, cy - (yr * cosT + p.h * lift * sinT) * scale, yr];
    }
    m.points.forEach(function (p, n) { var q = project(p); sx[n] = q[0]; sy[n] = q[1]; depth[n] = q[2]; });
    var order = m.quads.slice().sort(function (p, q) { return depth[q.a] + depth[q.c] - depth[p.a] - depth[p.c]; });

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 0.8 * ratio;
    order.forEach(function (q) {
      ctx.beginPath();
      ctx.moveTo(sx[q.a], sy[q.a]); ctx.lineTo(sx[q.b], sy[q.b]); ctx.lineTo(sx[q.c], sy[q.c]); ctx.lineTo(sx[q.d], sy[q.d]);
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle = q.color || "#2a4fc0";
      ctx.fill(); ctx.stroke();
    });

    ctx.beginPath();
    m.provinceLines.forEach(function (line) {
      line.forEach(function (p, n) { var q = project(p); if (n) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    });
    ctx.strokeStyle = "rgba(255,255,255,.86)"; ctx.lineWidth = 1.15 * ratio; ctx.setLineDash([4 * ratio, 3 * ratio]); ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineJoin = ctx.lineCap = "round";
    m.rivers.forEach(function (river) {
      ctx.beginPath();
      river.points.forEach(function (p, n) { var q = project(p); if (n) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.setLineDash([]);
      ctx.strokeStyle = "#1238a8"; ctx.lineWidth = (river.main ? 3.4 : 1.3) * ratio; ctx.stroke();
      if (river.main) { // water moving downstream
        ctx.setLineDash([3 * ratio, 9 * ratio]); ctx.lineDashOffset = -seconds * 16 * ratio;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.3 * ratio; ctx.stroke();
      }
    });
    ctx.setLineDash([]);

    m.roads.forEach(function (run) {
      ctx.beginPath();
      run.points.forEach(function (p, n) { var q = project(p); if (n) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 6.2 * ratio; ctx.stroke();
      ctx.strokeStyle = "#45484d"; ctx.lineWidth = 4.1 * ratio; ctx.stroke();
      ctx.setLineDash([4 * ratio, 5 * ratio]); ctx.lineDashOffset = -seconds * 3 * ratio;
      ctx.strokeStyle = "#f3d777"; ctx.lineWidth = 0.8 * ratio; ctx.stroke(); ctx.setLineDash([]);
      if (run === m.roads[0]) {
        var roadLabelPoint = project(run.points[Math.floor(run.points.length / 2)]);
        label("Autopista Duarte", roadLabelPoint[0] + 5 * ratio, roadLabelPoint[1] - 7 * ratio, true);
      }

      // Two tiny vehicles follow this mapped road; motion is decorative, not traffic data.
      for (var vehicle = 0; vehicle < 2; vehicle++) {
        var distance = (seconds * run.length / 56 + vehicle * run.length / 2) % run.length, segment = 0;
        while (segment < run.distances.length - 2 && run.distances[segment + 1] < distance) segment++;
        var segmentLength = run.distances[segment + 1] - run.distances[segment] || 1;
        var portion = (distance - run.distances[segment]) / segmentLength;
        var a = run.points[segment], b = run.points[segment + 1];
        var here = { x: a.x + (b.x - a.x) * portion, y: a.y + (b.y - a.y) * portion, h: a.h + (b.h - a.h) * portion };
        var p0 = project(a), p1 = project(b), carPoint = project(here);
        ctx.save(); ctx.translate(carPoint[0], carPoint[1]); ctx.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
        ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0, 3.2 * ratio, 6.2 * ratio, 2.5 * ratio, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = vehicle ? "#e2231a" : "#f7f4e8"; ctx.strokeStyle = "#10131a"; ctx.lineWidth = 0.9 * ratio;
        ctx.beginPath(); ctx.moveTo(-6 * ratio, -2.5 * ratio); ctx.lineTo(4 * ratio, -2.5 * ratio); ctx.lineTo(6 * ratio, 0); ctx.lineTo(4 * ratio, 2.5 * ratio); ctx.lineTo(-6 * ratio, 2.5 * ratio); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#1238a8"; ctx.fillRect(-1.5 * ratio, -1.7 * ratio, 3.5 * ratio, 3.4 * ratio);
        ctx.restore();
      }
    });

    function label(text, x, y, bold) {
      ctx.font = (bold ? "800 " : "700 ") + Math.round((bold ? 15 : 12) * ratio) + "px Archivo, sans-serif";
      ctx.lineWidth = 3.5 * ratio; ctx.strokeStyle = "#fff"; ctx.strokeText(text, x, y);
      ctx.fillStyle = "#10131a"; ctx.fillText(text, x, y);
    }
    m.dams.forEach(function (dam) {
      var q = project(dam), r = 5.5 * ratio;
      ctx.beginPath(); ctx.moveTo(q[0], q[1] - r); ctx.lineTo(q[0] + r, q[1]); ctx.lineTo(q[0], q[1] + r); ctx.lineTo(q[0] - r, q[1]); ctx.closePath();
      ctx.fillStyle = "#10131a"; ctx.fill(); ctx.lineWidth = 1.5 * ratio; ctx.strokeStyle = "#fff"; ctx.stroke();
      label(dam.name, q[0] + 9 * ratio, q[1] + 4 * ratio);
    });
    m.zones.forEach(function (spot) {
      var q = project(spot), pole = (spot.mine ? 34 : 0) * ratio * grow, r = (spot.mine ? 8 : 5) * ratio;
      if (pole) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - pole); ctx.lineWidth = 2.5 * ratio; ctx.strokeStyle = "#10131a"; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(q[0], q[1] - pole, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#e2231a"; ctx.fill(); ctx.lineWidth = 2 * ratio; ctx.strokeStyle = spot.mine ? "#10131a" : "#fff"; ctx.stroke();
      label(spot.name, q[0] + r + 5 * ratio, q[1] - pole + 4 * ratio, spot.mine);
      if (spot.mine && state.farmPlaced) {
        var rise = Math.min(1, Math.max(0, (now - scene.start) / 420));
        var pop = 1 - Math.pow(1 - rise, 3), fx = q[0], fy = q[1] - pole - 8 * ratio * pop;
        ctx.save(); ctx.globalAlpha = pop; ctx.translate(fx, fy); ctx.scale(pop, pop);
        ctx.fillStyle = "#537a35"; ctx.beginPath(); ctx.moveTo(-22 * ratio, 5 * ratio); ctx.lineTo(0, -2 * ratio); ctx.lineTo(22 * ratio, 5 * ratio); ctx.lineTo(18 * ratio, 17 * ratio); ctx.lineTo(-18 * ratio, 17 * ratio); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(247,244,232,.8)"; ctx.lineWidth = 1 * ratio;
        [-14, -7, 0, 7, 14].forEach(function (dx) { ctx.beginPath(); ctx.moveTo(dx * ratio, 5 * ratio); ctx.lineTo(dx * ratio, 15 * ratio); ctx.stroke(); });
        [[-13, -2], [0, -5], [13, -2]].forEach(function (plant) {
          var px = plant[0] * ratio, py = plant[1] * ratio;
          ctx.strokeStyle = "#f0d36b"; ctx.lineWidth = 1.3 * ratio; ctx.beginPath(); ctx.moveTo(px, py + 3 * ratio); ctx.quadraticCurveTo(px - 1 * ratio, py - 4 * ratio, px, py - 9 * ratio); ctx.stroke();
          ctx.fillStyle = "#a6bd50"; ctx.beginPath(); ctx.ellipse(px - 2 * ratio, py - 4 * ratio, 2.2 * ratio, 1 * ratio, -0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px + 2 * ratio, py - 7 * ratio, 2.2 * ratio, 1 * ratio, 0.4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.strokeStyle = "#f7f4e8"; ctx.lineWidth = 1.5 * ratio;
        [-10, 0, 10].forEach(function (dx) { ctx.beginPath(); ctx.moveTo(dx * ratio, 5 * ratio); ctx.lineTo(dx * ratio, 15 * ratio); ctx.stroke(); });
        ctx.fillStyle = "#fff"; ctx.fillRect(-5 * ratio, -16 * ratio, 10 * ratio, 12 * ratio);
        ctx.fillStyle = "#e2231a"; ctx.beginPath(); ctx.moveTo(-8 * ratio, -16 * ratio); ctx.lineTo(0, -23 * ratio); ctx.lineTo(8 * ratio, -16 * ratio); ctx.closePath(); ctx.fill();
        ctx.restore();
        label("FINCA", fx + 25 * ratio, fy + 3 * ratio, true);
      }
    });

    // north arrow
    var nx = -sinA, ny = -cosA * cosT, len = 26 * ratio, ox = 34 * ratio, oy = 44 * ratio, size = Math.hypot(nx, ny) || 1;
    ctx.beginPath(); ctx.moveTo(ox - nx / size * len / 2, oy - ny / size * len / 2); ctx.lineTo(ox + nx / size * len / 2, oy + ny / size * len / 2);
    ctx.lineWidth = 3 * ratio; ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.font = "800 " + Math.round(14 * ratio) + "px Archivo, sans-serif"; ctx.fillStyle = "#fff";
    ctx.fillText("N", ox + nx / size * (len / 2 + 9 * ratio) - 5 * ratio, oy + ny / size * (len / 2 + 9 * ratio) + 5 * ratio);
  }

  function startScene() {
    var canvas = visibleSceneCanvas(), ratio = Math.min(2, window.devicePixelRatio || 1);
    if (!canvas.clientWidth) return;
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientWidth * 0.7 * ratio);
    if (!scene.model || scene.zone !== state.zone) {
      scene.model = buildScene(state.zone);
      scene.zone = state.zone;
      scene.angle = -0.35;
      scene.dragged = false;
    }
    scene.start = performance.now();
    cancelAnimationFrame(scene.frame);
    (function tick(now) {
      drawScene(now);
      if (sceneVisible() && !reduceMotion) scene.frame = requestAnimationFrame(tick);
    })(performance.now());
    drawZoneInfo();
  }
  function stopScene() { cancelAnimationFrame(scene.frame); }

  // Map zoom toward the zone, then the 3D view opens.
  function zoomToZone(container, index) {
    var svg = container.querySelector("svg"), z = D.zones[index];
    if (state.zone !== index) state.farmPlaced = false;
    state.zone = index;
    function open() { draw(); setView("zone"); }
    if (!svg || reduceMotion) { open(); return; }
    svg.style.transformOrigin = (100 * mx(z.lon) / MAP.w) + "% " + (100 * my(z.lat) / MAP.h) + "%";
    svg.classList.add("zooming");
    setTimeout(open, 600);
  }

  // The zone's sheet: relief, climate, rivers, dams and soil.
  function drawZoneInfo() {
    if (state.view !== "zone") return;
    if (scene.zone !== state.zone) { startScene(); return; }
    var L = T[state.lang], z = zone(), c = z.climate, m = scene.model;
    var hottest = c.tmax.indexOf(Math.max.apply(null, c.tmax));
    function mean(list) { return total(list) / list.length; }
    $("z-title").textContent = z.name;
    $("z-plan").textContent = state.farmPlaced ? L.z_continue : L.z_plan;
    $("z-farm-note").textContent = state.farmPlaced ? L.z_farm_placed : L.z_farm_note;
    $("z-sub").textContent = tr("z_sub", { basin: z.basin });
    var rows = [
      [num(elevationAt(z.lon, z.lat)) + " m", L.z_elev],
      [num(m.highest) + " m", L.z_high],
      [num(c.tmax[hottest], 1) + " °C", tr("z_heat", { month: MONTHS[state.lang][hottest] })],
      [num(mean(c.temp), 1) + " °C", L.z_temp],
      [num(total(c.rain)) + " mm", L.z_rain],
      [num(total(c.et0)) + " mm", L.z_et0],
      [Math.round(mean(c.humidity)) + "%", L.z_hum],
      [num(mean(c.wind), 1) + " m/s", L.z_wind],
      [Math.round(mean(c.soil)) + "%", L.z_soilw]
    ];
    $("z-stats").innerHTML = rows.map(function (row) {
      return "<div><b>" + row[0] + "</b><span>" + esc(row[1]) + "</span></div>";
    }).join("");
    $("z-lists").innerHTML =
      "<p><b>" + L.z_rivers + ":</b> " + esc(m.riverNames.length ? m.riverNames.join(", ") : L.z_none) + "</p>" +
      "<p><b>" + L.z_dams + ":</b> " + esc(m.dams.length ? m.dams.map(function (d) { return d.name; }).join(", ") : L.z_none) + "</p>" +
      "<p><b>" + L.z_soil_title + ":</b> " + esc(L.z_soil) + " <button type=\"button\" class=\"btn small\" data-go=\"help\">" + L.z_soil_btn + "</button></p>";
  }

  // Rotation: what grows on each plot in this cycle and in the next one.
  function drawRotation(s, result) {
    var L = T[state.lang];
    var month2 = (state.month - 1 + 6) % 12 + 1;
    var needs2 = D.needs[zone().name + "|" + state.soil + "|" + month2];
    var hasRice = s.plots.some(function (p) { return p.crop === "rice"; });

    // Each plot of cycle 1 and the crop it gets in cycle 2.
    var lots = s.plots.map(function (p) {
      var next = p.crop === "rice" ? (s.key === "mixed" && s.alternative ? s.alternative : "rice") : "rice";
      return { tareas: p.tareas, first: p.crop, second: next };
    });
    if (s.idle_tareas > 0.005) lots.push({ tareas: s.idle_tareas, first: null, second: null });

    function bar(crop, startDay, needs) {
      if (!crop) {
        return "<div class=\"cal-bar idle\" style=\"left:" + (100 * startDay / 365) + "%;width:" + (100 * 120 / 365) + "%\">" + tr("idle") + "</div>";
      }
      return "<div class=\"cal-bar " + role(crop) + "\" style=\"left:" + (100 * startDay / 365) + "%;width:" +
        (100 * needs[crop].days / 365) + "%\" title=\"" + esc(cropName(crop)) + " · " + needs[crop].days + " d\">" +
        cropIcon(crop) + "<span>" + esc(cropName(crop)) + "</span></div>";
    }
    var months = "";
    for (var k = 0; k < 12; k++) months += "<span>" + MONTHS_SHORT[state.lang][(state.month - 1 + k) % 12] + "</span>";
    var rows = lots.map(function (lot, i) {
      return "<div class=\"cal-row\"><div class=\"cal-name\">" + tr("rot_lot", { n: String.fromCharCode(65 + i), tareas: tareasText(lot.tareas) }) +
        "</div><div class=\"cal-track\">" + bar(lot.first, 14, result.needs) + bar(lot.second, 14 + 183, needs2) + "</div></div>";
    }).join("");

    var water2 = 0;
    lots.forEach(function (lot) { if (lot.second) water2 += lot.tareas * needs2[lot.second].typical_m3; });
    var budget2 = state.allocation * needs2.rice.typical_m3 * state.area;
    var alt = s.alternative ? lower(cropName(s.alternative)) : "";
    var story;
    if (!s.plots.length) story = T[state.lang].say_none;
    else if (s.key === "current") story = L.rot_none;
    else if (s.key === "mixed" && hasRice) story = tr("rot_swap", { alt: alt, n: num(s.urea_sacks) });
    else story = s.urea_sacks >= 0.5 ? tr("rot_back_n", { alt: alt, n: num(s.urea_sacks) }) : tr("rot_back", { alt: alt });

    $("rotation").innerHTML =
      "<div class=\"cal\"><div class=\"cal-row cal-head\"><div class=\"cal-name\"></div><div class=\"cal-months\">" + months + "</div></div>" +
      "<div class=\"cal-row cal-cycles\"><div class=\"cal-name\"></div><div class=\"cal-track\">" +
      "<b style=\"left:" + (100 * 14 / 365) + "%\">" + tr("rot_cycle", { n: 1, month: MONTHS[state.lang][state.month - 1] }) + "</b>" +
      "<b style=\"left:" + (100 * 197 / 365) + "%\">" + tr("rot_cycle", { n: 2, month: MONTHS[state.lang][month2 - 1] }) + "</b></div></div>" +
      rows + "</div>" +
      "<p class=\"rot-story\">" + esc(story) + "</p>" +
      "<div class=\"impact rot-water\"><div><b>" + num(s.water_m3) + "</b><span>" +
      esc(tr("rot_water", { c: 1, used: num(s.water_m3), budget: num(result.budget_m3) })) + "</span></div><div><b>" +
      num(water2) + "</b><span>" + esc(tr("rot_water", { c: 2, used: num(water2), budget: num(budget2) })) +
      (water2 > budget2 * 1.02 ? " " + esc(L.rot_over) : "") + "</span></div></div>" +
      "<p class=\"note\">" + esc(tr("rot_note", { alloc: Math.round(state.allocation * 100) })) + "</p>";
  }

  function drawParcel(s) {
    var L = T[state.lang];
    paintCells($("parcel").children, s, true);
    $("parcel-sub").textContent = tr("parcel_sub", { name: strategyName(s), area: tareasText(state.area) });
    var climate = zone().climate, monthIndex = state.month - 1;
    $("parcel-context").innerHTML =
      "<div class=\"parcel-weather\"><b>" + esc(L.field_weather) + " · " + esc(MONTHS[state.lang][monthIndex]) + "</b>" +
      "<span>" + num(climate.tmax[monthIndex], 1) + " °C</span><small>" + num(climate.rain[monthIndex]) + " mm " + esc(L.field_rain) + "</small></div>" +
      "<div class=\"parcel-soil\">" + SOIL_ART[state.soil] + "<span><b>" + esc(L.field_soil) + "</b><small>" + esc(L.soils[state.soil]) + "</small></span></div>" +
      "<div class=\"parcel-water\"><div><b>" + esc(L.field_water) + "</b><span>" + Math.round(state.allocation * 100) + "%</span></div>" +
      "<i><u style=\"width:" + Math.round(state.allocation * 100) + "%\"></u></i><small>" + esc(L.field_water_target) + "</small></div>";
    var lines = s.plots.map(function (p) {
      return "<span>" + cropBadge(p.crop) + "<b>" + tareasText(p.tareas) + "</b> " + tr("tareas") + " · " +
        esc(cropName(p.crop)) + "</span>";
    });
    if (s.idle_tareas > 0.005) {
      lines.push("<span><i class=\"cb idle\"></i><b>" + tareasText(s.idle_tareas) + "</b> " + tr("tareas") + " · " + tr("idle") + "</span>");
    }
    $("plan-mix").innerHTML = lines.join("");
    function tile(value, text) { return "<div><b>" + value + "</b><span>" + esc(text) + "</span></div>"; }
    $("impact").innerHTML =
      tile(num(s.urea_sacks), L.impact_n) +
      tile(num(Math.max(0, s.saved_m3)), L.impact_water) +
      tile(tareasText(state.area - s.idle_tareas) + " / " + tareasText(state.area), L.impact_land);
  }

  function drawSceneContexts() {
    var L = T[state.lang], climate = zone().climate, monthIndex = state.month - 1;
    ["z-scene-context", "g-scene-context"].forEach(function (id) {
      var panel = $(id);
      if (!panel) return;
      panel.innerHTML =
        "<div class=\"scene-context-head\"><b>" + esc(L.field_weather) + " · " + esc(MONTHS[state.lang][monthIndex]) + "</b>" +
        "<strong>" + num(climate.tmax[monthIndex], 1) + "°</strong><span>" + num(climate.rain[monthIndex]) + " mm " + esc(L.field_rain) + "</span></div>" +
        "<div class=\"scene-context-soil\">" + SOIL_ART[state.soil] + "<span><b>" + esc(L.field_soil) + "</b><small>" +
        esc(L.soils[state.soil]) + "</small></span></div>" +
        "<div class=\"scene-context-water\"><div><b>" + esc(L.field_water) + "</b><strong>" + Math.round(state.allocation * 100) + "%</strong></div>" +
        "<i><u style=\"width:" + Math.round(state.allocation * 100) + "%\"></u></i></div>" +
        "<div class=\"scene-context-area\"><b>" + esc(L.field_area) + "</b><span>" + tareasText(state.area) + " " + esc(tr("tareas")) + "</span></div>";
    });
  }

  // ------------------------------------------------------------------
  // Reacting to the farmer
  // ------------------------------------------------------------------
  function listen() {
    document.querySelectorAll(".lang button").forEach(function (button) {
      button.onclick = function () {
        state.lang = button.getAttribute("data-lang");
        drawStatic();
        listen();
        draw();
        setView(state.view, true);
      };
    });
    $("zone").onchange = function () { state.zone = +this.value; state.farmPlaced = false; draw(); };
    $("month").onchange = function () { state.month = +this.value; draw(); };
    $("area").oninput = function () {
      var value = parseFloat(this.value);
      if (value > 0) { state.area = Math.min(value, 20000); draw(); }
    };
    $("soil").onclick = function (event) {
      var value = event.target.getAttribute("data-value");
      if (value) { state.soil = value; draw(); }
    };
    $("priority").onclick = function (event) {
      var value = event.target.getAttribute("data-value");
      if (value) { state.priority = value; state.selected = null; draw(); }
    };
    $("allocation").oninput = function () { state.allocation = this.value / 100; draw(); };
    $("light").onclick = function (event) {
      var button = event.target.closest("[data-light]");
      if (!button) return;
      var status = button.getAttribute("data-light");
      state.riceAllowed = status !== "veda";
      state.allocation = { normal: 1, tandeo: 0.6, veda: 0.3 }[status];
      state.selected = null;
      draw();
    };
    $("layers").onclick = function (event) {
      var value = event.target.getAttribute("data-value");
      if (value) { state.layer = value; drawMap(); }
    };
    function pickZone(event) {
      var zoneMark = event.target.closest("[data-zone]");
      if (!zoneMark || (event.type === "keydown" && event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      state.zone = +zoneMark.getAttribute("data-zone");
      $("zone").value = state.zone;
      draw();
    }
    function exploreZone(event) {
      var mark = event.target.closest("[data-zone]"), province = event.target.closest("[data-province]");
      if (!mark && province && event.type !== "keydown") mark = { getAttribute: function () { return nearestZoneToMapPoint(event); } };
      if (!mark || (event.type === "keydown" && event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      zoomToZone(event.currentTarget, +mark.getAttribute("data-zone"));
    }
    $("map").onclick = exploreZone;
    $("map").onkeydown = exploreZone;
    $("h-map").onkeydown = exploreZone;
    $("z-plan").onclick = function () {
      if (!state.farmPlaced) {
        state.farmPlaced = true;
        scene.start = performance.now();
        drawZoneInfo();
        return;
      }
      state.guideWithScene = true;
      state.gstep = 1;
      draw();
      setView("guide");
    };
    $("guide").onclick = function (event) {
      var target = event.target, el;
      if ((el = target.closest("[data-province]"))) { state.zone = nearestZoneToMapPoint(event); state.farmPlaced = false; draw(); return; }
      if ((el = target.closest("[data-zone]"))) { state.zone = +el.getAttribute("data-zone"); draw(); return; }
      if ((el = target.closest("[data-g-month]"))) { state.month = +el.getAttribute("data-g-month"); draw(); return; }
      if ((el = target.closest("[data-g-soil]"))) { state.soil = el.getAttribute("data-g-soil"); draw(); return; }
      if ((el = target.closest("[data-g-priority]"))) {
        state.priority = el.getAttribute("data-g-priority"); state.selected = null; draw(); return;
      }
      if ((el = target.closest("[data-light]"))) {
        var status = el.getAttribute("data-light");
        state.riceAllowed = status !== "veda";
        state.allocation = { normal: 1, tandeo: 0.6, veda: 0.3 }[status];
        state.selected = null; draw(); return;
      }
      if ((el = target.closest("[data-g-area]"))) {
        state.area = Math.max(1, Math.min(20000, state.area + (+el.getAttribute("data-g-area")))); draw(); return;
      }
      if (target.closest("[data-g-next]")) { remember(); state.gstep = Math.min(5, state.gstep + 1); draw(); window.scrollTo(0, 0); return; }
      if (target.closest("[data-g-back]")) {
        if (trail.length) $("back").click(); else setView("home");
        return;
      }
      if (target.closest("[data-g-restart]")) { remember(); state.gstep = 0; draw(); window.scrollTo(0, 0); }
    };
    $("guide").oninput = function (event) {
      var id = event.target.id;
      if (id === "g-alloc") { state.allocation = event.target.value / 100; draw(); }
      else if (id === "g-salty") { state.salty = event.target.checked; draw(); }
      else if (id === "g-area") {
        var value = parseFloat(event.target.value);
        if (value > 0) { state.area = Math.min(value, 20000); draw(); }
      }
    };
    $("h-map").onclick = function (event) {
      var mark = event.target.closest("[data-zone]"), province = event.target.closest("[data-province]");
      if (mark) zoomToZone($("h-map"), +mark.getAttribute("data-zone"));
      else if (province) zoomToZone($("h-map"), nearestZoneToMapPoint(event));
    };
    ["z-canvas", "g-canvas"].forEach(function (id) {
      var stage = $(id);
      stage.onpointerdown = function (event) {
        scene.pointer = { x: event.clientX, angle: scene.angle };
        scene.dragged = true;
        stage.setPointerCapture(event.pointerId);
      };
      stage.onpointermove = function (event) {
        if (!scene.pointer) return;
        scene.angle = scene.pointer.angle + (event.clientX - scene.pointer.x) * 0.008;
        if (reduceMotion) drawScene(performance.now());
      };
      stage.onpointerup = stage.onpointercancel = function () { scene.pointer = null; };
    });
    $("detail").onclick = function (event) {
      var tab = event.target.getAttribute("data-tab");
      if (tab) { state.whyTab = tab; draw(); }
    };
    $("start").onclick = function () {
      state.gstep = 0;
      state.guideWithScene = false;
      draw();
      setView("guide");
    };
    $("rice-banned").onchange = function () { state.riceAllowed = !this.checked; state.selected = null; draw(); };
    $("salty").onchange = function () { state.salty = this.checked; draw(); };
    $("cards").onclick = function (event) {
      var card = event.target.closest(".card");
      if (card) { state.selected = card.getAttribute("data-key"); draw(); }
    };
  }

  window.onbeforeprint = function () { document.body.classList.add("sheet-mode"); };
  window.onafterprint = function () { document.body.classList.remove("sheet-mode"); };

  // Show one section of the app and hide the others.
  // Remember the screen that is being left (also tells the browser, so its Back button works).
  function remember() {
    trail.push({ view: state.view, gstep: state.gstep });
    try { history.pushState({ step: trail.length }, ""); browserSteps += 1; } catch (e) { /* not allowed on some file:// pages */ }
    $("back").hidden = false;
  }
  // Return to the screen that was open before the last click.
  function goBack() {
    var previous = trail.pop();
    $("back").hidden = !trail.length;
    if (!previous) return;
    state.gstep = previous.gstep;
    draw();
    setView(previous.view, false, true);
  }
  function setView(view, keepScroll, returning) {
    if (VIEWS.indexOf(view) < 0) view = "home";
    if (ready && !returning && view !== state.view) remember();
    state.view = view;
    document.body.setAttribute("data-view", view);
    document.querySelectorAll("[data-view]").forEach(function (el) {
      if (el !== document.body) el.hidden = el.getAttribute("data-view").split(" ").indexOf(view) < 0;
    });
    document.querySelectorAll("[data-go]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-go") === view);
    });
    try { history.replaceState(null, "", "#" + view); } catch (e) { /* not allowed on some file:// pages */ }
    if (!keepScroll) window.scrollTo(0, 0);
    if (view === "zone" || (view === "guide" && state.guideWithScene && state.gstep > 0)) startScene(); else stopScene();
  }
  document.addEventListener("click", function (event) {
    var go = event.target.closest("[data-go]");
    if (go) { event.preventDefault(); setView(go.getAttribute("data-go")); }
  });
  window.addEventListener("hashchange", function () { setView(location.hash.slice(1), true); });
  window.addEventListener("resize", function () { if (sceneVisible()) startScene(); });
  // The Back button of the page, and the one of the browser or the phone, do the same thing.
  $("back").onclick = function () {
    if (browserSteps > 0) history.back(); else goBack();
  };
  window.addEventListener("popstate", function () {
    if (browserSteps > 0) { browserSteps -= 1; goBack(); }
  });

  // Installable app: keep a copy of the page on the device so it opens without internet.
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js");
  }
  var installEvent = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installEvent = event;
    $("install").hidden = false;
  });
  $("install").onclick = function () {
    if (installEvent) installEvent.prompt();
    installEvent = null;
    $("install").hidden = true;
  };

  drawStatic();
  initJourney();
  listen();
  draw();
  setView(location.hash.slice(1) || "home", true);
  ready = true;
})();
