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
    aestheticPrefs: {},        // accumulated from aesthetic probe
    explore: {                 // exploration mini-game state (persisted)
      steps: 0,
      balls: 0,
      pokedex: {},             // { id: {s:bool, c:bool} }
      pairs: {},               // per-axis-pair state: visited bitset + player pos
      currentPair: 0
    }
  };

  var pokemonData = [];
  var engine = Poke_Mystery.engine;
  var ui = Poke_Mystery.ui;
  var env = Poke_Mystery.environment;

  // --- Exploration persistence ---

  var EXPLORE_STORAGE_KEY = "poke_mystery_explore_v1";

  function loadExplorationState() {
    try {
      var raw = localStorage.getItem(EXPLORE_STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved.steps !== undefined) state.explore.steps = saved.steps;
        if (saved.balls !== undefined) state.explore.balls = saved.balls;
        if (saved.pokedex) state.explore.pokedex = saved.pokedex;
        if (saved.pairs) state.explore.pairs = saved.pairs;
        if (saved.currentPair !== undefined) state.explore.currentPair = saved.currentPair;
      }
    } catch(e) {
      // Corrupted storage — start fresh
    }
  }

  function saveExplorationState() {
    try {
      var exp = state.explore;
      var data = {
        steps: exp.steps,
        balls: exp.balls,
        pokedex: exp.pokedex,
        pairs: exp.pairs,
        currentPair: exp.currentPair
      };
      localStorage.setItem(EXPLORE_STORAGE_KEY, JSON.stringify(data));
    } catch(e) {
      // localStorage full or unavailable — silently continue
    }
  }

  function onExplorePersist() {
    // Called by explore.js after moves/catches
    if (Poke_Mystery.explore) {
      var expState = Poke_Mystery.explore.getExplorationState();
      state.explore.steps = expState.steps;
      state.explore.balls = expState.balls;
      state.explore.pokedex = expState.pokedex;
      state.explore.currentPair = expState.currentPair;
      if (expState.pairs) {
        state.explore.pairs[expState.currentPair] = {
          visited: expState.pairs.currentVisited,
          playerTX: expState.pairs.playerTX,
          playerTY: expState.pairs.playerTY
        };
      }
      saveExplorationState();
    }
  }

  function awardQuizRewards() {
    state.explore.steps += 20 + Math.floor(Math.random() * 61);  // 20-80
    state.explore.balls += 1 + Math.floor(Math.random() * 5);     // 1-5
    saveExplorationState();
  }

  // --- Init ---

  function init() {
    ui.init();
    env.init();

    pokemonData = (window.POKE_MYSTERY_DATA && window.POKE_MYSTERY_DATA.pokemon) || [];
    loadExplorationState();

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
    ui.showPokeballReveal(state.trio, state.shinyIndex, function(pokemon) {
      state.chosenPokemon = pokemon;
      var pickedShinyCard = (pokemon === state.trio[state.shinyIndex]);
      state.isShiny = pickedShinyCard || engine.shinyRoll();
      state.phase = "chosen";

      // Add chosen Pokémon to Pokédex
      state.explore.pokedex[pokemon.id] = { s: true, c: true };
      if (state.isShiny) state.explore.pokedex[pokemon.id].shiny = true;

      var chosenIdx = state.trio.indexOf(pokemon);
      var chosenPhrase = (state.trioPhrases && chosenIdx >= 0) ? state.trioPhrases[chosenIdx] : "";
      saveExplorationState();

      ui.showShinyRoll(pokemon, state.isShiny, chosenPhrase, function() {
        showGallery();
      }, function() {
        startQuiz();
      });
    });
  }

  function showGallery() {
    state.phase = "gallery";
    awardQuizRewards();

    // Pass current pair state if saved
    var exploreState = {
      steps: state.explore.steps,
      balls: state.explore.balls,
      pokedex: state.explore.pokedex,
      currentPair: state.explore.currentPair,
      pairs: state.explore.pairs[state.explore.currentPair] || null
    };

    ui.showGallery(state.userVector, state.trio, state.chosenPokemon, pokemonData, function() {
      // Save state on close before restarting quiz
      onExplorePersist();
      startQuiz();
    }, exploreState);

    // Wire persist callback from main's scope (ui can't see onExplorePersist)
    if (Poke_Mystery.explore) {
      Poke_Mystery.explore.setPersistCallback(onExplorePersist);
    }
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
