# Poké_Mystery — Specification

This document is the technical source of truth. It defines *how* the system
works at the code level. For *what* we're building and *why*, see DESIGN.md.
For working instructions, see CLAUDE.md.

---

## The 5-Axis Coordinate System

Every Pokémon and every user ends up with a 5D coordinate vector:
`[reach, tempo, nature, tether, aura]`. All values are normalized to
the range `[-5, +5]`.

### Axis 1: Reach [Humble: -5 ↔ Cosmic: +5]

The local-familiar vs universal-legendary spectrum.

```
reach = reach_legendary + reach_capture + reach_size
```

| Component | Source Field | Formula |
|-----------|-------------|---------|
| `reach_legendary` | `is_legendary`, `is_mythical` | `is_legendary ? +3 : 0` + `is_mythical ? +2 : 0` |
| `reach_capture` | `capture_rate` (0–255) | `(1 - (capture_rate / 255)) * 3` mapped to [-4, +4] then scaled |
| `reach_size` | `height` (dm), `weight` (hg) | `log(height * weight) / log(max_hw)` normalized to [-2, +2] |

Final reach is clamped to [-5, +5].

**Anchors:** Bidoof (~ -4.5), Pikachu (~ -1), Rayquaza (~ +4.5), Arceus (~ +5)

### Axis 2: Tempo [Mercurial: -5 ↔ Stoic: +5]

Glass-cannon reactivity vs armored endurance.

```
tempo = tempo_stats + tempo_growth
```

| Component | Source Field | Formula |
|-----------|-------------|---------|
| `tempo_stats` | `stats` array | `ratio = (atk + spa + spe) / (hp + def + spd)`. Normalize ratio across all Pokémon to [-4, +4]. Values > 1.5 → Mercurial, < 0.7 → Stoic. |
| `tempo_growth` | `growth_rate` | fast, slow-then-very-fast → -1; slow, fast-then-very-slow → +1; medium, medium-slow → 0 |

Final tempo is clamped to [-5, +5].

**Anchors:** Ninjask (~ -4.8, ratio ~3.5), Shuckle (~ +4.9, ratio ~0.15)

**Stat sources:** `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed` from the `/pokemon/{id}` endpoint.

### Axis 3: Nature [Wild: -5 ↔ Wrought: +5]

Organic/instinctual vs synthetic/constructed.

```
nature = nature_eggs + nature_types
```

| Component | Source Field | Formula |
|-----------|-------------|---------|
| `nature_eggs` | `egg_groups` array | Each egg group gets a score: Monster=-3, Dragon=-2, Water1=-2, Ground=-2, Bug=-1, Flying=-1, Plant=0, Water3=0, Fairy=0, Humanshape=+1, Water2=+1, Ditto=+1, Indeterminate=+2, Amorphous=+3, Mineral=+4. Average the scores of all egg groups. No-eggs → 0 (legendaries are neutral on this axis). |
| `nature_types` | `types` array (from /pokemon) | Each type gets a score: Fighting=-3, Ground=-2, Bug=-2, Normal=-2, Rock=-2, Dragon=-1, Flying=-1, Grass=-1, Water=0, Ice=0, Poison=0, Ghost=0, Dark=0, Fairy=0, Fire=+1, Psychic=+2, Electric=+2, Steel=+3. Average type scores. |

`nature = (nature_eggs * 0.6 + nature_types * 0.4)` mapped to [-5, +5].

**Anchors:** Feraligatr (~ -3.5), Garchomp (~ -3), Gengar (~ +1), Porygon-Z (~ +4.5)

### Axis 4: Tether [Kith: -5 ↔ Kinless: +5]

Communal/nurturing vs solitary/self-contained.

```
tether = tether_happiness + tether_gender + tether_habitat
```

| Component | Source Field | Formula |
|-----------|-------------|---------|
| `tether_happiness` | `base_happiness` (0–140) | `(1 - (base_happiness / 140)) * 5` mapped to [-3, +3]. High happiness → Kith (-), low → Kinless (+). |
| `tether_gender` | `gender_rate` (-1 to 8) | `gender_rate === -1 ? +2 : 0`. Genderless Pokémon lean Kinless. |
| `tether_habitat` | `habitat` | grassland=-2, forest=-2, urban=-2, waters-edge=-1, sea=0, mountain=+1, rough-terrain=+1, cave=+2, rare=+2. null (unknown) → 0. |

Final tether is clamped to [-5, +5].

**Anchors:** Chansey (~ -4.5), Togekiss (~ -3), Darkrai (~ +4), Absol (~ +3.5)

### Axis 5: Aura [Earnest: -5 ↔ Capricious: +5]

Dignified/serious vs playful/trickster/whimsical.

```
aura = aura_color + aura_genera + aura_shape + aura_gen
```

| Component | Source Field | Formula |
|-----------|-------------|---------|
| `aura_color` | `color` (10 values) | black=-2, brown=-2, gray=-2, red=-1, blue=0, green=0, white=0, yellow=+1, purple=+2, pink=+3 |
| `aura_genera` | `genera[en]` string | Contains "Shadow"/"Ghost" → +1.5. Contains "Dark" → +1. Contains "Flame"/"Guardian"/"Sky High"/"Dragon"/"Legendary" → -1. Contains "Tiny"/"Small" → +0.5. Default → 0. |
| `aura_shape` | `shape` (14 values) | armor=-2, humanoid=-2, bug-wings=-1, legs=-1, quadruped=0, fish=0, wings=0, heads=0, tentacles=0, upright=+1, squiggle=+1, ball=+2, blob=+2 |
| `aura_gen` | `generation` | Light weight. Gen I–II → -0.3, Gen III–IV → -0.1, Gen V–VI → +0.1, Gen VII–IX → +0.3 |

Final aura is clamped to [-5, +5].

**Anchors:** Lucario (~ -3.5), Absol (~ -2.5), Gengar (~ +3.5), Wobbuffet (~ +4), Ditto (~ +3)

---

## Precompute Data Contract

### Input

The script `scripts/precompute.py` fetches from PokéAPI:
- `https://pokeapi.co/api/v2/pokemon-species/?limit=0` — get total count
- `https://pokeapi.co/api/v2/pokemon-species/{id}/` — for each species
- `https://pokeapi.co/api/v2/pokemon/{id}/` — for each Pokémon (stats, types, sprites)

Only default varieties are computed (non-default forms are skipped to avoid
duplicates like Mega Evolutions and regional forms cluttering the cloud).

### Output: `src/data/pokemon_coords.json`

```json
{
  "version": "0.1.0",
  "generated": "2026-05-22T00:00:00Z",
  "total": 1025,
  "pokemon": [
    {
      "id": 25,
      "name": "pikachu",
      "genus": "Mouse Pokémon",
      "coords": [ -0.8, -0.3, -1.2, -1.5, 0.4 ],
      "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
      "artwork_shiny_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png",
      "types": ["electric"],
      "color": "yellow",
      "shape": "quadruped",
      "generation": "generation-i"
    }
  ]
}
```

- `coords` is `[reach, tempo, nature, tether, aura]`
- All URLs point to `raw.githubusercontent.com` (PokéAPI's sprite hosting)
- `types`, `color`, `shape`, `generation` are included for display/categorization
  in the UI but are NOT used in the matching algorithm (those values are already
  baked into the coords)

---

## Question Format

### JSON Schema

Each question in the pool:

```json
{
  "id": "q01",
  "text": "You find an old photograph tucked inside a library book. It shows...",
  "options": [
    {
      "text": "A crowded street festival, faces blurred with motion.",
      "weight": { "reach": 0, "tempo": -1, "nature": 0, "tether": -2, "aura": 0 }
    },
    {
      "text": "An empty field at dawn, a single tree at its center.",
      "weight": { "reach": -1, "tempo": 1, "nature": -1, "tether": 1, "aura": -1 }
    },
    {
      "text": "A laboratory bench covered in handwritten notes and polished instruments.",
      "weight": { "reach": 0, "tempo": 0, "nature": 2, "tether": 1, "aura": -1 }
    },
    {
      "text": "A sky full of unfamiliar constellations, rotating slowly above a sleeping town.",
      "weight": { "reach": 2, "tempo": 1, "nature": 0, "tether": 0, "aura": 1 }
    }
  ]
}
```

### Rules

- Each option's weight values are in the range [-3, +3] per axis.
- A question typically targets 1-2 primary axes (with values of ±2 or ±3) and
  may have small values (±1 or 0) on secondary axes.
- The sum across all 4 options for a given axis does not need to be zero.
  Some questions push harder on certain axes than others.
- Each question targets a primary and secondary axis, documented in comments.

### Primary axis distribution (60 questions, 15 sampled)

| Axis | Questions targeting it as primary | Avg per sample of 15 |
|------|-----------------------------------|---------------------|
| Reach | 12 | 3 |
| Tempo | 12 | 3 |
| Nature | 12 | 3 |
| Tether | 12 | 3 |
| Aura | 12 | 3 |

---

## Engine Algorithm

### Vector Accumulation

```
user_vector = [0, 0, 0, 0, 0]

for each answered question:
    for each axis (0..4):
        user_vector[axis] += option.weight[axis]

user_vector is NOT normalized — it accumulates raw. After 15 questions with
weights in [-3, +3], the theoretical range per axis is [-45, +45]. In practice,
most users end up in [-15, +15] because weights average out.
```

### Nearest-Neighbor Matching

```
for each pokemon in precomputed cloud:
    distance = euclidean(user_vector, pokemon.coords)
    // Euclidean distance in 5D:
    // sqrt(sum((u[i] - p[i])^2 for i in 0..4))

top_3 = sort by distance ascending, take first 3
```

If user_vector is all zeros (no questions answered, edge case), return
3 random Pokémon from the middle of the cloud (exclude legendaries).

### Shiny Roll

```
function shinyRoll(selectedPokemon):
    roll = Math.floor(Math.random() * 50)  // 0..49
    if roll === 0:                          // 1-in-50
        return { isShiny: true, artwork: selectedPokemon.artwork_shiny_url }
    else:
        return { isShiny: false, artwork: selectedPokemon.artwork_url }
```

The shiny roll fires ONCE, at the moment the user selects their starter from the trio.
It does not pre-roll or show odds. The magic is in not knowing until you choose.

---

## State Management

All runtime state lives in `Poke_Mystery.state`:

```js
state = {
  // Quiz state
  phase: 'intro' | 'quiz' | 'briefcase' | 'trio' | 'chosen',
  currentQuestionIndex: 0,
  userVector: [0, 0, 0, 0, 0],
  answeredQuestions: [],       // question IDs answered (to avoid repeats)

  // Question pool
  questionPool: [],            // all 60 questions
  activeQuestions: [],         // the 15 sampled for this session

  // Results
  trio: [],                    // 3 nearest Pokémon { id, name, genus, coords, artwork_url, ... }
  chosenPokemon: null,         // the one the user picked
  isShiny: false,

  // Environment
  environment: {               // current background state
    palette: 'grassland',     // css class or canvas state key
    targetPalette: 'grassland',
    transitionProgress: 0,
  }
}
```

---

## Core Tech Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Runtime | Vanilla JS, single HTML file | No build step, works from file:// |
| Pokémon data | Pre-computed static JSON | No live API calls, fast, offline-capable |
| Artwork | PokéAPI official-artwork PNGs | High quality, consistent, precomputed URLs |
| Audio | Web Audio API (shiny chime only) | No audio files to load, synthesized 8-bit |
| CSS | Vanilla CSS with CSS custom properties | Environment shifter uses color transitions |
| Deploy | GitHub Pages | Free, fast, auto-deploys on push |

---

## Normalization Reference

For the precompute script, all raw values are normalized using min-max
normalization across the full Pokémon population, then scaled to the
target axis range:

```
normalized = (raw - min) / (max - min)  // [0, 1]
scaled = -5 + normalized * 10           // [-5, +5]
```

For ratio-based values (Tempo stats ratio), normalization uses the
actual observed min/max across all Pokémon, not theoretical bounds.
This ensures the distribution uses the full [-5, +5] range.
