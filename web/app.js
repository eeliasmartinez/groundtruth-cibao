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
    lang: "en", // the global judging is in English; the ES button switches to Spanish
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
    gstep: 0, // question of the guided walkthrough (GUIDE_STEPS.length = the result)
    farmPlaced: false,
    guideWithScene: false,
    easyMode: false,
    myCrops: [], // directory ids the farmer says they grow or have
    savedOnDevice: false,
    storageError: false,
    journeyBeat: 1
  };

  var STRATEGY_ORDER = ["current", "mixed", "rotation", "green"];
  var ZONE_NAMES = D.zones.map(function (z) { return z.name; });
  var storedPlan = window.GTStorage.load(ZONE_NAMES, STRATEGY_ORDER);
  if (storedPlan.plan) {
    // Every visit opens in English (global judging); a saved plan keeps everything else.
    Object.keys(storedPlan.plan).forEach(function (key) { if (key !== "lang") state[key] = storedPlan.plan[key]; });
    state.savedOnDevice = true;
    state.formDone = true;
  }
  state.storageError = storedPlan.error;
  // Every screen the person leaves is remembered here so "Back" can return to it.
  var trail = [];
  var ready = false; // becomes true once the first screen is on
  var browserSteps = 0; // how many of those screens the browser's own Back button knows about
  var ahead = []; // screens left with Back, so the browser's Forward button can return to them

  // Schematic map of the northern Dominican Republic. Points are [longitude, latitude],
  // placed by hand from general geographic knowledge: good for orientation, not surveyed.
  var MAP = { w: 760, h: 546, lon0: -72.1, lat0: 20.05, k: 206, cos: 0.947 };
  var NAV_VIEWS = ["home", "plan", "rotation", "options", "map", "data", "help"];
  // crops opens from Home, outside the main farm-planning tabs
  var VIEWS = NAV_VIEWS.concat(["guide", "zone", "crops", "world", "country", "region", "wquiz", "wplan", "wrot", "wmap"]);
  var WORLD_VIEWS = ["world", "country", "region", "wquiz", "wplan", "wrot", "wmap"];
  var worldMode = false; // the last screens were the whole-world version
  var selectedLocalCrop = "cacao";
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
  // crops outside the rotation engine share one plain leaf
  var LEAF_ICON = '<path d="M5 19C5 11 10 5 19 5c0 9-6 14-14 14z"/><path d="M5 19l8-8"/>';
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
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[crop] || LEAF_ICON) + "</svg>";
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
    ["ONE, Boletín de Estadísticas Agropecuarias enero–diciembre 2025 (cacao y otros rubros)", "https://www.one.gob.do/media/njpkonqj/bolet%C3%ADn-estad%C3%ADstico-agropecuario-enero-diciembre-2025.pdf"],
    ["Province boundaries: geoBoundaries ADM1, Dominican Republic, represented 2022 (public domain)", "https://www.geoboundaries.org/api/current/gbOpen/DOM/ADM1/"],
    ["FAO Irrigation and Drainage Paper 56: Crop evapotranspiration (Allen et al., 1998)", "https://www.fao.org/4/x0490e/x0490e00.htm"],
    ["FAO-56 chapter 6, Tables 11 and 12: crop stage lengths and Kc used by the water calculator", "https://www.fao.org/4/x0490e/x0490e0b.htm"],
    ["World prototype globe: NASA Blue Marble shaded relief and bathymetry, via NASA GIBS", "https://gibs.earthdata.nasa.gov"],
    ["World prototype climate: NASA POWER climatology API, monthly 2001-2025", "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/"],
    ["World prototype countries: Natural Earth 1:110m (public domain)", "https://www.naturalearthdata.com/"],
    ["World prototype relief: Terrain Tiles on AWS Open Data (mostly NASA SRTM)", "https://registry.opendata.aws/terrain-tiles/"],
    ["World prototype rivers: Natural Earth 1:10m rivers and lake centerlines (public domain)", "https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/"],
    ["World prototype provinces: geoBoundaries ADM1 (open licences)", "https://www.geoboundaries.org/"],
    ["World prototype crops: FAOSTAT Crops and livestock products, area harvested (CC BY 4.0)", "https://www.fao.org/faostat/en/#data/QCL"],
    ["FAO Irrigation Water Management Training Manual No. 3: Irrigation water needs (1986)", "https://www.fao.org/4/s2022e/s2022e00.htm"],
    ["FAO Irrigation and Drainage Paper 29: Water quality for agriculture (Ayers & Westcot, 1985)", "https://www.fao.org/4/t0234e/t0234e00.htm"],
    ["elDinero, 25 Mar 2026: La región Norte concentra el 91.5% de la producción nacional de arroz", "https://eldinero.com.do/359496/la-region-norte-concentra-el-91-5-de-la-produccion-nacional-de-arroz/"],
    ["UNCCD, 23 Aug 2024: Dominican Republic: restoring land to secure clean water for millions", "https://www.unccd.int/news-stories/stories/dominican-republic-restoring-land-secure-clean-water-millions"],
    ["El Caribe, 15 Sep 2019: INDRHI confirma prohibición de siembra de arroz de invierno", "https://www.elcaribe.com.do/2019/09/15/director-del-indrhi-confirma-prohibicion-siembra-de-arroz-de-invierno-en-provincias-del-cibao-central-y-linea-noroeste-por-sequia/"],
    ["Diario Libre, 11 Aug 2026: condiciones de las presas y ríos (INDRHI)", "https://www.diariolibre.com/planeta/clima/2026/08/11/45--menos-lluvias-estas-son-las-condiciones-de-las-presas-y-rios/3625695"],
    ["Montecristi 24 Horas, 28 Aug 2026: Racionan el agua para la agricultura por falta de lluvias", "https://montecristi24horas.com/2026/08/racionan-el-agua-para-la-agricultura-por-falta-de-lluvias/"],
    ["Presidencia de la República Dominicana: INDRHI informa sobre volúmenes en el sistema nacional de presas", "https://presidencia.gob.do/noticias/indrhi-informa-sobre-volumenes-en-sistema-nacional-de-presas"],
    ["Map rivers: © OpenStreetMap contributors (ODbL)", "https://www.openstreetmap.org/copyright"],
    ["Map coastline: Natural Earth (public domain)", "https://www.naturalearthdata.com/"],
    ["Typefaces: Big Shoulders Display and Archivo (SIL Open Font License), via Fontsource", "https://fontsource.org/"],
    ["Satellite photo: NASA Worldview Snapshots, MODIS Terra corrected reflectance, 18 Feb 2026", "https://wvs.earthdata.nasa.gov/"],
    ["Elevation: Terrain Tiles on AWS Open Data (Mapzen), derived mainly from NASA SRTM", "https://registry.opendata.aws/terrain-tiles/"],
    ["Named peak elevations: Instituto Geográfico Nacional GNSS survey (2021)", "https://ign.gob.do/medicion-por-sistema-global-de-navegacion-por-satelite-gnss-de-los-tres-picos-mas-altos-de-las-antillas/"],
    ["Mountain names and reference coordinates: GeoNames / NGA gazetteer", "https://www.geonames.org/advanced-search.html?country=DO&featureClass=T"],
    ["Regional mountain heights and hydrography: Instituto Geográfico Nacional", "https://ign.gob.do/wp-content/uploads/2024/11/RECURSOS-HIDROGRAFICOS-SUPERFICIALESDE-REP.-DOM-digital-op_compressed.pdf"],
    ["Soil by feel: USDA NRCS, Guide to Texture by Feel (S. J. Thien, 1979)", "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/guide-to-texture-by-feel"]
  ];

  // ------------------------------------------------------------------
  // Every sentence on the page, in both languages
  // ------------------------------------------------------------------
  var T = window.GT_COPY.T;
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
    if (D.crops[key]) return D.crops[key][state.lang];
    return D.other_crops[key] ? D.other_crops[key][state.lang] : key;
  }
  function lower(text) {
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
  function role(crop) {
    if (crop === "rice") return "rice";
    if (crop === "sesbania") return "green";
    return isLegume(crop) ? "legume" : "cash";
  }
  function zone() { return D.zones[state.zone]; }
  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function strategyName(s) {
    if (s.key === "mine") {
      if (!s.plots.length) return tr("name_mine_none");
      if (s.variant === "own" || s.plots.length === 1) return tr("name_mine_one", { crop: lower(cropName(s.plots[0].crop)) });
      if (s.variant === "mix") return tr("name_mine_mix", { a: cropName(s.plots[0].crop), b: lower(cropName(s.plots[1].crop)) });
      return tr("name_mine_keep");
    }
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
      state.riceAllowed, state.salty, engineCrops());
  }
  // The farmer's marked crops that the rotation engine knows (red, black and white beans are one profile).
  function engineCrops() {
    var keys = [];
    (window.GT_LOCAL_CROPS || []).forEach(function (crop) {
      if (crop.modelKey && state.myCrops.indexOf(crop.id) >= 0 && keys.indexOf(crop.modelKey) < 0) keys.push(crop.modelKey);
    });
    return keys;
  }
  // The farmer's own crops that have a water calculation, split into those that fit one
  // irrigation cycle (LONG_CYCLE days or less) and the long ones (plantain, cassava...).
  function myWaterCrops() {
    var short = [], long = [];
    (window.GT_LOCAL_CROPS || []).forEach(function (crop) {
      var key = cropWaterKey(crop);
      if (!key || state.myCrops.indexOf(crop.id) < 0 || short.indexOf(key) >= 0 || long.indexOf(key) >= 0) return;
      if (key === "rice" && !state.riceAllowed) return;
      if (key === "sesbania") return;
      (waterCropDays(key) <= LONG_CYCLE ? short : long).push(key);
    });
    return { short: short, long: long };
  }
  // A plan made only of the farmer's crops, with the same fields as an engine plan so
  // every screen can draw it. Water is the typical year, as in the engine.
  function minePlan(variant, plots, budget) {
    var c = D.constants, planted = 0, water = 0, waterDry = 0, nitrogen = 0;
    plots = plots.filter(function (p) { return p.tareas > 0.005; }).map(function (p) {
      var w = cropWater(p.crop);
      planted += p.tareas; water += w[0] * p.tareas; waterDry += w[1] * p.tareas;
      if (D.crops[p.crop]) nitrogen += D.crops[p.crop].nitrogen * p.tareas / c.tareas_per_hectare;
      return { crop: p.crop, tareas: p.tareas, water_m3: w[0] * p.tareas };
    });
    var warnings = [];
    if (state.area - planted > 0.005) warnings.push("idle_land");
    if (waterDry > budget * 1.02) warnings.push("short_in_dry_year");
    return {
      key: "mine", variant: variant, alternative: null, plots: plots,
      idle_tareas: Math.max(0, state.area - planted), water_m3: water, water_dry_m3: waterDry,
      saved_m3: budget - water, saved_share: budget ? Math.max(0, 1 - water / budget) : 0,
      nitrogen_kg: nitrogen, urea_sacks: nitrogen / c.urea_nitrogen / c.urea_sack_kg,
      scores: { water: 0, soil: 0, income: 0, overall: 0 }, warnings: warnings, long: []
    };
  }
  function farmerPlans() {
    var mine = myWaterCrops(), A = state.area, budget = waterBudget();
    var w = {};
    mine.short.forEach(function (k) { w[k] = cropWater(k)[0]; });
    function scaled(keys) {
      var need = keys.reduce(function (sum, k) { return sum + w[k] * A / keys.length; }, 0);
      var f = need > budget ? budget / need : 1;
      return keys.map(function (k) { return { crop: k, tareas: f * A / keys.length }; });
    }
    var plans = [];
    if (mine.short.length) {
      var byNeed = mine.short.slice().sort(function (a, b) { return w[a] - w[b]; });
      var thrifty = byNeed[0], thirsty = byNeed[byNeed.length - 1];
      // keep: the land split evenly between their crops, less land if the water is short
      plans.push(minePlan("keep", scaled(mine.short), budget));
      // own: all the land in their crop that asks for the least water
      plans.push(minePlan("own", [{ crop: thrifty, tareas: Math.min(A, budget / w[thrifty]) }], budget));
      // mix: the whole farm planted, with as much of their thirstiest crop as the water allows
      if (thirsty !== thrifty && A * w[thrifty] <= budget) {
        var x = Math.min(A, (budget - A * w[thrifty]) / (w[thirsty] - w[thrifty]));
        plans.push(minePlan("mix", [{ crop: thirsty, tareas: x }, { crop: thrifty, tareas: A - x }], budget));
      }
    } else {
      plans.push(minePlan("long", [], budget));
    }
    plans.forEach(function (p) { p.long = mine.long; });
    return plans;
  }
  function plantedLand(s) { return state.area - s.idle_tareas; }
  // Main plan: only crops the farmer grows. The engine's plans count when all their crops
  // are the farmer's (they carry the rotation and nitrogen rules); otherwise, or when one
  // of the farmer-only splits plants more land, that split. More land first, then more of
  // their crops kept, then less water. Plans with other crops stay as secondary options.
  function mainPlan(result) {
    if (!state.myCrops.length) return result.ranked[0];
    var short = myWaterCrops().short;
    var plans = farmerPlans();
    // the engine plans assume rice land (rice comes back in cycle 2), so only for rice farmers
    var engine = growsRice() && result.ranked.filter(function (s) {
      return s.plots.length && s.plots.every(function (p) { return short.indexOf(p.crop) >= 0; });
    })[0];
    // land within 5% of the farm counts as a tie, so a few tareas never drop one of their crops
    var tie = 0.05 * state.area;
    function landGap(a, b) { var d = plantedLand(b) - plantedLand(a); return Math.abs(d) <= tie ? 0 : d; }
    plans.sort(function (a, b) {
      return landGap(a, b) || b.plots.length - a.plots.length || plantedLand(b) - plantedLand(a) || a.water_m3 - b.water_m3;
    });
    var best = plans[0];
    if (engine && plantedLand(engine) >= plantedLand(best) - 0.05) {
      engine.long = best.long;
      return engine;
    }
    return best;
  }

  // ------------------------------------------------------------------
  // Drawing
  // ------------------------------------------------------------------
  function drawStatic() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-t]").forEach(function (el) {
      el.textContent = tr(el.getAttribute("data-t"));
    });
    document.querySelectorAll("[data-t-label]").forEach(function (el) {
      el.setAttribute("aria-label", tr(el.getAttribute("data-t-label")));
    });
    document.querySelectorAll("[data-t-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", tr(el.getAttribute("data-t-placeholder")));
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
    updateLocks();

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
    drawCropDirectory();
    setJourneyBeat(state.journeyBeat);
  }

  function cropNumber(value) {
    return new Intl.NumberFormat(state.lang === "es" ? "es-DO" : "en-US", { maximumFractionDigits: 1 }).format(value);
  }

  function drawCropDirectory() {
    var L = T[state.lang], rows = window.GT_LOCAL_CROPS || [];
    var query = ($("crop-search").value || "").toLocaleLowerCase();
    var groupSelect = $("crop-group"), modelSelect = $("crop-model");
    var group = groupSelect.value || "all", model = modelSelect.value || "all";
    groupSelect.innerHTML = "<option value=\"all\">" + esc(L.crop_groups.all) + "</option>" +
      Object.keys(L.crop_groups).filter(function (key) { return key !== "all"; }).map(function (key) {
        return "<option value=\"" + key + "\">" + esc(L.crop_groups[key]) + "</option>";
      }).join("");
    modelSelect.innerHTML = "<option value=\"all\">" + esc(L.crop_models.all) + "</option>" +
      "<option value=\"modeled\">" + esc(L.crop_models.modeled) + "</option>" +
      "<option value=\"water\">" + esc(L.crop_models.water) + "</option>" +
      "<option value=\"pending\">" + esc(L.crop_models.pending) + "</option>";
    groupSelect.value = group;
    modelSelect.value = model;
    var filtered = rows.filter(function (crop) {
      var name = crop[state.lang] || crop.es;
      var searchMatch = !query || (name + " " + crop.es + " " + crop.en).toLocaleLowerCase().indexOf(query) >= 0;
      return searchMatch && (group === "all" || crop.group === group) &&
        (model === "all" || cropStatus(crop) === model);
    });
    if (!filtered.some(function (crop) { return crop.id === selectedLocalCrop; }) && filtered.length)
      selectedLocalCrop = filtered[0].id;
    $("crop-total").textContent = rows.length;
    $("crop-result-count").textContent = L.crop_results.replace("{n}", filtered.length);
    // Counts come from the directory itself, so they always add up.
    var withWater = rows.filter(function (crop) { return cropWaterKey(crop); }).length;
    var inEngine = rows.filter(function (crop) { return crop.modelKey; }).length;
    $("crop-overview").innerHTML = [[rows.length, L.crop_ov_total], [withWater, L.crop_ov_water],
      [inEngine, L.crop_ov_engine], [waterCropKeys().length, L.crop_ov_profiles]].map(function (item) {
      return "<div><b>" + item[0] + "</b><span>" + esc(item[1]) + "</span></div>";
    }).join("");
    $("crop-list").innerHTML = filtered.length ? filtered.map(function (crop) {
      var name = crop[state.lang] || crop.es;
      var metric = crop.production == null ? L.crop_no_stat : cropNumber(crop.production) + " " + L.crop_tonnes;
      return "<button type=\"button\" class=\"crop-row" + (crop.id === selectedLocalCrop ? " selected" : "") +
        "\" data-crop-id=\"" + crop.id + "\"><span class=\"crop-row-main\"><b>" + esc(name) +
        "</b><small>" + esc(L.crop_groups[crop.group]) + "</small></span><span class=\"crop-row-stat\">" +
        esc(metric) + "</span><span class=\"crop-row-mark\" aria-hidden=\"true\">" + ({ modeled: "●", water: "◐", pending: "○" })[cropStatus(crop)] + "</span></button>";
    }).join("") : "<p class=\"crop-empty\">" + esc(L.crop_empty) + "</p>";
    renderCropProfile(rows.filter(function (crop) { return crop.id === selectedLocalCrop; })[0]);
    drawCropWater();
  }

  // ---------------- Water calculator for every crop with an FAO-56 profile ----------------
  // Rotation-engine crops use the engine's own needs (rice depends on the soil); the other
  // crops use crops_fao.py through build_web.py. Values are m3 per tarea [typical, dry year].
  function cropStatus(crop) { return crop.modelKey ? "modeled" : (crop.water ? "water" : "pending"); }
  function cropWaterKey(crop) { return crop.modelKey || crop.water || null; }
  function waterCropKeys() { return Object.keys(D.crops).concat(Object.keys(D.other_crops)); }
  function waterCropName(key) { return D.crops[key] ? cropName(key) : D.other_crops[key][state.lang]; }
  function waterCropDays(key) {
    return D.crops[key] ? D.crops[key].stages.reduce(function (a, b) { return a + b; }, 0) : D.other_crops[key].days;
  }
  function cropWater(key, month) {
    month = month || state.month;
    if (D.crops[key]) {
      var n = D.needs[zone().name + "|" + state.soil + "|" + month][key];
      return [n.typical_m3, n.dry_m3];
    }
    var other = D.other_needs[zone().name + "|" + month];
    return other && other[key];
  }
  // The allocation is a share of the farm's usual need: rice for a rice farmer (as the
  // engine assumes); otherwise the average of the farmer's own crops, land split evenly.
  function usualNeedPerTarea(month) {
    if (growsRice()) return cropWater("rice", month)[0];
    var keys = (window.GT_LOCAL_CROPS || []).filter(function (crop) {
      return state.myCrops.indexOf(crop.id) >= 0 && cropWaterKey(crop);
    }).map(cropWaterKey);
    // long-cycle crops (plantain, cassava) keep their own land and are not part of one cycle
    var short = keys.filter(function (k) { return waterCropDays(k) <= LONG_CYCLE; });
    if (short.length) keys = short;
    if (!keys.length) return cropWater("rice", month)[0];
    return keys.reduce(function (sum, k) { return sum + cropWater(k, month)[0]; }, 0) / keys.length;
  }
  function waterBudget() {
    return state.allocation * usualNeedPerTarea() * state.area;
  }
  // ---------------- "My crops" and the two recommendations ----------------
  // Both rank crops by water only, the one measure every crop here shares: first the land
  // the allocated water covers in a dry year, then the lower need per tarea. Crops whose
  // cycle is longer than LONG_CYCLE days are left out of the ranking, because the
  // allocation is announced for one irrigation cycle. Sesbania is a green manure that is
  // not harvested, so it is not offered as "the best crop to plant".
  var LONG_CYCLE = 180;
  function waterFit(key) {
    var w = cropWater(key), budget = waterBudget();
    var cover = w[1] > 0 ? Math.min(state.area, budget / w[1]) : state.area;
    return { key: key, typical: w[0], dry: w[1], cover: cover, days: waterCropDays(key),
      spare: Math.max(0, budget - w[1] * state.area) };
  }
  function byWater(a, b) { return b.cover - a.cover || a.dry - b.dry; }
  function rankable(key) { return key !== "sesbania" && waterCropDays(key) <= LONG_CYCLE; }
  function isLegume(key) {
    return D.legumes.indexOf(key) >= 0 || ["green_bean", "peanut", "soybean"].indexOf(key) >= 0;
  }
  function fitLine(f) {
    if (f.days > LONG_CYCLE) return tr("rec_long", { n: f.days });
    return f.cover >= state.area
      ? tr("rec_whole", { m3: num(f.dry), spare: num(f.spare) })
      : tr("rec_part", { n: tareasText(Math.floor(f.cover * 10) / 10), area: tareasText(state.area), m3: num(f.dry) });
  }
  function drawMyCrops() {
    var L = T[state.lang], rows = window.GT_LOCAL_CROPS || [];
    var groups = Object.keys(L.crop_groups).filter(function (g) { return g !== "all"; });
    $("cw-chips").innerHTML = groups.map(function (g) {
      var inGroup = rows.filter(function (crop) { return crop.group === g; });
      if (!inGroup.length) return "";
      return "<div class=\"cw-chip-group\"><span>" + esc(L.crop_groups[g]) + "</span>" + inGroup.map(function (crop) {
        var on = state.myCrops.indexOf(crop.id) >= 0;
        return "<button type=\"button\" class=\"cw-chip" + (on ? " on" : "") + (cropWaterKey(crop) ? "" : " nocalc") +
          "\" data-my-crop=\"" + crop.id + "\" aria-pressed=\"" + on + "\">" + esc(crop[state.lang] || crop.es) + "</button>";
      }).join("") + "</div>";
    }).join("");
  }
  function recItem(f, label, best) {
    return "<li" + (best ? " class=\"best\"" : "") + "><b>" + esc(label) + "</b>" +
      (isLegume(f.key) ? "<em>" + esc(T[state.lang].rec_legume) + "</em>" : "") + "<span>" + esc(fitLine(f)) + "</span></li>";
  }
  function drawRecommendations() { $("cw-rec").innerHTML = recommendationsHtml(); }
  function recommendationsHtml() {
    var L = T[state.lang], rows = window.GT_LOCAL_CROPS || [];
    var all = waterCropKeys().filter(rankable).map(waterFit).sort(byWater);
    var top = all.slice(0, 3);
    var globalHtml = "<div class=\"cw-rec-box\"><h4>" + esc(L.rec_all_title) + "</h4><p class=\"help\">" +
      esc(tr("rec_all_help", { n: all.length })) + "</p><ol>" + top.map(function (f, i) {
        return recItem(f, waterCropName(f.key), i === 0);
      }).join("") + "</ol></div>";
    var mine = rows.filter(function (crop) { return state.myCrops.indexOf(crop.id) >= 0; });
    var mineHtml = "<div class=\"cw-rec-box mine\"><h4>" + esc(L.rec_mine_title) + "</h4>";
    if (!mine.length) {
      mineHtml += "<p class=\"help\">" + esc(L.rec_mine_empty) + "</p>";
    } else {
      var fits = [], noCalc = [];
      mine.forEach(function (crop) {
        var key = cropWaterKey(crop);
        if (!key) { noCalc.push(crop[state.lang] || crop.es); return; }
        var f = waterFit(key); f.label = crop[state.lang] || crop.es; fits.push(f);
      });
      var ranked = fits.filter(function (f) { return rankable(f.key); }).sort(byWater);
      var long = fits.filter(function (f) { return !rankable(f.key); });
      var best = ranked[0];
      mineHtml += best ? "<p class=\"cw-rec-lead\">" + esc(tr("rec_mine_best", { crop: best.label })) + "</p>" : "";
      mineHtml += "<ol>" + ranked.concat(long).map(function (f) { return recItem(f, f.label, f === best); }).join("") + "</ol>";
      if (noCalc.length) mineHtml += "<p class=\"help\">" + esc(tr("rec_nocalc", { list: noCalc.join(", ") })) + "</p>";
      var g = all[0];
      if (best && g && g.key !== best.key && (g.cover > best.cover || g.dry < best.dry)) {
        mineHtml += "<p class=\"cw-rec-compare\">" + esc(g.cover > best.cover
          ? tr("rec_compare_cover", { other: waterCropName(g.key), n: tareasText(Math.floor(g.cover * 10) / 10), crop: best.label, m: tareasText(Math.floor(best.cover * 10) / 10) })
          : tr("rec_compare_less", { other: waterCropName(g.key), pct: Math.round(100 * (1 - g.dry / best.dry)), crop: best.label })) + "</p>";
      }
    }
    mineHtml += "</div>";
    return mineHtml + globalHtml + "<p class=\"note cw-rec-note\">" + esc(L.rec_note) + "</p>";
  }

  function drawCropWater() {
    var L = T[state.lang];
    if (!$("cw-zone")) return;
    drawMyCrops();
    drawRecommendations();
    if (!$("cw-zone").options.length || $("cw-zone").getAttribute("data-lang") !== state.lang) {
      $("cw-zone").innerHTML = D.zones.map(function (z, i) { return "<option value=\"" + i + "\">" + esc(z.name) + "</option>"; }).join("");
      $("cw-month").innerHTML = MONTHS[state.lang].map(function (m, i) { return "<option value=\"" + (i + 1) + "\">" + esc(m) + "</option>"; }).join("");
      $("cw-soil").innerHTML = ["clay", "loam", "sandy"].map(function (s) { return "<option value=\"" + s + "\">" + esc(L.soils[s]) + "</option>"; }).join("");
      $("cw-zone").setAttribute("data-lang", state.lang);
    }
    $("cw-zone").value = state.zone; $("cw-month").value = state.month; $("cw-soil").value = state.soil;
    if (document.activeElement !== $("cw-area")) $("cw-area").value = state.area;
    $("cw-alloc").value = Math.round(state.allocation * 100);
    $("cw-alloc-out").textContent = Math.round(state.allocation * 100) + "%";
    var budget = waterBudget();
    $("cw-budget").textContent = tr(growsRice() ? "cw_budget" : "cw_budget_mine", { m3: num(budget), pct: Math.round(state.allocation * 100), area: tareasText(state.area) });
    var rows = waterCropKeys().map(function (key) {
      var w = cropWater(key);
      return { key: key, typical: w[0], dry: w[1], fits: w[1] > 0 ? budget / w[1] : Infinity };
    }).sort(function (a, b) { return a.dry - b.dry; });
    var most = Math.max.apply(null, rows.map(function (r) { return r.dry; }));
    var linked = {};
    (window.GT_LOCAL_CROPS || []).forEach(function (crop) { var k = cropWaterKey(crop); if (k && !linked[k]) linked[k] = crop.id; });
    $("cw-table").innerHTML = "<div class=\"cw-head\"><span>" + esc(L.cw_crop) + "</span><span>" + esc(L.cw_typical) +
      "</span><span>" + esc(L.cw_dry) + "</span><span>" + esc(L.cw_fits) + "</span></div>" + rows.map(function (r) {
      var whole = r.fits >= state.area;
      var fitsText = whole ? L.cw_all : tareasText(Math.floor(r.fits * 10) / 10);
      return "<button type=\"button\" class=\"cw-row" + (whole ? " whole" : "") + "\"" + (linked[r.key] ? " data-crop-id=\"" + linked[r.key] + "\"" : "") +
        "><span class=\"cw-name\"><b>" + esc(waterCropName(r.key)) + "</b><small>" + tr("cw_days", { n: waterCropDays(r.key) }) + "</small>" +
        "<i style=\"width:" + Math.max(2, 100 * r.dry / most).toFixed(1) + "%\"></i></span><span>" + num(r.typical) + "</span><span>" + num(r.dry) +
        "</span><span class=\"cw-fit\">" + esc(fitsText) + "</span></button>";
    }).join("");
  }

  function renderCropProfile(crop) {
    if (!crop) { $("crop-profile").innerHTML = ""; return; }
    var L = T[state.lang], name = crop[state.lang] || crop.es;
    var stat = crop.production == null ? "" : "<div class=\"crop-stat\"><b>" + cropNumber(crop.production) +
      "</b><span>" + esc(L.crop_tonnes_2025) + "</span></div>";
    var exportLine = crop.exportShare == null ? "" : "<p class=\"crop-export\">" +
      esc(L.crop_export_share.replace("{n}", cropNumber(crop.exportShare))) + "</p>";
    if (crop.exportTonnes != null) exportLine += "<p class=\"crop-export\"><b>" + esc(L.crop_export_volume) + "</b> " +
      cropNumber(crop.exportTonnes) + " t · USD " + cropNumber(crop.exportUsdM) + " M (2025)</p>";
    var modelCopy = crop.modelKey ? L.crop_modelled_detail : (crop.water ? L.crop_water_detail : L.crop_pending_detail);
    var waterKey = cropWaterKey(crop), waterLine = "";
    if (waterKey) {
      var w = cropWater(waterKey);
      waterLine = "<div class=\"crop-stat\"><b>" + num(w[0]) + " m³</b><span>" + esc(tr("crop_water_line", {
        zone: zone().name, month: lower(MONTHS[state.lang][state.month - 1]), dry: num(w[1]), days: waterCropDays(waterKey) })) + "</span></div>";
      if (D.other_crops[waterKey]) waterLine += "<p class=\"crop-export\">" + esc(L.crop_water_source) + " " + esc(D.other_crops[waterKey].row) + "</p>";
    }
    $("crop-profile").innerHTML = "<p class=\"crop-profile-kicker\">" + esc(L.crop_profile_kicker) + "</p>" +
      "<h3>" + esc(name) + "</h3><p class=\"crop-profile-group\">" + esc(L.crop_groups[crop.group]) + "</p>" +
      stat + exportLine + waterLine + "<div class=\"crop-model-note " + (waterKey ? "available" : "pending") + "\"><b>" +
      esc(L.crop_models[cropStatus(crop)]) + "</b><p>" + esc(modelCopy) + "</p></div>" +
      "<a href=\"https://www.one.gob.do/media/njpkonqj/bolet%C3%ADn-estad%C3%ADstico-agropecuario-enero-diciembre-2025.pdf\" target=\"_blank\" rel=\"noopener\">" +
      esc(L.crop_open_source) + "</a>";
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
    var best = mainPlan(result);
    var byKey = {};
    result.strategies.forEach(function (s) { byKey[s.key] = s; });
    var selected = byKey[state.selected] || best;

    prepareGuide();
    $("zone").value = state.zone;
    $("farm-settings-values").textContent = zone().name + " · " + MONTHS[state.lang][state.month - 1] +
      " · " + tareasText(state.area) + " " + T[state.lang].tareas + " · " + T[state.lang].soils[state.soil] +
      " · " + Math.round(state.allocation * 100) + "%";
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
    drawStorageStatus();
    if (state.view === "crops") drawCropDirectory();
    if (window.GTWorld) window.GTWorld.render(state.view);
  }

  function drawStorageStatus() {
    if (state.savedOnDevice && !window.GTStorage.save(state, ZONE_NAMES, STRATEGY_ORDER)) {
      state.savedOnDevice = false;
      state.storageError = true;
    }
    var button = $("save-local-plan"), note = $("local-save-note"), L = T[state.lang];
    if (button) button.textContent = state.savedOnDevice ? L.delete_local : L.save_local;
    if (!note) return;
    note.hidden = !state.savedOnDevice && !state.storageError;
    note.textContent = state.savedOnDevice ? L.saved_local : state.storageError ? L.storage_error : "";
  }

  function drawHeadline(result, best) {
    var longNote = best.long && best.long.length ? " " + esc(tr("mine_long", {
      list: best.long.map(function (k) { return lower(cropName(k)); }).join(", "), n: LONG_CYCLE
    })) : "";
    if (best.key === "mine" && !best.plots.length) {
      $("headline").innerHTML = esc(tr("headline_mine_none", { n: LONG_CYCLE })) + longNote;
      return;
    }
    if (!best.plots.length) {
      $("headline").innerHTML = tr("headline_none", { rain: Math.round(result.needs.rice.rain_share * 100) });
      return;
    }
    $("headline").innerHTML = tr(state.myCrops.length ? "headline_mine" : "headline", {
      alloc: Math.round(state.allocation * 100), name: esc(strategyName(best)), mix: esc(mixText(best))
    }) + longNote;
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
      if (!D.crops[p.crop]) return;
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
    if ((s.key === "current" || (s.key === "mine" && s.plots.length === 1 && s.plots[0].crop === "rice")) && s.plots.length) risks.push(R.mono);
    if (s.plots.some(function (p) { return !D.crops[p.crop]; })) risks.push(R.not_checked);
    risks.push(R.always);
    return risks;
  }

  function drawDetail(s, result) {
    var L = T[state.lang];
    stopVoice();
    var alt = s.alternative ? cropName(s.alternative) : "";
    var hasRice = s.plots.some(function (p) { return p.crop === "rice"; });
    var whyKey = s.key === "mixed" && !hasRice ? "mixed_banned" : s.key;
    if (s.key === "mine" && !L.why_text.mine) whyKey = "current";

    var evidence = [tr("ev_rice", {
      m3: num(result.needs.rice.typical_m3), zone: zone().name, month: MONTHS[state.lang][state.month - 1]
    })];
    if (s.alternative) {
      evidence.push(tr("ev_alt", {
        alt: alt, m3: num(result.needs[s.alternative].typical_m3),
        ratio: num(result.needs.rice.typical_m3 / result.needs[s.alternative].typical_m3, 1)
      }));
    }
    if (s.key === "mine") s.plots.forEach(function (p) {
      if (p.crop !== "rice") evidence.push(tr("ev_crop", { crop: cropName(p.crop), m3: num(cropWater(p.crop)[0]) }));
    });
    evidence.push(tr("ev_rain", { rain: Math.round(result.needs.rice.rain_share * 100) }));
    evidence.push(tr("ev_use", { used: num(s.water_m3), budget: num(s.key === "mine" ? waterBudget() : result.budget_m3) }));
    if (s.plots.length) evidence.push(tr("ev_dry", { dry: num(s.water_dry_m3) }));

    var benefits = [];
    if (s.key === "mine" && s.plots.length) {
      benefits.push(L.ben_own);
      if (s.idle_tareas <= 0.005) benefits.push(L.ben_full);
      if (s.saved_share > 0.01) benefits.push(tr("ben_saved", { saved: Math.round(s.saved_share * 100) }));
      if (s.urea_sacks >= 0.5) benefits.push(tr("ben_nitrogen", { n: num(s.urea_sacks) }));
    }
    if (hasRice && s.key === "current") { benefits.push(L.ben_market); benefits.push(L.ben_same); }
    if (s.key !== "current" && s.key !== "mine" && s.plots.length) {
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
      "<a class=\"btn primary action-share\" target=\"_blank\" rel=\"noopener\" href=\"https://wa.me/?text=" +
      encodeURIComponent(plan) + "\">" + L.share_wa + "</a>" +
      "<div class=\"action-tools\"><button type=\"button\" class=\"btn\" id=\"copy-plan\">" + L.share_copy + "</button>" +
      (window.speechSynthesis ? "<button type=\"button\" class=\"btn\" id=\"listen-plan\">" + L.listen + "</button>" : "") +
      "<button type=\"button\" class=\"btn\" id=\"print-plan\">" + L.print + "</button>" +
      "<button type=\"button\" class=\"btn\" id=\"save-local-plan\">" + (state.savedOnDevice ? L.delete_local : L.save_local) + "</button></div>";
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
    $("save-local-plan").onclick = function () {
      if (state.savedOnDevice) {
        state.storageError = !window.GTStorage.clear();
        state.savedOnDevice = false;
      } else {
        state.savedOnDevice = window.GTStorage.save(state, ZONE_NAMES, STRATEGY_ORDER);
        state.storageError = !state.savedOnDevice;
      }
      draw();
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

  // Which rice zone to open when a province (not a zone dot) is tapped. Zones that lie
  // inside the province come first; if it has none, the nearest one is used and the
  // page says so, so nobody reads another province's climate as their own.
  function insideRings(lon, lat, rings) {
    var inside = false;
    rings.forEach(function (ring) {
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var a = ring[i], b = ring[j];
        if ((a[1] > lat) !== (b[1] > lat) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
    });
    return inside;
  }
  function zoneFromProvince(event) {
    var svg = event.target.closest("svg") || event.currentTarget.querySelector("svg");
    var line = event.target.closest("[data-province]");
    var province = line && (window.GT_PROVINCES || [])[+line.getAttribute("data-province")];
    if (!svg) return state.zone;
    var rect = svg.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width * MAP.w;
    var y = (event.clientY - rect.top) / rect.height * MAP.h;
    var lon = x / (MAP.cos * MAP.k) + MAP.lon0, lat = MAP.lat0 - y / MAP.k;
    var own = D.zones.map(function (z, index) { return index; }).filter(function (index) {
      return province && insideRings(D.zones[index].lon, D.zones[index].lat, province.rings);
    });
    var choices = own.length ? own : D.zones.map(function (z, index) { return index; });
    var best = choices[0], distance = Infinity;
    choices.forEach(function (index) {
      var z = D.zones[index];
      var dx = (z.lon - lon) * 111.3 * Math.cos(lat * Math.PI / 180), dy = (z.lat - lat) * 110.6;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < distance) { distance = d; best = index; }
    });
    state.pickNote = province && !own.length
      ? { zone: best, province: province.name, km: Math.max(5, Math.round(distance / 5) * 5) } : null;
    return best;
  }
  function pickNoteText() {
    var note = state.pickNote;
    if (!note || note.zone !== state.zone) return "";
    return tr("province_nearest", { province: note.province, zone: zone().name, km: note.km });
  }

  var mapKey = "";
  function drawMap() {
    // The four map copies only show the zone, the layer and the language, so the
    // sliders and other answers do not need to rebuild them.
    var key = state.zone + "|" + state.layer + "|" + state.lang;
    if (key === mapKey && $("map").firstChild && (!$("g-map") || $("g-map").firstChild)) return;
    mapKey = key;
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

  // The walkthrough's questions, in order; the step after the last one is the result.
  var GUIDE_STEPS = ["zone", "crops", "month", "soil", "water", "priority"];
  var RESULT_STEP = GUIDE_STEPS.length;
  function stepKind(step) { return step < RESULT_STEP ? GUIDE_STEPS[step] : "result"; }
  function growsRice() { return !state.myCrops.length || state.myCrops.indexOf("rice") >= 0; }

  // Builds the screen of the current question (only when the question changes,
  // so its entrance animation plays once and typing is never interrupted).
  function prepareGuide() {
    var L = T[state.lang], step = state.gstep, stage = $("g-stage");
    var questions = state.easyMode ? L.easy_g_q : L.g_q;
    var explanations = state.easyMode ? L.easy_g_sub : L.g_sub;
    var kind = stepKind(step);
    var tag = step + "|" + state.lang + "|" + (state.easyMode ? "easy" : "full") + "|" + (kind === "result" ? growsRice() : "");
    // Once a province/zone is chosen, keep its relief beside every guide step.
    // At step 0 the map remains available on the question panel while the 3D
    // relief appears alongside it.
    var showZoneScene = state.guideWithScene;
    $("g-scene-panel").hidden = !showZoneScene;
    $("guide").classList.toggle("with-scene", showZoneScene);
    if (stage.getAttribute("data-step") === tag) return;
    var body;
    if (kind === "zone") {
      body = "<div id=\"g-map\" class=\"g-map\"></div><p class=\"g-pick\">" + L.g_zone + " <b id=\"g-zone\"></b></p>" +
        "<p class=\"note g-pick-note\" id=\"g-pick-note\" aria-live=\"polite\" hidden></p>";
    } else if (kind === "crops") {
      var groups = Object.keys(L.crop_groups).filter(function (g) { return g !== "all"; });
      body = "<div class=\"cw-chips g-crops\">" + groups.map(function (g) {
        var inGroup = (window.GT_LOCAL_CROPS || []).filter(function (crop) { return crop.group === g; });
        if (!inGroup.length) return "";
        return "<div class=\"cw-chip-group\"><span>" + esc(L.crop_groups[g]) + "</span>" + inGroup.map(function (crop) {
          return "<button type=\"button\" class=\"cw-chip" + (cropWaterKey(crop) ? "" : " nocalc") + "\" data-g-crop=\"" + crop.id + "\">" +
            esc(crop[state.lang] || crop.es) + "</button>";
        }).join("") + "</div>";
      }).join("") + "</div><p class=\"help\">" + esc(L.g_crops_hint) + "</p>";
    } else if (kind === "month") {
      body = "<p class=\"g-label\">" + L.g_month + "</p><div class=\"g-months\">" + MONTHS_SHORT[state.lang].map(function (m, i) {
        return "<button type=\"button\" data-g-month=\"" + (i + 1) + "\">" + m + "</button>";
      }).join("") + "</div><p class=\"help\" id=\"g-month-help\"></p><p class=\"g-label\">" + L.g_area + "</p>" +
        "<div class=\"g-area\"><button type=\"button\" data-g-area=\"-10\" aria-label=\"-10\">−</button>" +
        "<input id=\"g-area\" type=\"number\" min=\"1\" max=\"20000\" inputmode=\"decimal\">" +
        "<button type=\"button\" data-g-area=\"10\" aria-label=\"+10\">+</button></div>";
    } else if (kind === "soil") {
      body = "<div class=\"g-options\">" + ["clay", "loam", "sandy"].map(function (key) {
        return "<button type=\"button\" class=\"g-option\" data-g-soil=\"" + key + "\">" + SOIL_ART[key] + "<b>" + L.soils[key] + "</b></button>";
      }).join("") + "</div><p class=\"help\" id=\"g-soil-help\"></p>" +
        "<label class=\"check\"><input id=\"g-salty\" type=\"checkbox\"><span>" + L.salty + "</span></label>" +
        "<details class=\"more\"><summary>" + L.g_soil_link + "</summary>" + soilGuide() + "</details>";
    } else if (kind === "water") {
      body = "<div class=\"g-water\"><div class=\"g-tank\" aria-hidden=\"true\"><div class=\"g-level\" id=\"g-level\">" +
        "<svg class=\"g-wave\" viewBox=\"0 0 240 16\" preserveAspectRatio=\"none\"><path d=\"M0 8c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0v8H0z\"/></svg></div>" +
        "<b id=\"g-pct\"></b></div><div class=\"g-water-side\"><input id=\"g-alloc\" type=\"range\" min=\"0\" max=\"100\" step=\"5\" aria-label=\"" + esc(L.allocation) + "\">" +
        "<div class=\"light\" id=\"g-light\"></div><p class=\"help\" id=\"g-water-help\"></p><p class=\"g-fit\" id=\"g-fit\"></p></div></div>";
    } else if (kind === "priority") {
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
        "<button type=\"button\" class=\"btn\" data-g-restart>" + L.g_restart + "</button></div></div></div>" +
        "<div class=\"g-mine-extra\" id=\"g-mine-extra\"></div>";
    }
    stage.innerHTML = "<h2 class=\"g-q\">" + (step < RESULT_STEP ? questions[step] : L.g_result) + "</h2><p class=\"g-sub\" id=\"g-sub\">" +
      (step < RESULT_STEP ? esc(explanations[step]) : "") + "</p><div class=\"g-body\">" + body + "</div>";
    stage.setAttribute("data-step", tag);
    if (step === RESULT_STEP) { wipe(); setTimeout(function () { countUp(stage); }, 0); }
    if (step === RESULT_STEP && !state.formDone) { state.formDone = true; updateLocks(); }
    $("guide").setAttribute("data-step", step);
  }

  // Fills the current screen with the farmer's answers and their consequences.
  function updateGuide(result, best, byKey) {
    var L = T[state.lang], step = state.gstep, kind = stepKind(step);
    $("g-count").textContent = step < RESULT_STEP ? tr("g_step", { n: step + 1 }) : L.g_done;
    $("g-bar").style.width = (100 * Math.min(step + 1, RESULT_STEP + 1) / (RESULT_STEP + 1)) + "%";
    var back = document.querySelector("[data-g-back]"), next = document.querySelector("[data-g-next]");
    back.textContent = L.g_back;
    next.textContent = step === RESULT_STEP - 1 ? L.g_see : L.g_next;
    next.hidden = step >= RESULT_STEP;
    next.disabled = kind === "crops" && !state.myCrops.length;
    function mark(selector, attribute, value) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.classList.toggle("on", el.getAttribute(attribute) === String(value));
      });
    }
    if (kind === "zone") {
      $("g-zone").textContent = zone().name;
      $("g-pick-note").textContent = pickNoteText();
      $("g-pick-note").hidden = !pickNoteText();
    } else if (kind === "crops") {
      document.querySelectorAll("[data-g-crop]").forEach(function (el) {
        var on = state.myCrops.indexOf(el.getAttribute("data-g-crop")) >= 0;
        el.classList.toggle("on", on); el.setAttribute("aria-pressed", String(on));
      });
    } else if (kind === "month") {
      mark("[data-g-month]", "data-g-month", state.month);
      $("g-month-help").textContent = $("month-help").textContent;
      if (document.activeElement !== $("g-area")) $("g-area").value = state.area;
    } else if (kind === "soil") {
      mark("[data-g-soil]", "data-g-soil", state.soil);
      $("g-soil-help").textContent = L.soil_help[state.soil];
      $("g-salty").checked = state.salty;
    } else if (kind === "water") {
      $("g-level").style.height = (100 * state.allocation) + "%";
      $("g-pct").textContent = Math.round(state.allocation * 100) + "%";
      $("g-alloc").value = Math.round(state.allocation * 100);
      $("g-water-help").textContent = L.water_help[waterStatus()];
      var rice = byKey.current.plots.length ? byKey.current.plots[0].tareas : 0;
      $("g-fit").textContent = !growsRice()
        ? tr("g_fit_mine", { n: tareasText(Math.min(1, state.allocation) * state.area), area: tareasText(state.area) })
        : state.riceAllowed ? tr("g_fit", { n: tareasText(rice), area: tareasText(state.area) }) : L.g_fit_ban;
    } else if (kind === "priority") {
      mark("[data-g-priority]", "data-g-priority", state.priority);
    } else {
      $("g-sub").innerHTML = $("headline").innerHTML;
      paintCells($("g-parcel").children, best, true);
      $("g-mix").innerHTML = $("plan-mix").innerHTML;
      $("g-impact").innerHTML = $("impact").innerHTML;
      $("g-mine-extra").innerHTML = state.myCrops.length ? "<p class=\"note\">" + esc(L.g_mine_note) + "</p><div class=\"cw-rec\">" + recommendationsHtml() + "</div>" : "";
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
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if (motionQuery) {
    var updateMotionPreference = function (event) {
      reduceMotion = event.matches;
      if (sceneVisible()) startScene();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", updateMotionPreference);
    else if (motionQuery.addListener) motionQuery.addListener(updateMotionPreference);
  }
  var scene = { frame: 0, start: 0, angle: -0.35, dragged: false, pointer: null, model: null, zone: -1, damIcon: new Image() };
  scene.damIcon.src = "dam.svg";
  scene.damIcon.onload = function () { if (sceneVisible()) drawScene(performance.now()); };

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
    var peaks = (window.GT_PEAKS || []).filter(function (peak) { return inside(peak.lon, peak.lat); }).map(function (peak) {
      var spot = place(peak.lon, peak.lat, 22); spot.name = peak.name; return spot;
    });
    var dams = window.GT_GEO.dams.filter(function (dam) { return inside(dam.lon, dam.lat); }).map(function (dam) {
      var spot = place(dam.lon, dam.lat, 30); spot.name = dam.name; return spot;
    });
    var zones = [];
    D.zones.forEach(function (other, n) {
      if (!inside(other.lon, other.lat)) return;
      var spot = place(other.lon, other.lat, 30); spot.name = shortName(other.name); spot.mine = n === index; zones.push(spot);
    });
    return { points: points, quads: quads, provinceLines: provinceLines, rivers: rivers, peaks: peaks, dams: dams, zones: zones, riverNames: names,
      highest: highest, widthKm: 2 * WINDOW.lon * kmLon };
  }

  function visibleSceneCanvas() {
    return state.view === "guide" && state.guideWithScene ? $("g-canvas") : $("z-canvas");
  }
  function sceneVisible() {
    return state.view === "zone" || (state.view === "guide" && state.guideWithScene);
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

    function label(text, x, y, bold) {
      ctx.font = (bold ? "800 " : "700 ") + Math.round((bold ? 15 : 12) * ratio) + "px Archivo, sans-serif";
      ctx.lineWidth = 3.5 * ratio; ctx.strokeStyle = "#fff"; ctx.strokeText(text, x, y);
      ctx.fillStyle = "#10131a"; ctx.fillText(text, x, y);
    }
    // Spread the four neighboring Sierra peaks apart so their labels do not stack.
    var peakOffsets = [[12,-12],[14,16],[-14,-14],[-14,17],[18,0]];
    var peakLabelOffsets = {
      "Pico Duarte": [36,-34], "La Pelona": [-112,-30],
      "La Rucilla": [38,30], "Pico del Yaque": [-128,30]
    };
    m.peaks.forEach(function (peak, i) {
      var q = project(peak), offset = peakLabelOffsets[peak.name] || peakOffsets[i % peakOffsets.length], dx = offset[0] * ratio, dy = offset[1] * ratio;
      ctx.beginPath(); ctx.arc(q[0], q[1], 3.2 * ratio, 0, Math.PI * 2);
      ctx.fillStyle = "#e2231a"; ctx.fill(); ctx.lineWidth = 1.5 * ratio; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + dx * .65, q[1] + dy * .65);
      ctx.strokeStyle = "rgba(16,19,26,.72)"; ctx.lineWidth = 1 * ratio; ctx.stroke();
      label(peak.name, q[0] + dx, q[1] + dy, false);
    });
    m.dams.forEach(function (dam) {
      var q = project(dam), size = 23 * ratio;
      if (scene.damIcon && scene.damIcon.complete && scene.damIcon.naturalWidth) {
        ctx.drawImage(scene.damIcon, q[0] - size / 2, q[1] - size / 2, size, size);
      } else {
        var r = 5.5 * ratio;
        ctx.beginPath(); ctx.moveTo(q[0], q[1] - r); ctx.lineTo(q[0] + r, q[1]); ctx.lineTo(q[0], q[1] + r); ctx.lineTo(q[0] - r, q[1]); ctx.closePath();
        ctx.fillStyle = "#10131a"; ctx.fill(); ctx.lineWidth = 1.5 * ratio; ctx.strokeStyle = "#fff"; ctx.stroke();
      }
      label(dam.name, q[0] + 13 * ratio, q[1] + 4 * ratio);
    });
    m.zones.forEach(function (spot) {
      var q = project(spot), pole = (spot.mine ? 34 : 0) * ratio * grow, r = (spot.mine ? 8 : 5) * ratio;
      if (pole) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - pole); ctx.lineWidth = 2.5 * ratio; ctx.strokeStyle = "#10131a"; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(q[0], q[1] - pole, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#e2231a"; ctx.fill(); ctx.lineWidth = 2 * ratio; ctx.strokeStyle = spot.mine ? "#10131a" : "#fff"; ctx.stroke();
      var farmHere = spot.mine && (state.farmPlaced || (state.view === "guide" && state.guideWithScene));
      // With the farm drawn on the pin, the name moves past the field (22 px each side) so nothing covers it.
      var nameX = q[0] + (farmHere ? 27 * ratio : r + 5 * ratio);
      if (!farmHere) label(spot.name, nameX, q[1] - pole + 4 * ratio, spot.mine);
      if (farmHere) {
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
        // Above the roof, so it never sits on top of the zone's name (drawn to the right of the pin).
        ctx.save(); ctx.textAlign = "center"; label(state.lang === "es" ? "FINCA" : "FARM", fx, fy - 29 * ratio, true); ctx.restore();
        label(spot.name, nameX, q[1] - pole + 4 * ratio, true); // drawn last, on top of the farm
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
    function open() { if (svg) svg.classList.remove("zooming"); draw(); setView("zone"); }
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
    $("z-pick-note").textContent = pickNoteText();
    $("z-pick-note").hidden = !pickNoteText();
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
    var mineStory = null;
    var lots = s.plots.map(function (p) {
      var next = p.crop === "rice" ? (s.key === "mixed" && s.alternative ? s.alternative : "rice") : "rice";
      return { tareas: p.tareas, first: p.crop, second: next };
    });
    if (s.key === "mine") {
      // Only the farmer's crops: after a cereal or vegetable, their legume that asks for the
      // least water; after a legume, back to their own crop; with no legume, their crops trade places.
      var own = myWaterCrops().short;
      var legumes = own.filter(isLegume).sort(function (a, b) { return cropWater(a, month2)[0] - cropWater(b, month2)[0]; });
      var others = own.filter(function (k) { return !isLegume(k); });
      lots.forEach(function (lot, i) {
        if (!isLegume(lot.first) && legumes.length) { lot.second = legumes[0]; mineStory = mineStory || "legume"; }
        else if (isLegume(lot.first) && others.length) { lot.second = others[0]; mineStory = mineStory || "legume"; }
        else if (own.length > 1) { lot.second = own[(own.indexOf(lot.first) + 1) % own.length]; mineStory = mineStory || "swap"; }
        else lot.second = lot.first;
      });
      if (!mineStory) mineStory = "same";
    }
    function cropDays(crop, needs) { return needs[crop] ? needs[crop].days : waterCropDays(crop); }
    if (s.idle_tareas > 0.005) lots.push({ tareas: s.idle_tareas, first: null, second: null });

    function bar(crop, startDay, needs) {
      if (!crop) {
        return "<div class=\"cal-bar idle\" style=\"left:" + (100 * startDay / 365) + "%;width:" + (100 * 120 / 365) + "%\">" + tr("idle") + "</div>";
      }
      return "<div class=\"cal-bar " + role(crop) + "\" style=\"left:" + (100 * startDay / 365) + "%;width:" +
        (100 * cropDays(crop, needs) / 365) + "%\" title=\"" + esc(cropName(crop)) + " · " + cropDays(crop, needs) + " d\">" +
        cropIcon(crop) + "<span>" + esc(cropName(crop)) + "</span></div>";
    }
    var months = "";
    for (var k = 0; k < 12; k++) months += "<span>" + MONTHS_SHORT[state.lang][(state.month - 1 + k) % 12] + "</span>";
    var rows = lots.map(function (lot, i) {
      return "<div class=\"cal-row\"><div class=\"cal-name\">" + tr("rot_lot", { n: String.fromCharCode(65 + i), tareas: tareasText(lot.tareas) }) +
        "</div><div class=\"cal-track\">" + bar(lot.first, 14, result.needs) + bar(lot.second, 14 + 183, needs2) + "</div></div>";
    }).join("");

    var water2 = 0;
    lots.forEach(function (lot) { if (lot.second) water2 += lot.tareas * cropWater(lot.second, month2)[0]; });
    var budget2 = s.key === "mine" ? state.allocation * usualNeedPerTarea(month2) * state.area
      : state.allocation * needs2.rice.typical_m3 * state.area;
    var alt = s.alternative ? lower(cropName(s.alternative)) : "";
    var story;
    if (s.key === "mine" && !s.plots.length) story = tr("headline_mine_none", { n: LONG_CYCLE });
    else if (!s.plots.length) story = T[state.lang].say_none;
    else if (s.key === "mine") story = tr("rot_mine_" + mineStory, {
      list: lots.filter(function (l) { return l.first; }).map(function (l) {
        return lower(cropName(l.first)) + " → " + lower(cropName(l.second));
      }).join(", ")
    });
    else if (s.key === "current") story = L.rot_none;
    else if (s.key === "mixed" && hasRice) story = tr("rot_swap", { alt: alt, n: num(s.urea_sacks) });
    else story = s.urea_sacks >= 0.5 ? tr("rot_back_n", { alt: alt, n: num(s.urea_sacks) }) : tr("rot_back", { alt: alt });

    $("rotation").innerHTML =
      "<div class=\"cal\"><div class=\"cal-row cal-head\"><div class=\"cal-name\"></div><div class=\"cal-months\">" + months + "</div></div>" +
      "<div class=\"cal-row cal-cycles\"><div class=\"cal-name\"></div><div class=\"cal-track\">" +
      "<b style=\"left:" + (100 * 14 / 365) + "%\">" + tr("rot_cycle", { n: 1, month: MONTHS[state.lang][state.month - 1] }) + "</b>" +
      "<b style=\"left:" + (100 * 197 / 365) + "%\">" + tr("rot_cycle", { n: 2, month: MONTHS[state.lang][month2 - 1] }) + "</b></div></div>" +
      rows + "</div>" +
      "<p class=\"cal-explainer\"><span class=\"cal-key\" aria-hidden=\"true\"></span>" + esc(L.rot_idle_explain) + "</p>" +
      "<p class=\"rot-story\">" + esc(story) + "</p>" +
      "<div class=\"impact rot-water\"><div><b>" + num(s.water_m3) + "</b><span>" +
      esc(tr("rot_water", { c: 1, used: num(s.water_m3), budget: num(s.key === "mine" ? waterBudget() : result.budget_m3) })) + "</span></div><div><b>" +
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
      "<i><u style=\"width:" + Math.round(state.allocation * 100) + "%\"></u></i><small>" + esc(L.field_water_target) + "</small></div>" +
      "<div class=\"data-origin\"><span><b>NASA</b> " + esc(L.origin_nasa) + "</span>" +
      "<span><b>" + esc(L.origin_user_label) + "</b> " + esc(L.origin_user) + "</span>" +
      "<span><b>" + esc(L.origin_map_label) + "</b> " + esc(L.origin_map) + "</span></div>";
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
      tile(num(Math.max(0, s.saved_m3)), s.key === "mine" ? L.impact_water_mine : L.impact_water) +
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
        "<div class=\"scene-context-area\"><b>" + esc(L.field_area) + "</b><span>" + tareasText(state.area) + " " + esc(tr("tareas")) + "</span></div>" +
        "<div class=\"scene-context-extra\"><b>" + esc(L.field_nasa_context) + "</b>" +
        "<div><span>" + esc(L.field_et0) + "</span><strong>" + num(climate.et0[monthIndex]) + " mm/mes</strong></div>" +
        "<div><span>" + esc(L.field_root_wetness) + "</span><strong>" + num(climate.soil[monthIndex]) + "%</strong></div>" +
        "<div><span>" + esc(L.field_surface_wetness) + "</span><strong>" + num(climate.soil_surface[monthIndex]) + "%</strong></div>" +
        "<div><span>" + esc(L.field_humidity) + "</span><strong>" + num(climate.humidity[monthIndex]) + "%</strong></div>" +
        "<div><span>" + esc(L.field_wind) + "</span><strong>" + num(climate.wind[monthIndex], 1) + " m/s</strong></div>" +
        "<small>" + esc(L.field_nasa_note) + "</small></div>";
    });
  }

  // ------------------------------------------------------------------
  // Reacting to the farmer
  // ------------------------------------------------------------------
  function listen() {
    $("crop-search").oninput = drawCropDirectory;
    $("cw-zone").onchange = function () { state.zone = +this.value; state.farmPlaced = false; state.pickNote = null; draw(); };
    $("cw-month").onchange = function () { state.month = +this.value; draw(); };
    $("cw-soil").onchange = function () { state.soil = this.value; draw(); };
    $("cw-area").oninput = function () { var v = parseFloat(this.value); if (v > 0) { state.area = Math.min(v, 20000); draw(); } };
    $("cw-alloc").oninput = function () { state.allocation = this.value / 100; draw(); };
    $("cw-chips").onclick = function (event) {
      var chip = event.target.closest("[data-my-crop]");
      if (!chip) return;
      var id = chip.getAttribute("data-my-crop"), at = state.myCrops.indexOf(id);
      if (at >= 0) state.myCrops.splice(at, 1); else state.myCrops.push(id);
      draw();
    };
    $("cw-table").onclick = function (event) {
      var row = event.target.closest("[data-crop-id]");
      if (!row) return;
      selectedLocalCrop = row.getAttribute("data-crop-id");
      $("crop-search").value = ""; $("crop-group").value = "all"; $("crop-model").value = "all";
      drawCropDirectory();
      $("crop-profile").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };
    $("crop-group").onchange = drawCropDirectory;
    $("crop-model").onchange = drawCropDirectory;
    $("crop-list").onclick = function (event) {
      var row = event.target.closest("[data-crop-id]");
      if (!row) return;
      selectedLocalCrop = row.getAttribute("data-crop-id");
      drawCropDirectory();
    };
    $("crop-overview").onclick = function (event) {
      var groupButton = event.target.closest("[data-crop-group]");
      if (groupButton) { $("crop-group").value = groupButton.getAttribute("data-crop-group"); drawCropDirectory(); }
    };
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
      if (!mark && province && event.type !== "keydown") mark = { getAttribute: function () { return zoneFromProvince(event); } };
      if (!mark || (event.type === "keydown" && event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (mark.nodeType) state.pickNote = null;
      zoomToZone(event.currentTarget, +mark.getAttribute("data-zone"));
    }
    $("map").onclick = exploreZone;
    $("map").onkeydown = exploreZone;
    $("h-map").onkeydown = exploreZone;
    $("z-plan").onclick = function () {
      if (!state.myCrops.length) state.myCrops = ["rice"];
      state.farmPlaced = true;
      state.guideWithScene = true;
      state.gstep = 1;
      draw();
      setView("guide");
    };
    $("guide").onclick = function (event) {
      var target = event.target, el;
      if ((el = target.closest("[data-province]"))) {
        state.zone = zoneFromProvince(event); state.farmPlaced = false; state.guideWithScene = true;
        draw(); startScene(); return;
      }
      if ((el = target.closest("[data-zone]"))) {
        state.zone = +el.getAttribute("data-zone"); state.guideWithScene = true; state.pickNote = null;
        draw(); startScene(); return;
      }
      if ((el = target.closest("[data-g-crop]"))) {
        var cropId = el.getAttribute("data-g-crop"), at = state.myCrops.indexOf(cropId);
        if (at >= 0) state.myCrops.splice(at, 1); else state.myCrops.push(cropId);
        draw(); return;
      }
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
      if (target.closest("[data-g-next]")) {
        if (stepKind(state.gstep) === "crops" && !state.myCrops.length) return;
        remember(); state.gstep = Math.min(RESULT_STEP, state.gstep + 1); draw();
        if (state.guideWithScene) startScene();
        window.scrollTo(0, 0); return;
      }
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
      if (mark) { state.pickNote = null; zoomToZone($("h-map"), +mark.getAttribute("data-zone")); }
      else if (province) zoomToZone($("h-map"), zoneFromProvince(event));
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
      if (!state.myCrops.length) state.myCrops = ["rice"];
      state.easyMode = false;
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

  // What the world prototype (world.js) needs from this page: open a screen through the
  // same history as everything else, and the current language and month names.
  window.GTApp = {
    go: function (view) { setView(view); },
    lang: function () { return state.lang; },
    months: function () { return MONTHS[state.lang]; },
    monthsShort: function () { return MONTHS_SHORT[state.lang]; },
    icon: function (crop) { return ICONS[crop] ? cropIcon(crop) : null; },
    locks: function () { updateLocks(); }
  };

  window.onbeforeprint = function () { document.body.classList.add("sheet-mode"); };
  window.onafterprint = function () { document.body.classList.remove("sheet-mode"); };

  // Show one section of the app and hide the others.
  // Remember the screen that is being left (also tells the browser, so its Back button works).
  function remember() {
    trail.push({ view: state.view, gstep: state.gstep });
    ahead = [];
    try {
      // A #link typed in the address bar already made its own browser step: label it instead of adding one.
      if (typedLink) history.replaceState({ step: trail.length }, ""); else history.pushState({ step: trail.length }, "");
      browserSteps += 1;
    } catch (e) { /* not allowed on some file:// pages */ }
    $("back").hidden = false;
  }
  // Return to the screen that was open before the last click.
  function goBack() {
    var previous = trail.pop();
    $("back").hidden = !trail.length;
    if (!previous) return;
    ahead.push({ view: state.view, gstep: state.gstep });
    state.gstep = previous.gstep;
    draw();
    setView(previous.view, false, true);
  }
  // The sections of a new screen rise in, their lists one after another (CSS: .view-in).
  // The class is taken off afterwards so later redraws (typing, sliders) do not replay it.
  var entranceTimer = 0;
  // Big numbers count up from zero when they first appear (plain numbers only, like 31,558).
  function countUp(root) {
    if (reduceMotion || !root) return;
    root.querySelectorAll(".impact b").forEach(function (el) {
      var text = el.textContent.trim();
      if (!/^[\d.,]+$/.test(text)) return;
      var target = parseFloat(text.replace(/,/g, "")), decimals = (text.split(".")[1] || "").length;
      if (!(target > 0)) return;
      var start = performance.now(), fmt = new Intl.NumberFormat(state.lang === "es" ? "es-DO" : "en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      (function step(now) {
        var t = Math.min(1, (now - start) / 700), e = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt.format(target * e);
        if (t < 1) requestAnimationFrame(step); else el.textContent = text;
      })(start);
    });
  }
  window.GTCountUp = countUp;
  // Rotation and Options look switched off until the farm questions are answered.
  function updateLocks() {
    var locked = worldMode ? !(window.GTWorld && window.GTWorld.planReady()) : !state.formDone;
    document.querySelectorAll("#nav [data-go], #tabbar [data-go]").forEach(function (b) {
      var go = b.getAttribute("data-go"), off = locked && (go === "rotation" || go === "options");
      b.classList.toggle("locked", off);
      if (off) { b.setAttribute("aria-disabled", "true"); b.title = tr("nav_locked"); }
      else { b.removeAttribute("aria-disabled"); b.removeAttribute("title"); }
    });
  }
  window.GTWipe = function () { wipe(); };
  // A blue band with a red edge sweeps off the screen and uncovers the new one, like a print plate.
  function wipe() {
    if (reduceMotion) return;
    var band = $("wipe");
    if (!band) { band = document.createElement("div"); band.id = "wipe"; band.setAttribute("aria-hidden", "true"); document.body.appendChild(band); }
    band.classList.remove("run"); void band.offsetWidth; band.classList.add("run");
    clearTimeout(wipe.timer); // never leave the curtain over the page, even if animations pause
    wipe.timer = setTimeout(function () { band.classList.remove("run"); }, 700);
  }
  // The blue "Plan B" curtain plays only when a plan is revealed, not on every screen change.
  function playEntrance() {
    if (reduceMotion) return;
    // only the outermost visible blocks of the screen, so nothing moves twice
    var shown = [].filter.call(document.querySelectorAll("[data-view]:not(body)"), function (el) {
      return !el.hidden && !(el.parentElement && el.parentElement.closest("[data-view]:not(body)"));
    });
    shown.forEach(function (el) { el.classList.remove("view-in"); void el.offsetWidth; el.classList.add("view-in"); });
    shown.forEach(countUp);
    clearTimeout(entranceTimer);
    entranceTimer = setTimeout(function () { shown.forEach(function (el) { el.classList.remove("view-in"); }); }, 1100);
  }

  // Open again the screen that was left with Back (browser or phone Forward button).
  function goForward() {
    var next = ahead.pop();
    if (!next) return;
    trail.push({ view: state.view, gstep: state.gstep });
    $("back").hidden = false;
    state.gstep = next.gstep;
    draw();
    setView(next.view, false, true);
  }
  function setView(view, keepScroll, returning) {
    if (VIEWS.indexOf(view) < 0) view = "home";
    // In the world version, Map shows the chosen country with the same layers as the Dominican map.
    if (WORLD_VIEWS.indexOf(view) >= 0) worldMode = true;
    else if (["home", "guide", "zone"].indexOf(view) >= 0) worldMode = false;
    if (view === "map" && worldMode) view = "wmap";
    // Rotation and Options open only after the questionnaire. In the world version they show
    // the world plan's rotation and plans.
    if ((view === "rotation" || view === "options") && worldMode) {
      var W = window.GTWorld;
      view = W && W.planReady() ? (view === "rotation" ? "wrot" : "wplan") : W && W.country() ? "country" : "world";
    } else if ((view === "rotation" || view === "options") && !state.formDone) {
      view = "guide";
    }
    if (ready && !returning && view !== state.view) remember();
    var changed = ready && view !== state.view;
    state.view = view;
    if (view === "crops") drawCropDirectory();
    document.querySelectorAll("[data-mode]").forEach(function (b) {
      var world = WORLD_VIEWS.indexOf(view) >= 0;
      b.classList.toggle("on", (b.getAttribute("data-mode") === "world") === world);
      b.setAttribute("aria-pressed", String((b.getAttribute("data-mode") === "world") === world));
    });
    document.body.setAttribute("data-view", view);
    var farmSettings = $("farm-settings");
    if (farmSettings) farmSettings.open = view === "plan";
    document.querySelectorAll("[data-view]").forEach(function (el) {
      if (el !== document.body) el.hidden = el.getAttribute("data-view").split(" ").indexOf(view) < 0;
    });
    document.querySelectorAll("[data-go]").forEach(function (b) {
      var go = b.getAttribute("data-go");
      b.classList.toggle("on", go === view || (view === "wmap" && go === "map") || (view === "wrot" && go === "rotation") || (view === "wplan" && go === "options"));
    });
    if (changed) playEntrance();
    try { history.replaceState(history.state || { step: 0 }, "", "#" + view); } catch (e) { /* not allowed on some file:// pages */ }
    if (!keepScroll) window.scrollTo(0, 0);
    if (sceneVisible()) startScene(); else stopScene();
    if (window.GTWorld) window.GTWorld.show(view);
    updateLocks();
  }
  document.addEventListener("click", function (event) {
    var go = event.target.closest("[data-go]");
    if (go) { event.preventDefault(); setView(go.getAttribute("data-go")); }
  });
  var typedLink = false;
  window.addEventListener("hashchange", function () {
    typedLink = !history.state;
    setView(location.hash.slice(1), true);
    typedLink = false;
  });
  window.addEventListener("resize", function () { if (sceneVisible()) startScene(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopScene();
    else if (sceneVisible()) startScene();
  });
  // The Back button of the page, and the one of the browser or the phone, do the same thing.
  $("back").onclick = function () {
    if (browserSteps > 0) history.back(); else goBack();
  };
  // Each saved browser step carries its position, so Back and Forward can be told apart.
  window.addEventListener("popstate", function (event) {
    // A #link typed in the address bar has no step: the hashchange listener opens it.
    if (!event.state || typeof event.state.step !== "number") return;
    var step = event.state.step;
    while (step < trail.length) { browserSteps = Math.max(0, browserSteps - 1); goBack(); }
    while (step > trail.length && ahead.length) { browserSteps += 1; goForward(); }
  });

  // Installable app: keep a copy of the page on the device so it opens without internet.
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    // When a newer version takes over, reload once so the page shown is the new one.
    var hadController = !!navigator.serviceWorker.controller, reloadedForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (hadController && !reloadedForUpdate) { reloadedForUpdate = true; location.reload(); }
    });
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
