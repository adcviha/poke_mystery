// ===== Poké_Mystery Environment Shifter =====
// CSS-only gradient background that shifts with the user's 5D vector.
// Also exports shared axis colour mapping used by the gallery.
// Attaches to window.Poke_Mystery.

Poke_Mystery.environment = (function() {

  var body;

  // --- Shared axis colour mapping (used by gallery too) ---

  var AXIS_HUE = { reach: 220, tempo: 30, nature: 140, tether: 320, aura: 50 };
  var AXIS_ORDER = ["reach", "tempo", "nature", "tether", "aura"];

  function backgroundGradient(vector) {
    // Rank axes by absolute vector value
    var ranked = AXIS_ORDER.map(function(name, i) {
      return { name: name, val: Math.abs(vector[i]), idx: i };
    });
    ranked.sort(function(a, b) { return b.val - a.val; });

    var primary = ranked[0];
    var secondary = ranked[1];

    var hue1 = (AXIS_HUE[primary.name] + (vector[primary.idx] > 0 ? 15 : -15) + 360) % 360;
    var hue2 = (AXIS_HUE[secondary.name] + (vector[secondary.idx] > 0 ? 15 : -15) + 360) % 360;

    var sat = 38;
    var light = 83;

    return "linear-gradient(135deg, "
      + "hsl(" + hue1 + ", " + sat + "%, " + (light - 3) + "%) 0%, "
      + "hsl(" + hue2 + ", " + sat + "%, " + light + "%) 100%)";
  }

  function dotColor(coords) {
    var bestAxis = 0;
    var bestVal = 0;
    for (var i = 0; i < 5; i++) {
      if (Math.abs(coords[i]) > Math.abs(bestVal)) {
        bestVal = coords[i];
        bestAxis = i;
      }
    }
    var hue = (AXIS_HUE[AXIS_ORDER[bestAxis]] + (bestVal > 0 ? 10 : -10) + 360) % 360;
    var dist = Math.sqrt(
      coords[0]*coords[0] + coords[1]*coords[1] + coords[2]*coords[2] +
      coords[3]*coords[3] + coords[4]*coords[4]
    );
    var alpha = Math.min(0.32, 0.07 + dist * 0.04);
    return "hsla(" + Math.round(hue) + ", 50%, 55%, " + alpha.toFixed(2) + ")";
  }

  // --- Public colour helpers ---

  Poke_Mystery.colors = {
    AXIS_HUE: AXIS_HUE,
    AXIS_ORDER: AXIS_ORDER,
    backgroundGradient: backgroundGradient,
    dotColor: dotColor
  };

  // --- Init ---

  function init() {
    body = document.body;
  }

  // --- Update background from cumulative vector ---

  function update(vector, weight) {
    if (!body) return;
    body.style.background = backgroundGradient(vector);
  }

  // --- Reset ---

  function reset() {
    if (body) {
      body.style.background = "";
    }
  }

  // --- Public API ---

  return {
    init: init,
    update: update,
    reset: reset
  };

})();
