// ===== Poké_Mystery Environment Shifter =====
// CSS gradient background + canvas ink-drop overlay.
// Each answer spawns an expanding coloured drop that swirls and fades.
// Attaches to window.Poke_Mystery.

Poke_Mystery.environment = (function() {

  var body, canvas, ctx;
  var drops = [];
  var animId;

  // --- Init ---

  function init() {
    body = document.body;

    // Canvas overlay for ink drops
    canvas = document.createElement("canvas");
    canvas.className = "env-canvas";
    canvas.setAttribute("aria-hidden", "true");
    body.appendChild(canvas);

    ctx = canvas.getContext("2d");
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    animId = requestAnimationFrame(tick);
  }

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // --- Animation loop ---

  function tick() {
    if (!ctx) return;

    // Fade existing drops — draw a near-transparent white veil over the whole canvas.
    // Over many frames this creates a soft ghost trail as old drops dissolve.
    // Clear canvas fully each frame and redraw active drops.
    // Source-over prevents the moire/banding from additive blending.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.age++;

      // Expand radius, fade alpha
      var progress = d.age / d.lifespan;
      d.radius = d.startRadius + (d.maxRadius - d.startRadius) * progress;
      d.alpha = d.startAlpha * (1 - progress);

      if (d.alpha <= 0.005) {
        drops.splice(i, 1);
        continue;
      }

      // Sine-wave drift for organic swirling
      var driftX = Math.sin(d.age * 0.02 + d.phase) * 0.3;
      var driftY = Math.cos(d.age * 0.025 + d.phase) * 0.3;
      d.x += driftX;
      d.y += driftY;

      // Radial gradient: hard center, soft edge — like an ink drop
      var grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
      var c = "hsla(" + d.hue + ", " + d.sat + "%, " + d.light + "%, " + d.alpha.toFixed(3) + ")";
      grad.addColorStop(0, c);
      grad.addColorStop(0.3, c);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(tick);
  }

  // --- Per-axis drop colours ---
  // Each axis gets a base hue; answer direction shifts it warmer or cooler.

  var AXIS_HUES = { reach: 240, tempo: 30, nature: 130, tether: 340, aura: 50 };

  function axisDropColor(weight) {
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var bestAxis = "reach";
    var bestVal = 0;
    axes.forEach(function(a) {
      if (Math.abs(weight[a] || 0) > Math.abs(bestVal)) { bestVal = weight[a] || 0; bestAxis = a; }
    });
    var hue = (AXIS_HUES[bestAxis] || 200) + (bestVal > 0 ? 35 : -35);
    var sat = 60 + Math.abs(bestVal) * 4;
    var light = 45 + Math.random() * 10;
    return { hue: Math.round(hue), sat: Math.round(sat), light: Math.round(light) };
  }

  // --- Spawn a drop driven by the question axis, CSS gradient by the cumulative vector ---

  function update(vector, weight) {
    if (!body) return;

    // Normalize accumulated vector (for the CSS background)
    var normDiv = 3;
    var r = vector[0] / normDiv;
    var t = vector[1] / normDiv;
    var n = vector[2] / normDiv;
    var a = vector[4] / normDiv;

    var hueReach = 100 + r * 12;
    var hueTempo = 200 - t * 15;
    var natureSat = 0.4 + n * 0.06;
    var auraBrightness = 0.85 + a * 0.03;

    var hue1 = Math.round((hueReach + hueTempo) / 2);
    var hue2 = Math.round(hueReach);
    var sat = Math.round(natureSat * 100);
    var light = Math.round(auraBrightness * 100);

    var grad = "linear-gradient(135deg, "
      + "hsl(" + hue1 + ", " + sat + "%, " + Math.round(light - 5) + "%) 0%, "
      + "hsl(" + hue2 + ", " + sat + "%, " + light + "%) 100%)";

    body.style.background = grad;

    // Drop colour comes from the question's axis, not the cumulative vector
    var dc = weight ? axisDropColor(weight) : { hue: hue1, sat: Math.round(sat * 1.8), light: Math.round(light * 0.5) };
    spawnDrop(dc.hue, dc.sat, dc.light);
  }

  function spawnDrop(hue, sat, light) {
    if (!canvas) return;
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      hue: hue,
      sat: sat,
      light: light,
      startRadius: 5 + Math.random() * 15,
      maxRadius: 120 + Math.random() * 200,
      startAlpha: 0.2 + Math.random() * 0.25,
      alpha: 0,
      age: 0,
      lifespan: 400 + Math.random() * 400, // frames (~7-13 sec at 60fps)
      phase: Math.random() * Math.PI * 2
    });
  }

  // --- Reset ---

  function reset() {
    drops = [];
    if (ctx && canvas) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
