// ===== Poké_Mystery Main =====
// State management, orchestration, init.
// Attaches to window.Poke_Mystery.

Poke_Mystery.main = (function() {

  var state = {
    phase: "intro",           // intro | quiz | briefcase | trio | chosen
    currentQuestionIndex: 0,
    userVector: [0, 0, 0, 0, 0],
    activeQuestions: [],
    trio: [],
    chosenPokemon: null,
    isShiny: false
  };

  var pokemonData = [];
  var engine = Poke_Mystery.engine;
  var ui = Poke_Mystery.ui;
  var env = Poke_Mystery.environment;

  // --- Init ---

  function init() {
    ui.init();
    env.init();

    // Pokemon data is loaded inline by the build script; for dev, it's loaded
    // from the global variable set by pokemon_coords.json
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
    state.chosenPokemon = null;
    state.isShiny = false;
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
      // Visual feedback
      btn.classList.add("selected");
      setTimeout(function() {
        answerQuestion(weight);
      }, 200);
    });
  }

  function answerQuestion(weight) {
    state.userVector = engine.accumulate(state.userVector, weight);
    env.update(state.userVector);
    state.currentQuestionIndex++;

    showNextQuestion();
  }

  function finishQuiz() {
    if (pokemonData.length === 0) {
      // Fallback: if data isn't loaded, grab a random entry as mock
      state.trio = [sampleFallbackPokemon()];
      showTrio();
      return;
    }

    state.trio = engine.nearestNeighbors(state.userVector, pokemonData, 3);
    showBriefcase();
  }

  function showBriefcase() {
    state.phase = "briefcase";
    ui.showBriefcase(function() {
      showTrio();
    });
  }

  function showTrio() {
    state.phase = "trio";
    ui.showTrio(state.trio, function(pokemon) {
      choosePokemon(pokemon);
    });
  }

  function choosePokemon(pokemon) {
    state.chosenPokemon = pokemon;
    state.isShiny = engine.shinyRoll();
    state.phase = "chosen";

    ui.showShinyRoll(pokemon, state.isShiny, function() {
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
