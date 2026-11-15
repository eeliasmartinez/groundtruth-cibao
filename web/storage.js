// Optional, device-only storage for a farm plan. No network requests or account data.
(function () {
  "use strict";
  var KEY = "groundtruth-cibao-plan-v1";
  var SOILS = ["clay", "loam", "sandy"];
  var PRIORITIES = ["water", "soil", "income"];
  var LANGUAGES = ["es", "en"];

  function validChoice(value, choices, fallback) {
    return choices.indexOf(value) >= 0 ? value : fallback;
  }
  // The zone is kept by its name, so a saved plan still opens the right place if the
  // list of zones changes order or grows. Older records only had the position.
  function normalize(plan, zoneNames, strategies) {
    if (!plan || typeof plan !== "object") return null;
    var zone = typeof plan.zoneName === "string" ? zoneNames.indexOf(plan.zoneName) : Number(plan.zone);
    var month = Number(plan.month);
    var area = Number(plan.area);
    var allocation = Number(plan.allocation);
    var basinShare = Number(plan.basinShare);
    if (!isFinite(zone) || zone % 1 || zone < 0 || zone >= zoneNames.length) return null;
    if (!isFinite(month) || month % 1 || month < 1 || month > 12) return null;
    if (!isFinite(area) || area < 1 || area > 20000) return null;
    if (!isFinite(allocation) || allocation < 0 || allocation > 1) return null;
    if (!isFinite(basinShare) || basinShare < 0 || basinShare > 1) basinShare = 0.25;
    return {
      lang: validChoice(plan.lang, LANGUAGES, "es"),
      zone: zone,
      zoneName: zoneNames[zone],
      soil: validChoice(plan.soil, SOILS, "clay"),
      month: month,
      area: area,
      priority: validChoice(plan.priority, PRIORITIES, "income"),
      allocation: allocation,
      riceAllowed: typeof plan.riceAllowed === "boolean" ? plan.riceAllowed : true,
      salty: plan.salty === true,
      selected: plan.selected === null || strategies.indexOf(plan.selected) >= 0 ? plan.selected : null,
      basinShare: basinShare,
      easyMode: plan.easyMode === true
    };
  }

  var lastWritten = null; // skip writing the same plan again on every redraw

  window.GTStorage = {
    load: function (zoneNames, strategies) {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return { plan: null, error: false };
        lastWritten = raw;
        var record = JSON.parse(raw);
        if (!record || record.version !== 1) return { plan: null, error: false };
        var plan = normalize(record.plan, zoneNames, strategies);
        if (plan) delete plan.zoneName; // the page itself works with the position
        return { plan: plan, error: false };
      } catch (error) {
        return { plan: null, error: true };
      }
    },
    save: function (plan, zoneNames, strategies) {
      try {
        var safePlan = normalize({ zoneName: zoneNames[plan.zone], lang: plan.lang, soil: plan.soil, month: plan.month,
          area: plan.area, priority: plan.priority, allocation: plan.allocation, riceAllowed: plan.riceAllowed,
          salty: plan.salty, selected: plan.selected, basinShare: plan.basinShare, easyMode: plan.easyMode }, zoneNames, strategies);
        if (!safePlan) return false;
        var text = JSON.stringify({ version: 1, plan: safePlan });
        if (text === lastWritten) return true;
        localStorage.setItem(KEY, text);
        lastWritten = text;
        return true;
      } catch (error) {
        return false;
      }
    },
    clear: function () {
      try {
        localStorage.removeItem(KEY);
        lastWritten = null;
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}());
