// ===== Poké_Mystery Engine =====
// Vector accumulation, nearest-neighbor matching, shiny roll.
// Attaches to window.Poke_Mystery.

Poke_Mystery.engine = (function() {

  // --- Constants ---
  var SHINY_ODDS = 50;  // 1-in-50

  // --- Question sampling ---

  function sampleQuestions(pool, count) {
    // Stratified sample: pick count/5 from each primary axis
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var perAxis = Math.floor(count / axes.length);
    var sampled = [];

    axes.forEach(function(axis) {
      var group = pool.filter(function(q) { return q.primary === axis; });
      shuffle(group);
      sampled = sampled.concat(group.slice(0, perAxis));
    });

    shuffle(sampled);
    return sampled;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // --- Vector accumulation ---

  function accumulate(vector, weight) {
    // vector is [reach, tempo, nature, tether, aura]
    // weight is { reach, tempo, nature, tether, aura }
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var out = vector.slice();
    axes.forEach(function(axis, i) {
      out[i] += (weight[axis] || 0);
    });
    return out;
  }

  // --- Nearest-neighbor matching ---

  function nearestNeighbors(userVector, pokemonData, n) {
    n = n || 3;
    var scored = pokemonData.map(function(p) {
      var dist = 0;
      for (var i = 0; i < 5; i++) {
        var d = userVector[i] - p.coords[i];
        dist += d * d;
      }
      return { pokemon: p, distance: Math.sqrt(dist) };
    });
    scored.sort(function(a, b) { return a.distance - b.distance; });
    return scored.slice(0, n).map(function(s) { return s.pokemon; });
  }

  // --- Shiny roll ---

  function shinyRoll() {
    return Math.floor(Math.random() * SHINY_ODDS) === 0;
  }

  // --- Public API ---

  return {
    sampleQuestions: sampleQuestions,
    accumulate: accumulate,
    nearestNeighbors: nearestNeighbors,
    shinyRoll: shinyRoll
  };

})();
