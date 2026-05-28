#!/bin/bash
# Poké_Mystery build script — concatenates source into single HTML output.
# Usage: ./build.sh
# Output: poke_mystery.html (overwritten)
set -e

OUTPUT="poke_mystery.html"
SRC="src"

{
  # Header up to </head>, strip the stylesheet link (we inline CSS)
  sed -n '1,/<\/head>/p' "$SRC/index.html" | sed '$d' | grep -v 'link rel="stylesheet"'

  # Inline CSS
  echo '  <style>'
  cat "$SRC/style.css"
  echo '  </style>'
  echo '</head>'

  # Body between </head> and first <script> tag
  sed -n '/<\/head>/,/<script/p' "$SRC/index.html" \
    | sed '1d;$d'

  # Inline data
  echo '<script>'
  echo '// PokéAPI precomputed data'
  python3 -c "
import json
with open('$SRC/data/pokemon_coords.json') as f:
    data = json.load(f)
print('window.POKE_MYSTERY_DATA = ' + json.dumps(data) + ';')
"
  echo '</script>'

  # Inline all JS in dependency order
  echo '<script>'
  echo 'window.Poke_Mystery = {};'
  for js in \
    text/descriptors.js \
    text/phrases.js \
    questions.js \
    engine.js \
    environment.js \
    ui.js \
    main.js
  do
    echo "// ===== $js ====="
    cat "$SRC/$js"
    echo ''
  done
  echo '</script>'

  echo '</body>'
  echo '</html>'
} > "$OUTPUT"

echo "Built $OUTPUT ($(wc -c < "$OUTPUT") bytes)"
