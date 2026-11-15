// Strategy calculations for the web page.
// This is a line-by-line twin of rotation.py (compare_needs and basin_savings).
// check_web.js proves both give the same answers. Code written with the
// assistance of Claude Code (Anthropic).
(function (root) {
  "use strict";

  function suitability(data, cropKey, need, soil, salty) {
    var crop = data.crops[cropKey];
    var warnings = [];

    var heat = 1 - (need.tmax - crop.heat_limit) / 5;
    heat = Math.max(0, Math.min(1, heat));
    if (heat < 1) warnings.push("heat");

    var ground = 1;
    if (soil === "clay") {
      ground = 0.25 + 0.15 * crop.heavy_soil;
      if (crop.heavy_soil <= 2) warnings.push("heavy_soil");
    } else if (soil === "sandy" && crop.flooded) {
      ground = 0.7;
      warnings.push("sandy_rice");
    }

    var salt = 1;
    if (salty && crop.salt_limit < 3) {
      salt = 0.6;
      warnings.push("salt");
    }
    return [heat * ground * salt, warnings];
  }

  function bestCrop(data, candidates, needs, fit, priority) {
    var best = null;
    var bestValue = -Infinity;
    candidates.forEach(function (key) {
      var value;
      if (priority === "water") value = fit[key][0] / Math.max(needs[key].typical_m3, 1);
      else if (priority === "soil") value = fit[key][0] * (data.crops[key].nitrogen + 10);
      else value = fit[key][0] * data.crops[key].market;
      if (value > bestValue) {
        bestValue = value;
        best = key;
      }
    });
    return best;
  }

  function strategy(data, key, plots, area, needs, fit, baseline, budget, priority, alternative) {
    var c = data.constants;
    plots = plots.filter(function (p) { return p[1] > 0.005; });
    var planted = 0, water = 0, waterDry = 0, nitrogen = 0, rotated = 0, income = 0;
    plots.forEach(function (p) {
      var crop = p[0], tareas = p[1];
      planted += tareas;
      water += needs[crop].typical_m3 * tareas;
      waterDry += needs[crop].dry_m3 * tareas;
      nitrogen += data.crops[crop].nitrogen * tareas / c.tareas_per_hectare;
      if (crop !== "rice") rotated += tareas;
      income += tareas * data.crops[crop].market * fit[crop][0];
    });

    var hectares = area / c.tareas_per_hectare;
    var savedShare = baseline ? 1 - water / baseline : 0;
    var scores = {
      water: 100 * savedShare * planted / area,
      soil: 100 * (0.5 * Math.min(1, nitrogen / (hectares * c.nitrogen_target_kg_ha)) + 0.5 * rotated / area),
      income: 100 * income / (area * 5)
    };
    var other = (1 - c.priority_weight) / 2;
    scores.overall = ["water", "soil", "income"].reduce(function (sum, name) {
      return sum + scores[name] * (name === priority ? c.priority_weight : other);
    }, 0);

    var warnings = [];
    plots.forEach(function (p) {
      fit[p[0]][1].forEach(function (code) {
        if (warnings.indexOf(code) < 0) warnings.push(code);
      });
    });
    if (area - planted > 0.005) warnings.push("idle_land");
    if (plots.some(function (p) { return p[0] !== "sesbania" && data.crops[p[0]].market <= 2; }))
      warnings.push("weak_market");
    if (plots.length && plots.every(function (p) { return data.crops[p[0]].market === 0; }))
      warnings.push("no_income");
    if (waterDry > budget * 1.02) warnings.push("short_in_dry_year");

    return {
      key: key,
      alternative: alternative || null,
      plots: plots.map(function (p) {
        return { crop: p[0], tareas: p[1], water_m3: needs[p[0]].typical_m3 * p[1] };
      }),
      idle_tareas: area - planted,
      water_m3: water,
      water_dry_m3: waterDry,
      saved_m3: baseline - water,
      saved_share: savedShare,
      nitrogen_kg: nitrogen,
      urea_sacks: nitrogen / c.urea_nitrogen / c.urea_sack_kg,
      scores: scores,
      warnings: warnings
    };
  }

  // needs: water needs of every crop for one zone, soil and planting month.
  // prefer: crops the farmer already grows (optional), as in rotation.compare_needs.
  function compare(data, needs, soil, area, allocation, priority, riceAllowed, salty, prefer) {
    var c = data.constants;
    var fit = {};
    Object.keys(data.crops).forEach(function (key) {
      fit[key] = suitability(data, key, needs[key], soil, salty);
    });

    var riceNeed = needs.rice.typical_m3;
    var baseline = riceNeed * area;
    var budget = allocation * baseline;
    function affordable(crop, tareas, money) {
      return Math.min(tareas, money / needs[crop].typical_m3);
    }

    function own(group) {
      var mine = group.filter(function (crop) { return prefer && prefer.indexOf(crop) >= 0 && fit[crop][0] > 0; });
      return mine.length ? mine : group;
    }
    var legume = bestCrop(data, own(data.legumes), needs, fit, priority);
    var cash = bestCrop(data, own(data.cash_crops), needs, fit, priority);
    function build(key, plots, alternative) {
      return strategy(data, key, plots, area, needs, fit, baseline, budget, priority, alternative);
    }

    var riceOnly = riceAllowed ? affordable("rice", area, budget) : 0;
    var current = build("current", [["rice", riceOnly]]);

    var legumeNeed = needs[legume].typical_m3;
    var ricePart = 0;
    if (riceAllowed) {
      ricePart = (budget - area * legumeNeed) / (riceNeed - legumeNeed);
      ricePart = Math.max(0, Math.min(ricePart, area * (1 - c.min_rotation_share)));
    }
    var legumePart = affordable(legume, area - ricePart, budget - ricePart * riceNeed);
    var mixed = build("mixed", [["rice", ricePart], [legume, legumePart]], legume);

    var rotation = build("rotation", [[cash, affordable(cash, area, budget)]], cash);
    var green = build("green", [["sesbania", affordable("sesbania", area, budget)]], "sesbania");

    var strategies = [current, mixed, rotation, green];
    var ranked = strategies.slice().sort(function (a, b) {
      return b.scores.overall - a.scores.overall;
    });
    return {
      needs: needs,
      fit: fit,
      baseline_m3: baseline,
      budget_m3: budget,
      strategies: strategies, // fixed order: current, mixed, rotation, green
      ranked: ranked // best first
    };
  }

  function basinSavings(data, basin, riceNeed, otherNeed, share) {
    var info = data.basins[basin];
    var riceTareas = data.constants.national_rice_tareas * info.rice_share;
    var field = share * riceTareas * (riceNeed - otherNeed) / 1e6;
    var damShare = {};
    Object.keys(info.dams).forEach(function (name) {
      damShare[name] = field / info.dams[name];
    });
    return { tareas: share * riceTareas, field_million_m3: field, dam_share: damShare };
  }

  var api = { suitability: suitability, compare: compare, basinSavings: basinSavings };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GTEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
