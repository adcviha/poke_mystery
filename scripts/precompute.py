#!/usr/bin/env python3
"""
PokéMystery precompute script.

Fetches the full PokéAPI (species + pokemon endpoints), computes 5D coordinates
for every default-variety Pokémon using the SPEC.md formulas, and writes the
result to src/data/pokemon_coords.json.

Usage: python3 scripts/precompute.py
Output: src/data/pokemon_coords.json
Time: ~10-15 minutes with polite throttling (~2000 API calls)
"""

import json
import math
import os
import sys
import time
import urllib.request
import urllib.error

API_BASE = "https://pokeapi.co/api/v2"
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "pokemon_coords.json")
DELAY = 0.05  # seconds between requests — pokeapi is free, be polite
BATCH_SIZE = 50  # save progress every N Pokémon


# ===== API helpers =====

def fetch_json(url, retries=3):
    """Fetch a URL and parse JSON, with retries for transient failures."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PokeMystery/0.1"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None  # 404s are permanent, don't retry
            if attempt == retries - 1:
                print(f"  FAILED: {url} — {e}")
                return None
            time.sleep(2 ** attempt)
        except (urllib.error.URLError, OSError) as e:
            if attempt == retries - 1:
                print(f"  FAILED: {url} — {e}")
                return None
            time.sleep(2 ** attempt)
    return None


# ===== Egg group → Nature score =====

EGG_GROUP_SCORES = {
    "monster":       -2,
    "dragon":        -1,
    "water1":        -2,
    "ground":        -2,
    "bug":           -1,
    "flying":        -1,
    "plant":          0,
    "water3":         0,
    "fairy":          0,
    "humanshape":    +1,
    "water2":        +1,
    "ditto":         +1,
    "indeterminate": +2,
    "amorphous":     +3,
    "mineral":       +4,
    "no-eggs":        0,
}


# ===== Type → Nature score =====

TYPE_SCORES = {
    "fighting":  -3,
    "ground":    -2,
    "bug":       -2,
    "normal":     0,  # truly neutral — was -2, caused Snorlax to be max Wild
    "rock":      -2,
    "dragon":    -1,
    "flying":    -1,
    "grass":     -1,
    "water":      0,
    "ice":        0,
    "poison":     0,
    "ghost":      0,
    "dark":       0,
    "fairy":      0,
    "fire":      +1,
    "psychic":   +2,
    "electric":  +2,
    "steel":     +3,
}


# ===== Habitat → Tether score =====

HABITAT_SCORES = {
    "grassland":      -2,
    "forest":         -2,
    "urban":          -2,
    "waters-edge":    -1,
    "sea":             0,
    "mountain":       +1,
    "rough-terrain":  +1,
    "cave":           +2,
    "rare":           +2,
}


# ===== Color → Aura score =====

COLOR_SCORES = {
    "black":  -2,
    "brown":  -2,
    "gray":   -2,
    "red":    -1,
    "blue":    0,
    "green":   0,
    "white":   0,
    "yellow": +1,
    "purple": +2,
    "pink":   +3,
}


# ===== Shape → Aura score =====

SHAPE_SCORES = {
    "armor":     -2,
    "humanoid":  -2,
    "bug-wings": -1,
    "legs":      -1,
    "quadruped":  0,
    "fish":       0,
    "wings":      0,
    "heads":      0,
    "tentacles":  0,
    "upright":   +1,
    "squiggle":  +1,
    "ball":      +2,
    "blob":      +2,
}


# ===== Growth rate → Tempo modifier =====

GROWTH_TEMPO = {
    "slow":                  +1,
    "fast-then-very-slow":   +1,
    "medium":                 0,
    "medium-slow":            0,
    "fast":                  -1,
    "slow-then-very-fast":   -1,
}


# ===== Genera keyword → Aura modifier =====

GENERA_CAPRICIOUS = ["shadow", "ghost", "sleeping", "drowsy", "lazy", "dopey", "imitation", "mime"]
GENERA_CAPRICIOUS_LIGHT = ["dark", "tiny", "small", "psi", "scuffle", "trumpet", "balloon", "dummy", "fake"]
GENERA_EARNEST = ["flame", "guardian", "sky high", "dragon", "legendary", "sword", "shield", "aura"]


def aura_from_genera(genus_en):
    """Score the English genus string for Aura."""
    if not genus_en:
        return 0.0
    lower = genus_en.lower()
    for k in GENERA_CAPRICIOUS:
        if k in lower:
            return 1.5
    for k in GENERA_CAPRICIOUS_LIGHT:
        if k in lower:
            return 0.5
    for k in GENERA_EARNEST:
        if k in lower:
            return -1.0
    return 0.0


# ===== Flavor text keyword → Aura modifier =====

AURA_FLAVOR_CAPRICIOUS = [
    "laugh", "joke", "prank", "trick", "mischief", "whimsy", "whimsical",
    "dance", "playful", "carefree", "easy-going", "easygoing", "relaxed",
    "lazy", "slothful", "pretend", "disguise", "mimic", "mimicking",
    "confuse", "baffle", "weird", "strange", "odd", "bizarre", "curious",
    "clumsy", "stumble", "totter", "dizzy", "goofy", "silly", "merry",
    "cheerful", "jolly", "impish", "naughty", "pesky", "rascal",
    "grin", "smirk", "giggle", "cackle", "snicker",
]

AURA_FLAVOR_EARNEST = [
    "protect", "guard", "guardian", "duty", "honor", "noble",
    "serious", "solemn", "dignified", "wise", "ancient prophecy",
    "aura", "meditate", "discipline", "warrior", "oath", "vigil",
    "sentinel", "legendary hero", "sacred", "righteous", "stoic",
    "unyielding", "unwavering", "resolute", "command", "judge",
    "justice", "order", "balance the world",
]


def aura_from_flavor_text(flavor_texts):
    """Score concatenated English flavor texts for Aura via keyword density."""
    if not flavor_texts:
        return 0.0
    combined = " ".join(flavor_texts).lower()
    cap = sum(1 for k in AURA_FLAVOR_CAPRICIOUS if k in combined)
    earn = sum(1 for k in AURA_FLAVOR_EARNEST if k in combined)
    # Each match is worth ~0.35, capped so flavor text doesn't overwhelm
    raw = (cap - earn) * 0.35
    return clamp(raw, -2.5, 2.5)


# ===== Egg group → Tether modifier =====

TETHER_EGG_GROUP_SCORES = {
    "fairy":         -1.5,  # nurturing, communal
    "plant":         -1.0,  # ecosystem, interconnected
    "amorphous":     +1.5,  # solitary, formless
    "mineral":       +1.5,  # asocial, constructed
    "indeterminate": +1.0,  # weird solitary entities
}


# ===== Genera keyword → Tether modifier =====

TETHER_GENERA_KITH = [
    "family", "jubilee", "happiness", "blessing", "caring", "parent",
    "nurturing", "nurse", "cheer", "hug", "cuddle", "bond", "trust",
    "helper", "peace", "kindness", "love", "angel", "care",
]

TETHER_GENERA_KINLESS = [
    "lonely", "solitary", "silent", "hermit", "outcast", "banished",
    "exile", "recluse",
]

# ===== Flavor text keyword → Tether modifier =====

TETHER_FLAVOR_KITH = [
    "family", "together", "group", "blessing", "kindness", "peace",
    "share", "care", "nurse", "joy", "parent", "child", "baby",
    "herd", "pack", "colony", "couple", "pair", "community",
    "friend", "gentle", "protect", "nurturing", "bond", "companion",
    "team", "partner", "flock", "together with", "gathering",
    "kindhearted", "caring", "help", "rescue",
]

TETHER_FLAVOR_KINLESS = [
    "alone", "solitary", "loner", "isolated", "banish", "exile",
    "nightmare", "silent", "darkness", "abandoned", "wander",
    "desolate", "hermit", "outcast", "recluse", "shun",
    "silence", "solitude", "lurking", "void",
]


def tether_from_genera(genus_en):
    """Score the English genus string for Tether (Kith/Kinless)."""
    if not genus_en:
        return 0.0
    lower = genus_en.lower()
    for k in TETHER_GENERA_KITH:
        if k in lower:
            return -1.5  # Kith
    for k in TETHER_GENERA_KINLESS:
        if k in lower:
            return 1.5  # Kinless
    return 0.0


def tether_from_flavor_text(flavor_texts):
    """Score concatenated English flavor texts for Tether via keyword density."""
    if not flavor_texts:
        return 0.0
    combined = " ".join(flavor_texts).lower()
    kith = sum(1 for k in TETHER_FLAVOR_KITH if k in combined)
    kinless = sum(1 for k in TETHER_FLAVOR_KINLESS if k in combined)
    raw = (kinless - kith) * 0.4
    return clamp(raw, -2.0, 2.0)


# ===== Generation → Aura modifier =====

GEN_AURA = {
    "generation-i":   -0.3,
    "generation-ii":  -0.3,
    "generation-iii": -0.1,
    "generation-iv":  -0.1,
    "generation-v":   +0.1,
    "generation-vi":  +0.1,
    "generation-vii": +0.3,
    "generation-viii":+0.3,
    "generation-ix":  +0.3,
}


# ===== Clamp helper =====

def clamp(val, lo=-5.0, hi=5.0):
    return max(lo, min(hi, val))


# ===== Main compute for one Pokémon =====

def compute_coords(species_data, pokemon_data, flavor_texts=None):
    """
    Given species JSON, pokemon JSON, and optional English flavor text list,
    compute [reach, tempo, nature, tether, aura].
    Returns None if essential data is missing.
    """
    if flavor_texts is None:
        flavor_texts = []

    # Shared: genus string used by both Tether and Aura
    genera_entries = species_data.get("genera", [])
    genus_en = next((g["genus"] for g in genera_entries if g["language"]["name"] == "en"), None)

    # ---- REACH ----
    is_legendary = species_data.get("is_legendary", False)
    is_mythical = species_data.get("is_mythical", False)
    capture_rate = species_data.get("capture_rate", 255)
    height = pokemon_data.get("height", 1) or 1   # dm
    weight = pokemon_data.get("weight", 1) or 1   # hg

    reach_legendary = (3.0 if is_legendary else 0.0) + (2.0 if is_mythical else 0.0)
    reach_capture = (1.0 - (capture_rate / 255.0)) * 4.0
    # Non-legendaries shouldn't ride capture_rate to Cosmic — Snorlax isn't Arceus.
    # Reduce capture_rate weight by 75% for common Pokémon.
    if not is_legendary and not is_mythical:
        reach_capture *= 0.25
    # size: log of height*weight, rough normalization
    hw = height * weight
    reach_size = math.log(hw + 1) / math.log(500000) * 4.0 - 2.0  # roughly [-2, +2]
    reach = clamp(reach_legendary + reach_capture + reach_size)

    # ---- TEMPO ----
    stats = {s["stat"]["name"]: s["base_stat"] for s in pokemon_data.get("stats", [])}
    atk = stats.get("attack", 50)
    spa = stats.get("special-attack", 50)
    spe = stats.get("speed", 50)
    hp = stats.get("hp", 50)
    defense = stats.get("defense", 50)
    spd = stats.get("special-defense", 50)
    denom = (hp + defense + spd) or 1
    ratio = (atk + spa + spe) / denom
    # Piecewise linear: ratio 0.15 → +4 Stoic, ratio 1.0 → 0 neutral, ratio 3.5 → -4 Mercurial
    if ratio <= 1.0:
        tempo_stats = 4.0 - (ratio - 0.15) / (1.0 - 0.15) * 4.0
    else:
        tempo_stats = -(ratio - 1.0) / (3.5 - 1.0) * 4.0
    tempo_stats = clamp(tempo_stats, -4, 4)
    # Speed bonus: raw speed independent of ratio — fast mons feel Mercurial even without offense
    tempo_speed = (1.0 - (spe / 100.0)) * 1.5  # high speed → -Mercurial, low speed → +Stoic
    tempo_stats = clamp(tempo_stats, -4, 4)
    growth_name = species_data.get("growth_rate", {}).get("name", "medium")
    tempo_growth = GROWTH_TEMPO.get(growth_name, 0.0)
    tempo = clamp(tempo_stats + tempo_speed + tempo_growth)

    # ---- NATURE ----
    egg_groups = [eg["name"] for eg in species_data.get("egg_groups", [])]
    if egg_groups:
        nature_eggs = sum(EGG_GROUP_SCORES.get(eg, 0) for eg in egg_groups) / len(egg_groups)
    else:
        nature_eggs = 0.0
    types = [t["type"]["name"] for t in pokemon_data.get("types", [])]
    if types:
        nature_types = sum(TYPE_SCORES.get(t, 0) for t in types) / len(types)
    else:
        nature_types = 0.0
    nature = clamp((nature_eggs * 0.6 + nature_types * 0.4) * 1.5)

    # ---- TETHER ----
    base_happiness = species_data.get("base_happiness", 70)
    tether_happiness = (1.0 - (base_happiness / 140.0)) * 6.0 - 3.0  # [-3, +3]
    gender_rate = species_data.get("gender_rate", 4)
    tether_gender = 2.0 if gender_rate == -1 else 0.0
    habitat_name = species_data.get("habitat", {}) or {}
    habitat_name = habitat_name.get("name") if habitat_name else None
    tether_habitat = HABITAT_SCORES.get(habitat_name, 0.0)
    # Egg groups: Fairy/Plant → Kith, Amorphous/Mineral → Kinless
    if egg_groups:
        tether_eggs = sum(TETHER_EGG_GROUP_SCORES.get(eg, 0) for eg in egg_groups) / len(egg_groups)
    else:
        tether_eggs = 0.0
    # Genera + flavor text keyword signals
    tether_genera = tether_from_genera(genus_en)
    tether_flavor = tether_from_flavor_text(flavor_texts)
    tether = clamp(tether_happiness + tether_gender + tether_habitat + tether_eggs + tether_genera + tether_flavor)

    # ---- AURA ----
    color_name = species_data.get("color", {}).get("name", "gray")
    aura_color = COLOR_SCORES.get(color_name, 0.0)
    aura_genera = aura_from_genera(genus_en)
    aura_flavor = aura_from_flavor_text(flavor_texts)
    shape_name = species_data.get("shape", {}) or {}
    shape_name = shape_name.get("name") if shape_name else None
    aura_shape = SHAPE_SCORES.get(shape_name, 0.0) * 0.5  # halved — shape shouldn't dominate
    gen_name = species_data.get("generation", {}).get("name", "")
    aura_gen = GEN_AURA.get(gen_name, 0.0)
    aura = clamp(aura_color + aura_genera + aura_flavor + aura_shape + aura_gen)

    return [round(reach, 4), round(tempo, 4), round(nature, 4), round(tether, 4), round(aura, 4)]


# ===== Extract artwork URLs =====

def extract_artwork(pokemon_data):
    """Get official-artwork URLs from pokemon sprites data."""
    other = pokemon_data.get("sprites", {}).get("other", {})
    artwork = other.get("official-artwork", {})
    return {
        "artwork_url": artwork.get("front_default"),
        "artwork_shiny_url": artwork.get("front_shiny"),
    }


# ===== Main =====

def main():
    print("=== Poke_Mystery Precompute ===\n")

    # Get total species count and full species list
    print("Fetching species count...")
    species_list_url = f"{API_BASE}/pokemon-species/?limit=1"
    first_page = fetch_json(species_list_url)
    if not first_page:
        print("ERROR: Cannot reach PokeAPI. Check your internet connection.")
        sys.exit(1)
    total_species = first_page["count"]
    print(f"Total species in API: {total_species}")

    print("Fetching full species list...")
    all_species_url = f"{API_BASE}/pokemon-species/?limit={total_species}"
    all_species_data = fetch_json(all_species_url)
    if not all_species_data:
        print("ERROR: Cannot fetch species list.")
        sys.exit(1)

    species_results = all_species_data["results"]
    print(f"Species entries: {len(species_results)}")

    # Build a set of valid pokemon IDs for quick lookup
    print("Fetching pokemon list...")
    pokemon_list_url = f"{API_BASE}/pokemon/?limit=100000"
    pokemon_list_data = fetch_json(pokemon_list_url)
    pokemon_ids = set()
    if pokemon_list_data:
        for entry in pokemon_list_data["results"]:
            pid = int(entry["url"].rstrip("/").split("/")[-1])
            pokemon_ids.add(pid)
    print(f"Valid pokemon IDs: {len(pokemon_ids)}")

    # Process each species from the species list (not by scanning pokemon IDs)
    # This avoids hitting form IDs (10001+) that don't have species endpoints.
    print(f"\nProcessing {len(species_results)} species...\n")

    pokemon_data_list = []
    errors = []

    for i, species_entry in enumerate(species_results):
        species_url = species_entry["url"]
        species_id = int(species_url.rstrip("/").split("/")[-1])

        # Fetch species data
        species_data = fetch_json(species_url)
        if not species_data:
            errors.append(f"species {species_id}")
            time.sleep(DELAY)
            continue

        # Get the default variety's pokemon ID
        varieties = species_data.get("varieties", [])
        default_pid = None
        for v in varieties:
            if v.get("is_default", False):
                var_url = v["pokemon"]["url"]
                default_pid = int(var_url.rstrip("/").split("/")[-1])
                break

        if default_pid is None:
            errors.append(f"no-default {species_id}")
            time.sleep(DELAY)
            continue

        # Skip if default variety's pokemon ID doesn't match species ID
        # (this species entry is a form pointing to a different base)
        if default_pid != species_id:
            # This species belongs to a form that shares the same species
            # Only process when species_id == default_pid (the base form)
            time.sleep(DELAY)
            continue

        # Fetch pokemon data (stats, types, sprites)
        pokemon_url = f"{API_BASE}/pokemon/{default_pid}/"
        pokemon_data = fetch_json(pokemon_url)
        if not pokemon_data:
            errors.append(f"pokemon {default_pid}")
            time.sleep(DELAY)
            continue

        # Compute coordinates (extract flavor texts for keyword matching)
        flavor_entries = species_data.get("flavor_text_entries", [])
        flavor_texts = list(dict.fromkeys(
            f["flavor_text"].replace("\n", " ").replace("\x0c", " ")
            for f in flavor_entries
            if f["language"]["name"] == "en"
        ))
        coords = compute_coords(species_data, pokemon_data, flavor_texts)

        # Extract artwork
        artwork = extract_artwork(pokemon_data)

        # Build entry
        genera = species_data.get("genera", [])
        genus_en = next((g["genus"] for g in genera if g["language"]["name"] == "en"), "")

        entry = {
            "id": default_pid,
            "name": species_data["name"],
            "genus": genus_en,
            "coords": coords,
            "artwork_url": artwork["artwork_url"],
            "artwork_shiny_url": artwork["artwork_shiny_url"],
            "types": [t["type"]["name"] for t in pokemon_data.get("types", [])],
            "color": species_data.get("color", {}).get("name", "unknown"),
            "shape": species_data.get("shape", {}).get("name", "unknown") if species_data.get("shape") else "unknown",
            "generation": species_data.get("generation", {}).get("name", "unknown"),
        }
        pokemon_data_list.append(entry)

        # Progress
        count = len(pokemon_data_list)
        if count % BATCH_SIZE == 0:
            print(f"  {count}/{len(species_results)} processed, {len(errors)} errors")

        # Be polite
        time.sleep(DELAY)

    print(f"\nDone. {len(pokemon_data_list)} Pokémon processed.")
    if errors:
        print(f"Errors: {len(errors)} — first 10: {errors[:10]}")

    # ===== Normalization pass: min-max scale coords to [-5, +5] =====
    print("\nNormalizing coordinates...")
    if pokemon_data_list:
        for axis in range(5):
            values = [p["coords"][axis] for p in pokemon_data_list]
            vmin = min(values)
            vmax = max(values)
            vrange = vmax - vmin if vmax != vmin else 1.0
            print(f"  Axis {axis}: raw range [{vmin:.3f}, {vmax:.3f}]")
            for p in pokemon_data_list:
                normalized = (p["coords"][axis] - vmin) / vrange  # [0, 1]
                scaled = -5.0 + normalized * 10.0                    # [-5, +5]
                p["coords"][axis] = round(scaled, 4)

    # ===== Build output =====
    output = {
        "version": "0.1.0",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(pokemon_data_list),
        "pokemon": pokemon_data_list,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f)
    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"\nWrote {len(pokemon_data_list)} Pokémon to {OUTPUT_PATH} ({file_size:,} bytes)")

    # ===== Spot-check: print nearest neighbors for a neutral vector =====
    print("\n=== Spot Check: nearest Pokémon to neutral vector [0,0,0,0,0] ===")
    neutral = [0.0, 0.0, 0.0, 0.0, 0.0]
    scored = []
    for p in pokemon_data_list:
        dist = math.sqrt(sum((neutral[i] - p["coords"][i]) ** 2 for i in range(5)))
        scored.append((dist, p["name"], p["coords"]))
    scored.sort()
    for dist, name, coords in scored[:10]:
        print(f"  {name:20s} dist={dist:.3f} coords={[round(c,1) for c in coords]}")

    print("\nDone!")


if __name__ == "__main__":
    main()
