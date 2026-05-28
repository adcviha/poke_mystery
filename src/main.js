// ===== Poké_Mystery Main =====
// State management, orchestration, init.
// Attaches to window.Poke_Mystery.

Poke_Mystery.main = (function() {

  // --- Toggles ---
  var AESTHETIC_PROBE_ENABLED = false;

  var state = {
    phase: "intro",           // intro | quiz | youare | briefcase | trio | chosen
    currentQuestionIndex: 0,
    userVector: [0, 0, 0, 0, 0],
    activeQuestions: [],
    trio: [],
    trioPhrases: [],           // arrival phrases for each trio card
    shinyIndex: 0,             // which trio card shows shiny (0, 1, or 2)
    chosenPokemon: null,
    isShiny: false,
    aestheticPrefs: {}         // accumulated from aesthetic probe
  };

  var pokemonData = [];
  var engine = Poke_Mystery.engine;
  var ui = Poke_Mystery.ui;
  var env = Poke_Mystery.environment;

  // --- Init ---

  function init() {
    ui.init();
    env.init();

    pokemonData = (window.POKE_MYSTERY_DATA && window.POKE_MYSTERY_DATA.pokemon) || [];

    startQuiz();
  }

  // --- Quiz lifecycle ---

  function startQuiz() {
    state.phase = "intro";
    state.currentQuestionIndex = 0;
    state.userVector = [0, 0, 0, 0, 0];
    state.activeQuestions = engine.sampleQuestions(Poke_Mystery.questions, 15);
    state.trio = [];
    state.trioPhrases = [];
    state.shinyIndex = 0;
    state.chosenPokemon = null;
    state.isShiny = false;
    state.aestheticPrefs = {};
    env.reset();

    ui.showIntro(function() {
      showNextQuestion();
    });
  }

  function showNextQuestion() {
    state.phase = "quiz";
    var idx = state.currentQuestionIndex;
    var questions = state.activeQuestions;

    if (idx >= questions.length) {
      finishQuiz();
      return;
    }

    ui.showQuestion(questions[idx], idx, questions.length, state.userVector, function(weight, btn) {
      btn.classList.add("selected");
      setTimeout(function() {
        answerQuestion(weight);
      }, 200);
    });
  }

  function answerQuestion(weight) {
    state.userVector = engine.accumulate(state.userVector, weight);
    env.update(state.userVector, weight);
    state.currentQuestionIndex++;

    showNextQuestion();
  }

  function finishQuiz() {
    if (AESTHETIC_PROBE_ENABLED && Poke_Mystery.aestheticProbe) {
      showAestheticProbe();
    } else {
      computeAndReveal();
    }
  }

  // --- Aesthetic preference probe ---

  function showAestheticProbe() {
    state.phase = "aesthetic";
    var probeQuestions = Poke_Mystery.aestheticProbe;
    var currentIdx = 0;

    function showNext() {
      if (currentIdx >= probeQuestions.length) {
        computeAndReveal();
        return;
      }

      var q = probeQuestions[currentIdx];
      ui.showAestheticQuestion(q, function(pref, btn) {
        btn.classList.add("selected");
        // Merge pref into accumulated aestheticPrefs
        if (pref.shape) state.aestheticPrefs.shape = pref.shape;
        if (pref.color) state.aestheticPrefs.color = pref.color;
        if (pref.vibe) state.aestheticPrefs.vibe = pref.vibe;
        currentIdx++;
        setTimeout(showNext, 150);
      });
    }

    showNext();
  }

  function computeAndReveal() {
    if (pokemonData.length === 0) {
      state.trio = [sampleFallbackPokemon()];
      state.trioPhrases = [""];
      state.shinyIndex = 0;
      showBriefcase();
      return;
    }

    var hasPrefs = state.aestheticPrefs && (state.aestheticPrefs.shape || state.aestheticPrefs.color || state.aestheticPrefs.vibe);
    state.trio = engine.selectTrio(state.userVector, pokemonData, hasPrefs ? state.aestheticPrefs : null);

    // Generate arrival phrases for each role
    state.trioPhrases = state.trio.map(function(p, i) {
      return engine.phraseForRole(p, i);
    });

    // Pick which card gets the shiny
    state.shinyIndex = engine.shinyWhich();

    // Show "You are..." screen before the briefcase
    showYouAreScreen();
  }

  function showYouAreScreen() {
    state.phase = "youare";
    var description = engine.describeVector(state.userVector);
    ui.showYouAre(description, function() {
      showBriefcase();
    });
  }

  function showBriefcase() {
    state.phase = "briefcase";
    ui.showBriefcase(function() {
      showPokeballReveal();
    });
  }

  function showPokeballReveal() {
    state.phase = "pokeballs";
    ui.showPokeballReveal(state.trio, state.trioPhrases, state.shinyIndex, function(pokemon) {
      state.chosenPokemon = pokemon;
      var pickedShinyCard = (pokemon === state.trio[state.shinyIndex]);
      state.isShiny = pickedShinyCard || engine.shinyRoll();
      state.phase = "chosen";
      ui.showShinyRoll(pokemon, state.isShiny, function() {
        showGallery();
      }, function() {
        startQuiz();
      });
    });
  }

  function showGallery() {
    state.phase = "gallery";
    ui.showGallery(state.userVector, state.trio, state.chosenPokemon, pokemonData, function() {
      startQuiz();
    });
  }

  // --- Fallback (no JSON data loaded, e.g. raw dev file) ---

  function sampleFallbackPokemon() {
    return {
      id: 25,
      name: "pikachu",
      genus: "Mouse Pokémon",
      artwork_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
      artwork_shiny_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png",
      coords: [0, 0, 0, 0, 0],
      types: ["electric"],
      color: "yellow",
      shape: "quadruped",
      generation: "generation-i"
    };
  }

  // --- Public API ---

  return {
    init: init,
    state: state
  };

})();

// Boot on DOM ready
document.addEventListener("DOMContentLoaded", function() {
  Poke_Mystery.main.init();
});
