// ===== Poké_Mystery Arrival Phrases =====
// Third-person narrator describing how each Pokémon appears.
// Three role pools: mirror (closest match), shadow (contrast), stranger (wildcard).
// Gated by Pokémon's strongest axis, direction, and shape/type constraints.
// Attaches to window.Poke_Mystery.

Poke_Mystery.phraseShapeGroups = {
  NOT_FLYING: ["armor","ball","blob","fish","heads","humanoid","legs","quadruped","squiggle","tentacles","upright"],
  NO_LEGS:    ["ball","blob","fish","squiggle","tentacles","wings","bug-wings"],
  NO_UPRIGHT: ["ball","blob","fish","squiggle","tentacles","quadruped","armor"]
};

Poke_Mystery.phrases = {
  0: [ // mirror — closest match
    { axis: "reach", dir: 1, min: 2, text: "Arrived as if it already knew the way." },
    { axis: "reach", dir: 1, min: 2, text: "From somewhere beyond. But here now." },
    { axis: "reach", dir: -1, min: 2, text: "Was already nearby. Just had to look up." },
    { axis: "reach", dir: -1, min: 2, text: "Never left. Just waited to be seen." },
    { axis: "tempo", dir: 1, min: 2, text: "Took its time. Arrived exactly when it meant to." },
    { axis: "tempo", dir: 1, min: 2, text: "Slow, certain. No need to rush." },
    { axis: "tempo", dir: -1, min: 2, text: "Arrived before the question finished." },
    { axis: "tempo", dir: -1, min: 2, text: "Quick. Like it was already running.", exclude_shapes: "NO_LEGS" },
    { axis: "nature", dir: 1, min: 2, text: "Stepped out of something precise. A mechanism, maybe.", exclude_shapes: "NO_LEGS" },
    { axis: "nature", dir: 1, min: 2, text: "Calculated. But not cold. Just exact." },
    { axis: "nature", dir: -1, min: 2, text: "Came through the undergrowth. Quiet as moss." },
    { axis: "nature", dir: -1, min: 2, text: "Wild and unbothered. Like weather." },
    { axis: "tether", dir: 1, min: 2, text: "Alone, but not lonely. Just solitary by nature." },
    { axis: "tether", dir: 1, min: 2, text: "From the edges. Where the crowd thins out." },
    { axis: "tether", dir: -1, min: 2, text: "Brought company. Even alone, it brought company." },
    { axis: "tether", dir: -1, min: 2, text: "Reached out before it was fully here." },
    { axis: "aura", dir: 1, min: 2, text: "Smiling. Or something close to it." },
    { axis: "aura", dir: 1, min: 2, text: "Tripped on the way in. Meant to?", exclude_shapes: "NO_LEGS" },
    { axis: "aura", dir: -1, min: 2, text: "Solemn. Straight-backed. Here for something true.", exclude_shapes: "NO_UPRIGHT" },
    { axis: "aura", dir: -1, min: 2, text: "Carrying a quiet gravity. Not heavy. Just real." }
  ],
  1: [ // shadow — contrast
    { axis: "reach", dir: 1, min: 2, text: "Circled twice before landing.", exclude_shapes: "NOT_FLYING" },
    { axis: "reach", dir: 1, min: 2, text: "From the same sky, but a different star." },
    { axis: "reach", dir: -1, min: 2, text: "Same ground. Different path across it." },
    { axis: "reach", dir: -1, min: 2, text: "A neighbour you never noticed." },
    { axis: "tempo", dir: 1, min: 2, text: "Waited for the first to settle. Then followed." },
    { axis: "tempo", dir: 1, min: 2, text: "Behind by a beat. Deliberately." },
    { axis: "tempo", dir: -1, min: 2, text: "Came in on the tailwind. A little breathless.", exclude_shapes: "NOT_FLYING" },
    { axis: "tempo", dir: -1, min: 2, text: "Darted in after the first. Racing, or dancing.", exclude_shapes: "NO_LEGS" },
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
  2: [ // stranger — wildcard
    { axis: "reach", dir: 1, min: 2, text: "Drifted in from the periphery.", exclude_shapes: "NOT_FLYING" },
    { axis: "reach", dir: 1, min: 2, text: "From a long way off. Took the scenic route." },
    { axis: "reach", dir: -1, min: 2, text: "Stumbled in, looked around, stayed.", exclude_shapes: "NO_LEGS" },
    { axis: "reach", dir: -1, min: 2, text: "Close to home. But not quite the same street." },
    { axis: "tempo", dir: 1, min: 2, text: "The last to arrive. Unbothered by that." },
    { axis: "tempo", dir: 1, min: 2, text: "Sauntered in. No hurry. No apology.", exclude_shapes: "NO_LEGS" },
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
    { axis: "aura", dir: 1, min: 2, text: "Tripped over the briefcase. Played it off.", exclude_shapes: "NO_LEGS" },
    { axis: "aura", dir: 1, min: 2, text: "Giggling in the corner. At what?" },
    { axis: "aura", dir: -1, min: 2, text: "Arrived with purpose. Didn't say what." },
    { axis: "aura", dir: -1, min: 2, text: "Stoic. Still. Watching you back." }
  ]
};
