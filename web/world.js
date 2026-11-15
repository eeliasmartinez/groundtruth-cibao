// World prototype: a turning globe (NASA Blue Marble with shaded relief), each
// country's provinces (geoBoundaries, fetched when opened) and, for a province,
// NASA POWER monthly climate (fetched when opened) with FAO-56 irrigation needs.
// Water is worked out from the 2001-2025 monthly averages, so it is an average
// year only; the Dominican pages use daily data and also give a dry year.
// Code written with the assistance of Claude Code (Anthropic).
(function () {
  "use strict";
  var W = window.GT_WORLD, D = window.GT_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var MID_DOY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
  // Flooded rice extras, same values as crops.py (FAO Training Manual No. 3).
  var RICE_SATURATION_MM = 200, RICE_LAYER_MM = 100, PERCOLATION = { clay: 4, loam: 6, sandy: 8 };
  var LONG_CYCLE = 180;

  var st = {
    country: null, provinces: null, provinceStatus: "", province: null,
    climate: null, climateStatus: "", month: (new Date().getMonth() + 1) % 12 + 1, soil: "loam",
    lon0: -40, lat0: 12, hover: null, picked: null,
    // the farmer's questionnaire (same five questions as the Dominican walkthrough)
    quizMode: false, qstep: 0, current: null, area: 1, pct: 0.6, priority: "water"
  };
  var cache = { provinces: {}, climate: {} };

  function lang() { return window.GTApp ? window.GTApp.lang() : "es"; }
  function L() { return window.GT_COPY.T[lang()]; }
  function tr(key, vars) {
    var text = L()[key] || key;
    return vars ? text.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; }) : text;
  }
  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; });
  }
  function num(value, digits) {
    return new Intl.NumberFormat(lang() === "es" ? "es-DO" : "en-US", { maximumFractionDigits: digits || 0 }).format(value);
  }
  function countryName(c) { return c[lang()] || c.es; }

  // ------------------------------------------------------------------ geometry
  W.countries.forEach(function (c) {
    var box = [180, 90, -180, -90];
    c.rings.forEach(function (ring) {
      ring.forEach(function (p) {
        box[0] = Math.min(box[0], p[0]); box[1] = Math.min(box[1], p[1]);
        box[2] = Math.max(box[2], p[0]); box[3] = Math.max(box[3], p[1]);
      });
    });
    c.box = box;
  });
  function inRing(lon, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var a = ring[i], b = ring[j];
      if ((a[1] > lat) !== (b[1] > lat) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function countryAt(lon, lat) {
    for (var n = 0; n < W.countries.length; n++) {
      var c = W.countries[n], b = c.box;
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      for (var r = 0; r < c.rings.length; r++) if (inRing(lon, lat, c.rings[r])) return c;
    }
    return null;
  }
  // Centre of the largest ring (area-weighted), used to ask NASA POWER for one point.
  function centroid(rings) {
    var best = null, bestArea = 0;
    rings.forEach(function (ring) {
      var a = 0, cx = 0, cy = 0;
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
        a += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f;
      }
      if (Math.abs(a) > bestArea) { bestArea = Math.abs(a); best = [cx / (3 * a), cy / (3 * a)]; }
    });
    return best || rings[0][0];
  }

  // ------------------------------------------------------------------ globe
  var globe = { canvas: null, ctx: null, size: 0, table: null, tableLat0: null, tex: null, texW: 0, texH: 0,
    image: null, frame: null, running: false, drag: null, last: 0, target: null };
  var earth = new Image();
  earth.onload = function () {
    try {
      var c = document.createElement("canvas");
      c.width = earth.naturalWidth; c.height = earth.naturalHeight;
      var x = c.getContext("2d"); x.drawImage(earth, 0, 0);
      globe.tex = x.getImageData(0, 0, c.width, c.height).data;
      globe.texW = c.width; globe.texH = c.height;
    } catch (e) { globe.tex = null; } // file:// pages may not read image pixels: vector globe instead
  };
  earth.src = "earth.jpg";

  function setupGlobe() {
    var canvas = $("w-globe");
    if (!canvas) return false;
    var css = Math.min(canvas.parentNode.clientWidth || 360, 620);
    var size = Math.round(Math.min(Math.min(css, 560) * Math.min(window.devicePixelRatio || 1, 1.5), 640));
    if (globe.canvas !== canvas || globe.size !== size) {
      globe.canvas = canvas; globe.ctx = canvas.getContext("2d");
      canvas.width = canvas.height = size; canvas.style.width = canvas.style.height = css + "px";
      globe.size = size; globe.table = null; globe.image = globe.ctx.createImageData(size, size);
    }
    return true;
  }
  // For every pixel of the disc: latitude, longitude offset from the centre and light.
  // Only the longitude changes while the globe turns, so this runs again only on tilt.
  function buildTable() {
    var n = globe.size, R = n / 2 - 2, c = n / 2, phi0 = st.lat0 * Math.PI / 180;
    var lat = new Float32Array(n * n), dlon = new Float32Array(n * n), shade = new Float32Array(n * n);
    for (var j = 0; j < n; j++) {
      for (var i = 0; i < n; i++) {
        var k = j * n + i, x = (i - c) / R, y = (c - j) / R, rho = Math.sqrt(x * x + y * y);
        if (rho >= 1) { shade[k] = -1; continue; }
        var cc = Math.asin(rho), sc = Math.sin(cc), coc = Math.cos(cc);
        lat[k] = rho ? Math.asin(coc * Math.sin(phi0) + y * sc * Math.cos(phi0) / rho) * 180 / Math.PI : st.lat0;
        dlon[k] = rho ? Math.atan2(x * sc, rho * coc * Math.cos(phi0) - y * sc * Math.sin(phi0)) * 180 / Math.PI : 0;
        var z = Math.sqrt(1 - rho * rho);
        shade[k] = Math.max(0.28, Math.min(1.12, 0.35 + 0.8 * (-0.45 * x + 0.45 * y + 0.77 * z)));
      }
    }
    globe.table = { lat: lat, dlon: dlon, shade: shade }; globe.tableLat0 = st.lat0;
  }
  function project(lon, lat) {
    var phi = lat * Math.PI / 180, phi0 = st.lat0 * Math.PI / 180, dl = (lon - st.lon0) * Math.PI / 180;
    var cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dl);
    var R = globe.size / 2 - 2;
    return [globe.size / 2 + R * Math.cos(phi) * Math.sin(dl),
      globe.size / 2 - R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl)), cosc];
  }
  function unproject(px, py) {
    var n = globe.size, R = n / 2 - 2, x = (px - n / 2) / R, y = (n / 2 - py) / R, rho = Math.sqrt(x * x + y * y);
    if (rho >= 1) return null;
    var phi0 = st.lat0 * Math.PI / 180, cc = Math.asin(rho), sc = Math.sin(cc), coc = Math.cos(cc);
    var lat = rho ? Math.asin(coc * Math.sin(phi0) + y * sc * Math.cos(phi0) / rho) * 180 / Math.PI : st.lat0;
    var lon = st.lon0 + (rho ? Math.atan2(x * sc, rho * coc * Math.cos(phi0) - y * sc * Math.sin(phi0)) * 180 / Math.PI : 0);
    return [((lon + 540) % 360) - 180, lat];
  }
  function strokeCountry(c, color, width) {
    var ctx = globe.ctx;
    ctx.beginPath();
    c.rings.forEach(function (ring) {
      var pen = false;
      ring.forEach(function (p) {
        var q = project(p[0], p[1]);
        if (q[2] <= 0) { pen = false; return; }
        if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
        pen = true;
      });
    });
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function drawGlobe() {
    if (!setupGlobe()) return;
    if (!globe.table || globe.tableLat0 !== st.lat0) buildTable();
    var n = globe.size, ctx = globe.ctx, T = globe.table, out = globe.image.data;
    ctx.clearRect(0, 0, n, n);
    if (globe.tex) {
      var tw = globe.texW, th = globe.texH, tex = globe.tex, lon0 = st.lon0;
      for (var k = 0, o = 0; k < n * n; k++, o += 4) {
        var s = T.shade[k];
        if (s < 0) { out[o + 3] = 0; continue; }
        var col = Math.floor(((T.dlon[k] + lon0 + 540) % 360) / 360 * tw) % tw;
        var row = Math.min(th - 1, Math.floor((90 - T.lat[k]) / 180 * th));
        var t = (row * tw + col) * 4;
        out[o] = Math.min(255, tex[t] * s); out[o + 1] = Math.min(255, tex[t + 1] * s); out[o + 2] = Math.min(255, tex[t + 2] * s); out[o + 3] = 255;
      }
      ctx.putImageData(globe.image, 0, 0);
    } else {
      var g = ctx.createRadialGradient(n * 0.38, n * 0.35, n * 0.05, n / 2, n / 2, n / 2);
      g.addColorStop(0, "#2f5bd3"); g.addColorStop(1, "#0b1d5c");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n / 2, n / 2, n / 2 - 2, 0, Math.PI * 2); ctx.fill();
      W.countries.forEach(function (c) { strokeCountry(c, "rgba(220,235,190,.9)", 1.2); });
    }
    W.countries.forEach(function (c) { strokeCountry(c, "rgba(255,255,255,.35)", 0.7); });
    if (st.hover) strokeCountry(st.hover, "#ffd23f", 2.4);
    var dr = W.countries.filter(function (c) { return c.iso3 === "DOM"; })[0];
    if (dr && dr !== st.hover) strokeCountry(dr, "#e2231a", 2);
    // thin atmosphere ring
    ctx.beginPath(); ctx.arc(n / 2, n / 2, n / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(170,205,255,.55)"; ctx.lineWidth = 3; ctx.stroke();
  }
  function loop(time) {
    if (!globe.running) return;
    var dt = globe.last ? Math.min(50, time - globe.last) : 16; globe.last = time;
    if (globe.target) { // fly to the chosen country, then open it
      var t = globe.target, f = Math.min(1, (time - t.start) / 700), e = 1 - Math.pow(1 - f, 3);
      st.lon0 = t.fromLon + t.dLon * e; st.lat0 = t.fromLat + (t.toLat - t.fromLat) * e;
      if (f >= 1) { globe.target = null; openCountry(t.country); }
    } else if (!globe.drag && !reduceMotion) {
      st.lon0 = (st.lon0 + dt * 0.006 + 540) % 360 - 180;
    }
    drawGlobe();
    globe.frame = requestAnimationFrame(loop);
  }
  function startGlobe() {
    if (globe.running) return;
    globe.running = true; globe.last = 0;
    drawGlobe(); // first picture at once, before the first animation frame
    globe.frame = requestAnimationFrame(loop);
  }
  function stopGlobe() { globe.running = false; if (globe.frame) cancelAnimationFrame(globe.frame); }
  function flyTo(c) {
    var center = centroid(c.rings), dLon = ((center[0] - st.lon0 + 540) % 360) - 180;
    if (reduceMotion) { st.lon0 = center[0]; st.lat0 = Math.max(-60, Math.min(60, center[1])); openCountry(c); return; }
    var target = globe.target = { country: c, start: performance.now(), fromLon: st.lon0, dLon: dLon, fromLat: st.lat0,
      toLat: Math.max(-60, Math.min(60, center[1])) };
    // If animation frames are not running (background tab, power saving), open it anyway.
    setTimeout(function () { if (globe.target === target) { globe.target = null; openCountry(c); } }, 1200);
  }
  function canvasPoint(event) {
    var r = globe.canvas.getBoundingClientRect();
    return [(event.clientX - r.left) / r.width * globe.size, (event.clientY - r.top) / r.height * globe.size];
  }
  function listenGlobe() {
    var canvas = $("w-globe");
    canvas.onpointerdown = function (event) {
      globe.drag = { x: event.clientX, y: event.clientY, lon: st.lon0, lat: st.lat0, moved: false };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = function (event) {
      var p = canvasPoint(event);
      if (globe.drag) {
        var dx = event.clientX - globe.drag.x, dy = event.clientY - globe.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) globe.drag.moved = true;
        st.lon0 = globe.drag.lon - dx * 0.35; st.lat0 = Math.max(-60, Math.min(60, globe.drag.lat + dy * 0.35));
      }
      var ll = unproject(p[0], p[1]);
      st.hover = ll ? countryAt(ll[0], ll[1]) : null;
      $("w-hover").textContent = st.hover ? countryName(st.hover) : L().w_hover_hint;
      if (reduceMotion) drawGlobe();
    };
    canvas.onpointerup = function (event) {
      var drag = globe.drag; globe.drag = null;
      if (drag && drag.moved) return;
      var p = canvasPoint(event), ll = unproject(p[0], p[1]), c = ll && countryAt(ll[0], ll[1]);
      if (c) flyTo(c);
    };
    canvas.onpointercancel = function () { globe.drag = null; };
    $("w-country").onchange = function () {
      var c = W.countries[+this.value];
      if (c) flyTo(c);
    };
  }

  // ------------------------------------------------------------------ maps of a country or province
  function fitter(rings, width, height) {
    var all = [];
    rings.forEach(function (ring) { all = all.concat(ring); });
    var minLon = 180, maxLon = -180;
    all.forEach(function (p) { minLon = Math.min(minLon, p[0]); maxLon = Math.max(maxLon, p[0]); });
    var wrap = maxLon - minLon > 300; // crosses the 180th meridian (Russia, Fiji, ...)
    function lonOf(lon) { return wrap && lon < 0 ? lon + 360 : lon; }
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    all.forEach(function (p) {
      var x = lonOf(p[0]);
      b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], p[1]);
    });
    var k = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180);
    var w = Math.max(1e-6, (b[2] - b[0]) * k), h = Math.max(1e-6, b[3] - b[1]);
    var scale = Math.min((width - 24) / w, (height - 24) / h);
    var ox = (width - w * scale) / 2, oy = (height - h * scale) / 2;
    return {
      box: b, wrap: wrap,
      x: function (lon) { return ox + (lonOf(lon) - b[0]) * k * scale; },
      y: function (lat) { return oy + (b[3] - lat) * scale; },
      path: function (rs) {
        var self = this;
        return rs.map(function (ring) {
          var out = [], lx = null, ly = null;
          ring.forEach(function (p, i) {
            var x = self.x(p[0]), y = self.y(p[1]);
            if (i && Math.abs(x - lx) + Math.abs(y - ly) < 0.8) return;
            out.push((out.length ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)); lx = x; ly = y;
          });
          return out.length > 2 ? out.join("") + "Z" : "";
        }).join("");
      }
    };
  }
  // NASA GIBS picture of the same box (needs internet; if it fails the map stays plain).
  function nasaImage(f, width, height) {
    var b = f.box;
    if (f.wrap) return "";
    var pad = 0.02 * Math.max(b[2] - b[0], b[3] - b[1]);
    var x0 = f.x(b[0] - pad), x1 = f.x(b[2] + pad), y0 = f.y(b[3] + pad), y1 = f.y(b[1] - pad);
    var url = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
      "&LAYERS=BlueMarble_ShadedRelief_Bathymetry&CRS=EPSG:4326&FORMAT=image/jpeg&WIDTH=" + Math.round(width) +
      "&HEIGHT=" + Math.round(height) + "&BBOX=" + [b[1] - pad, b[0] - pad, b[3] + pad, b[2] + pad].map(function (v) { return v.toFixed(3); }).join(",");
    return "<image href=\"" + url + "\" x=\"" + x0.toFixed(1) + "\" y=\"" + y0.toFixed(1) + "\" width=\"" + (x1 - x0).toFixed(1) +
      "\" height=\"" + (y1 - y0).toFixed(1) + "\" preserveAspectRatio=\"none\" opacity=\".9\"/>";
  }
  function geoRings(geometry) {
    if (!geometry) return [];
    var polys = geometry.type === "MultiPolygon" ? geometry.coordinates : geometry.type === "Polygon" ? [geometry.coordinates] : [];
    return polys.map(function (poly) { return poly[0]; });
  }

  // ------------------------------------------------------------------ country
  function openCountry(c) {
    st.country = c; st.province = null; st.provinces = cache.provinces[c.iso3] || null;
    st.provinceStatus = st.provinces ? "" : "loading";
    if (window.GTApp) window.GTApp.go("country");
    renderCountry();
    if (!st.provinces) loadProvinces(c);
  }
  function mediaUrl(url) { // GitHub stores these files with LFS; this address serves them to web pages
    var m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/(.+)$/.exec(url);
    return m ? "https://media.githubusercontent.com/media/" + m[1] + "/" + m[2] + "/" + m[3] : url;
  }
  function loadProvinces(c) {
    fetch("https://www.geoboundaries.org/api/current/gbOpen/" + c.iso3 + "/ADM1/")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (meta) { return fetch(mediaUrl(meta.simplifiedGeometryGeoJSON)); })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (geo) {
        var list = geo.features.map(function (f) {
          return { name: f.properties.shapeName || "?", rings: geoRings(f.geometry) };
        }).filter(function (p) { return p.rings.length; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
        cache.provinces[c.iso3] = list;
        if (st.country === c) { st.provinces = list; st.provinceStatus = ""; renderCountry(); }
      })
      .catch(function () {
        if (st.country === c) { st.provinceStatus = "failed"; renderCountry(); }
      });
  }
  function renderCountry() {
    var c = st.country;
    if (!c || !$("wc-title")) return;
    var Lx = L();
    $("wc-title").textContent = countryName(c);
    $("wc-sub").textContent = c.year ? tr("w_country_sub", { year: c.year }) : Lx.w_country_nodata;
    $("wc-status").textContent = st.provinceStatus === "loading" ? Lx.w_loading_prov
      : st.provinceStatus === "failed" ? Lx.w_failed_prov
      : (st.quizMode ? Lx.wq_pick_province + " " : "") + tr("w_prov_count", { n: st.provinces ? st.provinces.length : 0 });
    var width = 800, height = 560, outline = st.provinces ? [].concat.apply([], st.provinces.map(function (p) { return p.rings; })) : c.rings;
    var f = fitter(outline, width, height);
    var svg = "<svg viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"" + esc(countryName(c)) + "\">" + nasaImage(f, width, height);
    if (st.provinces) {
      svg += st.provinces.map(function (p, i) {
        return "<path class=\"w-prov\" data-w-prov=\"" + i + "\" d=\"" + f.path(p.rings) + "\" tabindex=\"0\" role=\"button\"><title>" + esc(p.name) + "</title></path>";
      }).join("");
    } else {
      svg += "<path class=\"w-prov solo\" d=\"" + f.path(c.rings) + "\"/>";
    }
    $("wc-map").innerHTML = svg + "</svg>";
    $("wc-list").innerHTML = (st.provinces || []).map(function (p, i) {
      return "<button type=\"button\" data-w-prov=\"" + i + "\">" + esc(p.name) + "</button>";
    }).join("") + (st.provinceStatus === "failed" || (st.provinces && !st.provinces.length)
      ? "<button type=\"button\" data-w-whole=\"1\">" + esc(Lx.w_use_whole) + "</button>" : "");
    var most = c.crops.length ? c.crops[0][1] : 1;
    $("wc-crops").innerHTML = c.crops.map(function (cr) {
      var item = W.items[cr[0]];
      return "<li><span><b>" + esc(item[lang()] || item.en) + "</b>" + (item.w ? "" : " <small>" + esc(Lx.w_no_calc) + "</small>") +
        "</span><span>" + num(cr[1]) + " ha</span><i style=\"width:" + Math.max(2, 100 * cr[1] / most).toFixed(1) + "%\"></i></li>";
    }).join("") || "<li>" + esc(Lx.w_country_nodata) + "</li>";
    $("wc-crops-note").textContent = tr("w_crops_note", { year: c.year || "—" });
  }

  // ------------------------------------------------------------------ province and water
  function openProvince(p) {
    st.province = p; st.climate = null;
    var center = centroid(p.rings);
    p.center = center;
    var key = center[0].toFixed(2) + "," + center[1].toFixed(2);
    st.climate = cache.climate[key] || null;
    st.climateStatus = st.climate ? "" : "loading";
    if (st.quizMode) { st.qstep = 0; st.current = defaultCrop(); }
    if (window.GTApp) window.GTApp.go(st.quizMode ? "wquiz" : "region");
    renderRegion(); renderQuiz();
    if (st.climate) return;
    fetch("https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M,WS2M" +
      "&community=AG&longitude=" + center[0].toFixed(3) + "&latitude=" + center[1].toFixed(3) + "&format=JSON")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) {
        var P = json.properties.parameter, months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        function series(name) { return months.map(function (m) { var v = P[name][m]; return v === -999 ? null : v; }); }
        var climate = { tmax: series("T2M_MAX"), tmin: series("T2M_MIN"), rain: series("PRECTOTCORR"), solar: series("ALLSKY_SFC_SW_DWN"),
          rh: series("RH2M"), wind: series("WS2M"), elev: json.geometry.coordinates[2] || 0, lat: center[1],
          range: (json.header && json.header.range) || "" };
        if (climate.tmax.some(function (v) { return v === null; })) throw new Error("missing");
        climate.et0 = monthlyEt0(climate);
        climate.usable = usableRain(climate.rain);
        cache.climate[key] = climate;
        if (st.province === p) { st.climate = climate; st.climateStatus = ""; renderRegion(); renderQuiz(); }
      })
      .catch(function () { if (st.province === p) { st.climateStatus = "failed"; renderRegion(); renderQuiz(); } });
  }
  // FAO-56 Penman-Monteith with monthly means: the same formulas as water.py (daily there).
  function monthlyEt0(c) {
    var out = [], lat = c.lat * Math.PI / 180;
    var pressure = 101.3 * Math.pow((293 - 0.0065 * c.elev) / 293, 5.26), gamma = 0.000665 * pressure;
    function es(t) { return 0.6108 * Math.exp(17.27 * t / (t + 237.3)); }
    for (var m = 0; m < 12; m++) {
      var tmax = c.tmax[m], tmin = c.tmin[m], tmean = (tmax + tmin) / 2;
      var esat = (es(tmax) + es(tmin)) / 2, ea = esat * c.rh[m] / 100;
      var slope = 4098 * es(tmean) / Math.pow(tmean + 237.3, 2), J = MID_DOY[m];
      var dr = 1 + 0.033 * Math.cos(2 * Math.PI * J / 365), decl = 0.409 * Math.sin(2 * Math.PI * J / 365 - 1.39);
      var ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat) * Math.tan(decl))));
      var ra = (24 * 60 / Math.PI) * 0.0820 * dr * (ws * Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.sin(ws));
      var rso = (0.75 + 2e-5 * c.elev) * ra, rs = c.solar[m];
      var cloud = Math.max(0.3, Math.min(1, rso > 0 ? rs / rso : 1));
      var rnl = 4.903e-9 * (Math.pow(tmax + 273.16, 4) + Math.pow(tmin + 273.16, 4)) / 2 * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * cloud - 0.35);
      var rn = 0.77 * rs - rnl, u = c.wind[m];
      out.push(Math.max(0, (0.408 * slope * rn + gamma * 900 / (tmean + 273) * u * (esat - ea)) / (slope + gamma * (1 + 0.34 * u))));
    }
    return out; // mm per day
  }
  function usableRain(rainPerDay) { // FAO Training Manual No. 3 rule, as in water.py; mm per day
    return rainPerDay.map(function (r, m) {
      var total = r * DAYS[m], used = total > 75 ? 0.8 * total - 25 : 0.6 * total - 10;
      return Math.max(0, used) / DAYS[m];
    });
  }
  function profile(key) { return D.crops[key] || D.other_crops[key] || D.world_crops[key]; }
  function profileName(key) { return profile(key)[lang()]; }
  function seasonDays(key) { return profile(key).stages.reduce(function (a, b) { return a + b; }, 0); }
  function kcCurve(p) { // same shape as kc_curve in water.py
    var s = p.stages, k = p.kc, out = [], i;
    for (i = 0; i < s[0]; i++) out.push(k[0]);
    for (i = 0; i < s[1]; i++) out.push(k[0] + (k[1] - k[0]) * i / s[1]);
    for (i = 0; i < s[2]; i++) out.push(k[1]);
    for (i = 0; i < s[3]; i++) out.push(s[3] > 1 ? k[1] + (k[2] - k[1]) * i / (s[3] - 1) : k[1]);
    return out;
  }
  function monthOfDoy(doy) { var m = 0; while (m < 11 && doy >= DAYS[m]) { doy -= DAYS[m]; m++; } return m; }
  function cropNeedMm(key, climate) {
    var p = profile(key), kc = kcCurve(p), perc = p.flooded ? PERCOLATION[st.soil] : 0;
    var start = DAYS.slice(0, st.month - 1).reduce(function (a, b) { return a + b; }, 0) + 14, need = 0;
    for (var d = 0; d < kc.length; d++) {
      var m = monthOfDoy((start + d) % 365);
      need += Math.max(0, kc[d] * climate.et0[m] + perc - climate.usable[m]);
    }
    return need + (p.flooded ? RICE_SATURATION_MM + RICE_LAYER_MM : 0);
  }
  function allProfiles() {
    return Object.keys(D.crops).concat(Object.keys(D.other_crops), Object.keys(D.world_crops));
  }
  function renderRegion() {
    var p = st.province, c = st.country;
    if (!p || !c || !$("wr-title")) return;
    var Lx = L(), MONTHS = window.GTApp ? window.GTApp.months() : [];
    $("wr-title").textContent = p.name;
    $("wr-sub").textContent = tr("w_region_sub", { country: countryName(c),
      lat: p.center ? p.center[1].toFixed(2) : "", lon: p.center ? p.center[0].toFixed(2) : "" });
    $("wr-status").textContent = st.climateStatus === "loading" ? Lx.w_loading_climate
      : st.climateStatus === "failed" ? Lx.w_failed_climate : "";
    var width = 800, height = 480, f = fitter(p.rings, width, height);
    var mark = p.center ? "<circle class=\"w-center\" cx=\"" + f.x(p.center[0]).toFixed(1) + "\" cy=\"" + f.y(p.center[1]).toFixed(1) + "\" r=\"7\"/>" : "";
    $("wr-map").innerHTML = "<svg viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"" + esc(p.name) + "\">" +
      nasaImage(f, width, height) + "<path class=\"w-prov solo\" d=\"" + f.path(p.rings) + "\"/>" + mark + "</svg>";
    if (!$("wr-month").options.length || $("wr-month").getAttribute("data-lang") !== lang()) {
      $("wr-month").innerHTML = MONTHS.map(function (m, i) { return "<option value=\"" + (i + 1) + "\">" + esc(m) + "</option>"; }).join("");
      $("wr-soil").innerHTML = ["clay", "loam", "sandy"].map(function (s) { return "<option value=\"" + s + "\">" + esc(Lx.soils[s]) + "</option>"; }).join("");
      $("wr-month").setAttribute("data-lang", lang());
    }
    $("wr-month").value = st.month; $("wr-soil").value = st.soil;
    var cl = st.climate;
    if (!cl) { $("wr-climate").innerHTML = ""; $("wr-rec").innerHTML = ""; return; }
    // Climate: monthly rain against the water the field loses (ET0), both in mm per month.
    var rainM = cl.rain.map(function (r, m) { return r * DAYS[m]; }), etM = cl.et0.map(function (e, m) { return e * DAYS[m]; });
    var top = Math.max.apply(null, rainM.concat(etM)) || 1;
    $("wr-climate").innerHTML = "<h3>" + esc(Lx.w_climate_title) + "</h3><div class=\"wr-bars\">" + rainM.map(function (r, m) {
      return "<div class=\"wr-bar" + (etM[m] > r ? " short" : "") + "\" title=\"" + esc(MONTHS[m] + ": " + num(r) + " / " + num(etM[m]) + " mm") + "\">" +
        "<i class=\"rain\" style=\"height:" + (100 * r / top).toFixed(1) + "%\"></i><i class=\"et\" style=\"bottom:" + (100 * etM[m] / top).toFixed(1) + "%\"></i>" +
        "<span>" + esc((MONTHS[m] || "").slice(0, 1).toUpperCase()) + "</span></div>";
    }).join("") + "</div><p class=\"wr-key\">" + esc(Lx.w_climate_key) + "</p><p class=\"wr-facts\">" +
      esc(tr("w_climate_facts", { rain: num(rainM.reduce(function (a, b) { return a + b; }, 0)), et: num(etM.reduce(function (a, b) { return a + b; }, 0)),
        tmax: num(Math.max.apply(null, cl.tmax), 1), elev: num(cl.elev) })) + "</p>";

    var needs = {};
    allProfiles().forEach(function (key) { needs[key] = cropNeedMm(key, cl); });
    function line(key, label, best, hectares) {
      var mm = needs[key], days = seasonDays(key);
      var text = days > LONG_CYCLE ? tr("w_rec_long", { n: days, m3: num(mm * 10) })
        : mm < 1 ? Lx.w_rec_rain : tr("w_rec_need", { m3: num(mm * 10), mm: num(mm), n: days });
      return "<li" + (best ? " class=\"best\"" : "") + "><b>" + esc(label) + "</b>" + (hectares ? "<em>" + num(hectares) + " ha</em>" : "") +
        "<span>" + esc(text) + "</span></li>";
    }
    var ranked = allProfiles().filter(function (k) { return k !== "sesbania" && seasonDays(k) <= LONG_CYCLE; })
      .sort(function (a, b) { return needs[a] - needs[b]; });
    var html = "<div class=\"cw-rec-box\"><h4>" + esc(Lx.w_rec_all) + "</h4><p class=\"help\">" + esc(tr("w_rec_all_help", { n: ranked.length })) +
      "</p><ol>" + ranked.slice(0, 3).map(function (k, i) { return line(k, profileName(k), i === 0); }).join("") + "</ol></div>";
    var grown = c.crops.map(function (cr) { return { item: W.items[cr[0]], ha: cr[1] }; });
    var withCalc = grown.filter(function (g) { return g.item.w && profile(g.item.w); });
    var shortOnes = withCalc.filter(function (g) { return seasonDays(g.item.w) <= LONG_CYCLE; })
      .sort(function (a, b) { return needs[a.item.w] - needs[b.item.w]; });
    var longOnes = withCalc.filter(function (g) { return seasonDays(g.item.w) > LONG_CYCLE; });
    var best = shortOnes[0];
    html += "<div class=\"cw-rec-box mine\"><h4>" + esc(tr("w_rec_country", { country: countryName(c) })) + "</h4>" +
      (best ? "<p class=\"cw-rec-lead\">" + esc(tr("w_rec_country_best", { crop: best.item[lang()] || best.item.en })) + "</p>" : "") +
      "<ol>" + shortOnes.concat(longOnes).map(function (g) { return line(g.item.w, g.item[lang()] || g.item.en, g === best, g.ha); }).join("") + "</ol>";
    var none = grown.filter(function (g) { return !(g.item.w && profile(g.item.w)); });
    if (none.length) html += "<p class=\"help\">" + esc(tr("w_rec_nocalc", { list: none.map(function (g) { return g.item[lang()] || g.item.en; }).join(", ") })) + "</p>";
    if (!grown.length) html += "<p class=\"help\">" + esc(Lx.w_country_nodata) + "</p>";
    html += "</div><p class=\"note cw-rec-note\">" + esc(tr("w_region_note", { range: cl.range || "2001–2025" })) + "</p>";
    $("wr-rec").innerHTML = html;
  }


  // ------------------------------------------------------------------ the farmer's questionnaire
  // Water only, average year: the allocation is a share of what the farmer's usual crop
  // needs here (as the Dominican tool uses rice). Three plans are compared: keep the usual
  // crop on the land the water covers, switch it all, or mix both so all land is planted.
  var LEGUMES_ALL = ["beans", "pigeon_pea", "cowpea", "green_bean", "peanut", "soybean", "lentil", "peas_dry", "broad_bean"];
  function countryKeys() {
    var keys = [];
    (st.country ? st.country.crops : []).forEach(function (cr) {
      var k = W.items[cr[0]].w;
      if (k && profile(k) && keys.indexOf(k) < 0) keys.push(k);
    });
    return keys;
  }
  function defaultCrop() {
    var short = countryKeys().filter(function (k) { return seasonDays(k) <= LONG_CYCLE; });
    return short[0] || "maize";
  }
  function quizPlans() {
    var cl = st.climate, need = {};
    allProfiles().forEach(function (k) { need[k] = cropNeedMm(k, cl) * 10; }); // m3 per hectare
    var cur = st.current, area = st.area, budget = st.pct * need[cur] * area;
    var known = countryKeys();
    var pool = allProfiles().filter(function (k) {
      return k !== cur && k !== "sesbania" && seasonDays(k) <= LONG_CYCLE;
    });
    function rank(k) {
      var group = st.priority === "soil" ? (LEGUMES_ALL.indexOf(k) >= 0 ? 0 : 1)
        : st.priority === "known" ? (known.indexOf(k) >= 0 ? 0 : 1) : 0;
      return group * 1e9 + need[k];
    }
    pool.sort(function (a, b) { return rank(a) - rank(b); });
    var alt = pool[0];
    function plan(kind, parts) {
      var used = 0, planted = 0;
      parts.forEach(function (p) { used += p.ha * need[p.key]; planted += p.ha; });
      return { kind: kind, parts: parts.filter(function (p) { return p.ha > 0.005; }), used: used, planted: planted };
    }
    var keep = plan("keep", [{ key: cur, ha: need[cur] > 0 ? Math.min(area, budget / need[cur]) : area }]);
    var swap = plan("swap", [{ key: alt, ha: need[alt] > 0 ? Math.min(area, budget / need[alt]) : area }]);
    var mixCur = 0;
    if (need[cur] > need[alt]) mixCur = Math.max(0, Math.min(area, (budget - area * need[alt]) / (need[cur] - need[alt])));
    var mixAlt = need[alt] > 0 ? Math.min(area - mixCur, Math.max(0, (budget - mixCur * need[cur]) / need[alt])) : area - mixCur;
    var mix = plan("mix", [{ key: cur, ha: mixCur }, { key: alt, ha: mixAlt }]);
    // A mix with one crop is just "switch" or "keep": show each different plan once.
    var plans = [keep, swap, mix].filter(function (p, i, all) {
      return all.slice(0, i).every(function (q) { return partsText(q) !== partsText(p); });
    });
    function legumeHa(p) { return p.parts.reduce(function (a, x) { return a + (LEGUMES_ALL.indexOf(x.key) >= 0 ? x.ha : 0); }, 0); }
    function knownHa(p) { return p.parts.reduce(function (a, x) { return a + (x.key === cur || known.indexOf(x.key) >= 0 ? x.ha : 0); }, 0); }
    var best = plans.slice().sort(function (a, b) {
      var land = Math.round(b.planted * 10) - Math.round(a.planted * 10);
      if (land) return land;
      if (st.priority === "soil") return legumeHa(b) - legumeHa(a) || a.used - b.used;
      if (st.priority === "known") return knownHa(b) - knownHa(a) || a.used - b.used;
      return a.used - b.used;
    })[0];
    return { plans: plans, best: best, budget: budget, need: need, alt: alt };
  }
  function partsText(p) {
    if (!p.parts.length) return L().wq_nothing;
    return p.parts.map(function (x) { return tr("wq_part", { ha: num(x.ha, x.ha < 10 ? 1 : 0), crop: profileName(x.key).toLowerCase() }); }).join(" + ");
  }
  function renderQuiz() {
    if (!$("wq-stage") || !st.province || !st.country) return;
    var Lx = L(), MONTHS = window.GTApp ? window.GTApp.months() : [], step = st.qstep;
    $("wq-where").textContent = st.province.name + " · " + countryName(st.country);
    $("wq-count").textContent = step < 5 ? tr("wq_count", { n: step + 1 }) : Lx.wq_result_label;
    $("wq-bar").style.width = (100 * Math.min(step + 1, 5) / 5) + "%";
    var back = document.querySelector("[data-wq-back]"), next = document.querySelector("[data-wq-next]");
    back.textContent = Lx.g_back; next.textContent = step === 4 ? Lx.g_see : Lx.g_next; next.hidden = step >= 5;
    var html = "";
    if (step === 0) {
      var known = countryKeys(), others = allProfiles().filter(function (k) { return known.indexOf(k) < 0 && k !== "sesbania"; });
      function chip(k) {
        return "<button type=\"button\" class=\"cw-chip" + (k === st.current ? " on" : "") + "\" data-wq-crop=\"" + k + "\" aria-pressed=\"" + (k === st.current) + "\">" + esc(profileName(k)) + "</button>";
      }
      html = "<h2>" + esc(Lx.wq_q_crop) + "</h2><p class=\"help\">" + esc(tr("wq_crop_help", { country: countryName(st.country) })) + "</p>" +
        (known.length ? "<p class=\"g-label\">" + esc(tr("wq_crop_country", { country: countryName(st.country) })) + "</p><div class=\"wq-chips\">" + known.map(chip).join("") + "</div>" : "") +
        "<p class=\"g-label\">" + esc(Lx.wq_crop_other) + "</p><div class=\"wq-chips\">" + others.map(chip).join("") + "</div>";
    } else if (step === 1) {
      html = "<h2>" + esc(Lx.g_q[1]) + "</h2><p class=\"g-label\">" + esc(Lx.cw_month) + "</p><div class=\"wq-chips\">" + MONTHS.map(function (m, i) {
        return "<button type=\"button\" class=\"cw-chip" + (i + 1 === st.month ? " on" : "") + "\" data-wq-month=\"" + (i + 1) + "\">" + esc(m) + "</button>";
      }).join("") + "</div><p class=\"g-label\">" + esc(Lx.wq_area) + "</p><div class=\"wq-area\"><button type=\"button\" data-wq-area=\"-1\" aria-label=\"-1\">−</button>" +
        "<input id=\"wq-area\" type=\"number\" min=\"0.1\" max=\"100000\" step=\"0.1\" inputmode=\"decimal\" value=\"" + st.area + "\"><button type=\"button\" data-wq-area=\"1\" aria-label=\"+1\">+</button></div>" +
        "<p class=\"help\">" + esc(Lx.wq_area_help) + "</p>";
    } else if (step === 2) {
      html = "<h2>" + esc(Lx.g_q[2]) + "</h2><div class=\"wq-chips\">" + ["clay", "loam", "sandy"].map(function (s) {
        return "<button type=\"button\" class=\"cw-chip big" + (s === st.soil ? " on" : "") + "\" data-wq-soil=\"" + s + "\">" + esc(Lx.soils[s]) + "</button>";
      }).join("") + "</div><p class=\"help\">" + esc(Lx.soil_help[st.soil]) + "</p><p class=\"help\">" + esc(Lx.wq_soil_note) + "</p>";
    } else if (step === 3) {
      html = "<h2>" + esc(Lx.wq_q_water) + "</h2><p class=\"help\">" + esc(tr("wq_water_help", { crop: profileName(st.current).toLowerCase() })) + "</p>" +
        "<div class=\"wq-chips\">" + [[1, "wq_w_normal"], [0.6, "wq_w_cut"], [0.3, "wq_w_severe"]].map(function (o) {
          return "<button type=\"button\" class=\"cw-chip big" + (Math.abs(st.pct - o[0]) < 0.001 ? " on" : "") + "\" data-wq-pct=\"" + o[0] + "\">" + esc(Lx[o[1]]) + "</button>";
        }).join("") + "</div><div class=\"cw-range wq-range\"><input id=\"wq-pct\" type=\"range\" min=\"0\" max=\"100\" step=\"5\" value=\"" + Math.round(st.pct * 100) +
        "\" aria-label=\"" + esc(Lx.wq_q_water) + "\"><output id=\"wq-pct-out\">" + Math.round(st.pct * 100) + "%</output></div>";
    } else if (step === 4) {
      html = "<h2>" + esc(Lx.g_q[4]) + "</h2><div class=\"wq-chips col\">" + ["water", "soil", "known"].map(function (k) {
        return "<button type=\"button\" class=\"cw-chip big" + (k === st.priority ? " on" : "") + "\" data-wq-prio=\"" + k + "\"><b>" + esc(Lx["wq_p_" + k]) + "</b><span>" + esc(Lx["wq_p_" + k + "_help"]) + "</span></button>";
      }).join("") + "</div>";
    } else if (!st.climate) {
      html = "<h2>" + esc(Lx.g_result) + "</h2><p class=\"w-status\">" + esc(st.climateStatus === "failed" ? Lx.w_failed_climate : Lx.w_loading_climate) + "</p>";
    } else {
      var r = quizPlans(), best = r.best;
      html = "<div class=\"wq-result\"><p class=\"wq-stamp\">PLAN B</p><h2>" + esc(Lx.g_result) + "</h2><p class=\"lead\">" + esc(tr("wq_lead", {
        pct: Math.round(st.pct * 100), crop: profileName(st.current).toLowerCase(), plan: partsText(best) })) + "</p>" +
        "<p class=\"wq-budget\">" + esc(tr("wq_budget", { m3: num(r.budget), ha: num(st.area, st.area < 10 ? 1 : 0) })) + "</p><ol class=\"wq-plans\">" +
        r.plans.map(function (p) {
          var free = Math.max(0, st.area - p.planted);
          return "<li class=\"" + (p === best ? "best" : "") + "\"><b>" + esc(Lx["wq_plan_" + p.kind]) + (p === best ? " · " + esc(Lx.wq_recommended) : "") + "</b>" +
            "<span class=\"wq-what\">" + esc(partsText(p)) + "</span><span>" + esc(tr("wq_plan_use", { used: num(p.used), budget: num(r.budget) })) +
            (free > 0.05 ? " · " + esc(tr("wq_free", { ha: num(free, free < 10 ? 1 : 0) })) : " · " + esc(Lx.wq_all_planted)) + "</span></li>";
        }).join("") + "</ol><p class=\"note\">" + esc(Lx.wq_note) + "</p>" +
        "<div class=\"wq-actions\"><button type=\"button\" class=\"btn primary\" data-wq-sheet=\"1\">" + esc(Lx.wq_see_sheet) + "</button>" +
        "<button type=\"button\" class=\"btn\" data-wq-restart=\"1\">" + esc(Lx.g_restart) + "</button></div></div>";
    }
    $("wq-stage").innerHTML = html;
  }
  function listenQuiz() {
    $("wq-section").onclick = function (event) {
      var t = event.target, el;
      if ((el = t.closest("[data-wq-crop]"))) { st.current = el.getAttribute("data-wq-crop"); renderQuiz(); return; }
      if ((el = t.closest("[data-wq-month]"))) { st.month = +el.getAttribute("data-wq-month"); renderQuiz(); return; }
      if ((el = t.closest("[data-wq-area]"))) { st.area = Math.max(0.1, Math.round((st.area + +el.getAttribute("data-wq-area")) * 10) / 10); renderQuiz(); return; }
      if ((el = t.closest("[data-wq-soil]"))) { st.soil = el.getAttribute("data-wq-soil"); renderQuiz(); return; }
      if ((el = t.closest("[data-wq-pct]"))) { st.pct = +el.getAttribute("data-wq-pct"); renderQuiz(); return; }
      if ((el = t.closest("[data-wq-prio]"))) { st.priority = el.getAttribute("data-wq-prio"); renderQuiz(); return; }
      if (t.closest("[data-wq-next]")) { st.qstep = Math.min(5, st.qstep + 1); renderQuiz(); window.scrollTo(0, 0); return; }
      if (t.closest("[data-wq-back]")) {
        if (st.qstep > 0) { st.qstep -= 1; renderQuiz(); } else if (window.GTApp) window.GTApp.go("country");
        return;
      }
      if (t.closest("[data-wq-sheet]")) { if (window.GTApp) window.GTApp.go("region"); return; }
      if (t.closest("[data-wq-restart]")) { st.qstep = 0; renderQuiz(); window.scrollTo(0, 0); }
    };
    $("wq-section").oninput = function (event) {
      if (event.target.id === "wq-area") { var v = parseFloat(event.target.value); if (v > 0) st.area = Math.min(v, 100000); }
      if (event.target.id === "wq-pct") { st.pct = event.target.value / 100; $("wq-pct-out").textContent = event.target.value + "%";
        document.querySelectorAll("[data-wq-pct]").forEach(function (b) { b.classList.toggle("on", Math.abs(+b.getAttribute("data-wq-pct") - st.pct) < 0.001); }); }
    };
    document.querySelectorAll("[data-wq-start]").forEach(function (b) {
      b.onclick = function () {
        st.quizMode = true;
        if (st.country && b.hasAttribute("data-wq-here") && st.province) { st.qstep = 0; st.current = defaultCrop(); window.GTApp.go("wquiz"); renderQuiz(); return; }
        $("w-hover").textContent = L().wq_pick_country;
        $("w-globe").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      };
    });
  }

  // ------------------------------------------------------------------ wiring
  function listenPages() {
    $("wc-map").onclick = $("wc-list").onclick = function (event) {
      var el = event.target.closest("[data-w-prov]");
      if (el && st.provinces) { openProvince(st.provinces[+el.getAttribute("data-w-prov")]); return; }
      if (event.target.closest("[data-w-whole]") && st.country) openProvince({ name: countryName(st.country), rings: st.country.rings });
    };
    $("wc-map").onkeydown = function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var el = event.target.closest("[data-w-prov]");
      if (el && st.provinces) { event.preventDefault(); openProvince(st.provinces[+el.getAttribute("data-w-prov")]); }
    };
    $("wr-month").onchange = function () { st.month = +this.value; renderRegion(); };
    $("wr-soil").onchange = function () { st.soil = this.value; renderRegion(); };
  }
  function fillCountrySelect() {
    var sel = $("w-country");
    if (!sel || sel.getAttribute("data-lang") === lang()) return;
    var order = W.countries.map(function (c, i) { return i; }).sort(function (a, b) {
      return countryName(W.countries[a]).localeCompare(countryName(W.countries[b]));
    });
    sel.innerHTML = "<option value=\"\">" + esc(L().w_pick_placeholder) + "</option>" + order.map(function (i) {
      return "<option value=\"" + i + "\">" + esc(countryName(W.countries[i])) + "</option>";
    }).join("");
    sel.setAttribute("data-lang", lang());
  }
  var wired = false;
  window.GTWorld = {
    show: function (view) {
      if (!wired && $("w-globe")) { listenGlobe(); listenPages(); listenQuiz(); wired = true; }
      if (view === "home") st.quizMode = false;
      if (view === "world") {
        fillCountrySelect();
        $("w-hover").textContent = L().w_hover_hint;
        startGlobe();
      } else stopGlobe();
      if (view === "country") renderCountry();
      if (view === "region") renderRegion();
      if (view === "wquiz") renderQuiz();
    },
    render: function (view) {
      if (view === "world") { fillCountrySelect(); if (!st.hover) $("w-hover").textContent = L().w_hover_hint; }
      if (view === "country") renderCountry();
      if (view === "region") renderRegion();
      if (view === "wquiz") renderQuiz();
    },
    // for checks: the monthly water calculation for a set of monthly climate values
    _need: function (key, climate, month, soil) {
      var keep = [st.month, st.soil]; st.month = month; st.soil = soil;
      climate.et0 = monthlyEt0(climate); climate.usable = usableRain(climate.rain);
      var v = cropNeedMm(key, climate); st.month = keep[0]; st.soil = keep[1]; return v;
    }
  };
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopGlobe();
    else if (document.body.getAttribute("data-view") === "world") startGlobe();
  });
  window.addEventListener("resize", function () { if (globe.running) globe.table = null; });
}());
