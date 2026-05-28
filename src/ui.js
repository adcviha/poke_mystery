// ===== Poké_Mystery UI =====
// Quiz interface, briefcase reveal, trio selection, shiny animation.
// Attaches to window.Poke_Mystery.

Poke_Mystery.ui = (function() {

  var container;

  // --- DOM helpers ---

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function on(sel, evt, fn) {
    var target = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (target) target.addEventListener(evt, fn);
  }

  function off(sel, evt, fn) {
    var target = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (target) target.removeEventListener(evt, fn);
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // --- Intro screen ---

  function showIntro(onStart) {
    clear(container);
    var screen = el("div", "screen intro-screen");

    var tagline = el("p", "intro-tagline", "Take a quiz to reveal a Pok&eacute;mon mystery.");
    var btn = el("button", "btn-start", "Begin");
    btn.addEventListener("click", onStart);

    screen.appendChild(tagline);
    screen.appendChild(btn);
    container.appendChild(screen);
  }

  // --- Question screen ---

  function showQuestion(question, index, total, currentVector, onAnswer) {
    clear(container);
    var screen = el("div", "screen question-screen");

    var progress = el("div", "question-progress", (index + 1) + " / " + total);
    screen.appendChild(progress);

    var text = el("div", "question-text", question.text);
    screen.appendChild(text);

    var opts = el("div", "question-options");
    var numOpts = question.options.length;
    var optClass = "opt-" + numOpts;

    question.options.forEach(function(option) {
      var btn = el("button", "option-btn " + optClass, option.text);
      btn.addEventListener("click", function() {
        onAnswer(option.weight, btn);
      });
      opts.appendChild(btn);
    });

    screen.appendChild(opts);
    container.appendChild(screen);
  }

  // --- Aesthetic preference question ---

  function showAestheticQuestion(question, onAnswer) {
    clear(container);
    var screen = el("div", "screen aesthetic-screen");

    var label = el("div", "aesthetic-label", "One last thing...");
    screen.appendChild(label);

    var text = el("div", "question-text", question.text);
    screen.appendChild(text);

    var opts = el("div", "question-options");
    var numOpts = question.options.length;

    question.options.forEach(function(option) {
      var btn = el("button", "option-btn opt-" + numOpts, option.text);
      btn.addEventListener("click", function() {
        onAnswer(option.pref, btn);
      });
      opts.appendChild(btn);
    });

    screen.appendChild(opts);
    container.appendChild(screen);
  }

  // --- Briefcase transition ---

  function showBriefcase(onComplete) {
    clear(container);
    var screen = el("div", "screen briefcase-screen");

    var briefcase = el("div", "briefcase");
    var inner = el("div", "briefcase-inner");
    var label = el("div", "briefcase-label", "Professor Birch's briefcase rests in the grass.");
    briefcase.appendChild(inner);
    briefcase.appendChild(label);

    screen.appendChild(briefcase);
    container.appendChild(screen);

    setTimeout(function() {
      briefcase.classList.add("open");
      setTimeout(function() { onComplete(briefcase); }, 800);
    }, 1800);
  }

  // --- "You are..." screen ---

  function showYouAre(text, onComplete) {
    clear(container);
    var screen = el("div", "screen you-are-screen");

    var label = el("div", "you-are-label", "The briefcase stirs...");
    var body = el("div", "you-are-text", text);

    screen.appendChild(label);
    screen.appendChild(body);

    var done = false;
    function advance() {
      if (done) return;
      done = true;
      onComplete();
    }

    screen.addEventListener("click", advance);

    // Auto-advance after a generous read time
    setTimeout(advance, 6000);

    container.appendChild(screen);
  }

  // --- Pokéball reveal ---
  // Three closed Poké Balls appear. Genus + type hint shown before opening.
  // Click a ball to peek at the Pokémon + flavour text. Click again to lock in.
  // No shiny indication until after the choice is locked.

  var TYPE_HINTS = {
    fire: "The ball is warm to the touch.",
    water: "The ball is slick with seawater.",
    electric: "The ball crackles faintly with static.",
    grass: "The ball smells of fresh leaves and damp earth.",
    ice: "The ball is cold enough to fog your breath.",
    ghost: "The ball shimmers with an eerie, distant light.",
    psychic: "The ball hums — not audibly. Just... a feeling.",
    dragon: "The ball thrums with something ancient.",
    dark: "The ball drinks in the light around it.",
    fairy: "The ball glimmers with a soft, playful light.",
    fighting: "The ball vibrates with restrained force.",
    flying: "The ball feels lighter than it should.",
    poison: "The ball tingles faintly against your fingertips.",
    ground: "The ball is heavy. Soil and stone heavy.",
    rock: "The ball is solid, unyielding. Ancient.",
    bug: "The ball buzzes, just barely. Or maybe it's your pulse.",
    steel: "The ball is cool, precise. Machined.",
    normal: "The ball rests quietly. Unassuming. Content."
  };

  var BALL_TYPES = [
    { name: "poke",    top: "#e04040", bottom: "#f0f0f0" },
    { name: "great",   top: "#3878d8", bottom: "#f0f0f0" },
    { name: "ultra",   top: "#f8c040", bottom: "#f0f0f0" },
    { name: "master",  top: "#7838c8", bottom: "#f0f0f0" },
    { name: "safari",  top: "#78a050", bottom: "#f0f0f0" },
    { name: "moon",    top: "#3868c0", bottom: "#f0f0f0" },
    { name: "love",    top: "#f08098", bottom: "#f0f0f0" },
    { name: "heavy",   top: "#485868", bottom: "#c0c8d0" },
    { name: "luxury",  top: "#181820", bottom: "#f0f0f0" },
    { name: "premier", top: "#f0f0f0", bottom: "#f0f0f0" }
  ];

  function pickBallTypes() {
    var pool = BALL_TYPES.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
  }

  function renderBall(ballType, isShiny) {
    var ball = el("div", "ball" + (isShiny ? " shiny" : ""));
    ball.style.setProperty("--ball-top", ballType.top);
    ball.style.setProperty("--ball-bottom", ballType.bottom);
    var top = el("div", "ball-top");
    var band = el("div", "ball-band");
    var btn = el("div", "ball-btn");
    var shine = el("div", "ball-shine");
    ball.appendChild(top);
    ball.appendChild(band);
    ball.appendChild(btn);
    ball.appendChild(shine);
    return ball;
  }

  function showPokeballReveal(trio, phrases, shinyIndex, onLockIn) {
    var screen = document.querySelector(".briefcase-screen");
    if (!screen) return;
    clear(screen);

    var ballTypes = pickBallTypes();
    var wrapper = el("div", "reveal-wrapper");
    var title = el("div", "reveal-title", "Three Poké Balls lie inside...");
    wrapper.appendChild(title);

    var ballsRow = el("div", "reveal-balls");
    var openedIndex = -1;
    var order = [1, 0, 2]; // shadow, mirror, stranger

    function render() {
      clear(ballsRow);

      order.forEach(function(origIdx, displayIdx) {
        var pokemon = trio[origIdx];
        var phrase = (phrases && phrases[origIdx]) ? phrases[origIdx] : "";
        var ballType = ballTypes[displayIdx];
        var isOpen = (displayIdx === openedIndex);
        var isShinyCard = (origIdx === shinyIndex);
        var primaryType = (pokemon.types && pokemon.types[0]) ? pokemon.types[0] : "normal";
        var typeHint = TYPE_HINTS[primaryType] || TYPE_HINTS["normal"];

        var wrap = el("div", "ball-wrap" + (isOpen ? " open" : ""));

        if (!isOpen) {
          // Closed state: ball sprite + genus + type hint
          wrap.appendChild(renderBall(ballType, isShinyCard));
          wrap.appendChild(el("div", "ball-genus", pokemon.genus || ""));
          wrap.appendChild(el("div", "ball-hint", typeHint));

          wrap.addEventListener("click", function() {
            openedIndex = displayIdx;
            render();
          });
        } else {
          // Open state: artwork (shiny if this is the shiny card) + name + flavour + prompt
          var art = el("img", "ball-artwork");
          art.src = isShinyCard ? (pokemon.artwork_shiny_url || pokemon.artwork_url) : (pokemon.artwork_url || "");
          art.alt = pokemon.name;
          art.loading = "lazy";

          var nameEl = el("div", "ball-name", capitalise(pokemon.name) + (isShinyCard ? ' <span class="ball-star">&#9733;</span>' : ""));
          var flavor = el("div", "ball-flavor", phrase);
          var prompt = el("div", "ball-prompt", "Click again to choose");

          wrap.appendChild(art);
          wrap.appendChild(nameEl);
          wrap.appendChild(flavor);
          wrap.appendChild(prompt);

          wrap.addEventListener("click", function() {
            onLockIn(pokemon);
          });
        }

        ballsRow.appendChild(wrap);
      });
    }

    render();
    wrapper.appendChild(ballsRow);
    screen.appendChild(wrapper);
  }

  // --- Shiny reveal ---

  function showShinyRoll(pokemon, isShiny, onViewMap, onRestart) {
    var screen = document.querySelector(".briefcase-screen");
    if (!screen) return;
    clear(screen);

    var reveal = el("div", "shiny-reveal");

    var img = el("img", "shiny-artwork");
    img.src = isShiny ? (pokemon.artwork_shiny_url || pokemon.artwork_url) : pokemon.artwork_url;
    img.alt = pokemon.name;

    var nameWrap = el("div", "shiny-name-wrap");

    var nameField = el("span", "shiny-name", capitalise(pokemon.name));

    if (isShiny) {
      reveal.classList.add("is-shiny");
      var flash = el("div", "shiny-flash");
      reveal.appendChild(flash);

      var star = el("span", "shiny-star", "★");
      nameWrap.appendChild(nameField);
      nameWrap.appendChild(star);
    } else {
      nameWrap.appendChild(nameField);
    }

    var genusField = el("div", "shiny-genus", pokemon.genus || "");

    reveal.appendChild(img);
    reveal.appendChild(nameWrap);
    reveal.appendChild(genusField);

    var btnRow = el("div", "shiny-btns");

    var mapBtn = el("button", "btn-retry", "Something else…");
    mapBtn.addEventListener("click", onViewMap);

    var retryBtn = el("button", "btn-retry", "Take the quiz again");
    retryBtn.addEventListener("click", onRestart);

    btnRow.appendChild(mapBtn);
    btnRow.appendChild(retryBtn);
    reveal.appendChild(btnRow);
    screen.appendChild(reveal);
  }

  // --- Gallery star chart ---

  var AXIS_LABELS = [
    { name: "Reach",    neg: "Humble",    pos: "Cosmic" },
    { name: "Tempo",    neg: "Mercurial", pos: "Stoic" },
    { name: "Nature",   neg: "Wild",      pos: "Wrought" },
    { name: "Tether",   neg: "Kith",      pos: "Kinless" },
    { name: "Aura",     neg: "Earnest",   pos: "Capricious" }
  ];

  var AXIS_PAIRS = [
    { label: "Reach / Tempo",      x: 0, y: 1 },
    { label: "Nature / Tether",    x: 2, y: 3 },
    { label: "Aura / Reach",       x: 4, y: 0 },
    { label: "Tempo / Nature",     x: 1, y: 2 },
    { label: "Tether / Aura",      x: 3, y: 4 }
  ];

  function showGallery(userVector, trio, chosenPokemon, allPokemon, onRestart) {
    var container = document.getElementById("app");
    if (!container) return;
    clear(container);

    var screen = el("div", "screen gallery-screen");
    var canvas = el("canvas", "gallery-canvas");
    var ctx = canvas.getContext("2d");

    var currentPair = 0;

    var toggles = el("div", "gallery-toggles");
    AXIS_PAIRS.forEach(function(pair, i) {
      var btn = el("button", "gallery-toggle" + (i === 0 ? " active" : ""), pair.label);
      btn.addEventListener("click", function() {
        currentPair = i;
        var allToggles = toggles.querySelectorAll(".gallery-toggle");
        allToggles.forEach(function(t) { t.classList.remove("active"); });
        btn.classList.add("active");
        drawGallery(canvas, ctx, pair.x, pair.y, userVector, trio, chosenPokemon, allPokemon);
      });
      toggles.appendChild(btn);
    });

    var restartBtn = el("button", "btn-retry gallery-restart", "Take the quiz again");
    restartBtn.addEventListener("click", onRestart);

    screen.appendChild(canvas);
    screen.appendChild(toggles);
    screen.appendChild(restartBtn);
    container.appendChild(screen);

    function resize() {
      var w = screen.clientWidth;
      var h = Math.max(window.innerHeight * 0.55, 350);
      var dpr = window.devicePixelRatio || 1;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      drawGallery(canvas, ctx, AXIS_PAIRS[currentPair].x, AXIS_PAIRS[currentPair].y,
        userVector, trio, chosenPokemon, allPokemon);
    }

    window.addEventListener("resize", resize);
    resize();
  }

  function drawGallery(canvas, ctx, xAxis, yAxis, userVector, trio, chosenPokemon, allPokemon) {
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);
    if (W <= 0 || H <= 0) return;

    var pad = { top: 32, right: 28, bottom: 36, left: 36 };
    var pw = W - pad.left - pad.right;
    var ph = H - pad.top - pad.bottom;

    // Coordinate range: [-5, +5] for both axes
    var xMin = -5.5, xMax = 5.5, yMin = -5.5, yMax = 5.5;

    function toX(val) { return pad.left + ((val - xMin) / (xMax - xMin)) * pw; }
    function toY(val) { return pad.top + ((yMax - val) / (yMax - yMin)) * ph; }

    var colors = Poke_Mystery.colors;

    // Background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    // Grid lines at axis zero-crossings
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top);
    ctx.lineTo(toX(0), pad.top + ph);
    ctx.moveTo(pad.left, toY(0));
    ctx.lineTo(pad.left + pw, toY(0));
    ctx.stroke();

    // Subtle grid at +/-2.5
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    [-2.5, 2.5].forEach(function(v) {
      ctx.beginPath();
      ctx.moveTo(toX(v), pad.top);
      ctx.lineTo(toX(v), pad.top + ph);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad.left, toY(v));
      ctx.lineTo(pad.left + pw, toY(v));
      ctx.stroke();
    });

    // All Pokemon dots
    var trioIds = trio ? trio.map(function(p) { return p.id; }) : [];
    var chosenId = chosenPokemon ? chosenPokemon.id : -1;

    allPokemon.forEach(function(p) {
      var cx = toX(p.coords[xAxis]);
      var cy = toY(p.coords[yAxis]);
      if (cx < pad.left - 2 || cx > pad.left + pw + 2) return;
      if (cy < pad.top - 2 || cy > pad.top + ph + 2) return;

      // Skip trio members — they get special rendering
      if (trioIds.indexOf(p.id) !== -1 || p.id === chosenId) return;

      ctx.fillStyle = colors.dotColor(p.coords);
      ctx.beginPath();
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Trio members highlighted
    if (trio) {
      trio.forEach(function(p, i) {
        var cx = toX(p.coords[xAxis]);
        var cy = toY(p.coords[yAxis]);

        // Larger dot
        var isChosen = p.id === chosenId;
        var size = isChosen ? 6 : 4.5;
        var alpha = isChosen ? 0.9 : 0.7;

        // Glow under the dot
        var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 3);
        var hue = isChosen ? 45 : (colors.AXIS_HUE[colors.AXIS_ORDER[
          [0,1,2,3,4].sort(function(a,b){
            return Math.abs(p.coords[b]) - Math.abs(p.coords[a]);
          })[0]
        ]] || 200);
        glow.addColorStop(0, "hsla(" + hue + ", 60%, 60%, " + alpha + ")");
        glow.addColorStop(1, "hsla(" + hue + ", 60%, 60%, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = "hsla(" + hue + ", 50%, 55%, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();

        // Ring for chosen
        if (isChosen) {
          ctx.strokeStyle = "hsla(45, 70%, 55%, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, size + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Name label
        ctx.fillStyle = "rgba(220,220,220,0.75)";
        ctx.font = "12px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(capitalise(p.name), cx, cy - size - 6);
      });
    }

    // User position marker
    var ux = toX(userVector[xAxis]);
    var uy = toY(userVector[yAxis]);

    // Outer glow
    var userGlow = ctx.createRadialGradient(ux, uy, 0, ux, uy, 18);
    userGlow.addColorStop(0, "rgba(255,200,60,0.5)");
    userGlow.addColorStop(0.5, "rgba(255,180,40,0.15)");
    userGlow.addColorStop(1, "rgba(255,160,30,0)");
    ctx.fillStyle = userGlow;
    ctx.beginPath();
    ctx.arc(ux, uy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = "rgba(255,210,80,0.9)";
    ctx.beginPath();
    ctx.arc(ux, uy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Axis labels
    var labelStyle = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(200,200,200,0.5)";
    ctx.font = labelStyle;

    // X-axis labels
    var xAxisInfo = AXIS_LABELS[xAxis];
    ctx.textAlign = "left";
    ctx.fillText(xAxisInfo.neg, pad.left, pad.top + ph + 20);
    ctx.textAlign = "right";
    ctx.fillText(xAxisInfo.pos, pad.left + pw, pad.top + ph + 20);
    ctx.textAlign = "center";
    ctx.fillText(xAxisInfo.name, pad.left + pw / 2, pad.top + ph + 20);

    // Y-axis labels
    var yAxisInfo = AXIS_LABELS[yAxis];
    ctx.save();
    ctx.translate(pad.left - 18, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(yAxisInfo.neg, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(pad.left - 18, pad.top);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(yAxisInfo.pos, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(pad.left - 26, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(yAxisInfo.name, 0, 0);
    ctx.restore();
  }

  function capitalise(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // --- Init ---

  function init() {
    container = document.getElementById("app");
  }

  return {
    init: init,
    showIntro: showIntro,
    showQuestion: showQuestion,
    showAestheticQuestion: showAestheticQuestion,
    showYouAre: showYouAre,
    showBriefcase: showBriefcase,
    showPokeballReveal: showPokeballReveal,
    showShinyRoll: showShinyRoll,
    showGallery: showGallery
  };

})();
