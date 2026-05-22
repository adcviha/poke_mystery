# CLAUDE.md

Working notes for any Claude session picking up this project.

## TL;DR

**PokéMystery** is a single-file HTML personality quiz hosted on GitHub Pages. Users answer 15 questions sampled from a pool of 60. Each answer quietly nudges a hidden 5-axis vector. At the end, the engine finds the 3 nearest Pokémon in a pre-computed coordinate cloud (built from the full PokéAPI) and reveals them via Professor Birch's briefcase. A 1-in-50 shiny roll fires on starter selection.

Tagline: *"Take a quiz to reveal a Pokémon mystery."*

**Tone:** Earnest, quiet, Mystery Dungeon-inspired. Not ironic. Not Buzzfeed. Not a clinical personality diagnosis. The quiz reveals what you're *drawn toward*, not what you *are*.

## Hard constraints

Don't break these without checking first:

- **One HTML file as the output.** The source is modular (see File Layout), but the deployable artifact is a single `pokemystery.html`. A trivial shell script concatenates source files. No bundler, no `node_modules`.
- **Vanilla JS.** No React, Vue, or any framework. All JS attaches to a shared `window.PokeMystery` namespace.
- **No live API calls at runtime.** All Pokémon data is pre-computed into `src/data/pokemon_coords.json` by the `scripts/precompute.js` Node script. The quiz runs entirely from static data.
- **Pokémon artwork only.** Use `other/official-artwork/front_default` URLs (and their shiny variants). No sprites, no home renders. These URLs are precomputed into the JSON.
- **GitHub Pages deployment.** Push to master → auto-deploys.
- **60-question pool / 15 sampled.** Questions follow the Anti-Friction Rules (no social masks, no caricatures, no obvious correct answers, obfuscate what's being tested).
- **Readable code over clever code.** No minification. Comments explain *why*, not *what*. Banner comments separate major systems.

## The 5 Axes (quick reference)

See SPEC.md for exact formulas. This is the quick mental model:

| Axis | Spectrum | What it measures |
|------|----------|-----------------|
| **Reach** | Humble ↔ Cosmic | Local/familiar vs legendary/universal |
| **Tempo** | Mercurial ↔ Stoic | Glass cannon vs armored endurance |
| **Nature** | Wild ↔ Wrought | Organic/instinctual vs synthetic/constructed |
| **Tether** | Kith ↔ Kinless | Communal/nurturing vs solitary/self-contained |
| **Aura** | Earnest ↔ Capricious | Dignified/serious vs playful/trickster/weird |

## Code conventions

- All state lives in `PokeMystery.state` (one object). Sub-objects group related properties.
- Functions are short and named for what they do. Banner comments (`// =====`) separate major sections within files.
- `const` declarations before any code that uses them.
- Internals exposed via `window.POKEMYSTERY` for console hacking.
- Each source file is one IIFE attaching to `window.PokeMystery`.

## File layout

```
pokemystery/
├── pokemystery.html            # BUILT OUTPUT — single-file deployable
├── index.html                  # GitHub Pages redirect → pokemystery.html
├── build.sh                    # Concatenates src/ into pokemystery.html
│
├── src/
│   ├── index.html              # Dev shell: style + script tags in dependency order
│   ├── style.css               # All CSS (environment shifter, briefcase, quiz UI)
│   │
│   ├── data/
│   │   └── pokemon_coords.json # PRE-COMPUTED: all Pokémon → 5D coords + metadata
│   │
│   ├── engine.js               # Vector accumulation, nearest-neighbor, shiny roll
│   ├── questions.js            # 60-question pool with axis weightings
│   ├── environment.js          # Canvas/CSS background environment shifter
│   ├── ui.js                   # Quiz UI, briefcase reveal, trio selection
│   └── main.js                 # Init, event binding, orchestration
│
├── scripts/
│   └── precompute.js           # Node: fetch PokéAPI → compute coords → JSON
│
├── CLAUDE.md                   # This file
├── DESIGN.md                   # Vision, aesthetic targets, UX flow, roadmap
└── SPEC.md                     # Technical contract: formulas, data model, algorithms
```

**Build script** (`build.sh`): concatenates CSS into a `<style>` tag and JS files (in dependency order) into a `<script>` tag inside a copy of the dev shell. No Node required — pure `cat`.

## How to run / test

**Dev:** Open `src/index.html` in a modern browser. No server needed.

**Precompute:** `node scripts/precompute.js` — hits PokéAPI (~2000 requests, takes 10-15 min with throttling). Outputs `src/data/pokemon_coords.json`. Run this once; commit the JSON.

**Deploy:** Run `./build.sh` to produce `pokemystery.html`. Commit and push to master — auto-deploys to GitHub Pages.

Live at: `https://adcviha.github.io/pokemystery/`

## Working protocol (every task, every time)

### 1. Translate the Vibe
The user describes behavior in plain English. Before touching code, translate into technical terms and state your approach in one sentence.

### 2. The GO Gate
List every file you will modify or create. State the plan in 2-3 sentences. Then **stop and wait** for the user to say "GO" before writing any code. Do not output code, diffs, or implementations until you hear "GO."

### 3. No reinventing wheels
If a request can be handled by an existing browser API or a function already in the codebase, say so and use it. Don't write custom math when the platform already does it.

## When to push back

- A request that would require adding a framework, build chain, or large dependency — flag the tradeoff.
- A feature that conflicts with the Mystery Dungeon tone (loud, ironic, meme-heavy, Buzzfeed-style).
- A request to make the quiz "more accurate" by adding more axes — the 5-axis framework is locked until the MVP proves otherwise.

## When to confirm before coding

- **The user describes a vibe change imprecisely.** Pause, replay what you understood, get explicit confirmation.
- **A question or UI element that could read as clinical/judgmental.** The tone is everything. Flag it.
- **Anything that touches the axis formulas or matching algorithm.** Those are load-bearing.

## Roadmap

- **Phase 1** — Scaffolding: CLAUDE.md, DESIGN.md, SPEC.md, directory structure
- **Phase 2** — Precompute script + question pool
- **Phase 3** — Quiz engine + UI (environment shifter, briefcase, trio, shiny roll)
- **Phase 4** — Deploy to GitHub Pages
