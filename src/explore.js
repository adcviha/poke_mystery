// ===== Poké_Mystery Exploration =====
// Tile-based exploration mini-game. 5D→2D projection, terrain-coloured
// ground tiles, fog-of-war, catch-on-contact, shiny-on-sight.
// Attaches to window.Poke_Mystery.

Poke_Mystery.explore = (function() {

  // --- Constants ---

  var COORD_SCALE = 14;       // spreads coords into tile space
  var GRID_SIZE   = 160;      // tiles per side
  var TILE_SIZE   = 28;       // rendered px per tile
  var VIS_RADIUS  = 6;        // fog visibility in tiles
  var BASE_CATCH  = 0.33;     // catch rate near origin
  var MIN_CATCH   = 0.12;     // catch rate at cosmic edges
  var SHINY_RATE  = 1 / 3;    // shiny on first sight

  var AXIS_NAMES = ["reach","tempo","nature","tether","aura"];

  // Five axis pairs the player can toggle between
  var AXIS_PAIRS = [
    { x:0, y:1 }, { x:2, y:3 }, { x:4, y:0 }, { x:1, y:2 }, { x:3, y:4 }
  ];

  // --- Internal state ---

  var canvas, ctx;
  var allPokemon, trio, chosenPokemon;
  var onClose;
  var animFrame;
  var hue;          // AXIS_HUE from colors

  var currentPair = 0;
  var terrainRGBA;  // Uint32Array[GRID_SIZE*GRID_SIZE] — precomputed tile colours
  var tileMons;     // Object: tileKey -> [pokemon, ...]
  var shinyCache;   // Object: pokemonId -> bool — shiny already determined
  var visited;      // Uint8Array[GRID_SIZE*GRID_SIZE/8] — 1 bit per tile
  var playerTX, playerTY;
  var camX, camY;

  var steps, balls;
  var pokedex;           // { id: {s:bool, c:bool} }

  var keysDown = {};
  var keyTimers = {};
  var catchActive = false;
  var catchMon = null;
  var catchShiny = false;

  var sessionSeed;

  // --- Tile math ---

  function tileKey(tx, ty) { return tx + "_" + ty; }

  function tileIdx(tx, ty) { return ty * GRID_SIZE + tx; }

  function projectCoord(coord, axisIdx) {
    var tx = Math.round(coord * COORD_SCALE + (GRID_SIZE / 2));
    return Math.max(0, Math.min(GRID_SIZE - 1, tx));
  }

  function tileDist(tx1, ty1, tx2, ty2) {
    var dx = tx1 - tx2, dy = ty1 - ty2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // --- Hash for shiny determinism ---

  function shinyForId(id) {
    if (shinyCache[id] !== undefined) return shinyCache[id];
    var h = (id * 2654435761 + sessionSeed) & 0x7FFFFFFF;
    shinyCache[id] = (h % Math.round(1 / SHINY_RATE)) === 0;
    return shinyCache[id];
  }

  // --- Terrain colour ---

  // Muted dark base colours for each axis (hsl values — hue, sat%, light%)
  var TERRAIN_BASE = [
    { h:220, s:24, l:12 },  // reach  — blue
    { h:30,  s:24, l:12 },  // tempo  — orange
    { h:140, s:20, l:10 },  // nature — green
    { h:320, s:20, l:11 },  // tether — magenta
    { h:50,  s:20, l:11 }   // aura   — gold
  ];

  var VOID_COLOR = { h:220, s:6, l:4 };  // cosmic void — near-black

  function tileNoise(tx, ty) {
    // Deterministic ±2 lightness jitter so same-colour regions don't look flat
    return ((tx * 374761393 + ty * 668265263) & 7) - 2;
  }

  function hslToRGBA(h, s, l, a) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    a = Math.max(0, Math.min(1, a));
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r, g, b;
    if (h < 60)      { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return (a * 255) << 24 | (b << 16) | (g << 8) | r;
  }

  // --- Dominant axis for a Pokémon ---

  function dominantAxis(p) {
    var best = 0, bestVal = -1;
    for (var i = 0; i < 5; i++) {
      var abs = Math.abs(p.coords[i]);
      if (abs > bestVal) { bestVal = abs; best = i; }
    }
    return best;
  }

  // --- Precomputation (per axis pair) ---

  function precomputePair() {
    var pair = AXIS_PAIRS[currentPair];
    var xi = pair.x, yi = pair.y;

    // Build tile-to-pokemon map + spatial bins for fast nearest lookup
    var BIN_COUNT = 20;
    var bins = {};
    tileMons = {};

    for (var i = 0; i < allPokemon.length; i++) {
      var p = allPokemon[i];
      var tx = projectCoord(p.coords[xi], xi);
      var ty = projectCoord(p.coords[yi], yi);
      var key = tileKey(tx, ty);
      if (!tileMons[key]) tileMons[key] = [];
      tileMons[key].push(p);

      // Spatial bin at ~8 tiles each
      var bx = Math.floor(tx / BIN_COUNT);
      var by = Math.floor(ty / BIN_COUNT);
      var bk = bx + "_" + by;
      if (!bins[bk]) bins[bk] = [];
      bins[bk].push({ tx: tx, ty: ty, dom: dominantAxis(p) });
    }

    // Precompute terrain colour for every tile
    terrainRGBA = new Uint32Array(GRID_SIZE * GRID_SIZE);

    for (var ty = 0; ty < GRID_SIZE; ty++) {
      for (var tx = 0; tx < GRID_SIZE; tx++) {
        var base = TERRAIN_BASE[0];  // default reach
        var minDist = Infinity;

        // Search nearby bins for nearest Pokémon
        var bx = Math.floor(tx / BIN_COUNT);
        var by = Math.floor(ty / BIN_COUNT);
        var searched = 0;

        for (var dbx = -1; dbx <= 1; dbx++) {
          for (var dby = -1; dby <= 1; dby++) {
            var bk = (bx + dbx) + "_" + (by + dby);
            var bin = bins[bk];
            if (!bin) continue;
            for (var j = 0; j < bin.length; j++) {
              var d = tileDist(tx, ty, bin[j].tx, bin[j].ty);
              if (d < minDist) {
                minDist = d;
                base = TERRAIN_BASE[bin[j].dom];
              }
              searched++;
            }
          }
        }

        // No Pokémon in range — cosmic void
        if (minDist > 6) {
          base = VOID_COLOR;
        }

        var light = base.l + tileNoise(tx, ty);
        terrainRGBA[tileIdx(tx, ty)] = hslToRGBA(base.h, base.s, light, 1);
      }
    }
  }

  // --- Visited bitset helpers ---

  function markVisited(tx, ty) {
    var idx = tileIdx(tx, ty);
    visited[idx >> 3] |= (1 << (idx & 7));
  }

  function isVisited(tx, ty) {
    var idx = tileIdx(tx, ty);
    return (visited[idx >> 3] & (1 << (idx & 7))) !== 0;
  }

  function markVisibilityRadius() {
    for (var dy = -VIS_RADIUS; dy <= VIS_RADIUS; dy++) {
      for (var dx = -VIS_RADIUS; dx <= VIS_RADIUS; dx++) {
        if (dx*dx + dy*dy <= VIS_RADIUS*VIS_RADIUS) {
          var tx = playerTX + dx, ty = playerTY + dy;
          if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
            markVisited(tx, ty);
          }
        }
      }
    }
  }

  // --- Serialisation ---

  function bitsetToBase64(bits) {
    var bytes = new Uint8Array(bits.length);
    for (var i = 0; i < bits.length; i++) bytes[i] = bits[i];
    var bin = "";
    for (var j = 0; j < bytes.length; j++) {
      bin += String.fromCharCode(bytes[j]);
    }
    return btoa(bin);
  }

  function base64ToBitset(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // --- Rendering ---

  function render() {
    if (!canvas || !ctx) return;
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);
    if (W <= 0 || H <= 0) return;

    // Camera follows player smoothly
    var targetCX = playerTX * TILE_SIZE + TILE_SIZE/2 - W/2;
    var targetCY = playerTY * TILE_SIZE + TILE_SIZE/2 - H/2;
    camX += (targetCX - camX) * 0.2;
    camY += (targetCY - camY) * 0.2;
    // Clamp to grid bounds
    camX = Math.max(-TILE_SIZE, Math.min(GRID_SIZE * TILE_SIZE - W + TILE_SIZE, camX));
    camY = Math.max(-TILE_SIZE, Math.min(GRID_SIZE * TILE_SIZE - H + TILE_SIZE, camY));

    var startTX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    var startTY = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    var endTX   = Math.min(GRID_SIZE - 1, Math.ceil((camX + W) / TILE_SIZE) + 1);
    var endTY   = Math.min(GRID_SIZE - 1, Math.ceil((camY + H) / TILE_SIZE) + 1);

    // Batch terrain tiles by colour to reduce fillStyle changes
    var colourBatches = {};

    for (var ty = startTY; ty <= endTY; ty++) {
      for (var tx = startTX; tx <= endTX; tx++) {
        var dist = tileDist(tx, ty, playerTX, playerTY);

        // Fog alpha
        var alpha;
        if (dist <= VIS_RADIUS - 0.5) {
          alpha = 1;
        } else if (dist <= VIS_RADIUS + 0.5) {
          alpha = 1 - (dist - (VIS_RADIUS - 0.5));
        } else if (isVisited(tx, ty)) {
          alpha = 0.22;
        } else {
          alpha = 0.06;
        }

        if (alpha < 0.02) continue;

        var rgba = terrainRGBA[tileIdx(tx, ty)];
        // Apply fog alpha to the alpha byte
        var a = Math.round(((rgba >>> 24) & 0xFF) * alpha);
        var colour = (a << 24) | (rgba & 0x00FFFFFF);

        if (!colourBatches[colour]) colourBatches[colour] = [];
        colourBatches[colour].push({ tx: tx, ty: ty });
      }
    }

    // Draw terrain
    var offX = -camX, offY = -camY;
    var colours = Object.keys(colourBatches);
    for (var ci = 0; ci < colours.length; ci++) {
      var c = parseInt(colours[ci]);
      var r = c & 0xFF;
      var g = (c >> 8) & 0xFF;
      var b = (c >> 16) & 0xFF;
      var a = ((c >>> 24) & 0xFF) / 255;
      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a.toFixed(2) + ")";
      var batch = colourBatches[colours[ci]];
      for (var bi = 0; bi < batch.length; bi++) {
        ctx.fillRect(
          batch[bi].tx * TILE_SIZE + offX,
          batch[bi].ty * TILE_SIZE + offY,
          TILE_SIZE, TILE_SIZE
        );
      }
    }

    // Draw Pokémon on visible tiles
    var pair = AXIS_PAIRS[currentPair];
    var trioIds = trio ? trio.map(function(p) { return p.id; }) : [];
    var chosenId = chosenPokemon ? chosenPokemon.id : -1;

    for (var ty = startTY; ty <= endTY; ty++) {
      for (var tx = startTX; tx <= endTX; tx++) {
        var dist = tileDist(tx, ty, playerTX, playerTY);
        if (dist > VIS_RADIUS) continue;

        var key = tileKey(tx, ty);
        var mons = tileMons[key];
        if (!mons || mons.length === 0) continue;

        // Don't draw caught Pokémon
        var hasUncaught = false;
        for (var mi = 0; mi < mons.length; mi++) {
          var dex = pokedex[mons[mi].id];
          if (!dex || !dex.c) { hasUncaught = true; break; }
        }
        if (!hasUncaught) continue;

        var cx = tx * TILE_SIZE + TILE_SIZE/2 + offX;
        var cy = ty * TILE_SIZE + TILE_SIZE/2 + offY;

        // Is this a trio/chosen member?
        var isSpecial = false;
        for (var si = 0; si < mons.length; si++) {
          if (trioIds.indexOf(mons[si].id) !== -1 || mons[si].id === chosenId) {
            isSpecial = true; break;
          }
        }

        var dotR = isSpecial ? 4 : 2.5;
        var dotAlpha = dist > VIS_RADIUS - 1 ? 0.4 : 0.75;

        // Colour by first uncaught mon's dominant axis
        var firstMon = mons[0];
        var dom = dominantAxis(firstMon);
        var dotHue = hue[AXIS_NAMES[dom]];

        // Check shiny
        var isShiny = false;
        for (var mj = 0; mj < mons.length; mj++) {
          if (shinyForId(mons[mj].id)) { isShiny = true; break; }
        }

        if (isShiny) {
          // Shiny sparkle — gold with star-shape glow
          ctx.fillStyle = "rgba(255,220,80," + dotAlpha + ")";
          ctx.beginPath();
          ctx.arc(cx, cy, dotR + 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "hsla(" + dotHue + ", 50%, 55%, " + dotAlpha + ")";
        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw player
    var px = playerTX * TILE_SIZE + TILE_SIZE/2 + offX;
    var py = playerTY * TILE_SIZE + TILE_SIZE/2 + offY;

    // Glow
    var glow = ctx.createRadialGradient(px, py, 0, px, py, TILE_SIZE * 2.5);
    glow.addColorStop(0, "rgba(255,210,80,0.35)");
    glow.addColorStop(0.5, "rgba(255,180,40,0.08)");
    glow.addColorStop(1, "rgba(255,160,30,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, TILE_SIZE * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Diamond shape
    var dSize = 6;
    ctx.fillStyle = "rgba(255,220,80,0.9)";
    ctx.beginPath();
    ctx.moveTo(px, py - dSize);
    ctx.lineTo(px + dSize, py);
    ctx.lineTo(px, py + dSize);
    ctx.lineTo(px - dSize, py);
    ctx.closePath();
    ctx.fill();

    // Subtle pulse ring
    var pulse = (Date.now() % 1500) / 1500;
    ctx.strokeStyle = "rgba(255,210,80," + (0.35 - pulse * 0.25) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, dSize + 4 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Continue animation loop
    animFrame = requestAnimationFrame(render);
  }

  // --- Movement ---

  function canMoveTo(tx, ty) {
    return tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE && steps > 0 && !catchActive;
  }

  function movePlayer(dx, dy) {
    if (!canMoveTo(playerTX + dx, playerTY + dy)) return false;

    playerTX += dx;
    playerTY += dy;
    steps--;
    markVisibilityRadius();

    // Check for encounter
    var key = tileKey(playerTX, playerTY);
    var mons = tileMons[key];
    if (mons && mons.length > 0 && !catchActive) {
      // Find first uncaught Pokémon on this tile
      for (var i = 0; i < mons.length; i++) {
        var dex = pokedex[mons[i].id];
        if (!dex || !dex.c) {
          // Mark as seen
          if (!dex) pokedex[mons[i].id] = { s: true, c: false };
          else dex.s = true;

          catchMon = mons[i];
          catchShiny = shinyForId(catchMon.id);
          catchActive = true;
          showCatchPrompt();
          break;
        }
      }
    }

    updateCounters();
    persistState();
    return true;
  }

  // --- Catch prompt ---

  function showCatchPrompt() {
    var overlay = document.querySelector(".explore-catch-overlay");
    if (overlay) overlay.parentNode.removeChild(overlay);

    overlay = document.createElement("div");
    overlay.className = "explore-catch-overlay";

    var modal = document.createElement("div");
    modal.className = "explore-catch-modal";

    var img = document.createElement("img");
    img.className = "explore-catch-art";
    img.src = catchShiny ? (catchMon.artwork_shiny_url || catchMon.artwork_url) : (catchMon.artwork_url || "");
    img.alt = catchMon.name;

    var nameEl = document.createElement("div");
    nameEl.className = "explore-catch-name";
    nameEl.innerHTML = "A wild " + capitalise(catchMon.name) + " appeared!" +
      (catchShiny ? ' <span class="explore-catch-shiny">&#9733;</span>' : "");

    var genusEl = document.createElement("div");
    genusEl.className = "explore-catch-genus";
    genusEl.textContent = catchMon.genus || "";

    var btns = document.createElement("div");
    btns.className = "explore-catch-btns";

    var throwBtn = document.createElement("button");
    throwBtn.className = "btn-retry";
    throwBtn.textContent = "Throw Ball (-1)";
    if (balls <= 0) { throwBtn.disabled = true; throwBtn.textContent = "No balls left"; }
    throwBtn.addEventListener("click", function() {
      attemptCatch();
    });

    var fleeBtn = document.createElement("button");
    fleeBtn.className = "btn-retry";
    fleeBtn.textContent = "Flee";
    fleeBtn.addEventListener("click", function() {
      closeCatchPrompt();
      // Bump player back one tile — find an empty or any adjacent tile
      stepBack();
    });

    btns.appendChild(throwBtn);
    btns.appendChild(fleeBtn);

    modal.appendChild(img);
    modal.appendChild(nameEl);
    modal.appendChild(genusEl);
    modal.appendChild(btns);
    overlay.appendChild(modal);

    // Insert into the gallery overlay
    var galleryOverlay = document.querySelector(".gallery-overlay");
    if (galleryOverlay) {
      galleryOverlay.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }
  }

  function closeCatchPrompt() {
    var overlay = document.querySelector(".explore-catch-overlay");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    catchActive = false;
    catchMon = null;
  }

  function attemptCatch() {
    if (balls <= 0 || !catchMon) return;

    balls--;

    // Catch rate based on distance from origin (cosmic regions are harder)
    var distFromOrigin = tileDist(playerTX, playerTY, GRID_SIZE/2, GRID_SIZE/2);
    var maxDist = GRID_SIZE / 2;
    var t = Math.min(1, distFromOrigin / maxDist);
    var rate = BASE_CATCH - t * (BASE_CATCH - MIN_CATCH);

    if (Math.random() < rate) {
      // Caught!
      var dex = pokedex[catchMon.id] || { s: true, c: false };
      dex.c = true;
      if (catchShiny) dex.shiny = true;
      pokedex[catchMon.id] = dex;

      closeCatchPrompt();
      showCatchResult(true);
    } else {
      closeCatchPrompt();
      showCatchResult(false);
    }

    updateCounters();
    persistState();
  }

  function showCatchResult(success) {
    var overlay = document.createElement("div");
    overlay.className = "explore-catch-overlay";

    var toast = document.createElement("div");
    toast.className = "explore-catch-toast";

    if (success) {
      toast.textContent = "Gotcha! " + capitalise(catchMon.name) + " was caught!" +
        (catchShiny ? " ★" : "");
      toast.classList.add("success");
    } else {
      toast.textContent = catchMon.name + " broke free!";
      stepBack();
    }

    overlay.appendChild(toast);

    var galleryOverlay = document.querySelector(".gallery-overlay");
    if (galleryOverlay) {
      galleryOverlay.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (!success) persistState();
    }, 1400);
  }

  function stepBack() {
    // Move player back toward origin by one tile (simplified — just away from current)
    var cx = GRID_SIZE / 2, cy = GRID_SIZE / 2;
    var dx = playerTX > cx ? -1 : (playerTX < cx ? 1 : 0);
    var dy = playerTY > cy ? -1 : (playerTY < cy ? 1 : 0);
    if (dx === 0 && dy === 0) dx = 1; // at exact center, move anywhere

    // Try preferred direction, fall back to any adjacent
    var attempts = [[dx, dy], [dx, 0], [0, dy], [-dx, -dy], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < attempts.length; i++) {
      var nx = playerTX + attempts[i][0];
      var ny = playerTY + attempts[i][1];
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        playerTX = nx; playerTY = ny;
        markVisibilityRadius();
        persistState();
        return;
      }
    }
  }

  // --- Counters ---

  function updateCounters() {
    var stepsEl = document.querySelector(".explore-steps");
    var ballsEl = document.querySelector(".explore-balls");
    var dexEl = document.querySelector(".explore-dex");
    if (stepsEl) stepsEl.textContent = "Steps: " + steps;
    if (ballsEl) ballsEl.textContent = "Balls: " + balls;
    if (dexEl) {
      var seen = 0, caught = 0;
      var keys = Object.keys(pokedex);
      for (var i = 0; i < keys.length; i++) {
        if (pokedex[keys[i]].s) seen++;
        if (pokedex[keys[i]].c) caught++;
      }
      dexEl.textContent = "Seen: " + seen + " / Caught: " + caught;
    }
  }

  // --- Input ---

  var KEY_DIR = {
    "ArrowUp":    [0, -1], "ArrowDown":  [0, 1],
    "ArrowLeft":  [-1, 0], "ArrowRight": [1, 0],
    "KeyW": [0, -1], "KeyS": [0, 1], "KeyA": [-1, 0], "KeyD": [1, 0]
  };

  function onKeyDown(e) {
    if (catchActive) return;
    var dir = KEY_DIR[e.code];
    if (!dir) return;

    e.preventDefault();

    if (!keysDown[e.code]) {
      keysDown[e.code] = true;
      movePlayer(dir[0], dir[1]);

      // Set up key repeat
      if (keyTimers[e.code]) clearTimeout(keyTimers[e.code]);
      keyTimers[e.code] = setTimeout(function() {
        if (keysDown[e.code]) {
          keyTimers[e.code] = setInterval(function() {
            if (keysDown[e.code]) movePlayer(dir[0], dir[1]);
          }, 70);
        }
      }, 160);
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
    if (keyTimers[e.code]) {
      clearTimeout(keyTimers[e.code]);
      clearInterval(keyTimers[e.code]);
      keyTimers[e.code] = null;
    }
  }

  // Mobile swipe
  var touchStartX, touchStartY;

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }

  function onTouchEnd(e) {
    if (catchActive) return;
    if (touchStartX === undefined) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var threshold = 30;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      movePlayer(dx > 0 ? 1 : -1, 0);
    } else if (Math.abs(dy) > threshold) {
      movePlayer(0, dy > 0 ? 1 : -1);
    }
    touchStartX = undefined; touchStartY = undefined;
  }

  // --- Persistence ---

  function persistState() {
    if (typeof onPersist === "function") onPersist();
  }

  var onPersist;

  // --- Public API ---

  function getExplorationState() {
    return {
      steps: steps,
      balls: balls,
      pokedex: pokedex,
      pairs: {
        // Convert visited bitset per pair to base64 for storage
        currentVisited: bitsetToBase64(visited),
        playerTX: playerTX,
        playerTY: playerTY
      },
      currentPair: currentPair
    };
  }

  function init(exploreCanvas, pokemonData, userVec, trioMons, chosenMon, closeFn, storedState) {
    canvas = exploreCanvas;
    ctx = canvas.getContext("2d");
    allPokemon = pokemonData;
    trio = trioMons;
    chosenPokemon = chosenMon;
    onClose = closeFn;
    hue = Poke_Mystery.colors.AXIS_HUE;

    sessionSeed = Math.floor(Math.random() * 1000000);
    shinyCache = {};

    // Restore or init state
    if (storedState) {
      steps = storedState.steps || 0;
      balls = storedState.balls || 0;
      pokedex = storedState.pokedex || {};
      currentPair = storedState.currentPair || 0;
    } else {
      steps = 0;
      balls = 0;
      pokedex = {};
      currentPair = 0;
    }

    // Init visited bitset per pair — restore from stored or fresh
    visited = new Uint8Array(GRID_SIZE * GRID_SIZE / 8);
    if (storedState && storedState.pairs && storedState.pairs.visited) {
      try { visited = base64ToBitset(storedState.pairs.visited); } catch(e) {}
    }

    // Player starts at center or restored position
    if (storedState && storedState.pairs && storedState.pairs.playerTX !== undefined) {
      playerTX = storedState.pairs.playerTX;
      playerTY = storedState.pairs.playerTY;
    } else {
      playerTX = Math.floor(GRID_SIZE / 2);
      playerTY = Math.floor(GRID_SIZE / 2);
    }

    // Place player near the user's quiz vector if first visit
    if (!storedState || !storedState.pairs || storedState.pairs.playerTX === undefined) {
      var pair = AXIS_PAIRS[currentPair];
      playerTX = projectCoord(userVec[pair.x], pair.x);
      playerTY = projectCoord(userVec[pair.y], pair.y);
    }

    // Camera starts at player
    camX = playerTX * TILE_SIZE + TILE_SIZE/2 - (canvas.width / (window.devicePixelRatio || 1)) / 2;
    camY = playerTY * TILE_SIZE + TILE_SIZE/2 - (canvas.height / (window.devicePixelRatio || 1)) / 2;

    // Precompute terrain
    precomputePair();

    // Mark initial visibility
    markVisibilityRadius();

    // Wire input
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    // Start render loop
    animFrame = requestAnimationFrame(render);
    updateCounters();
  }

  function switchPair(pairIndex) {
    if (pairIndex === currentPair) return;

    // Save current pair state before switching
    // (Handled by caller via getExplorationState + persist)

    currentPair = pairIndex;

    // Reset player to center of new projection
    playerTX = Math.floor(GRID_SIZE / 2);
    playerTY = Math.floor(GRID_SIZE / 2);

    // Fresh visited bitset
    visited = new Uint8Array(GRID_SIZE * GRID_SIZE / 8);

    // Recompute terrain for new pair
    precomputePair();
    markVisibilityRadius();
    updateCounters();
  }

  function destroy() {
    if (animFrame) cancelAnimationFrame(animFrame);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    if (canvas) {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    }
    // Clear key repeat timers
    Object.keys(keyTimers).forEach(function(k) {
      clearTimeout(keyTimers[k]);
      clearInterval(keyTimers[k]);
    });
    keyTimers = {};
    keysDown = {};
    catchActive = false;
  }

  function addSteps(n) { steps += n; updateCounters(); }
  function addBalls(n) { balls += n; updateCounters(); }
  function setPersistCallback(fn) { onPersist = fn; }

  return {
    init: init,
    switchPair: switchPair,
    destroy: destroy,
    getExplorationState: getExplorationState,
    addSteps: addSteps,
    addBalls: addBalls,
    setPersistCallback: setPersistCallback,
    updateCounters: updateCounters,
    // Expose for main.js to directly set pokedex entries
    addToPokedex: function(id, caught) {
      var entry = pokedex[id] || { s: true, c: false };
      if (caught) entry.c = true;
      pokedex[id] = entry;
    }
  };

  function capitalise(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

})();
