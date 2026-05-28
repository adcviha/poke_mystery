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

  function showPokeballReveal(trio, shinyIndex, onLockIn) {
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
          var prompt = el("div", "ball-prompt", "Click again to choose");

          wrap.appendChild(art);
          wrap.appendChild(nameEl);
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

  function showShinyRoll(pokemon, isShiny, phrase, onViewMap, onRestart) {
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

    if (phrase) {
      var flavorEl = el("div", "shiny-flavor", phrase);
      reveal.appendChild(flavorEl);
    }

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

  var AXIS_PAIRS = [
    { x: 0, y: 1 },
    { x: 2, y: 3 },
    { x: 4, y: 0 },
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ];

  function showGallery(userVector, trio, chosenPokemon, allPokemon, onClose) {
    var hue = Poke_Mystery.colors.AXIS_HUE;

    var overlay = el("div", "gallery-overlay");
    var canvas = el("canvas", "gallery-canvas");
    var ctx = canvas.getContext("2d");

    var currentPair = 0;

    // Symbolic toggle buttons — colored circles
    var toggles = el("div", "gallery-toggles");
    AXIS_PAIRS.forEach(function(pair, i) {
      var btn = el("button", "gallery-symbtn" + (i === 0 ? " active" : ""));
      var c1 = el("span", "gallery-symdot");
      c1.style.backgroundColor = "hsl(" + hue[["reach","tempo","nature","tether","aura"][pair.x]] + ", 55%, 55%)";
      var c2 = el("span", "gallery-symdot");
      c2.style.backgroundColor = "hsl(" + hue[["reach","tempo","nature","tether","aura"][pair.y]] + ", 55%, 55%)";
      btn.appendChild(c1);
      btn.appendChild(c2);
      btn.addEventListener("click", function() {
        currentPair = i;
        var allBtns = toggles.querySelectorAll(".gallery-symbtn");
        allBtns.forEach(function(t) { t.classList.remove("active"); });
        btn.classList.add("active");
        drawGallery(canvas, ctx, pair.x, pair.y, userVector, trio, chosenPokemon, allPokemon);
      });
      toggles.appendChild(btn);
    });

    // Close button
    var closeBtn = el("button", "gallery-close", "×");
    closeBtn.addEventListener("click", onClose);

    // Placeholder counters
    var counters = el("div", "gallery-counters");
    var stepsEl = el("span", "gallery-counter", "Steps: 0");
    var ballsEl = el("span", "gallery-counter", "Balls: 0");
    counters.appendChild(stepsEl);
    counters.appendChild(ballsEl);

    overlay.appendChild(closeBtn);
    overlay.appendChild(canvas);
    overlay.appendChild(toggles);
    overlay.appendChild(counters);
    document.body.appendChild(overlay);

    // Escape to close
    function onKey(e) {
      if (e.key === "Escape") { onClose(); }
    }
    document.addEventListener("keydown", onKey);

    function cleanup() {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    // Override onClose to clean up
    var wrappedClose = function() {
      cleanup();
      onClose();
    };
    closeBtn.removeEventListener("click", onClose);
    closeBtn.addEventListener("click", wrappedClose);
    // Also update escape handler
    document.removeEventListener("keydown", onKey);
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") wrappedClose();
    });
    window.addEventListener("resize", resize);

    function resize() {
      var w = overlay.clientWidth;
      var h = overlay.clientHeight;
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

    resize();
  }

  function drawGallery(canvas, ctx, xAxis, yAxis, userVector, trio, chosenPokemon, allPokemon) {
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);
    if (W <= 0 || H <= 0) return;

    var colors = Poke_Mystery.colors;

    // Dark void
    ctx.fillStyle = "#080c12";
    ctx.fillRect(0, 0, W, H);

    // Coordinate range
    var xMin = -5.5, xMax = 5.5, yMin = -5.5, yMax = 5.5;

    function toX(val) { return ((val - xMin) / (xMax - xMin)) * W; }
    function toY(val) { return ((yMax - val) / (yMax - yMin)) * H; }

    // All Pokemon dots
    var trioIds = trio ? trio.map(function(p) { return p.id; }) : [];
    var chosenId = chosenPokemon ? chosenPokemon.id : -1;

    allPokemon.forEach(function(p) {
      var cx = toX(p.coords[xAxis]);
      var cy = toY(p.coords[yAxis]);
      if (cx < -4 || cx > W + 4) return;
      if (cy < -4 || cy > H + 4) return;

      if (trioIds.indexOf(p.id) !== -1 || p.id === chosenId) return;

      ctx.fillStyle = colors.dotColor(p.coords);
      ctx.beginPath();
      ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Trio members highlighted
    if (trio) {
      trio.forEach(function(p, i) {
        var cx = toX(p.coords[xAxis]);
        var cy = toY(p.coords[yAxis]);

        var isChosen = p.id === chosenId;
        var size = isChosen ? 5 : 3.5;
        var alpha = isChosen ? 0.9 : 0.65;

        var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 4);
        var hue = isChosen ? 45 : (colors.AXIS_HUE[colors.AXIS_ORDER[
          [0,1,2,3,4].sort(function(a,b){
            return Math.abs(p.coords[b]) - Math.abs(p.coords[a]);
          })[0]
        ]] || 200);
        glow.addColorStop(0, "hsla(" + hue + ", 60%, 60%, " + alpha + ")");
        glow.addColorStop(1, "hsla(" + hue + ", 60%, 60%, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "hsla(" + hue + ", 50%, 55%, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();

        if (isChosen) {
          ctx.strokeStyle = "hsla(45, 70%, 55%, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, size + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // User position marker
    var ux = toX(userVector[xAxis]);
    var uy = toY(userVector[yAxis]);

    var userGlow = ctx.createRadialGradient(ux, uy, 0, ux, uy, 20);
    userGlow.addColorStop(0, "rgba(255,200,60,0.45)");
    userGlow.addColorStop(0.5, "rgba(255,180,40,0.12)");
    userGlow.addColorStop(1, "rgba(255,160,30,0)");
    ctx.fillStyle = userGlow;
    ctx.beginPath();
    ctx.arc(ux, uy, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,210,80,0.9)";
    ctx.beginPath();
    ctx.arc(ux, uy, 4, 0, Math.PI * 2);
    ctx.fill();
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
