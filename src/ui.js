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

  var ROLE_LABELS = ["your mirror", "your shadow", "your stranger"];

  function pickBallTypes() {
    var pool = BALL_TYPES.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
  }

  function renderBall(ballType) {
    var ball = el("div", "ball");
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
        var roleLabel = ROLE_LABELS[origIdx];
        var primaryType = (pokemon.types && pokemon.types[0]) ? pokemon.types[0] : "normal";
        var typeHint = TYPE_HINTS[primaryType] || TYPE_HINTS["normal"];

        var wrap = el("div", "ball-wrap" + (isOpen ? " open" : ""));

        if (!isOpen) {
          // Closed state: ball sprite + genus + type hint + role
          wrap.appendChild(renderBall(ballType));
          wrap.appendChild(el("div", "ball-genus", pokemon.genus || ""));
          wrap.appendChild(el("div", "ball-hint", typeHint));
          wrap.appendChild(el("div", "ball-role", roleLabel));

          wrap.addEventListener("click", function() {
            openedIndex = displayIdx;
            render();
          });
        } else {
          // Open state: artwork + name + flavour text + lock-in prompt
          var art = el("img", "ball-artwork");
          art.src = pokemon.artwork_url || "";
          art.alt = pokemon.name;
          art.loading = "lazy";

          var nameEl = el("div", "ball-name", capitalise(pokemon.name));
          var flavor = el("div", "ball-flavor", phrase);
          var prompt = el("div", "ball-prompt", "Click again to choose");
          var role = el("div", "ball-role", roleLabel);

          wrap.appendChild(art);
          wrap.appendChild(nameEl);
          wrap.appendChild(flavor);
          wrap.appendChild(prompt);
          wrap.appendChild(role);

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

  function showShinyRoll(pokemon, isShiny, onContinue) {
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

      var star = el("span", "shiny-star", "★"); // ★
      nameWrap.appendChild(nameField);
      nameWrap.appendChild(star);
    } else {
      nameWrap.appendChild(nameField);
    }

    var genusField = el("div", "shiny-genus", pokemon.genus || "");

    reveal.appendChild(img);
    reveal.appendChild(nameWrap);
    reveal.appendChild(genusField);

    var retryBtn = el("button", "btn-retry", "Take the quiz again");
    retryBtn.addEventListener("click", onContinue);

    reveal.appendChild(retryBtn);
    screen.appendChild(reveal);
  }

  // --- Environment update ---

  function updateEnvironment(vector) {
    var hues = {
      reach: 120,
      tempo: 200,
      nature: 90,
      tether: 30,
      aura: 280
    };
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var body = document.body;

    axes.forEach(function(axis, i) {
      var val = vector[i];
      var shift = Math.max(-20, Math.min(20, val * 1.5));
      body.style.setProperty("--hue-" + axis, (hues[axis] + shift));
      body.style.setProperty("--sat-" + axis, (50 + Math.abs(val) * 3) + "%");
    });
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
    updateEnvironment: updateEnvironment
  };

})();
