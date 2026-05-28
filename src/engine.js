// ===== Poké_Mystery Engine =====
// Vector accumulation, trio selection, shiny roll, vector description.
// Attaches to window.Poke_Mystery.

Poke_Mystery.engine = (function() {

  // --- Constants ---
  var SHINY_ODDS = 10;  // 1-in-10 personal shiny roll (on chosen Pokémon)

  // --- Question sampling ---

  function sampleQuestions(pool, count) {
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
  // Weighted random draw from top candidates so dense-cluster Pokémon
  // (starters, early-route) get a fair shot alongside extreme outliers.

  function weightedPick(candidates, weightFn) {
    var total = 0;
    var weights = [];
    candidates.forEach(function(c, i) {
      var w = Math.max(0, weightFn(c, i));
      weights.push(w);
      total += w;
    });
    if (total <= 0) return candidates[0];
    var roll = Math.random() * total;
    var cum = 0;
    for (var i = 0; i < candidates.length; i++) {
      cum += weights[i];
      if (roll <= cum) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function selectTrio(userVector, pokemonData, aestheticPrefs) {
    var scored = scoreAll(userVector, pokemonData);

    // Mirror: weighted random from top 25, weight = 1/(rank+2)
    var mirrorCandidates = scored.slice(0, Math.min(25, scored.length));
    var mirror = weightedPick(mirrorCandidates, function(c, i) {
      return 1 / (i + 2);
    }).pokemon;

    // Shadow: weighted random from rank 5-40, weighted by distance-from-mirror
    var shadowPool = scored.slice(5, Math.min(40, scored.length));
    var shadowWeights = shadowPool.map(function(s) {
      return axisDistance(mirror.coords, s.pokemon.coords);
    });
    var bestShadow = weightedPick(shadowPool, function(s, i) {
      return shadowWeights[i];
    }).pokemon;

    // Stranger: weighted random from rank 15-80, weighted by min-dist-from-both
    var strangerPool = scored.slice(15, Math.min(80, scored.length));
    var strangerWeights = strangerPool.map(function(s) {
      var dM = axisDistance(mirror.coords, s.pokemon.coords);
      var dS = axisDistance(bestShadow.coords, s.pokemon.coords);
      return Math.min(dM, dS);
    });
    var bestStranger = weightedPick(strangerPool, function(s, i) {
      return strangerWeights[i];
    }).pokemon;

    var trio = [mirror, bestShadow, bestStranger];

    if (aestheticPrefs) {
      trio = applyAestheticFilter(trio, scored, aestheticPrefs);
    } else {
      trio = ensureVisualDiversity(trio, scored);
    }

    return trio;
  }

  function ensureVisualDiversity(trio, scored) {
    var result = trio.slice();

    if (sharesVisual(result[0], result[1])) {
      for (var i = 5; i < Math.min(60, scored.length); i++) {
        if (!sharesVisual(result[0], scored[i].pokemon) &&
            !sharesVisual(result[2], scored[i].pokemon)) {
          result[1] = scored[i].pokemon;
          break;
        }
      }
    }

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
    return (a.color || "") === (b.color || "") || (a.shape || "") === (b.shape || "");
  }

  // --- Aesthetic preference filter (toggleable) ---

  var SHAPE_SOFT = ["ball", "blob", "squiggle", "upright"];
  var SHAPE_SHARP = ["armor", "humanoid", "bug-wings", "legs", "quadruped", "wings", "heads"];
  var COLOR_WARM = ["red", "yellow", "pink", "brown"];
  var COLOR_COOL = ["blue", "green", "purple", "white", "gray", "black"];

  function applyAestheticFilter(trio, scored, prefs) {
    var topPool = scored.slice(0, Math.min(60, scored.length));
    var reranked = topPool.map(function(s, idx) {
      var score = aestheticScore(s.pokemon, prefs);
      var rankNorm = 1 - (idx / topPool.length);
      return { pokemon: s.pokemon, combined: rankNorm * 0.6 + score * 0.4 };
    });
    reranked.sort(function(a, b) { return b.combined - a.combined; });

    var mirror = reranked[0].pokemon;
    var shadow = null;
    for (var i = 1; i < reranked.length; i++) {
      if (!sharesVisual(mirror, reranked[i].pokemon)) { shadow = reranked[i].pokemon; break; }
    }
    if (!shadow) shadow = reranked[1].pokemon;
    var stranger = null;
    for (var j = 2; j < reranked.length; j++) {
      if (!sharesVisual(mirror, reranked[j].pokemon) && !sharesVisual(shadow, reranked[j].pokemon)) {
        stranger = reranked[j].pokemon; break;
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
    if (prefs.vibe === "cute" && (SHAPE_SOFT.indexOf(shape) !== -1 || COLOR_WARM.indexOf(color) !== -1)) score += 0.75;
    if (prefs.vibe === "cool" && (SHAPE_SHARP.indexOf(shape) !== -1 || COLOR_COOL.indexOf(color) !== -1)) score += 0.75;
    if (prefs.vibe === "weird" && (shape === "blob" || shape === "squiggle" || color === "purple" || color === "pink")) score += 0.75;
    return score;
  }

  // --- Vector description ("You are...") ---

  var AXIS_NAMES = ["reach", "tempo", "nature", "tether", "aura"];

  function describeVector(userVector) {
    // Normalize accumulated vector to ~[-5,+5] range
    // After 15 questions at ±3 per axis, typical max per axis is ~9-15
    var normDivisor = 9;
    var axes = [];
    AXIS_NAMES.forEach(function(axis, i) {
      axes.push({ axis: axis, value: userVector[i] / normDivisor, abs: Math.abs(userVector[i] / normDivisor) });
    });

    // Sort by absolute strength
    axes.sort(function(a, b) { return b.abs - a.abs; });

    // Take top 2-3 axes above threshold
    var threshold = 1.5;
    var strong = axes.filter(function(a) { return a.abs >= threshold; });
    if (strong.length < 2) strong = axes.slice(0, 2); // always at least 2

    var pools = Poke_Mystery.descriptors;

    // Build description from top 3
    var parts = [];
    var used = strong.slice(0, 3);
    used.forEach(function(a) {
      var pool = a.value > 0 ? pools[a.axis].pos : pools[a.axis].neg;
      var phrase = pool[Math.floor(Math.random() * pool.length)];
      parts.push(phrase);
    });

    if (parts.length === 0) return "Somewhere between the known and the unknown.";

    return "You are " + parts.slice(0, parts.length - 1).join(", ") + ", and " + parts[parts.length - 1] + ".";
  }

  // --- Arrival phrases for trio cards ---
  // Third-person narrator describing how each Pokémon appears.
  // Gated by the Pokémon's strongest axis coordinate.
  // Phrases and shape groups live in Poke_Mystery.phrases / Poke_Mystery.phraseShapeGroups.

  function phraseForRole(pokemon, roleIdx) {
    var pool = Poke_Mystery.phrases[roleIdx] || Poke_Mystery.phrases[0];

    // Find the Pokémon's strongest axis
    var axes = AXIS_NAMES.map(function(axis, i) {
      return { axis: axis, value: pokemon.coords[i], abs: Math.abs(pokemon.coords[i]) };
    });
    axes.sort(function(a, b) { return b.abs - a.abs; });

    // Try the strongest axis first, then fall back to weaker ones
    for (var ai = 0; ai < axes.length; ai++) {
      var a = axes[ai];
      var dir = a.value > 0 ? 1 : -1;

      var matches = pool.filter(function(p) {
        if (p.axis !== a.axis) return false;
        if (p.dir !== dir) return false;
        if (a.abs < (p.min || 0)) return false;
        if (p.exclude_shapes) {
          var shapeList = Poke_Mystery.phraseShapeGroups[p.exclude_shapes];
          if (shapeList && shapeList.indexOf(pokemon.shape) !== -1) return false;
        }
        if (p.types && !p.types.some(function(t) { return pokemon.types.indexOf(t) !== -1; })) return false;
        return true;
      });

      if (matches.length > 0) {
        return matches[Math.floor(Math.random() * matches.length)].text;
      }
    }

    // Fallback — pick any phrase
    var any = pool[Math.floor(Math.random() * pool.length)];
    return any.text;
  }

  // --- Shiny picker for trio ---
  // Exactly one of the three cards shows shiny. Returns index 0, 1, or 2.

  function shinyWhich() {
    return Math.floor(Math.random() * 3);
  }

  // --- Personal shiny roll (on chosen Pokémon) ---

  function shinyRoll() {
    return Math.floor(Math.random() * SHINY_ODDS) === 0;
  }

  // --- Public API ---

  return {
    sampleQuestions: sampleQuestions,
    accumulate: accumulate,
    nearestNeighbors: nearestNeighbors,
    selectTrio: selectTrio,
    describeVector: describeVector,
    phraseForRole: phraseForRole,
    shinyWhich: shinyWhich,
    shinyRoll: shinyRoll
  };

})();
