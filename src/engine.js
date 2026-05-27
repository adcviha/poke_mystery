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

  function selectTrio(userVector, pokemonData, aestheticPrefs) {
    var scored = scoreAll(userVector, pokemonData);

    var mirror = scored[0].pokemon;

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

  var DESCRIPTORS = {
    reach: {
      pos: ["drawn to the vast", "pulled toward the cosmic", "eyes on the horizon", "at home in the infinite", "a quiet astronomer"],
      neg: ["rooted in the familiar", "drawn to the near and the known", "a keeper of small things", "grounded, deliberate", "at home in the particular"]
    },
    tempo: {
      pos: ["moving with patience", "still at the centre", "unhurried, deliberate", "a slow-burning fire", "patient as stone"],
      neg: ["quick as a spark", "restless, alive", "moving before the thought forms", "born for the wind", "a live wire humming"]
    },
    nature: {
      pos: ["shaped by structure", "drawn to the made and the measured", "a builder of systems", "at home in the blueprint", "thinking in frameworks"],
      neg: ["wild as weather", "drawn to the raw and the real", "kin to soil and rain", "answering to instinct", "a creature of seasons"]
    },
    tether: {
      pos: ["finding peace in solitude", "a private constellation", "standing apart, watching", "whole in the quiet", "drawn to empty spaces"],
      neg: ["woven into others", "a thread in a larger cloth", "nurtured by the crowd", "finding meaning in belonging", "hands reaching out"]
    },
    aura: {
      pos: ["a trickster's glint in the eye", "finding gravity in lightness", "a crooked smile", "serious about not being serious", "drawn to the strange and the silly"],
      neg: ["carrying a quiet weight", "earnest to the bone", "dignified, deliberate, true", "a straight line in a crooked world", "finding gravity in sincerity"]
    }
  };

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

    // Build description from top 3
    var parts = [];
    var used = strong.slice(0, 3);
    used.forEach(function(a) {
      var pool = a.value > 0 ? DESCRIPTORS[a.axis].pos : DESCRIPTORS[a.axis].neg;
      var phrase = pool[Math.floor(Math.random() * pool.length)];
      parts.push(phrase);
    });

    if (parts.length === 0) return "Somewhere between the known and the unknown.";

    return "You are " + parts.slice(0, parts.length - 1).join(", ") + ", and " + parts[parts.length - 1] + ".";
  }

  // --- Arrival phrases for trio cards ---
  // Third-person narrator describing how each Pokémon appears.
  // Gated by the Pokémon's strongest axis coordinate.

  // Shape groups for phrase gating
  var NOT_FLYING = ["armor","ball","blob","fish","heads","humanoid","legs","quadruped","squiggle","tentacles","upright"];
  var NO_LEGS = ["ball","blob","fish","squiggle","tentacles","wings","bug-wings"];
  var NO_UPRIGHT = ["ball","blob","fish","squiggle","tentacles","quadruped","armor"];

  var PHRASES = {
    0: [ // closest match
      { axis: "reach", dir: 1, min: 2, text: "Arrived as if it already knew the way." },
      { axis: "reach", dir: 1, min: 2, text: "From somewhere beyond. But here now." },
      { axis: "reach", dir: -1, min: 2, text: "Was already nearby. Just had to look up." },
      { axis: "reach", dir: -1, min: 2, text: "Never left. Just waited to be seen." },
      { axis: "tempo", dir: 1, min: 2, text: "Took its time. Arrived exactly when it meant to." },
      { axis: "tempo", dir: 1, min: 2, text: "Slow, certain. No need to rush." },
      { axis: "tempo", dir: -1, min: 2, text: "Arrived before the question finished." },
      { axis: "tempo", dir: -1, min: 2, text: "Quick. Like it was already running.", exclude_shapes: NO_LEGS },
      { axis: "nature", dir: 1, min: 2, text: "Stepped out of something precise. A mechanism, maybe.", exclude_shapes: NO_LEGS },
      { axis: "nature", dir: 1, min: 2, text: "Calculated. But not cold. Just exact." },
      { axis: "nature", dir: -1, min: 2, text: "Came through the undergrowth. Quiet as moss." },
      { axis: "nature", dir: -1, min: 2, text: "Wild and unbothered. Like weather." },
      { axis: "tether", dir: 1, min: 2, text: "Alone, but not lonely. Just solitary by nature." },
      { axis: "tether", dir: 1, min: 2, text: "From the edges. Where the crowd thins out." },
      { axis: "tether", dir: -1, min: 2, text: "Brought company. Even alone, it brought company." },
      { axis: "tether", dir: -1, min: 2, text: "Reached out before it was fully here." },
      { axis: "aura", dir: 1, min: 2, text: "Smiling. Or something close to it." },
      { axis: "aura", dir: 1, min: 2, text: "Tripped on the way in. Meant to?", exclude_shapes: NO_LEGS },
      { axis: "aura", dir: -1, min: 2, text: "Solemn. Straight-backed. Here for something true.", exclude_shapes: NO_UPRIGHT },
      { axis: "aura", dir: -1, min: 2, text: "Carrying a quiet gravity. Not heavy. Just real." }
    ],
    1: [ // contrast
      { axis: "reach", dir: 1, min: 2, text: "Circled twice before landing.", exclude_shapes: NOT_FLYING },
      { axis: "reach", dir: 1, min: 2, text: "From the same sky, but a different star." },
      { axis: "reach", dir: -1, min: 2, text: "Same ground. Different path across it." },
      { axis: "reach", dir: -1, min: 2, text: "A neighbour you never noticed." },
      { axis: "tempo", dir: 1, min: 2, text: "Waited for the first to settle. Then followed." },
      { axis: "tempo", dir: 1, min: 2, text: "Behind by a beat. Deliberately." },
      { axis: "tempo", dir: -1, min: 2, text: "Came in on the tailwind. A little breathless.", exclude_shapes: NOT_FLYING },
      { axis: "tempo", dir: -1, min: 2, text: "Darted in after the first. Racing, or dancing.", exclude_shapes: NO_LEGS },
      { axis: "nature", dir: 1, min: 2, text: "Different blueprints. Same foundations." },
      { axis: "nature", dir: 1, min: 2, text: "Made of the same stuff, assembled differently." },
      { axis: "nature", dir: -1, min: 2, text: "A different season. Same forest." },
      { axis: "nature", dir: -1, min: 2, text: "From downstream. Carried the same current.", types: ["water"] },
      { axis: "tether", dir: 1, min: 2, text: "Watching from a little further out. Curious." },
      { axis: "tether", dir: 1, min: 2, text: "Keeping its own distance. But still here." },
      { axis: "tether", dir: -1, min: 2, text: "Came looking for the first. Found you instead." },
      { axis: "tether", dir: -1, min: 2, text: "Brought someone with it. Couldn't help it." },
      { axis: "aura", dir: 1, min: 2, text: "Slipped through a side door. Grinning." },
      { axis: "aura", dir: 1, min: 2, text: "Humming. Or laughing. Hard to tell." },
      { axis: "aura", dir: -1, min: 2, text: "Followed the first with a nod. Understanding." },
      { axis: "aura", dir: -1, min: 2, text: "Serious, but warm. Like it knew why it was here." }
    ],
    2: [ // wildcard
      { axis: "reach", dir: 1, min: 2, text: "Drifted in from the periphery.", exclude_shapes: NOT_FLYING },
      { axis: "reach", dir: 1, min: 2, text: "From a long way off. Took the scenic route." },
      { axis: "reach", dir: -1, min: 2, text: "Stumbled in, looked around, stayed.", exclude_shapes: NO_LEGS },
      { axis: "reach", dir: -1, min: 2, text: "Close to home. But not quite the same street." },
      { axis: "tempo", dir: 1, min: 2, text: "The last to arrive. Unbothered by that." },
      { axis: "tempo", dir: 1, min: 2, text: "Sauntered in. No hurry. No apology.", exclude_shapes: NO_LEGS },
      { axis: "tempo", dir: -1, min: 2, text: "Late. Or early. Hard to tell with this one." },
      { axis: "tempo", dir: -1, min: 2, text: "Burst through. Didn't knock." },
      { axis: "nature", dir: 1, min: 2, text: "Materialized from something orderly. Then broke formation." },
      { axis: "nature", dir: 1, min: 2, text: "An anomaly in the data set. Here anyway." },
      { axis: "nature", dir: -1, min: 2, text: "Came through the walls. Metaphorically. Probably." },
      { axis: "nature", dir: -1, min: 2, text: "A wildcard. Doesn't follow the rules of the clearing." },
      { axis: "tether", dir: 1, min: 2, text: "Keeps to itself. But it's curious about you." },
      { axis: "tether", dir: 1, min: 2, text: "From further out than the rest. Still listening." },
      { axis: "tether", dir: -1, min: 2, text: "Invited itself. Brought snacks." },
      { axis: "tether", dir: -1, min: 2, text: "Tagged along with the second. Nobody minded." },
      { axis: "aura", dir: 1, min: 2, text: "Tripped over the briefcase. Played it off.", exclude_shapes: NO_LEGS },
      { axis: "aura", dir: 1, min: 2, text: "Giggling in the corner. At what?" },
      { axis: "aura", dir: -1, min: 2, text: "Arrived with purpose. Didn't say what." },
      { axis: "aura", dir: -1, min: 2, text: "Stoic. Still. Watching you back." }
    ]
  };

  function phraseForRole(pokemon, roleIdx) {
    var pool = PHRASES[roleIdx] || PHRASES[0];

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
        if (p.exclude_shapes && p.exclude_shapes.indexOf(pokemon.shape) !== -1) return false;
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
