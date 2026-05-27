// ===== Poké_Mystery Engine =====
// Vector accumulation, trio selection, shiny roll.
// Attaches to window.Poke_Mystery.

Poke_Mystery.engine = (function() {

  // --- Constants ---
  var SHINY_ODDS = 10;  // 1-in-10

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
    var axes = ["reach", "tempo", "nature", "tether", "aura"];
    var out = vector.slice();
    axes.forEach(function(axis, i) {
      out[i] += (weight[axis] || 0);
    });
    return out;
  }

  // --- 5D distance helpers ---

  function axisDistance(a, b) {
    var dist = 0;
    for (var i = 0; i < 5; i++) {
      var d = a[i] - b[i];
      dist += d * d;
    }
    return Math.sqrt(dist);
  }

  function scoreAll(userVector, pokemonData) {
    var scored = pokemonData.map(function(p) {
      return { pokemon: p, distance: axisDistance(userVector, p.coords) };
    });
    scored.sort(function(a, b) { return a.distance - b.distance; });
    return scored;
  }

  // --- Nearest-neighbor matching (simple top-N) ---

  function nearestNeighbors(userVector, pokemonData, n) {
    n = n || 3;
    var scored = scoreAll(userVector, pokemonData);
    return scored.slice(0, n).map(function(s) { return s.pokemon; });
  }

  // --- Diversified trio selection ---
  // Mirror: #1 nearest neighbor (strongest authentic match).
  // Shadow: from top 40, max 5D distance from Mirror while close to user.
  // Stranger: from top 80, max min-distance from both Mirror and Shadow.
  // Visual constraint: trio must have different colors AND different shapes.

  function selectTrio(userVector, pokemonData, aestheticPrefs) {
    var scored = scoreAll(userVector, pokemonData);

    // Mirror — closest match
    var mirror = scored[0].pokemon;

    // Pool for Shadow: ranks 5–40 (skip the very top clones)
    var shadowCandidates = scored.slice(5, Math.min(40, scored.length));
    var bestShadow = null;
    var bestShadowScore = -Infinity;

    shadowCandidates.forEach(function(s) {
      var distFromMirror = axisDistance(mirror.coords, s.pokemon.coords);
      var score = distFromMirror * 0.7 - s.distance * 0.3;
      if (score > bestShadowScore) {
        bestShadowScore = score;
        bestShadow = s.pokemon;
      }
    });

    // Pool for Stranger: ranks 15–80, distant from both Mirror and Shadow
    var strangerCandidates = scored.slice(15, Math.min(80, scored.length));
    var bestStranger = null;
    var bestStrangerScore = -Infinity;

    strangerCandidates.forEach(function(s) {
      var distFromMirror = axisDistance(mirror.coords, s.pokemon.coords);
      var distFromShadow = axisDistance(bestShadow.coords, s.pokemon.coords);
      var minDist = Math.min(distFromMirror, distFromShadow);
      var score = minDist * 0.7 - s.distance * 0.3;
      if (score > bestStrangerScore) {
        bestStrangerScore = score;
        bestStranger = s.pokemon;
      }
    });

    var trio = [mirror, bestShadow, bestStranger];

    // --- Visual diversity constraint ---
    // If any two share the same color or shape, swap the later one
    // for another candidate with a different visual profile.
    if (aestheticPrefs) {
      trio = applyAestheticFilter(trio, scored, aestheticPrefs);
    } else {
      trio = ensureVisualDiversity(trio, scored);
    }

    return trio;
  }

  // Ensure all three Pokémon have different colors AND different shapes.
  function ensureVisualDiversity(trio, scored) {
    var result = trio.slice();

    // Fix Shadow if it shares color or shape with Mirror
    if (sharesVisual(result[0], result[1])) {
      for (var i = 5; i < Math.min(60, scored.length); i++) {
        if (!sharesVisual(result[0], scored[i].pokemon) &&
            !sharesVisual(result[2], scored[i].pokemon)) {
          result[1] = scored[i].pokemon;
          break;
        }
      }
    }

    // Fix Stranger if it shares color or shape with Mirror or Shadow
    if (sharesVisual(result[0], result[2]) || sharesVisual(result[1], result[2])) {
      for (var j = 15; j < Math.min(100, scored.length); j++) {
        if (!sharesVisual(result[0], scored[j].pokemon) &&
            !sharesVisual(result[1], scored[j].pokemon)) {
          result[2] = scored[j].pokemon;
          break;
        }
      }
    }

    return result;
  }

  function sharesVisual(a, b) {
    if (!a || !b) return false;
    var aColor = a.color || "";
    var bColor = b.color || "";
    var aShape = a.shape || "";
    var bShape = b.shape || "";
    return aColor === bColor || aShape === bShape;
  }

  // --- Aesthetic preference filter ---
  // aestheticPrefs: { shape: "soft"|"sharp"|null, color: "warm"|"cool"|null, vibe: "cute"|"cool"|"weird"|null }
  // Re-ranks the top 60 by: distance_rank * 0.6 + aesthetic_score * 0.4

  var SHAPE_SOFT = ["ball", "blob", "squiggle", "upright"];
  var SHAPE_SHARP = ["armor", "humanoid", "bug-wings", "legs", "quadruped", "wings", "heads"];
  var COLOR_WARM = ["red", "yellow", "pink", "brown"];
  var COLOR_COOL = ["blue", "green", "purple", "white", "gray", "black"];

  function applyAestheticFilter(trio, scored, prefs) {
    var topPool = scored.slice(0, Math.min(60, scored.length));

    var reranked = topPool.map(function(s, idx) {
      var score = aestheticScore(s.pokemon, prefs);
      // Blend: distance rank normalized to [0,1] and aesthetic score
      var rankNorm = 1 - (idx / topPool.length);
      var combined = rankNorm * 0.6 + score * 0.4;
      return { pokemon: s.pokemon, combined: combined };
    });

    reranked.sort(function(a, b) { return b.combined - a.combined; });

    // Pick Mirror from top of reranked, then Shadow/Stranger with visual diversity
    // Mirror: top aesthetic match that's also in the original top 10 by distance
    var mirror = reranked[0].pokemon;
    var shadow = null;
    var stranger = null;

    // Shadow: find a visually different one from the reranked pool
    for (var i = 1; i < reranked.length; i++) {
      if (!sharesVisual(mirror, reranked[i].pokemon)) {
        shadow = reranked[i].pokemon;
        break;
      }
    }
    if (!shadow) shadow = reranked[1].pokemon;

    // Stranger: visually different from both
    for (var j = 2; j < reranked.length; j++) {
      if (!sharesVisual(mirror, reranked[j].pokemon) &&
          !sharesVisual(shadow, reranked[j].pokemon)) {
        stranger = reranked[j].pokemon;
        break;
      }
    }
    if (!stranger) stranger = reranked[Math.min(3, reranked.length - 1)].pokemon;

    return [mirror, shadow, stranger];
  }

  function aestheticScore(pokemon, prefs) {
    var score = 0;
    var shape = pokemon.shape || "";
    var color = pokemon.color || "";

    if (prefs.shape === "soft" && SHAPE_SOFT.indexOf(shape) !== -1) score += 1;
    if (prefs.shape === "sharp" && SHAPE_SHARP.indexOf(shape) !== -1) score += 1;

    if (prefs.color === "warm" && COLOR_WARM.indexOf(color) !== -1) score += 1;
    if (prefs.color === "cool" && COLOR_COOL.indexOf(color) !== -1) score += 1;

    // Vibe: uses shape + color as proxy
    if (prefs.vibe === "cute" && (SHAPE_SOFT.indexOf(shape) !== -1 || COLOR_WARM.indexOf(color) !== -1)) score += 0.75;
    if (prefs.vibe === "cool" && (SHAPE_SHARP.indexOf(shape) !== -1 || COLOR_COOL.indexOf(color) !== -1)) score += 0.75;
    if (prefs.vibe === "weird" && (shape === "blob" || shape === "squiggle" || color === "purple" || color === "pink")) score += 0.75;

    return score;
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
    selectTrio: selectTrio,
    shinyRoll: shinyRoll
  };

})();
