# Poké_Mystery — Design Document

> **Companion documents:** [SPEC.md](SPEC.md) defines the technical contract
> (axis formulas, data model, algorithms). [CLAUDE.md](CLAUDE.md) holds working
> instructions for Claude. This document is the vision, UX flow, aesthetic
> targets, and roadmap.

## Vision

A quiet, earnest web-based personality quiz that maps a user's philosophical
disposition to the ecosystem of over 1,000 Pokémon — not through rigid
categorization but through a continuous 5-dimensional vector space. The quiz
rejects the ironic, loud, meme-heavy personality tests of the late 2000s.
Instead, it mirrors the tonal magic of Nintendo DS-era game design, specifically
Pokémon Mystery Dungeon: Explorers of Sky.

The tagline is *"Take a quiz to reveal a Pokémon mystery"* — not "find out which
Pokémon you are." The framing matters. The quiz discovers what you're *drawn
toward*, not what you objectively *are*. A tough burly man and a chihuahua —
sometimes the resonance is in the contrast.

### Why this exists

Most Pokémon personality quizzes are either:
- **16-type sorters** that just map Myers-Briggs onto starter types (rigid, predictable)
- **Buzzfeed-style clickbait** with questions like "pick a pasta shape" (vacant)

This one treats the question pool with literary care. Every question follows
Anti-Friction Rules that prevent the quiz from feeling like a social roleplay
exercise. The output is a personalized starter trio revealed through Professor
Birch's briefcase — a moment of quiet ceremony, not a celebration.

## The 5 Existential Axes

These are the hidden dimensions the quiz measures. The user never sees them
directly — they only experience the questions and the results.

### Reach: Humble ↔ Cosmic

The scale at which a person engages with the world.

- **Humble:** Grounded, hyper-local, comfortable in the mundane. Values
  small-scale everyday realities. *The Bidoof in the creek behind your house.*
- **Cosmic:** Universal, sweeping, drawn to ideological truths and grand
  scales. *The Arceus that shaped the universe.*

A person who finds meaning in their neighborhood and daily rituals leans Humble.
A person who thinks in centuries and light-years leans Cosmic.

### Tempo: Mercurial ↔ Stoic

The rhythm at which a person moves through the world.

- **Mercurial:** High-reactivity, kinetic, shifts rapidly with stimuli.
  Glass-cannon energy. *The Ninjask that vanishes before you finish blinking.*
- **Stoic:** Permanent, unyielding, absorbs impacts without altering internal
  state. *The Shuckle that ferments berries undisturbed for years.*

A person who thrives on speed and response leans Mercurial. A person who
outlasts leans Stoic.

### Nature: Wild ↔ Wrought

The texture a person finds most natural.

- **Wild:** Instinctual, somatic, ancient. Driven by ancestral roots, raw
  emotion, organic flesh. *The Feraligatr that obeys only the river's current.*
- **Wrought:** Analytical, deliberate, mechanical. Processes reality through
  structured rules and synthetic frameworks. *The Porygon-Z that exists as
  pure code.*

A person moved by gut feeling and the smell of rain leans Wild. A person who
builds systems to understand systems leans Wrought.

### Tether: Kith ↔ Kinless

How a person relates to connection and solitude.

- **Kith:** Interdependent, community-minded, relational. Derives purpose
  from being a thread in an ecosystem. *The Chansey who nurses the injured
  without being asked.*
- **Kinless:** Solitary, self-contained, isolated by nature or by choice.
  Operates entirely within a private vacuum. *The Absol who appears alone
  before disaster, warning those who will not listen.*

A person who feels most alive in a crowd leans Kith. A person who recharges
in silence leans Kinless.

### Aura: Earnest ↔ Capricious

The emotional temperature a person carries.

- **Earnest:** Dignified, serious, weighted with purpose. Duty-bound.
  *The Lucario who senses aura and bears its responsibility without question.*
- **Capricious:** Playful, trickster, whimsical, deeply weird. Unconcerned
  with dignity. *The Gengar who hides in your shadow because your fear tastes
  funny.*

This is the axis that prevents the quiz from feeling like a psychological
diagnosis. It captures levity, strangeness, and the simple truth that some
people (and some Pokémon) are just here for the bit.

## UX Flow

### 1. The Ascent — answering questions

The user answers 15 questions randomly sampled from a curated pool of 60.
One question per screen. No progress bar — the quiz should feel like a
conversation, not a loading sequence. Each question presents 4 options,
each written with a dignified, poetic internal logic. No option is the
"obviously wrong" one.

### 2. The Environment Shifter — background transformation

As vectors accumulate across the 5 axes, the background environment shifts
in real-time. The transition is slow, almost subconscious — like weather
moving in. The environment reflects the current psychological coordinates:

- **Humble + Wild + Kith:** A sunlit Gen 3 tall-grass route. Warm greens.
  Soft focus. Bug Pokémon calls in the distance.
- **Cosmic + Wrought + Kinless:** A glitchy digital void. Deep blues and
  purples. Geometric patterns. Silence.
- **Mercurial + Capricious:** A thunderstorm over a forest canopy. Flickering
  light. Wind-whipped leaves.
- **Stoic + Earnest:** A quiet rainy mountain peak. Gray stone. Mist. Stillness.

The environment never suddenly "snaps" — it dissolves from one state to the
next across 3-4 seconds.

### 3. The Briefcase — silence, then reveal

The final question is answered. The screen holds in complete silence for a
beat (2-3 seconds — long enough to feel). The background fades into a
pristine patch of grass. On that grass sits Professor Birch's weathered
canvas briefcase. No text. No prompt. Just the briefcase and the quiet.

After a moment, the briefcase opens.

### 4. The Trinity of Choice — three Poké Balls

Three distinct Poké Balls are revealed inside the briefcase. They represent
the three Pokémon from the data cloud whose 5D coordinates are nearest to
the user's accumulated vector — the personalized Starter Trio.

Each Poké Ball is displayed as a card: the ball itself, the Pokémon's name,
its official artwork, and the English genus (e.g., "Genetic Pokémon"). No
explanation of *why* this Pokémon was chosen. The mystery is the point.

The user picks one.

### 5. The Shiny Roll — one last dice roll

Upon selecting their starter, a background RNG fires:
- **1 in 50 chance:** The screen flashes gold. An 8-bit star chime plays
  (synthesized via Web Audio API). The displayed artwork transitions to
  the Pokémon's official shiny artwork. A subtle gold shimmer effect
  crosses the screen, then fades.
- **49 in 50 chance:** A quiet flourish. The chosen Pokémon's artwork
  animates gently (subtle scale pulse). No fanfare — just recognition.

## Aesthetic Targets

- **Mystery Dungeon melancholy.** The dominant emotion is wistfulness, not
  excitement. Think Explorers of Sky's beach scene, not Pokémon Go's
  catch animation.
- **Quiet typography.** Generous whitespace. One idea per screen. The
  questions are written in a conversational, slightly poetic register —
  never clinical, never chirpy.
- **Soft color palette.** Grass greens, sky blues, earthy browns, muted
  golds. The environment shifter uses color temperature to signal the
  psychological coordinates.
- **Typeface.** System serif for question text (Georgia / Times New Roman
  — slightly literary, DS-era feel). System sans-serif for UI labels.
- **No sound except the shiny chime.** The quiz is silent. The only audio
  in the entire experience is the 8-bit star chime on a successful shiny
  roll — which makes it hit harder.
- **Pokémon artwork only.** Official key art (`official-artwork` from
  PokéAPI). No sprites, no home renders, no 3D models. The artwork is
  displayed large and centered with room to breathe.

## Question Curation: Anti-Friction Rules

Every question in the pool must pass these rules:

1. **Banish Specific Social Masks.** Never ask how a user behaves in
   specific social hierarchies (e.g., talking to a boss, a waiter, a
   barber). This introduces confounding variables like manners, anxiety,
   or social status.
2. **Prioritize Abstract and Sensory Association.** Ask about textures,
   natural phenomena, spatial preferences, memory architectures, or
   symbolic hypotheticals (e.g., reactions to fog, preferences in
   darkness, relationship to old possessions).
3. **No Unbalanced Caricatures.** Every option must feel completely
   valid to a person choosing it. Never include a "dumb/cringe option"
   or an "obviously correct moral option." Frame every choice with a
   dignified, poetic internal logic.
4. **Obfuscate the Variables.** Ensure that choices test for underlying
   psychological disposition rather than the literal topic of the
   question. A question about a clock should test pacing and time
   perspective (Tempo), not technological affinity (Nature).

## Roadmap

### Phase 1 — Scaffolding (current)
- Project directory, CLAUDE.md, DESIGN.md, SPEC.md
- Git init, initial commit

### Phase 2 — Precompute + Questions
- `scripts/precompute.py`: fetch full PokéAPI, compute 5D coords, output JSON
- Spot-check the cloud, tune axis formulas
- `src/questions.js`: 60-question pool with axis weightings

### Phase 3 — Engine + UI
- `src/engine.js`: vector accumulation, nearest-neighbor matching, shiny roll
- `src/ui.js`: quiz interface, briefcase reveal, trio selection
- `src/style.css`: all styling including environment shifter transitions
- `src/environment.js`: background transformation based on accumulated vector
- `src/main.js`: orchestration and init

### Phase 4 — Deploy
- `build.sh`: single-file concatenation
- `index.html`: GitHub Pages redirect
- Push to master, verify deployment

### Future
- Environment shifter: add more environment states (glitchy void, underwater,
  volcanic, snowy peak)
- The briefcase scene: grass texture, briefcase sprite/animation
- Audio: ambient environment sounds (rain, wind, forest) — only if they can
  be implemented without breaking the "silent except shiny chime" rule
- Share card: a generated image of the user's trio for social sharing
- Re-take without repeating questions: track which questions have been seen
  and sample from the unseen pool

## Non-goals

- Type alignment charts ("which type are you?") — too predictable
- Competitive battling advice — not what this is for
- Pokédex completion stats — irrelevant to the experience
- Social sharing that reveals "what the quiz thinks you are" — the mystery
  belongs to the user
- Mobile apps — desktop-first web experience
