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
        except (urllib.error.HTTPError, urllib.error.URLError, OSError) as e:
            if attempt == retries - 1:
                print(f"  FAILED: {url} — {e}")
                return None
            time.sleep(2 ** attempt)
    return None


# ===== Egg group → Nature score =====

EGG_GROUP_SCORES = {
    "monster":       -3,
    "dragon":        -2,
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
    "normal":    -2,
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

GENERA_CAPRICIOUS = ["shadow", "ghost"]
GENERA_CAPRICIOUS_LIGHT = ["dark", "tiny", "small"]
GENERA_EARNEST = ["flame", "guardian", "sky high", "dragon", "legendary", "sword", "shield"]


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

def compute_coords(species_data, pokemon_data):
    """
    Given species JSON and pokemon JSON, compute [reach, tempo, nature, tether, aura].
    Returns None if essential data is missing.
    """
    # ---- REACH ----
    is_legendary = species_data.get("is_legendary", False)
    is_mythical = species_data.get("is_mythical", False)
    capture_rate = species_data.get("capture_rate", 255)
    height = pokemon_data.get("height", 1) or 1   # dm
    weight = pokemon_data.get("weight", 1) or 1   # hg

    reach_legendary = (3.0 if is_legendary else 0.0) + (2.0 if is_mythical else 0.0)
    reach_capture = (1.0 - (capture_rate / 255.0)) * 4.0
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
    # ratio typically ranges ~0.2 (Shuckle) to ~3.5 (Ninjask)
    # Map [0.15, 4.0] → [+4, -4]
    tempo_stats = (1.0 - ((ratio - 0.15) / (4.0 - 0.15))) * 8.0 - 4.0
    tempo_stats = clamp(tempo_stats, -4, 4)
    growth_name = species_data.get("growth_rate", {}).get("name", "medium")
    tempo_growth = GROWTH_TEMPO.get(growth_name, 0.0)
    tempo = clamp(tempo_stats + tempo_growth)

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
    tether = clamp(tether_happiness + tether_gender + tether_habitat)

    # ---- AURA ----
    color_name = species_data.get("color", {}).get("name", "gray")
    aura_color = COLOR_SCORES.get(color_name, 0.0)
    genera_entries = species_data.get("genera", [])
    genus_en = next((g["genus"] for g in genera_entries if g["language"]["name"] == "en"), None)
    aura_genera = aura_from_genera(genus_en)
    shape_name = species_data.get("shape", {}) or {}
    shape_name = shape_name.get("name") if shape_name else None
    aura_shape = SHAPE_SCORES.get(shape_name, 0.0)
    gen_name = species_data.get("generation", {}).get("name", "")
    aura_gen = GEN_AURA.get(gen_name, 0.0)
    aura = clamp(aura_color + aura_genera + aura_shape + aura_gen)

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
    print("=== PokéMystery Precompute ===\n")

    # Get total species count
    print("Fetching species count...")
    species_list_url = f"{API_BASE}/pokemon-species/?limit=1"
    first_page = fetch_json(species_list_url)
    if not first_page:
        print("ERROR: Cannot reach PokéAPI. Check your internet connection.")
        sys.exit(1)
    total_species = first_page["count"]
    print(f"Total species in API: {total_species}")

    # Fetch the full species list to get IDs
    print("Fetching full species list...")
    all_species_url = f"{API_BASE}/pokemon-species/?limit={total_species}"
    all_species_data = fetch_json(all_species_url)
    if not all_species_data:
        print("ERROR: Cannot fetch species list.")
        sys.exit(1)

    results = all_species_data["results"]
    print(f"Species entries: {len(results)}")

    # Build list of (id, name) to process
    # Only process IDs that exist in the pokemon endpoint (some species are forms)
    pokemon_entries = []
    # First, get the actual pokemon endpoint list to know valid IDs
    print("Fetching pokemon list...")
    pokemon_list_url = f"{API_BASE}/pokemon/?limit=100000"
    pokemon_list_data = fetch_json(pokemon_list_url)
    pokemon_ids = set()
    if pokemon_list_data:
        for entry in pokemon_list_data["results"]:
            pid = int(entry["url"].rstrip("/").split("/")[-1])
            pokemon_ids.add(pid)
    print(f"Valid pokemon IDs: {len(pokemon_ids)} (max: {max(pokemon_ids) if pokemon_ids else 0})")

    # Process each species result
    # We'll go by pokemon ID ranges, trying each ID and checking if it exists
    max_id = max(pokemon_ids) if pokemon_ids else 1025
    print(f"\nProcessing Pokémon 1–{max_id}...\n")

    pokemon_data_list = []
    errors = []
    skipped_forms = 0

    for pid in range(1, max_id + 1):
        # Check if this ID exists in the pokemon endpoint
        if pid not in pokemon_ids:
            continue

        # Fetch species data
        species_url = f"{API_BASE}/pokemon-species/{pid}/"
        species_data = fetch_json(species_url)
        if not species_data:
            errors.append(f"species {pid}")
            continue

        # Check if this is a non-default variety (skip Megas, regionals, etc.)
        # The species endpoint has a varieties array; we only process when this
        # species IS the default variety's species
        varieties = species_data.get("varieties", [])
        is_default_species = False
        for v in varieties:
            if v.get("is_default", False):
                var_pokemon_name = v["pokemon"]["name"]
                var_pokemon_url = v["pokemon"]["url"]
                var_pid = int(var_pokemon_url.rstrip("/").split("/")[-1])
                if var_pid == pid:
                    is_default_species = True
                break

        if not is_default_species:
            skipped_forms += 1
            continue

        # Fetch pokemon data (stats, types, sprites)
        pokemon_url = f"{API_BASE}/pokemon/{pid}/"
        pokemon_data = fetch_json(pokemon_url)
        if not pokemon_data:
            errors.append(f"pokemon {pid}")
            continue

        # Compute coordinates
        coords = compute_coords(species_data, pokemon_data)

        # Extract artwork
        artwork = extract_artwork(pokemon_data)

        # Build entry
        genera = species_data.get("genera", [])
        genus_en = next((g["genus"] for g in genera if g["language"]["name"] == "en"), "")

        entry = {
            "id": pid,
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
        if pid % BATCH_SIZE == 0:
            print(f"  {pid}/{max_id} — {len(pokemon_data_list)} processed, {len(errors)} errors, {skipped_forms} forms skipped")

        # Be polite
        time.sleep(DELAY)

    print(f"\nDone. {len(pokemon_data_list)} Pokémon processed.")
    if errors:
        print(f"Errors: {len(errors)} — first 10: {errors[:10]}")
    print(f"Forms skipped: {skipped_forms}")

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
