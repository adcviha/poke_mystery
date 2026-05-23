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

    // Progress indicator (subtle — just a number)
    var progress = el("div", "question-progress", (index + 1) + " / " + total);
    screen.appendChild(progress);

    // Question text
    var text = el("div", "question-text", question.text);
    screen.appendChild(text);

    // Options
    var opts = el("div", "question-options");
    var numOpts = question.options.length;
    var optClass = "opt-" + numOpts;  // opt-2, opt-3, opt-4

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

    // After a pause, trigger opening animation
    setTimeout(function() {
      briefcase.classList.add("open");
      setTimeout(function() { onComplete(briefcase); }, 800);
    }, 1800);
  }

  // --- Trio reveal ---

  function showTrio(trio, onChoose) {
    // The briefcase screen stays; we add trio cards inside it
    var screen = document.querySelector(".briefcase-screen");
    if (!screen) return;
    clear(screen);

    var wrapper = el("div", "trio-wrapper");
    var title = el("div", "trio-title", "Three Pok&eacute; Balls lie inside...");
    wrapper.appendChild(title);

    var cards = el("div", "trio-cards");

    trio.forEach(function(pokemon, i) {
      var card = el("div", "pokemon-card card-" + (i + 1));

      var img = el("img", "card-artwork");
      img.src = pokemon.artwork_url || "";
      img.alt = pokemon.name;
      img.loading = "lazy";

      var name = el("div", "card-name", capitalise(pokemon.name));
      var genus = el("div", "card-genus", pokemon.genus || "");

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(genus);

      card.addEventListener("click", function() {
        onChoose(pokemon);
      });

      cards.appendChild(card);
    });

    wrapper.appendChild(cards);
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

    var nameField = el("div", "shiny-name", capitalise(pokemon.name));
    var genusField = el("div", "shiny-genus", pokemon.genus || "");

    if (isShiny) {
      reveal.classList.add("is-shiny");
      var flash = el("div", "shiny-flash");
      reveal.appendChild(flash);
    }

    reveal.appendChild(img);
    reveal.appendChild(nameField);
    reveal.appendChild(genusField);

    if (isShiny) {
      var sparkleText = el("div", "shiny-text", "It's a Shiny Pok&eacute;mon!");
      reveal.appendChild(sparkleText);
    }

    var retryBtn = el("button", "btn-retry", "Take the quiz again");
    retryBtn.addEventListener("click", onContinue);

    reveal.appendChild(retryBtn);
    screen.appendChild(reveal);
  }

  // --- Environment update ---

  function updateEnvironment(vector) {
    // Update CSS custom properties on body for subtle background shifts
    var hues = {
      reach: 120,   // green (nature/cosmic)
      tempo: 200,    // blue (calm/hectic)
      nature: 90,    // yellow-green (organic/synthetic)
      tether: 30,    // warm (kith) to cool (kinless)
      aura: 280      // purple (earnest/capricious)
    };
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var body = document.body;

    axes.forEach(function(axis, i) {
      var val = vector[i];
      // Map axis value [-inf, +inf] to hue shift [-20, +20]
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
    showBriefcase: showBriefcase,
    showTrio: showTrio,
    showShinyRoll: showShinyRoll,
    updateEnvironment: updateEnvironment
  };

})();
