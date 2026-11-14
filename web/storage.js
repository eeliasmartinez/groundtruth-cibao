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
  function normalize(plan, zoneCount, strategies) {
    if (!plan || typeof plan !== "object") return null;
    var zone = Number(plan.zone);
    var month = Number(plan.month);
    var area = Number(plan.area);
    var allocation = Number(plan.allocation);
    var basinShare = Number(plan.basinShare);
    if (!isFinite(zone) || zone % 1 || zone < 0 || zone >= zoneCount) return null;
    if (!isFinite(month) || month % 1 || month < 1 || month > 12) return null;
    if (!isFinite(area) || area < 1 || area > 20000) return null;
    if (!isFinite(allocation) || allocation < 0 || allocation > 1) return null;
    if (!isFinite(basinShare) || basinShare < 0 || basinShare > 1) basinShare = 0.25;
    return {
      lang: validChoice(plan.lang, LANGUAGES, "es"),
      zone: zone,
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

  window.GTStorage = {
    load: function (zoneCount, strategies) {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return { plan: null, error: false };
        var record = JSON.parse(raw);
        if (!record || record.version !== 1) return { plan: null, error: false };
        return { plan: normalize(record.plan, zoneCount, strategies), error: false };
      } catch (error) {
        return { plan: null, error: true };
      }
    },
    save: function (plan, zoneCount, strategies) {
      try {
        var safePlan = normalize(plan, zoneCount, strategies);
        if (!safePlan) return false;
        localStorage.setItem(KEY, JSON.stringify({ version: 1, plan: safePlan }));
        return true;
      } catch (error) {
        return false;
      }
    },
    clear: function () {
      try {
        localStorage.removeItem(KEY);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}());
