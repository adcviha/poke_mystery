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
    // Start with a white canvas — multiply blend needs a light base
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    // Fill with white — multiply blend needs a light base to darken.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,255,255,0.012)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw drops with multiply blending — overlapping drops compound like real ink.
    ctx.globalCompositeOperation = "multiply";

    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.age++;

      // Expand radius — fast initial spread, then slow
      d.radius = d.startRadius + (d.maxRadius - d.startRadius) * Math.min(1, t * 1.6);
      d.alpha = d.startAlpha * (1 - t);

      if (d.alpha <= 0.003) {
        drops.splice(i, 1);
        continue;
      }

      // Sine-wave drift
      var driftX = Math.sin(d.age * 0.03 + d.phase) * 0.5;
      var driftY = Math.cos(d.age * 0.035 + d.phase) * 0.5;
      d.x += driftX;
      d.y += driftY;

      // Radial gradient: hard center, soft edge
      var grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
      var c = "hsla(" + d.hue + ", " + d.sat + "%, " + d.light + "%, " + d.alpha.toFixed(3) + ")";
      grad.addColorStop(0, c);
      grad.addColorStop(0.25, c);
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
      startRadius: 30 + Math.random() * 30,
      maxRadius: 250 + Math.random() * 350,
      startAlpha: 0.25 + Math.random() * 0.3,
      alpha: 0,
      age: 0,
      lifespan: 250 + Math.random() * 250, // frames (~4-8 sec at 60fps)
      phase: Math.random() * Math.PI * 2
    });
  }

  // --- Reset ---

  function reset() {
    drops = [];
    if (ctx && canvas) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
