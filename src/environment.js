// ===== Poké_Mystery Environment Shifter =====
// Subtle background color transitions based on accumulated 5D vector.
// Attaches to window.Poke_Mystery.

Poke_Mystery.environment = (function() {

  var body;

  function init() {
    body = document.body;
  }

  function update(vector) {
    if (!body) return;

    // Map each axis to hue/saturation shifts
    // Reach: green (Humble=earthy green, Cosmic=deep indigo)
    var r = Math.max(-5, Math.min(5, vector[0]));
    var t = Math.max(-5, Math.min(5, vector[1]));
    var n = Math.max(-5, Math.min(5, vector[2]));
    var th = Math.max(-5, Math.min(5, vector[3]));
    var a = Math.max(-5, Math.min(5, vector[4]));

    // Base hue shifts
    var hueReach = 100 + r * 12;     // Humble=green(100), Cosmic=blue(160)
    var hueTempo = 200 - t * 15;      // Mercurial=red(0), Stoic=blue(200)
    var natureSat = 0.4 + n * 0.06;   // Wild=low sat organic, Wrought=high sat synthetic
    var tetherWarmth = 0.5 - th * 0.05; // Kith=warm, Kinless=cool
    var auraBrightness = 0.85 + a * 0.03; // Earnest=subdued, Capricious=bright

    // Blend into CSS custom properties
    body.style.setProperty("--env-hue", Math.round(hueReach));
    body.style.setProperty("--env-tempo-hue", Math.round(hueTempo));
    body.style.setProperty("--env-saturation", natureSat.toFixed(2));
    body.style.setProperty("--env-warmth", tetherWarmth.toFixed(2));
    body.style.setProperty("--env-brightness", auraBrightness.toFixed(2));

    // Composite background gradient
    var hue1 = Math.round((hueReach + hueTempo) / 2);
    var hue2 = Math.round(hueReach);
    var sat = Math.round(natureSat * 100);
    var light = Math.round(auraBrightness * 100);

    var grad = "linear-gradient(135deg, "
      + "hsl(" + hue1 + ", " + sat + "%, " + Math.round(light - 5) + "%) 0%, "
      + "hsl(" + hue2 + ", " + sat + "%, " + light + "%) 100%)";

    body.style.background = grad;
  }

  // Reset to default
  function reset() {
    if (!body) return;
    body.style.background = "";
    body.style.setProperty("--env-hue", "120");
    body.style.setProperty("--env-tempo-hue", "200");
    body.style.setProperty("--env-saturation", "0.4");
    body.style.setProperty("--env-warmth", "0.5");
    body.style.setProperty("--env-brightness", "0.85");
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

})();
