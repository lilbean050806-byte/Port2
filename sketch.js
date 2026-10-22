// ============================================================
// FINAL WEEK— Free Roam Top-Down with Boss Battle
// ============================================================

function updateCamera() {
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;
  targetX = constrain(targetX, 0, WORLD_W - width);
  targetY = constrain(targetY, 0, WORLD_H - height);
  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

let debugMode = false;

const WORLD_W = 1400;
const WORLD_H = 1600;

let camX = 0;
let camY = 0;
const CAM_SMOOTHING = 0.1;

const PLAYER_SPEED = 8;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN = 12;
const INVINCIBLE_FRAMES = 90;

const OFFSET_DOWN  = { x: 30, y: 0 };
const OFFSET_UP    = { x: 0,  y: 0 };
const OFFSET_RIGHT = { x: 0,  y: 0 };

let sewerExitPath = [];
let sewerPathUpdateTimer = 0;

const SEWER_PATH_UPDATE_RATE = 30;
const SEWER_LIGHT_SPEED = 0.08;
const SEWER_LIGHT_LENGTH = 5;
const STATE_LEVEL2_INTRO = "level2Intro";


let level3Starting = false;

let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 200,
  r: 22,
  blobT: 0,
  direction: { x: 0, y: -1 },
  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

let weekObjectives = [
  "Collect Evidence",
  "Get Supplies",
  "Don't Get Caught"
];

let bgImage;
let playerSheet;
let paperImage;
let denyStampImage;
let shootSound;
let SubScreen;
let music;
let bullets = [];

const FRAME_W = 150;
const FRAME_H = 200;
const PLAYER_SCALE = 0.25;

let currentFrame = 0;
let frameTimer   = 0;
let animSpeed    = 8;
let playerRow    = 0;

let enemies  = [];
let level    = 1;
let day      = 7;
let maxLevel = 3;

const STATE_HOME       = "home";
const STATE_WEEK_INTRO = "weekIntro";
const STATE_SUBSCREEN  = "subscreen";
const STATE_SCAVENGE   = "scavenge";
const STATE_WEEK3_PLATFORMER = "week3Platformer";
const STATE_WIN        = "win";
const STATE_OVER       = "over";
const STATE_EVIDENCE_BOARD = "board";

// opening cutscene state, plays after the main splash
// (STATE_HOME) and before the sub screen (STATE_SUBSCREEN).
const STATE_CUTSCENE = "cutscene";

let gameState = STATE_HOME;

let darknessLayer;
let eyeImage;
let copImage;
let timeLeft     = 30;
let timerStarted = false;

let supplies = 0;
let evidence = 0;
let evidenceCollectedThisLevel = false; // caps evidence pickups to one per level without wiping the running total the evidence board reads from

let evidenceBoardOpen = false;
let dumpsterImage;
let dumpsterOpenImage;
let boardImage;

let suppliesNeeded = 3;
let evidenceNeeded = 1;

let obstacleData;
let obstacles = [];

let enemyData;
let nextWave = 0;

// ============================================================
// DIFFICULTY TUNING — Level 1 cop cap. Level 1 now starts with
// exactly one cop, and checkWaveSpawns() below then adds
// one more cop at a time as the player advances, stopping once
// SCAVENGE_MAX_COPS is reached.
// ============================================================
const SCAVENGE_MAX_COPS = 5;

let boss     = null;
let bossData = null;
const BOSS_ZONE_Y = 300;

let bgShapes    = [];
let ezicImage;
let dimitriImage;
let playerHitSound;
let pickupSound;

let bunkerEntrance = {
  x: WORLD_W / 2,
  y: WORLD_H - 120,
  r: 60
};

let sewerDoorOpen = false;

/* ============================================================
   Game-over reason tracking (merged in from Week 7 A2) — lets
   the game-over screen explain WHY the run ended instead of
   always showing the same generic message.
   ============================================================ */
let gameOverTitle = "GAME OVER";
let loseReason = "";

/* ============================================================
   AUDIO — background music
   `bgMusic` is the new dark-suspense background track. It is
   only ever started ONCE, via startBackgroundMusic(), which is
   called from endIntroCutscene() — the moment the game hands off
   to STATE_SUBSCREEN, whether the player watched the whole
   opening cutscene or skipped it. It never starts during
   STATE_CUTSCENE itself.
   ============================================================ */
let bgMusic;
let musicStarted = false;
const BG_MUSIC_VOLUME = 0.15;

function startBackgroundMusic() {
  if (musicStarted) return;
  if (!bgMusic || !bgMusic.isLoaded()) return;

  musicStarted = true;
  bgMusic.setVolume(BG_MUSIC_VOLUME);
  bgMusic.loop();
}

/* ============================================================
   AUDIO — cop siren
   `sirenSound` used to play at a flat, overly loud volume all
   the time. It's now silent until a cop is within
   SIREN_TRIGGER_DISTANCE of the player, then fades smoothly in
   (and back out) based on the distance to the NEAREST cop, capped
   at a much lower ceiling (SIREN_MAX_VOLUME) so it never blasts.
   updateCopSiren() is called once per frame from both the Week 1
   scavenge level and the Week 2 sewer maze, passing in whichever
   enemy array is active.
   ============================================================ */
let sirenSound;
let sirenVolume = 0;
const SIREN_MAX_VOLUME = 0.12;       // hard ceiling — was blaring at full volume before
const SIREN_FADE_SPEED = 0.04;       // how quickly the fade catches up each frame
const SIREN_TRIGGER_DISTANCE = 450;  // cops beyond this distance are silent
const SIREN_MIN_AUDIBLE = 0.004;     // below this we just stop the sound instead of looping near-silently

function updateCopSiren(enemyList) {
  if (!sirenSound || !sirenSound.isLoaded()) return;

  let nearestDist = Infinity;
  for (let i = 0; i < enemyList.length; i++) {
    let d = dist(player.x, player.y, enemyList[i].x, enemyList[i].y);
    if (d < nearestDist) nearestDist = d;
  }

  let targetVolume = 0;
  if (nearestDist < SIREN_TRIGGER_DISTANCE) {
    targetVolume = map(nearestDist, 0, SIREN_TRIGGER_DISTANCE, SIREN_MAX_VOLUME, 0);
    targetVolume = constrain(targetVolume, 0, SIREN_MAX_VOLUME);
  }

  sirenVolume = lerp(sirenVolume, targetVolume, SIREN_FADE_SPEED);

  if (sirenVolume > SIREN_MIN_AUDIBLE) {
    if (!sirenSound.isPlaying()) sirenSound.loop();
    sirenSound.setVolume(sirenVolume);
  } else if (sirenSound.isPlaying()) {
    sirenSound.stop();
    sirenVolume = 0;
  }
}

// Called whenever we leave a cop-populated state (bunker, game
// over, win, week intro, etc.) so the siren doesn't keep looping
// in the background after the player is out of danger.
function stopCopSiren() {
  if (sirenSound && sirenSound.isPlaying()) {
    sirenSound.stop();
  }
  sirenVolume = 0;
}

/* ============================================================
   LEVEL 3 DATA — "Abandoned Police Office" platformer, pulled in
   from the standalone test build. Main path: start -> moverA
   across pit 1 -> ground2 (safety net) -> moverB across pit 2 ->
   ledge -> final platform -> goal. Optional alternate route:
   ledge4 -> vertical elevator -> top perch -> upper platform,
   skipping both pits entirely.
   ------------------------------------------------------------ */
const WEEK3_LEVEL_DATA = {
  platforms: [
    { x: 0,   y: 410, w: 170, h: 40 }, // starting ground
    { x: 350, y: 410, w: 110, h: 40 }, // safety-net ground between the two pits
    { x: 640, y: 410, w: 160, h: 40 }, // ground after the second pit
    { x: 30,  y: 320, w: 100, h: 16 }, // left ledge — bottom of the elevator shaft
    { x: 260, y: 250, w: 110, h: 16 }, // upper-route platform, reachable from the elevator top
    { x: 560, y: 270, w: 110, h: 16 }, // ledge leading to the final approach
    { x: 120, y: 150, w: 110, h: 16 }, // top perch — top of the elevator shaft
    { x: 680, y: 190, w: 100, h: 16 }, // final approach — goal sits here
  ],
  movers: [
    { x: 210, y: 380, w: 80, h: 16, axis: "x", base: 210, range: 70, speed: 0.020 },
    { x: 520, y: 360, w: 80, h: 16, axis: "x", base: 520, range: 80, speed: 0.018 },
    { x: 60,  y: 235, w: 70, h: 16, axis: "y", base: 235, range: 85, speed: 0.015 },
  ],
  hazards: [
    { x: 170, y: 430, w: 180, h: 20 }, // first pit floor
    { x: 460, y: 430, w: 180, h: 20 }, // second pit floor
  ],
  goal:  { x: 715, y: 150, w: 30, h: 40 },
  start: { x: 60, y: 100 },
};

let week3Platforms = [];
let week3Movers = [];
let week3Hazards = [];
let week3Goal = null;
let week3Player = null;
let week3BackgroundImage = null;     // policeStationBG equivalent (falls back to bunkerEnterImage)
let week3EntranceBgImage = null;     // bg.png equivalent for the entrance screen (falls back to bgImage)
let week3Phase = "entrance";
let week3BannerText = "";
let week3BannerTimer = 0;
let week3LevelComplete = false;

const WEEK3_GRAVITY = 0.6;
const WEEK3_PLATFORM_COLOR = [255, 160, 50];
const WEEK3_MOVER_COLOR = [90, 200, 255];
const WEEK3_HAZARD_COLOR = [220, 40, 40];
const WEEK3_GOAL_COLOR = [80, 240, 120];

function checkSewerClick() {
  let worldMouseX = mouseX + camX;
  let worldMouseY = mouseY + camY;

  let nearSewer =
    dist(
      player.x,
      player.y,
      bunkerEntrance.x,
      bunkerEntrance.y
    ) < 120;

  if (!nearSewer) return;

  let clickedSewer =
    dist(
      worldMouseX,
      worldMouseY,
      bunkerEntrance.x,
      bunkerEntrance.y
    ) < 110;

  if (!clickedSewer) return;

  if (!sewerDoorOpen) {
    sewerDoorOpen = true;

    if (pickupSound && pickupSound.isLoaded()) {
      pickupSound.stop();
      pickupSound.play();
    }

    return;
  }

  finishScavengeLevel();
}

const MAP_W      = 120;
const MAP_H      = 120;
const MAP_X      = 660;
const MAP_Y_OFFSET = 16;

const STATE_LOSE = "lose";

let homeImage;
let score = 0;

let evidencePhoto;
let ringImage;
let noteImage;
let flashDriveImage;
let tunnelClosed;
let tunnelOpen;
let bunkerEnterImage;
let bunkerImage;

let wire;
let water;
let watch;
let tape;
let survivorNote;
let radio;
let notes;
let medkit;
let lighter;
let food;
let difficultyMultiplier = 1;

if (timeLeft < 45) difficultyMultiplier = 1.5;
if (timeLeft < 30) difficultyMultiplier = 2.0;
if (timeLeft < 15) difficultyMultiplier = 3.5;

/* ============================================================
   Ghost-wife hallucination globals
   ============================================================ */
let wifeSheet;
let wifeVisible = false;
let wifeTimer = 0;

const WIFE_FRAME_W = 256;
const WIFE_FRAME_H = 256;

let wifeFrame = 0;
let wifeRow = 0;

/* ============================================================
   INTRO NARRATION CUTSCENE — plays once, the first time the
   player picks up any "fake" (hallucinated) item, in place of
   the normal quick ghost-wife flash.
   ============================================================ */

/* ------------------------------------------------------------
   Reusable typewriter dialogue system — usable for future story
   events too, not just this one.
   ------------------------------------------------------------ */
const TYPEWRITER_MS_PER_CHAR = 35;

function createTypewriterLine(text) {
  return {
    text: text,
    revealCount: 0,
    startTime: null,
    done: false,
  };
}

function updateTypewriterLine(line) {
  if (line.done) return;
  if (line.startTime === null) line.startTime = millis();

  let elapsed = millis() - line.startTime;
  let shouldReveal = floor(elapsed / TYPEWRITER_MS_PER_CHAR);
  line.revealCount = constrain(shouldReveal, 0, line.text.length);

  if (line.revealCount >= line.text.length) {
    line.done = true;
  }
}

function skipTypewriterLine(line) {
  line.revealCount = line.text.length;
  line.done = true;
}

function drawDialoguePanel(displayedText, panelAlpha) {
  push();

  let panelH = 130;
  let panelY = height - panelH - 30;
  let panelX = 40;
  let panelW = width - 80;

  noStroke();
  fill(0, 0, 0, 210 * panelAlpha);
  rect(panelX, panelY, panelW, panelH, 10);

  textFont("monospace");
  textAlign(LEFT, TOP);
  textSize(22);

  // slight text shadow, then the text itself
  fill(0, 0, 0, 180 * panelAlpha);
  text(displayedText, panelX + 32 + 1, panelY + 28 + 1, panelW - 64);

  fill(255, 255, 255, 255 * panelAlpha);
  text(displayedText, panelX + 32, panelY + 28, panelW - 64);

  pop();
}

/* ------------------------------------------------------------
   Intro cutscene state
   ------------------------------------------------------------ */
let introNarrationPlayed = false;
let introCutsceneActive = false;
let introCutscene = null;

const INTRO_PHASE_PANEL_FADE_IN = "panelFadeIn";
const INTRO_PHASE_TYPING_1      = "typing1";
const INTRO_PHASE_PAUSE_1       = "pause1";
const INTRO_PHASE_GHOST_FADE_IN = "ghostFadeIn";
const INTRO_PHASE_TYPING_2      = "typing2";
const INTRO_PHASE_PAUSE_2       = "pause2";
const INTRO_PHASE_FADE_OUT      = "fadeOut";
const INTRO_PHASE_DONE          = "done";

const INTRO_FADE_MS      = 400; // panel/ghost fade duration
const INTRO_PAUSE_MS     = 1000; // pause after line 1 finishes typing
const INTRO_END_PAUSE_MS = 700;  // pause after line 2 finishes typing

// ------------------------------------------------------------
// startIntroNarrationCutscene()
// Call this instead of the normal wifeVisible/wifeTimer
// hallucination trigger the FIRST time a fake item is picked up.
// ------------------------------------------------------------
function startIntroNarrationCutscene() {
  if (introNarrationPlayed || introCutsceneActive) return;

  introCutsceneActive = true;

  introCutscene = {
    phase: INTRO_PHASE_PANEL_FADE_IN,
    phaseStart: millis(),
    panelAlpha: 0,
    ghostAlpha: 0,
    line1: createTypewriterLine("Hmm... that doesn't seem real."),
    line2: createTypewriterLine("Find the real clues to solve my murder."),
    ghostSoundPlayed: false,
  };
}

// ------------------------------------------------------------
// updateIntroCutscene() — call once per frame while active,
// BEFORE drawIntroCutsceneOverlay().
// ------------------------------------------------------------
function updateIntroCutscene() {
  if (!introCutsceneActive || !introCutscene) return;

  let c = introCutscene;
  let elapsed = millis() - c.phaseStart;

  if (c.phase === INTRO_PHASE_PANEL_FADE_IN) {
    c.panelAlpha = constrain(elapsed / INTRO_FADE_MS, 0, 1);
    if (elapsed >= INTRO_FADE_MS) {
      c.phase = INTRO_PHASE_TYPING_1;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_TYPING_1) {
    updateTypewriterLine(c.line1);
    if (c.line1.done) {
      c.phase = INTRO_PHASE_PAUSE_1;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_PAUSE_1) {
    if (elapsed >= INTRO_PAUSE_MS) {
      c.phase = INTRO_PHASE_GHOST_FADE_IN;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_GHOST_FADE_IN) {
    if (!c.ghostSoundPlayed) {
      c.ghostSoundPlayed = true;
      if (pickupSound && pickupSound.isLoaded()) {
        pickupSound.stop();
        pickupSound.play();
      }
    }
    c.ghostAlpha = constrain(elapsed / INTRO_FADE_MS, 0, 1);
    if (elapsed >= INTRO_FADE_MS) {
      c.phase = INTRO_PHASE_TYPING_2;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_TYPING_2) {
    updateTypewriterLine(c.line2);
    if (c.line2.done) {
      c.phase = INTRO_PHASE_PAUSE_2;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_PAUSE_2) {
    if (elapsed >= INTRO_END_PAUSE_MS) {
      c.phase = INTRO_PHASE_FADE_OUT;
      c.phaseStart = millis();
    }

  } else if (c.phase === INTRO_PHASE_FADE_OUT) {
    let t = constrain(elapsed / INTRO_FADE_MS, 0, 1);
    c.panelAlpha = 1 - t;
    c.ghostAlpha = 1 - t;
    if (elapsed >= INTRO_FADE_MS) {
      c.phase = INTRO_PHASE_DONE;
    }

  } else if (c.phase === INTRO_PHASE_DONE) {
    introNarrationPlayed = true;
    introCutsceneActive = false;
    introCutscene = null;
  }
}

// ------------------------------------------------------------
// handleIntroCutsceneSkipInput() — call from keyPressed() when
// Space or Enter is pressed and introCutsceneActive is true.
// Skips the current typing line, or advances a waiting pause.
// ------------------------------------------------------------
function handleIntroCutsceneSkipInput() {
  if (!introCutscene) return;
  let c = introCutscene;

  if (c.phase === INTRO_PHASE_TYPING_1 && !c.line1.done) {
    skipTypewriterLine(c.line1);
    return;
  }
  if (c.phase === INTRO_PHASE_TYPING_2 && !c.line2.done) {
    skipTypewriterLine(c.line2);
    return;
  }
  if (c.phase === INTRO_PHASE_PAUSE_1) {
    c.phase = INTRO_PHASE_GHOST_FADE_IN;
    c.phaseStart = millis();
  } else if (c.phase === INTRO_PHASE_PAUSE_2) {
    c.phase = INTRO_PHASE_FADE_OUT;
    c.phaseStart = millis();
  }
}

// ------------------------------------------------------------
// drawIntroCutsceneGhost() — semi-transparent floating wife
// sprite with a soft glow, reusing the existing wifeSheet art.
// ------------------------------------------------------------
function drawIntroCutsceneGhost(alpha) {
  if (alpha <= 0) return;

  let floatOffset = sin(millis() * 0.0025) * 14;
  let screenX = width / 2;
  let screenY = height / 2 - 130 + floatOffset;

  push();
  imageMode(CENTER);
  noStroke();

  drawingContext.save();
  drawingContext.globalCompositeOperation = "lighter";
  fill(150, 200, 255, 90 * alpha);
  ellipse(screenX, screenY, 260, 260);
  drawingContext.restore();

  tint(200, 220, 255, 255 * alpha * 0.85);

  let frame = floor(millis() / 220) % 4;
  image(
    wifeSheet,
    screenX, screenY,
    300, 300,
    frame * WIFE_FRAME_W, 0,
    WIFE_FRAME_W, WIFE_FRAME_H
  );

  noTint();
  pop();
}

// ------------------------------------------------------------
// drawIntroCutsceneOverlay() — call once per frame while active,
// AFTER your normal HUD draw calls, so it renders on top.
// ------------------------------------------------------------
function drawIntroCutsceneOverlay() {
  if (!introCutsceneActive || !introCutscene) return;

  let c = introCutscene;

  push();
  noStroke();
  fill(0, 0, 0, 90 * max(c.panelAlpha, c.ghostAlpha));
  rect(0, 0, width, height);
  pop();

  drawIntroCutsceneGhost(c.ghostAlpha);

  let activeLine = null;
  if (c.phase === INTRO_PHASE_TYPING_1 || c.phase === INTRO_PHASE_PAUSE_1) {
    activeLine = c.line1;
  } else if (
    c.phase === INTRO_PHASE_GHOST_FADE_IN ||
    c.phase === INTRO_PHASE_TYPING_2 ||
    c.phase === INTRO_PHASE_PAUSE_2 ||
    c.phase === INTRO_PHASE_FADE_OUT
  ) {
    activeLine = c.line2;
  }

  if (activeLine && c.panelAlpha > 0) {
    let displayed = activeLine.text.substring(0, activeLine.revealCount);
    drawDialoguePanel(displayed, c.panelAlpha);
  }
}

/* ============================================================
   Opening cutscene globals
   ============================================================ */
let introVideo;                 // p5.MediaElement for the opening cutscene
let introVideoReady = false;    // true once the video element is loaded
let introVideoEnded = false;    // guards against onended firing more than once
const INTRO_VIDEO_PATH = "opening_cutscene.mp4";
const INTRO_SKIP_HINT_DELAY = 60; // frames before the "press to skip" hint appears

/* ============================================================
   WEEK 2 — sewer maze crawl (recursive-backtracker grid, same
   idea as the Pac-Man sketch's `maze` grid + isValidMove()
   corner check: a grid of 1s (wall) and 0s (open tunnel)).
   Movement stays continuous/pixel-based and the camera stays
   free-roam top-down — nothing is snapped to the grid visually
   — but walls block the player, and every item/prop is snapped
   onto an open tunnel cell so nothing spawns in a wall.

   v3 upgrade: items are now the same real named pickups (wire,
   water, watch, etc.) that Week 1 uses instead of a generic
   sprite-sheet frame, sourced from obstacleData exactly like
   Week 1's buildSewerLevel() did in the standalone sewer-maze
   example, and the tunnels get scattered decorative "eye" props
   for atmosphere the same way Week 1's world does.

   v4 upgrade: patrolling cops (sewerEnemies), using the same
   grid-aligned wandering logic Week 1's cops use, adapted to
   this maze's own grid/collision helpers.

   All names below are prefixed "sewer"/"SEWER" so nothing
   collides with Week 1's own names.
   ============================================================ */
const STATE_DUMPSTER = "dumpster";

const SEWER_CELL_SIZE = 90;     // pixel size of one grid cell
const SEWER_MAZE_COLS = 21;     // must be odd
const SEWER_MAZE_ROWS = 27;     // must be odd

const SEWER_WORLD_W = SEWER_MAZE_COLS * SEWER_CELL_SIZE;
const SEWER_WORLD_H = SEWER_MAZE_ROWS * SEWER_CELL_SIZE;

let sewerMaze = [];             // sewerMaze[row][col] === 1 -> wall, 0 -> open tunnel
let sewerSpawnPoint = { x: 0, y: 0 };
let sewerExitPoint  = { x: 0, y: 0 }; // the tunnel door leading to the Week 3 police office

let sewerItems = [];

// Patrolling cops for the sewer maze — same grid-aligned
// wandering pattern as Week 1's `enemies`, sourced from their
// own array so nothing collides with Week 1's state.
let sewerEnemies = [];
const SEWER_ENEMY_COUNT = 5;

// Decorative watching eyes scattered through the open tunnels,
// same idea as Week 1's bgShapes + drawEyeImage().
let sewerBgShapes = [];
const SEWER_BG_SHAPE_COUNT = 45;

// ============================================================
// Searchable dumpsters, living in the Week 1 free-roam scavenge
// level. Scattered around the open world (WORLD_W x WORLD_H)
// instead of lined up along a single side-scrolling corridor.
// ============================================================
let scavengeDumpsterSpots = [];
const SCAVENGE_DUMPSTER_COUNT  = 5;
const SCAVENGE_DUMPSTER_SIZE   = 110;
const SCAVENGE_DUMPSTER_RADIUS = 90; // how close the player needs to be to search one
const DUMPSTER_ITEM_VISIBLE_MS = 400; // how long a found item stays on screen before fading

// Scattered junk sprite sheet (junkitems.png), 8
// columns x 7 rows of loose items (bags, boxes, cans, photos,
// tools, etc.). Still used by Week 1's obstacle art; Week 2's
// sewer maze now uses real named item images instead (see the
// "v3 upgrade" note above).
let itemSheet = null;
const ITEM_SHEET_COLS = 8;
const ITEM_SHEET_ROWS = 7;
let itemFrameW = 0;
let itemFrameH = 0;

// Sewer-maze-level countdown. Running out catches the player,
// same outcome as running out of night in the top-down level.
const DUMPSTER_TIME_LIMIT = 60;
let dumpsterTimeLeft = DUMPSTER_TIME_LIMIT;

// ============================================================
// setupScavengeDumpsterSpots()
// Initializes the searchable scavenge dumpsters before setup() uses it.
// ============================================================
function setupScavengeDumpsterSpots(itemImages) {
  if (!Array.isArray(itemImages)) return;

  scavengeDumpsterSpots = [];

  for (let i = 0; i < SCAVENGE_DUMPSTER_COUNT; i++) {
    let x, y;
    let tooCloseToBunker;

    do {
      x = random(220, WORLD_W - 220);
      y = random(240, WORLD_H - 240);
      tooCloseToBunker = dist(x, y, bunkerEntrance.x, bunkerEntrance.y) < 220;
    } while (tooCloseToBunker);

    scavengeDumpsterSpots.push({
      x,
      y,
      searched: false,
      open: false,
      image: random(itemImages),
      real: random() > 0.3,
      type: random() < 0.3 ? "evidence" : "supply",
      itemVisibleUntil: 0
    });
  }
}

// ============================================================
// startIntroCutscene()
// Lightweight early definition so keyPressed()/mousePressed()
// can call it before the later function body is parsed.
// ============================================================
function startIntroCutscene() {
  gameState = STATE_CUTSCENE;
  introVideoEnded = false;

  userStartAudio();

  if (introVideo) {
    introVideo.time(0);
    introVideo.play();
  } else {
    endIntroCutscene();
  }
}

// ============================================================
// buildSewerMazeLevel()
// Generates a fresh sewer maze for Week 2: the grid itself, the
// spawn point, the exit point (leads to the Week 3 police
// office), a scatter of real evidence/supply items (same art as
// Week 1, sourced from obstacleData like the standalone sewer
// example did) snapped onto open tunnel cells, a handful of
// decorative watching eyes for atmosphere, and a fresh set of
// patrolling cops.
// ============================================================
function buildSewerMazeLevel() {
  sewerExitPath = [];
  sewerPathUpdateTimer = 0;

  sewerMaze = generateMazeGrid(SEWER_MAZE_COLS, SEWER_MAZE_ROWS);

  sewerSpawnPoint = mazeGridToWorld(1, SEWER_MAZE_ROWS - 2, SEWER_CELL_SIZE);
  sewerExitPoint  = mazeGridToWorld(SEWER_MAZE_COLS - 2, 1, SEWER_CELL_SIZE);

  let itemImages = [
    wire, water, watch, tape, survivorNote,
    radio, notes, medkit, lighter, food
  ];

  sewerItems = [];
  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    let snapped = nearestOpenMazeCell(
      sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS,
      o.x, o.y
    );

    sewerItems.push({
      x:         snapped.x,
      y:         snapped.y,
      size:      o.size,
      collected: false,
      image:     random(itemImages),
      real:      random() > 0.3,
      type:      random() < 0.3 ? "evidence" : "supply"
    });
  }

  sewerBgShapes = [];
  for (let i = 0; i < SEWER_BG_SHAPE_COUNT; i++) {
    let col = floor(random(1, SEWER_MAZE_COLS - 1));
    let row = floor(random(1, SEWER_MAZE_ROWS - 1));
    let p = mazeGridToWorld(col, row, SEWER_CELL_SIZE);

    sewerBgShapes.push({
      x:        p.x + random(-SEWER_CELL_SIZE / 3, SEWER_CELL_SIZE / 3),
      y:        p.y + random(-SEWER_CELL_SIZE / 3, SEWER_CELL_SIZE / 3),
      size:     random(30, 55),
      rotation: random(-30, 30),
    });
  }

  // Fresh patrolling cops every time the maze is (re)built. Spots
  // are snapped onto open tunnel cells so nothing spawns in a
  // wall, and anything too close to the player's spawn is
  // re-rolled so the player doesn't walk straight into a cop.
  sewerEnemies = [];
  for (let i = 0; i < SEWER_ENEMY_COUNT; i++) {
    let spot = nearestOpenMazeCell(
      sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS,
      random(SEWER_WORLD_W), random(SEWER_WORLD_H)
    );

    if (dist(spot.x, spot.y, sewerSpawnPoint.x, sewerSpawnPoint.y) < SEWER_CELL_SIZE * 3) {
      i--;
      continue;
    }

    sewerEnemies.push({
      x: spot.x,
      y: spot.y,
      r: 20,
      speed: 2.4,
      direction: null,
    });
  }
}

// ============================================================
// preload()
// ============================================================
let sewerDoorClosedImage;
let sewerDoorOpenImage;
let sewerFloor;

function preload() {
  sewerDoorClosedImage = loadImage("tunnelClosed.png");
  sewerDoorOpenImage = loadImage("tunnelOpen.png");
  enemyData = loadJSON("enemies.json");
  obstacleData = loadJSON("obstacles.json");
  playerSheet = loadImage("paperspleasecharacterspritesheet.png");
  bgImage = loadImage("paperspleasebackground.png");
  boardImage = loadImage("Bulletinboard.png");
  bunkerImage = loadImage("bunkerimg.png");

  music = loadSound("papersplease.mp3");
sirenSound = music; // same audio, no need to load it twice
  // AUDIO — new dark-suspense background track. Loaded separately
  // from the legacy `music` variable so nothing else needs to
  // change; `music` is kept around in case it's still referenced
  // elsewhere, but the game now plays `bgMusic` (see
  // startBackgroundMusic()).
  bgMusic = loadSound("backgroundMusic.mp3");
  // AUDIO — cop siren, now volume-managed by updateCopSiren()
  // instead of playing at a flat, overly loud level.

  playerHitSound = loadSound("playerhit.wav");
  shootSound = loadSound("shoot.wav");
  eyeImage = loadImage("eye.png");
  copImage = loadImage("cop.png");
  pickupSound = loadSound("pickup.mp3");
  

  wire = loadImage("wire.png");
  water = loadImage("water.png");
  watch = loadImage("watch.png");
  tape = loadImage("tape.png");
  survivorNote = loadImage("survivornote.png");
  radio = loadImage("radio.png");
  notes = loadImage("notes.png");
  medkit = loadImage("medki.png");
  lighter = loadImage("lighter.png");
  food = loadImage("food.png");
  homeImage = loadImage("home.png");
  SubScreen = loadImage("SubScreen.png");

  wifeSheet = loadImage("deadwife.png");

  // Week 1 dumpster art (searchable dumpsters in the free-roam level)
  dumpsterImage = loadImage("dumpster.png");
  dumpsterOpenImage = loadImage("dumpsterOpenImage.png");

  // Scattered junk items sprite sheet — used for Week 1 obstacle
  // art.
  itemSheet = loadImage("junkitems.png");

  // Week 3 — Abandoned Police Office platformer assets
  // (policeStationBG / bg from the standalone test build).
  // Falls back to bunkerEnterImage / bgImage in drawWeek3Level()
  // and drawWeek3EntranceScreen() if these files aren't present.
  week3BackgroundImage = loadImage("background.png");
  week3EntranceBgImage = loadImage("bg.png");

  // Week 2 sewer maze floor texture
  sewerFloor = loadImage("sewerFloor.png");

function loadOk() {}
function loadFail(name) {
  return (err) => console.error("FAILED TO LOAD:", name, err);
}

}

// ============================================================
// MAZE UTILITIES (Week 2 sewer crawl) — parameterized so they
// don't collide with anything Week 1 uses. Same "grid of 1s and
// 0s" concept, and the same corner-sampling collision check, as
// the Pac-Man sketch's maze + isValidMove().
// ============================================================
function generateMazeGrid(cols, rows) {
  let grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(1));
  }

  function carve(cx, cy) {
    grid[cy][cx] = 0;
    let dirs = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]]);
    for (let d of dirs) {
      let nx = cx + d[0];
      let ny = cy + d[1];
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
        grid[cy + d[1] / 2][cx + d[0] / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  return grid;
}

function mazeGridToWorld(col, row, cellSize) {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2
  };
}

function isMazeWallCell(grid, cols, rows, col, row) {
  if (col < 0 || col >= cols || row < 0 || row >= rows) return true;
  return grid[row][col] === 1;
}

// Corner-sampling collision check — same technique as the
// Pac-Man sketch's isValidMove(), adapted for a circular player.
function canMoveInMaze(grid, cellSize, cols, rows, x, y, r) {
  let pts = [
    [x - r, y - r], [x + r, y - r],
    [x - r, y + r], [x + r, y + r]
  ];
  for (let i = 0; i < pts.length; i++) {
    let col = Math.floor(pts[i][0] / cellSize);
    let row = Math.floor(pts[i][1] / cellSize);
    if (isMazeWallCell(grid, cols, rows, col, row)) return false;
  }
  return true;
}

// Snaps any world coordinate to the nearest open tunnel-cell
// center, so items/props never spawn inside a wall.
function nearestOpenMazeCell(grid, cellSize, cols, rows, x, y) {
  let col = Math.round(x / cellSize);
  let row = Math.round(y / cellSize);
  if (col % 2 === 0) col += 1;
  if (row % 2 === 0) row += 1;
  col = constrain(col, 1, cols - 2);
  row = constrain(row, 1, rows - 2);

  if (!isMazeWallCell(grid, cols, rows, col, row)) return mazeGridToWorld(col, row, cellSize);

  for (let radius = 2; radius < max(cols, rows); radius += 2) {
    for (let dc = -radius; dc <= radius; dc += 2) {
      for (let dr = -radius; dr <= radius; dr += 2) {
        let c = col + dc, r = row + dr;
        if (c < 1 || c > cols - 2 || r < 1 || r > rows - 2) continue;
        if (!isMazeWallCell(grid, cols, rows, c, r)) return mazeGridToWorld(c, r, cellSize);
      }
    }
  }
  return mazeGridToWorld(1, 1, cellSize);
}

// ------------------------------------------------------------
// Sewer cop wandering — same grid-aligned "pick a direction,
// walk it until blocked, re-pick at junctions/walls" pattern as
// the Pac-Man sketch's moveGhost(), adapted to this maze's own
// canMoveInMaze()/SEWER_* grid instead of Week 1's open world.
// Restricted to the 4 axis-aligned directions (matching how the
// maze grid actually connects, no diagonal corner-cutting), and
// re-evaluates immediately whenever a move is blocked instead of
// waiting on a low random chance, so cops don't stall in dead
// ends or corners.
// ------------------------------------------------------------
function sewerDirectionOptions() {
  return [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
}

function pickSewerEnemyDirection(e, currentDir) {
  let options = shuffle(sewerDirectionOptions());

  // Prefer any direction that isn't a straight reversal, if one is open
  let nonReverse = options.filter(d => {
    if (!currentDir) return true;
    return !(d.dx === -currentDir.dx && d.dy === -currentDir.dy);
  });

  for (let d of nonReverse) {
    let testX = e.x + d.dx * e.speed;
    let testY = e.y + d.dy * e.speed;
    if (canMoveInMaze(sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS, testX, testY, e.r * 0.7)) return d;
  }

  // Dead end — reversing is the only way out, so allow it
  for (let d of options) {
    let testX = e.x + d.dx * e.speed;
    let testY = e.y + d.dy * e.speed;
    if (canMoveInMaze(sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS, testX, testY, e.r * 0.7)) return d;
  }

  return null; // fully boxed in (shouldn't normally happen)
}

function updateSewerEnemies() {
  for (let i = 0; i < sewerEnemies.length; i++) {
    let e = sewerEnemies[i];

    if (!e.direction) {
      e.direction = pickSewerEnemyDirection(e, null);
    }

    let moved = false;
    if (e.direction) {
      let newX = e.x + e.direction.dx * e.speed;
      let newY = e.y + e.direction.dy * e.speed;

      if (canMoveInMaze(sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS, newX, newY, e.r * 0.7)) {
        e.x = newX;
        e.y = newY;
        moved = true;
      }
    }

    // Reconsider direction whenever blocked, plus occasionally
    // at random so patrols don't all just go straight forever.
    if (!moved || random() < 0.02) {
      let newDir = pickSewerEnemyDirection(e, e.direction);
      if (newDir) e.direction = newDir;
    }
  }
}

function drawSewerEnemies() {
  for (let i = 0; i < sewerEnemies.length; i++) {
    let e = sewerEnemies[i];
    push();
    imageMode(CENTER);
    image(copImage, e.x, e.y, e.r * 4, e.r * 4);
    pop();
  }
}

function checkSewerEnemyPlayerCollision() {
  if (gameState === STATE_OVER) return;

  for (let i = 0; i < sewerEnemies.length; i++) {
    const cop = sewerEnemies[i];

    const d = dist(
      player.x,
      player.y,
      cop.x,
      cop.y
    );

    // Smaller invisible hitboxes
    const playerHitRadius = player.r * 0.55;
    const copHitRadius = cop.r * 0.45;

    if (d < playerHitRadius + copHitRadius) {
      if (
        playerHitSound &&
        playerHitSound.isLoaded()
      ) {
        playerHitSound.play();
      }

      gameOverTitle = "YOU WERE CAUGHT";
      loseReason = "A cop patrol found you in the tunnels.";
      gameState = STATE_OVER;

      return;
    }
  }
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  darknessLayer = createGraphics(width, height);
  noSmooth(); // pixel-art sheets: stop bilinear filtering from blending in the next frame/row

  music.setVolume(0.005);
  pickupSound.setVolume(2.0);
  shootSound.setVolume(2.5);
  playerHitSound.setVolume(1.0);
  bossData = enemyData.boss;

  let itemImages = [
    wire, water, watch, tape, survivorNote,
    radio, notes, medkit, lighter, food
  ];

  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({
      x:         o.x,
      y:         o.y,
      size:      o.size,
      collected: false,
      image:     random(itemImages),
      real:      random() > 0.3,
      type:      random() < 0.3 ? "evidence" : "supply"
    });
  }

  for (let i = 0; i < 120; i++) {
    bgShapes.push({
      x:        random(WORLD_W),
      y:        random(WORLD_H),
      size:     random(80, 140),
      rotation: random(-30, 30),
    });
  }

  camX = player.x - width / 2;
  camY = player.y - height / 2;

  // scatter searchable dumpsters around the Week 1 world
  setupScavengeDumpsterSpots(itemImages);

  // set up the item sheet frame size (used by Week 1 obstacles)
  itemFrameW = itemSheet.width / ITEM_SHEET_COLS;
  itemFrameH = itemSheet.height / ITEM_SHEET_ROWS;

  // set up (but don't play yet) the opening cutscene video.
  // Created here rather than preload() since HTML5 video doesn't
  // need to block preload, and we want full control over playback.
  setupIntroVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  darknessLayer = createGraphics(width, height);
}

// ============================================================
// draw()
// ============================================================
function draw() {
if (debugMode) {
  drawDebugMode();
  return;
}

if (
  gameState ===
  STATE_LEVEL2_INTRO
) {

  drawLevel2Intro();

  return;
}

  if (gameState !== STATE_SCAVENGE && gameState !== STATE_DUMPSTER) {
    stopCopSiren();
  }

  if (evidenceBoardOpen) {
    drawEvidenceBoard();
    return;
  }

  if (gameState === STATE_HOME) {
    drawHomeScreen();
    return;
  }

  // Opening cutscene, plays between the main splash
  // (STATE_HOME) and the sub screen (STATE_SUBSCREEN).
  if (gameState === STATE_CUTSCENE) {
    drawIntroCutscene();
    return;
  }

  if (gameState === STATE_SUBSCREEN) {
    drawSubScreen();
    return;
  }

  if (gameState === STATE_WEEK_INTRO) {
    drawWeekIntro();
    return;
  }

  // Week 3 — police station platformer, entered after Week 2
  // (the sewer maze) is finished.
  if (gameState === STATE_WEEK3_PLATFORMER) {
    drawWeek3PlatformerFlow();
    return;
  }

  if (gameState === STATE_SCAVENGE) {
    background(20);

    updateCamera();

    push();
    translate(-camX, -camY);

    drawBackground();

    // Freeze gameplay updates while the intro narration cutscene
    // (first fake pickup) is playing.
    if (!introCutsceneActive) {
      handleInput();
      updateTimer();

      checkWaveSpawns();
      updateEnemies();
    }

    drawObstacles();
    drawScavengeDumpsters();
    drawEnemies();
    drawPlayer();
    drawBunkerGuideArrow();

    if (!introCutsceneActive) {
      checkBunkerEntrance();
      checkEnemyPlayerCollision();
    }

    pop();
    drawFlashlight();

    // AUDIO — fade the cop siren in/out based on distance to the
    // nearest cop in this level.
    updateCopSiren(enemies);

    updateWifeHallucination();
    drawWifeHallucination();

    drawPlayerScreen();
    drawMinimap();
    drawHUD();

    updateIntroCutscene();
    drawIntroCutsceneOverlay();

    return;
  }

  // Week 2 — sewer maze crawl. Comes right after the Week 1
  // scavenge level, and hands off to the Week 3 police station
  // platformer when the player reaches the sewer exit.
  if (gameState === STATE_DUMPSTER) {
    background(8, 10, 8);

    updateSewerMazeCamera();

    push();
    translate(-camX, -camY);

    drawSewerMazeBackground();

    if (!introCutsceneActive) {
      handleSewerMazeInput();
      updateDumpsterTimer();
      updateSewerEnemies();
    }

    drawSewerItems();
    drawSewerEnemies();
    drawSewerExitDoor();
    drawPlayer();
    drawSewerGuideArrow();

    if (!introCutsceneActive) {
      checkSewerMazeExit();
      checkSewerEnemyPlayerCollision();
    }

    pop();

    drawFlashlight();
    drawSewerPoliceGlow();

    // AUDIO — same siren fade logic, driven by the sewer maze's
    // own patrolling cops instead.
    updateCopSiren(sewerEnemies);

    updateWifeHallucination();
    drawWifeHallucination();

    drawPlayerScreen();
    drawDumpsterHUD();

    updateIntroCutscene();
    drawIntroCutsceneOverlay();

    return;
  }

  if (gameState === STATE_WIN) {
    drawWinScreen();
    return;
  }

  if (gameState === STATE_OVER) {
    drawGameOver();
    return;
  }
}

// ============================================================
// drawFlashlight()
// ============================================================
function drawFlashlight() {
  let screenX = player.x - camX;
  let screenY = player.y - camY;

  push();
  noStroke();
  fill(0, 160);
  rect(0, 0, width, height);

  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';

  fill(255, 230, 150, 50);
  ellipse(screenX, screenY, 120, 120);

  let dx = player.direction.x;
  let dy = player.direction.y;
  fill(255, 230, 150, 50);
  triangle(
    screenX,
    screenY,
    screenX + dx * 360 + dy * 100,
    screenY + dy * 360 - dx * 100,
    screenX + dx * 360 - dy * 100,
    screenY + dy * 360 + dx * 100
  );

  fill(255, 230, 150, 0.12);
  ellipse(screenX, screenY, 260, 260);

  drawingContext.restore();
  pop();
}

/* ============================================================
   Ghost-wife hallucination update + draw
   ============================================================ */
function updateWifeHallucination() {
  if (!wifeVisible) return;

  wifeTimer--;

  if (frameCount % 8 === 0) {
    wifeFrame++;
  }

  if (wifeFrame > 3) {
    wifeFrame = 0;
  }

  if (player.direction.y === -1) wifeRow = 0;
  else if (player.direction.x === 1) wifeRow = 1;
  else if (player.direction.x === -1) wifeRow = 1;
  else if (player.direction.y === 1) wifeRow = 3;

  if (wifeTimer <= 0) {
    wifeVisible = false;
  }
}

function drawWifeHallucination() {
  if (!wifeVisible) return;

  push();

  imageMode(CENTER);
  tint(255, 180);

  let screenX = width / 2;
  let screenY = height / 2 - 100;

  image(
    wifeSheet,
    screenX,
    screenY,
    300,
    300,
    wifeFrame * WIFE_FRAME_W,
    wifeRow * WIFE_FRAME_H,
    WIFE_FRAME_W,
    WIFE_FRAME_H
  );

  noTint();
  pop();
}

// ============================================================
// drawBunkerGuideArrow()
// Once the player has everything this level needs (one piece of
// evidence + enough supplies), a small pulsing arrow floats a
// short distance from the player and points toward the bunker
// entrance, rotating live as the player moves so it always leads
// the way home. Drawn in world space (inside the same
// translate(-camX, -camY) block as the player/enemies) so it
// sits naturally in the scene instead of stuck to the screen edge.
// ============================================================
function drawBunkerGuideArrow() {
  if (gameState !== STATE_SCAVENGE) return;
  if (!(evidenceCollectedThisLevel && supplies >= suppliesNeeded)) return;

  let angle = atan2(bunkerEntrance.y - player.y, bunkerEntrance.x - player.x);
  let arrowDist = 110;
  let ax = player.x + cos(angle) * arrowDist;
  let ay = player.y + sin(angle) * arrowDist;

  let pulse = map(sin(frameCount * 0.12), -1, 1, 0.9, 1.25);

  push();
  translate(ax, ay);
  rotate(angle);
  scale(pulse);

  noStroke();

  // soft glow behind the arrowhead so it reads clearly in the dark
  fill(120, 255, 150, 70);
  ellipse(0, 0, 90, 90);

  // arrow shaft
  fill(120, 255, 150, 230);
  rect(-42, -8, 36, 16, 3);

  // arrowhead
  triangle(4, -22, 40, 0, 4, 22);

  pop();
}

// ============================================================
// drawSewerGuideArrow()
// Same idea as drawBunkerGuideArrow(), but for the Week 2 sewer
// maze — once fully stocked, points toward the sewer exit instead
// of the bunker.
// ============================================================
function drawSewerGuideArrow() {
  if (gameState !== STATE_DUMPSTER) return;
  if (!(evidenceCollectedThisLevel && supplies >= suppliesNeeded)) return;

  let angle = atan2(sewerExitPoint.y - player.y, sewerExitPoint.x - player.x);
  let arrowDist = 110;
  let ax = player.x + cos(angle) * arrowDist;
  let ay = player.y + sin(angle) * arrowDist;

  let pulse = map(sin(frameCount * 0.12), -1, 1, 0.9, 1.25);

  push();
  translate(ax, ay);
  rotate(angle);
  scale(pulse);

  noStroke();

  fill(120, 255, 150, 70);
  ellipse(0, 0, 90, 90);

  fill(120, 255, 150, 230);
  rect(-42, -8, 36, 16, 3);

  triangle(4, -22, 40, 0, 4, 22);

  pop();
}

// ============================================================
// drawPlayerScreen()
// ============================================================
function drawPlayerScreen() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) {
    return;
  }

  let row;
  if      (player.direction.y ===  1) row = 3;
  else if (player.direction.y === -1) row = 0;
  else if (player.direction.x ===  1) row = 1;
  else if (player.direction.x === -1) row = 1;
  else                                 row = playerRow;

  let offsetX = 0;
  let offsetY = 0;
  if      (row === 3) { offsetX = OFFSET_DOWN.x;  offsetY = OFFSET_DOWN.y;  }
  else if (row === 0) { offsetX = OFFSET_UP.x;    offsetY = OFFSET_UP.y;    }
  else if (row === 1) { offsetX = OFFSET_RIGHT.x; offsetY = OFFSET_RIGHT.y; }

  let flip = player.direction.x === -1;
  let appliedOffsetX = flip ? -offsetX : offsetX;

  let sx = player.x - camX + appliedOffsetX;
  let sy = player.y - camY + offsetY;

  push();
  imageMode(CENTER);

  if (flip) {
    translate(sx, sy);
    scale(-1, 1);
    image(playerSheet, 0, 0,
      FRAME_W * PLAYER_SCALE, FRAME_H * PLAYER_SCALE,
      currentFrame * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
  } else {
    image(playerSheet, sx, sy,
      FRAME_W * PLAYER_SCALE, FRAME_H * PLAYER_SCALE,
      currentFrame * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
  }

  pop();
}

// ============================================================
// drawObstacles()
// ============================================================
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    if (o.collected) continue;

    if (
      o.x < camX - o.size ||
      o.x > camX + width  + o.size ||
      o.y < camY - o.size ||
      o.y > camY + height + o.size
    ) continue;

    let d      = dist(player.x, player.y, o.x, o.y);
    let nearby = d < 120;

    push();
    imageMode(CENTER);

    if (nearby) {
      drawingContext.shadowBlur  = 25;
      drawingContext.shadowColor = "yellow";
    }

    image(o.image, o.x, o.y, o.size, o.size);

    drawingContext.shadowBlur = 0;

    if (nearby) {
      fill(255);
      textAlign(CENTER);
      textSize(22
      );
      text("Press Space to inspect", o.x, o.y - o.size);
    }

    pop();
  }
}

// ============================================================
// applyBounce()
// ============================================================
function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, WORLD_W - player.r);
    player.y = constrain(player.y, player.r, WORLD_H - player.r);
  }
}

// ============================================================
// drawBackground()
// ============================================================
function drawBackground() {
  imageMode(CORNER);
  image(bgImage, 0, 0, WORLD_W, WORLD_H);

  // ADDED — soft warm spotlight glow at the bunker entrance, drawn
  // in world space BEFORE the bunker sprite so the building sits
  // in front of the glow (glow reads as a light source behind the
  // bunker, showing around its silhouette) rather than floating
  // on top of it. Uses the same additive "lighter" blend as the
  // player's flashlight so it still reads through the darkness
  // overlay drawn later in drawFlashlight().
  push();
  imageMode(CENTER);
  noStroke();
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';

  let bunkerPulse = map(sin(frameCount * 0.04), -1, 1, 0.85, 1);

  fill(255, 220, 140, 45 * bunkerPulse);
  ellipse(bunkerEntrance.x, bunkerEntrance.y, 420 * bunkerPulse, 420 * bunkerPulse);

  fill(255, 235, 180, 70 * bunkerPulse);
  ellipse(bunkerEntrance.x, bunkerEntrance.y, 220 * bunkerPulse, 220 * bunkerPulse);

  fill(255, 250, 220, 120 * bunkerPulse);
  ellipse(bunkerEntrance.x, bunkerEntrance.y, 100 * bunkerPulse, 100 * bunkerPulse);

  drawingContext.restore();
  pop();

  push();
  imageMode(CENTER);
  image(bunkerImage,
    bunkerEntrance.x, bunkerEntrance.y,
    bunkerEntrance.r * 4, bunkerEntrance.r * 4);
  pop();

  for (let i = 0; i < bgShapes.length; i++) {
    let s = bgShapes[i];
    if (
      s.x < camX - s.size ||
      s.x > camX + width  + s.size ||
      s.y < camY - s.size ||
      s.y > camY + height + s.size
    ) continue;
    drawEyeImage(s.x, s.y, s.size);
  }

  noFill();
  stroke(60, 50, 80);
  strokeWeight(4);
  rect(0, 0, WORLD_W, WORLD_H);
  noStroke();
}

// ============================================================
// handleInput()
// ============================================================
function handleInput() {
  if (keyIsDown(UP_ARROW))    { player.y -= PLAYER_SPEED; player.direction = { x:  0, y: -1 }; }
  if (keyIsDown(DOWN_ARROW))  { player.y += PLAYER_SPEED; player.direction = { x:  0, y:  1 }; }
  if (keyIsDown(LEFT_ARROW))  { player.x -= PLAYER_SPEED; player.direction = { x: -1, y:  0 }; }
  if (keyIsDown(RIGHT_ARROW)) { player.x += PLAYER_SPEED; player.direction = { x:  1, y:  0 }; }

  player.x = constrain(player.x, player.r, WORLD_W - player.r);
  player.y = constrain(player.y, player.r, WORLD_H - player.r);
}

// ============================================================
// handleSewerMazeInput()  — same arrow-key control scheme as
// Week 1, but blocked by the sewer maze's walls and checked
// per-axis so the player slides along a wall instead of getting
// stuck on it.
// ============================================================
function handleSewerMazeInput() {
  let moveX = 0;
  let moveY = 0;

  if (keyIsDown(UP_ARROW))    { moveY = -1; player.direction = { x:  0, y: -1 }; }
  if (keyIsDown(DOWN_ARROW))  { moveY =  1; player.direction = { x:  0, y:  1 }; }
  if (keyIsDown(LEFT_ARROW))  { moveX = -1; player.direction = { x: -1, y:  0 }; }
  if (keyIsDown(RIGHT_ARROW)) { moveX =  1; player.direction = { x:  1, y:  0 }; }

  let testX = player.x + moveX * PLAYER_SPEED;
  if (canMoveInMaze(sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS, testX, player.y, player.r * 0.8)) {
    player.x = testX;
  }

  let testY = player.y + moveY * PLAYER_SPEED;
  if (canMoveInMaze(sewerMaze, SEWER_CELL_SIZE, SEWER_MAZE_COLS, SEWER_MAZE_ROWS, player.x, testY, player.r * 0.8)) {
    player.y = testY;
  }

  player.x = constrain(player.x, player.r, SEWER_WORLD_W - player.r);
  player.y = constrain(player.y, player.r, SEWER_WORLD_H - player.r);
}

// ============================================================
// spawnInitialScavengeCops()
// Level 1 (the top-down free-roam scavenge level) now starts
// with exactly ONE cop instead of dumping a full wave.enemies
// group onto the map at once. checkWaveSpawns() below then adds
// one more cop at a time as the player advances, stopping once
// SCAVENGE_MAX_COPS is reached.
// ============================================================
function spawnInitialScavengeCops() {
  enemies = [];
  nextWave = 0;

  let baseSpeed =
    (enemyData.waves[0] && enemyData.waves[0].enemies[0])
      ? enemyData.waves[0].enemies[0].speed
      : 2;

  enemies.push({
    x:     random(100, WORLD_W - 100),
    y:     random(BOSS_ZONE_Y + 50, BOSS_ZONE_Y + 300),
    r:     20,
    speed: baseSpeed * 0.405,
    blobT: random(100),
  });
}

// ============================================================
// checkWaveSpawns()
// FIX (difficulty tuning): cops now trickle in ONE AT A TIME
// (instead of an entire wave.enemies group spawning together),
// and stop spawning entirely once enemies.length reaches
// SCAVENGE_MAX_COPS, so Level 1 ramps from 1 cop up to a hard
// ceiling of 5 rather than flooding the map with a whole wave.
// ============================================================
function checkWaveSpawns() {
  if (enemies.length >= SCAVENGE_MAX_COPS) return;
  if (nextWave >= enemyData.waves.length) return;

  let wave = enemyData.waves[nextWave];
  if (player.y < wave.spawnAt) {
    let data = wave.enemies[0]; // just one cop per wave trigger now

    enemies.push({
      x:     random(100, WORLD_W - 100),
      y:     random(BOSS_ZONE_Y + 50, BOSS_ZONE_Y + 300),
      r:     20,
      // Cop base speed increased 35% (0.3 -> 0.405) at the
      // user's request — everything downstream (updateEnemies's
      // difficultyMultiplier ramp) scales off this base.
      speed: data.speed * 0.405,
      blobT: random(100),
    });

    nextWave++;
  }
}

// ============================================================
// checkBossZone()
// ============================================================
function checkBossZone() {
  if (boss !== null) return;
  if (player.y > BOSS_ZONE_Y) return;
  spawnBoss();
}

// ============================================================
// spawnBoss()
// ============================================================
function spawnBoss() {

  boss = {
    x: WORLD_W / 2,
    y: bossData.retreatY,
    r: 120,
    health: bossData.health,
    maxHealth: bossData.health,
    blobT: 0,
    state: "pausing",
    pauseTimer: bossData.chargePause,
    chargeSpeed: bossData.chargeSpeed,
    retreatSpeed: bossData.retreatSpeed,
    retreatY: bossData.retreatY,
    chargeVX: 0,
    chargeVY: 0
  };

  enemies = [];
}

// ============================================================
// updateEnemies()
// ============================================================
function updateEnemies() {

  // Cops ramp up continuously the whole level (1.8x -> 2.4x from
  // 30s down to 15s), then get a distinct jump plus a steeper ramp
  // for the final 15 seconds (2.4x jumps to 3.0x, then climbs to
  // 4.0x by the time timeLeft hits 0) — lined up with the existing
  // "THEY ARE GETTING CLOSER" warning below.
  let difficultyMultiplier;

  if (timeLeft > 15) {
    difficultyMultiplier = map(
      timeLeft,
      30,
      15,
      1.8,
      2.4
    );
  } else {
    difficultyMultiplier = map(
      timeLeft,
      15,
      0,
      3.0,
      4.0
    );
  }

  for (let i = 0; i < enemies.length; i++) {

    let e = enemies[i];

    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {

      let currentSpeed = e.speed * difficultyMultiplier;

      e.x += (dx / d) * currentSpeed;
      e.y += (dy / d) * currentSpeed;

    }
  }
}


// ============================================================
// updateBoss()
// ============================================================
function updateBoss() {
  if (!boss) return;

  if (boss.state === "pausing") {
    boss.pauseTimer--;
    if (boss.pauseTimer <= 0) {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let d  = dist(boss.x, boss.y, player.x, player.y);
      boss.chargeVX = (dx / d) * boss.chargeSpeed;
      boss.chargeVY = (dy / d) * boss.chargeSpeed;
      boss.state    = "charging";
    }

  } else if (boss.state === "charging") {
    boss.x += boss.chargeVX;
    boss.y += boss.chargeVY;

    let pastPlayer = dist(boss.x, boss.y, player.x, player.y) > 200 && boss.y > player.y;
    let offWorld   = boss.x < 0 || boss.x > WORLD_W || boss.y < 0 || boss.y > WORLD_H;

    if (pastPlayer || offWorld) {
      boss.state = "retreating";
    }

  } else if (boss.state === "retreating") {
    let targetX = WORLD_W / 2;
    let targetY = boss.retreatY;
    let dx      = targetX - boss.x;
    let dy      = targetY - boss.y;
    let d       = dist(boss.x, boss.y, targetX, targetY);

    if (d < 8) {
      boss.x          = targetX;
      boss.y          = targetY;
      boss.state      = "pausing";
      boss.pauseTimer = bossData.chargePause;
    } else {
      boss.x += (dx / d) * boss.retreatSpeed;
      boss.y += (dy / d) * boss.retreatSpeed;
    }
  }
}

// ============================================================
// updateInvincibility()
// ============================================================
function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

// ============================================================
// drawEnemies()
// ============================================================
function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];
    push();
    imageMode(CENTER);
    image(copImage, e.x, e.y, e.r * 4, e.r * 4);
    pop();
  }
}

// ============================================================
// drawPlayer()
// ============================================================
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) {
    return;
  }

  if      (player.direction.y ===  1) playerRow = 3;
  else if (player.direction.y === -1) playerRow = 0;
  else if (player.direction.x ===  1) playerRow = 1;
  else if (player.direction.x === -1) playerRow = 1;

  let moving = keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW) || keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW);

  if (moving) {
    frameTimer++;
    if (frameTimer >= animSpeed) {
      currentFrame = (currentFrame + 1) % 4;
      frameTimer = 0;
    }
  } else {
    currentFrame = 0;
  }

  let offsetX = 0;
  let offsetY = 0;
  if      (playerRow === 3) { offsetX = OFFSET_DOWN.x;  offsetY = OFFSET_DOWN.y;  }
  else if (playerRow === 0) { offsetX = OFFSET_UP.x;    offsetY = OFFSET_UP.y;    }
  else if (playerRow === 1) { offsetX = OFFSET_RIGHT.x; offsetY = OFFSET_RIGHT.y; }

  let flip           = player.direction.x === -1;
  let appliedOffsetX = flip ? -offsetX : offsetX;

  push();
  imageMode(CENTER);

  if (flip) {
    translate(player.x + appliedOffsetX, player.y + offsetY);
    scale(-1, 1);
    image(playerSheet, 0, 0,
      FRAME_W * PLAYER_SCALE, FRAME_H * PLAYER_SCALE,
      currentFrame * FRAME_W, playerRow * FRAME_H, FRAME_W, FRAME_H);
  } else {
    image(playerSheet,
      player.x + appliedOffsetX, player.y + offsetY,
      FRAME_W * PLAYER_SCALE, FRAME_H * PLAYER_SCALE,
      currentFrame * FRAME_W, playerRow * FRAME_H, FRAME_W, FRAME_H);
  }

  pop();
}

// ============================================================
// drawMinimap()
// ============================================================
function drawMinimap() {
  let mapX = width  - MAP_W - 16;
  let mapY = height - MAP_H - 16;

  fill(0, 0, 0, 180);
  stroke(80, 60, 120);
  strokeWeight(1);
  rect(mapX, mapY, MAP_W, MAP_H, 4);
  noStroke();

  function worldToMap(wx, wy) {
    return {
      x: mapX + map(wx, 0, WORLD_W, 0, MAP_W),
      y: mapY + map(wy, 0, WORLD_H, 0, MAP_H),
    };
  }

  if (floor(frameCount / 20) % 2 === 0) {
    fill(255, 0, 0);
  } else {
    fill(0, 80, 255);
  }

  for (let i = 0; i < enemies.length; i++) {
    let p = worldToMap(enemies[i].x, enemies[i].y);
    ellipse(p.x, p.y, 6);
  }

  fill(0, 255, 0);
  let bunkerPos = worldToMap(bunkerEntrance.x, bunkerEntrance.y);
  ellipse(bunkerPos.x, bunkerPos.y, 8);

  fill(0, 200, 180);
  let pp = worldToMap(player.x, player.y);
  ellipse(pp.x, pp.y, 7);

  fill(120);
  textSize(9);
  textAlign(LEFT);
  textFont("monospace");
  text("MAP", mapX + 4, mapY + MAP_H - 4);
}

// ============================================================
// drawKeyCap() / drawControlHints()
// ADDED — small keyboard-key style icons (like a WASD / arrow
// key reference image) instead of a plain instructional text
// line. Used in place of the old top-left "WASD: Move..." text.
// ============================================================
function drawKeyCap(x, y, size, label) {
  push();
  rectMode(CORNER);
  stroke(230);
  strokeWeight(2);
  fill(30, 30, 30, 210);
  rect(x, y, size, size, 5);

  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textFont("monospace");
  textSize(size * 0.42);
  text(label, x + size / 2, y + size / 2 + 1);
  pop();
}

// Draws an arrow-key cluster with its origin (ox, oy) at the
// cluster's bottom-left corner, growing upward — so callers can
// anchor it to the bottom-left of the screen.
function drawArrowKeyCluster(ox, oy, keySize) {
  let gap = 4;
  let col1 = ox;
  let col2 = ox + keySize + gap;
  let col3 = ox + (keySize + gap) * 2;
  let rowBottom = oy - keySize;
  let rowTop    = oy - keySize * 2 - gap;

  drawKeyCap(col2, rowTop, keySize, "\u2191");
  drawKeyCap(col1, rowBottom, keySize, "\u2190");
  drawKeyCap(col2, rowBottom, keySize, "\u2193");
  drawKeyCap(col3, rowBottom, keySize, "\u2192");
}

// ============================================================
// drawHUD()
// ============================================================
function drawHUD() {
  noStroke();
  textFont("monospace");

  // Keycap-style movement hint, bottom-left of the screen (moved
  // out of the old top-left text line and drawn like a physical
  // key reference).
  let keySize = 26;
  drawArrowKeyCluster(16, height - 16, keySize);

  fill(255);
  textAlign(LEFT);
  textSize(22);
  text("Space: Collect / Search Dumpster", 16 + keySize * 3 + 20, height - 34);

  textSize(22);
  text("Time: "     + ceil(timeLeft),              16, 30);
  text("Evidence: " + (evidenceCollectedThisLevel ? 1 : 0) + " / " + evidenceNeeded, 16, 56);
  text("Supplies: " + supplies + " / " + suppliesNeeded, 16, 82);

  if (timeLeft <= 10) {
    fill(255, 80, 80);
    textSize(22);
    textAlign(CENTER);
    text("SUNRISE IS COMING", width / 2, 34);
  }

  // FIX: this "getting closer" warning used to live as loose
  // top-level code outside of any function, which is a runtime
  // error (fill/text/etc. can't run outside draw()). It's folded
  // into drawHUD() here instead, since that's where it belongs.
  if (timeLeft < 15) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(28);
    text("THEY ARE GETTING CLOSER", width / 2, 80);
  }

  // ADDED — tell the player once they've got everything this
  // level needs, so it's clear it's time to head back. A guide
  // arrow (drawBunkerGuideArrow(), drawn in world space) also
  // appears near the player pointing toward the bunker.
  if (evidenceCollectedThisLevel && supplies >= suppliesNeeded) {
    fill(120, 255, 150);
    textAlign(CENTER);
    textSize(20);
    text("FULLY STOCKED — RETURN TO BUNKER", width / 2, 112);
  }
}

// ============================================================
// drawWinScreen()
// ============================================================
function drawWinScreen() {
  fill(0, 0, 0, 190);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textFont("monospace");

  textSize(34);
  text("YOU SURVIVED THE NIGHT", width / 2, height / 2 - 70);

  textSize(22);
  text("You found enough supplies to return to the bunker.", width / 2, height / 2 - 25);
  text("The evidence points to someone else.",              width / 2, height / 2 +  5);

  textSize(22);
  fill(180);
  text("Evidence: " + evidence + " / " + evidenceNeeded, width / 2, height / 2 + 45);
  text("Supplies: " + supplies + " / " + suppliesNeeded, width / 2, height / 2 + 70);
  text("Press R to try again", width / 2, height / 2 + 110);
}

// ============================================================
// drawGameOver()
// Merged from Week 7 A2 — shows the dynamic reason the run
// ended (caught, sunrise, not enough supplies) instead of one
// generic message.
// ============================================================
function drawGameOver() {
  fill(0, 0, 0, 190);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textFont("monospace");

  textSize(34);
  text(gameOverTitle, width / 2, height / 2 - 80);

  fill(255, 120, 120);
  textSize(20);
  text(loseReason, width / 2, height / 2 - 40);

  fill(180);
  textSize(22);
  text("Your wife's murder remains unsolved.", width / 2, height / 2 - 5);

  textSize(22);
  text("Evidence: " + evidence + " / " + evidenceNeeded, width / 2, height / 2 + 45);
  text("Supplies: " + supplies + " / " + suppliesNeeded, width / 2, height / 2 + 70);
  text("Press R to return to title", width / 2, height / 2 + 110);
}

// ============================================================
// keyPressed()
// ============================================================
function keyPressed() {
  if (handleDebugKeys()) {
  return;
}

// ============================================================
// START LEVEL 2
// ============================================================

if (
  gameState ===
    STATE_LEVEL2_INTRO &&
  (
    keyCode === ENTER ||
    keyCode === 32
  )
) {

  startDumpsterLevel();

  return;
}
  if (introCutsceneActive) {
    if (keyCode === 32 || keyCode === ENTER) {
      handleIntroCutsceneSkipInput();
    }
    return;
  }

  if (evidenceBoardOpen && keyCode === ESCAPE) {
    evidenceBoardOpen = false;
    return;
  }

  if (gameState === STATE_HOME && keyCode === ENTER) {
    startIntroCutscene();
    return;
  }

  if (gameState === STATE_CUTSCENE) {
    skipIntroCutscene();
    return;
  }

  if (gameState === STATE_SUBSCREEN && keyCode === ENTER) {
    restartGame();
    return;
  }

  if (gameState === STATE_WEEK3_PLATFORMER && week3Phase === "entrance" && (key === "Enter" || keyCode === ENTER)) {
    startWeek3PlatformerLevel();
    return;
  }

  if ((key === "r" || key === "R") && gameState === STATE_WEEK3_PLATFORMER) {
    startWeek3PlatformerLevel();
    return;
  }

  if ((key === "r" || key === "R") && (gameState === STATE_OVER || gameState === STATE_WIN)) {
    gameState = STATE_HOME;
  }

  if (keyCode === 32 && gameState === STATE_SCAVENGE) {
    checkItemPickup();
    searchNearestScavengeDumpster();
  }

  if (keyCode === 32 && gameState === STATE_DUMPSTER) {
    checkSewerItemPickup();
  }
}

// ============================================================
// mousePressed()
// ============================================================
function mousePressed() {
  // Intro narration cutscene swallows clicks too, so nothing in
  // the frozen scene beneath it can be triggered by accident.
  if (introCutsceneActive) return;

  if (gameState === STATE_WEEK_INTRO) {
    let btnW = 340;
    let btnH = 90;
    let btnX = width / 2 - btnW / 2;
    let btnY = height * 0.72;

    if (mouseX > btnX && mouseX < btnX + btnW &&
        mouseY > btnY && mouseY < btnY + btnH) {
      startNextScavengeLevel();
    }
    return;
  }

  userStartAudio();

  // Clicking during the cutscene also skips it.
  if (gameState === STATE_CUTSCENE) {
    skipIntroCutscene();
    return;
  }

  // AUDIO — background music now only ever starts from
  // endIntroCutscene() (i.e. once we've actually reached the sub
  // screen). It's intentionally NOT (re)started here anymore so a
  // stray click during the cutscene can never trigger it early.

  if (gameState === STATE_SCAVENGE) {
    checkSewerClick();
  }

  if (gameState === STATE_WEEK3_PLATFORMER && week3Phase === "entrance") {
    if (
      mouseX > 95 &&
      mouseX < 195 &&
      mouseY > 135 &&
      mouseY < 325
    ) {
      startWeek3PlatformerLevel();
    }
    return;
  }

}

/* ============================================================
   Opening cutscene functions
   Plays opening_cutscene.mp4 between the main
   splash (STATE_HOME) and the sub screen (STATE_SUBSCREEN).
   ============================================================ */

// ------------------------------------------------------------
// setupIntroVideo()
// Creates the hidden HTML5 video element used to play the intro
// cutscene. Hidden because we draw its frames onto the p5 canvas
// ourselves each frame (via image()), which lets it composite
// with letterboxing/skip-hint text drawn in the same style as
// the rest of the game's screens.
// ------------------------------------------------------------
function setupIntroVideo() {
  introVideo = createVideo([INTRO_VIDEO_PATH], () => {
    introVideoReady = true;
  });
  introVideo.hide();
  introVideo.volume(1.0);

  // Advance to the sub screen automatically when the clip ends.
  introVideo.onended(() => {
    if (!introVideoEnded) {
      introVideoEnded = true;
      endIntroCutscene();
    }
  });
}

// ------------------------------------------------------------
// skipIntroCutscene()
// Lets the player skip via any key press or mouse click.
// ------------------------------------------------------------
function skipIntroCutscene() {
  if (gameState !== STATE_CUTSCENE) return;
  if (introVideoEnded) return;

  introVideoEnded = true;

  if (introVideo) {
    introVideo.stop();
  }

  endIntroCutscene();
}

// ------------------------------------------------------------
// endIntroCutscene()
// Shared exit point (video finished OR skipped) that hands off
// to the sub screen, exactly where STATE_HOME used to go.
//
// AUDIO — this is the ONE place startBackgroundMusic() is called
// from. Whether the player watched the whole opening video or
// skipped it, this function is the moment we transition into
// STATE_SUBSCREEN, so the new track always starts exactly here —
// never during STATE_CUTSCENE itself.
// ------------------------------------------------------------
function endIntroCutscene() {
  gameState = STATE_SUBSCREEN;
  startBackgroundMusic();
}

// ------------------------------------------------------------
// drawIntroCutscene()
// Draws the current video frame full-bleed on the canvas
// (letterboxed to preserve aspect ratio), plus a "press to skip"
// hint that fades in a moment after the scene starts so it
// doesn't distract right away.
// ------------------------------------------------------------
function drawIntroCutscene() {
  background(0);

  if (introVideoReady && introVideo) {
    // Letterbox the 1280x720 clip to fit any canvas size without
    // stretching or cropping.
    let vw = introVideo.width  || 1280;
    let vh = introVideo.height || 720;

    let scaleFactor = min(width / vw, height / vh);
    let drawW = vw * scaleFactor;
    let drawH = vh * scaleFactor;

    imageMode(CENTER);
    image(introVideo, width / 2, height / 2, drawW, drawH);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textFont("monospace");
    textSize(22);
    text("Loading...", width / 2, height / 2);
  }

  // Skip hint, drawn subtly at the bottom of the screen.
  fill(255, 200);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont("monospace");
  textSize(22);
  text("Press any key or click to skip", width / 2, height - 36);
}

// ============================================================
// drawSubScreen()
// ============================================================
function drawSubScreen() {
  background(0);
  imageMode(CORNER);

  if (SubScreen) {
    image(SubScreen, 0, 0, width, height);
  }

  fill(255);
  textAlign(CENTER);
  textSize(24);
  text("Press ENTER to continue", width / 2, height - 60);
}

// ============================================================
// checkItemPickup()
// FIX (Week 7 A2 merge): evidence is now capped at evidenceNeeded
// so you can't collect more than one piece of evidence per level.
// Converted from mouse-click ("Click to inspect") to a Space-bar
// key press when standing near an item.
// UPDATED: the first fake item ever picked up (across the whole
// playthrough) triggers the one-time intro narration cutscene
// instead of the quick ghost-wife flash.
// ============================================================
function checkItemPickup() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    if (o.collected) continue;

    let nearPlayer = dist(player.x, player.y, o.x, o.y) < 120;
    if (!nearPlayer) continue;

    if (pickupSound.isLoaded()) {
      pickupSound.stop();
      pickupSound.play();
    }

    o.collected = true;
    score++;

    if (o.real) {

      if (o.type === "evidence") {
        if (!evidenceCollectedThisLevel) {
          evidence++;
          evidenceCollectedThisLevel = true;
        }
      }
      if (o.type === "supply") supplies++;

    } else {

      if (!introNarrationPlayed) {
        startIntroNarrationCutscene();
      } else {
        wifeVisible = true;
        wifeTimer = 180; // 3 seconds
      }

    }

    return;
  }
}

// ============================================================
// drawEyeImage()
// ============================================================
function drawEyeImage(x, y, size) {
  let angle = atan2(player.y - y, player.x - x);

  push();
  translate(x, y);
  rotate(angle + PI);
  imageMode(CENTER);
  image(eyeImage, 0, 0, size, size);
  pop();
}

// ============================================================
// checkEnemyPlayerCollision()
// Merged from Week 7 A2 — sets a specific game-over reason.
// ============================================================
function checkEnemyPlayerCollision() {
  if (gameState === STATE_OVER) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);

    if (d < player.r + enemies[i].r) {
      if (playerHitSound.isLoaded()) {
        playerHitSound.play();
      }
      gameOverTitle = "YOU WERE CAUGHT";
      loseReason = "The police surrounded you before you could escape.";
      gameState = STATE_OVER;
      return;
    }
  }
}

// ============================================================
// updateTimer()
// Merged from Week 7 A2 — sets a specific game-over reason.
// ============================================================
function updateTimer() {
  if (gameState === STATE_OVER) return;
  if (gameState !== STATE_SCAVENGE) return;

  timeLeft -= deltaTime / 1000;

  if (timeLeft <= 0) {
    timeLeft  = 0;
    gameOverTitle = "TIME'S UP!";
    loseReason = "You didn't make it back to the bunker before sunrise.";
    gameState = STATE_OVER;
  }
}


// ============================================================
// drawEvidenceBoard()
// ============================================================
function drawEvidenceBoard() {
  background(25);

  imageMode(CENTER);

  image(
    boardImage,
    width  / 5,
    height / 2,
    width,
    height
  );

  let evidencePieces = [
    {
      title: "Police Report",
      x: width / 2 - 180,
      y: height / 2 - 10
    },
    {
      title: "Witness Statement",
      x: width / 2 + 180,
      y: height / 2 - 40
    },
    {
      title: "Security Footage",
      x: width / 2,
      y: height / 2 + 120
    }
  ];

  let wifeX = width  / 2;
  let wifeY = height / 2 - 110;

  stroke(180, 0, 0);
  strokeWeight(3);

  for (let i = 0; i < evidence; i++) {
    if (i >= evidencePieces.length) break;
    let clue = evidencePieces[i];
    line(wifeX, wifeY, clue.x, clue.y);
  }

  noStroke();

  for (let i = 0; i < evidence; i++) {
    if (i >= evidencePieces.length) break;
    let clue = evidencePieces[i];

    fill(255, 245, 220);
    rect(clue.x - 60, clue.y - 35, 120, 70, 4);

    fill(0);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(clue.title, clue.x, clue.y);
  }

  fill(255);
  textSize(20);
  text("ESC = Return to Bunker", width / 2, 40);
}

// ============================================================
// drawWeekIntro()
// ============================================================
function drawWeekIntro() {
  imageMode(CORNER);
  image(bunkerEnterImage, 0, 0, width, height);

  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  let panelW = width  * 0.82;
  let panelH = height * 0.78;
  let panelX = width  / 2 - panelW / 2;
  let panelY = height / 2 - panelH / 2;

  fill(20, 20, 20, 220);
  stroke(120);
  strokeWeight(2);
  rect(panelX, panelY, panelW, panelH, 12);
  noStroke();

  fill(255);
  textAlign(CENTER);
  textFont("monospace");
  textSize(48);
  text("WEEK " + level, width / 2, panelY + 90);

  fill(180);
  textSize(20);
  text("Prepare for another week underground", width / 2, panelY + 130);

  fill(220, 50, 50);
  textAlign(CENTER);
  textSize(30);

  let objectiveCenterX = width / 2;

  text(
    "THIS WEEK'S OBJECTIVES",
    objectiveCenterX,
    panelY + panelH * 0.35
  );

  fill(255);
  textSize(24);

  let startY = panelY + panelH * 0.45;

  for (let i = 0; i < weekObjectives.length; i++) {
    text(
      "• " + weekObjectives[i],
      objectiveCenterX,
      startY + i * 50
    );
  }

  let btnW = 340;
  let btnH = 90;
  let btnX = width  / 2 - btnW / 2;
  let btnY = height * 0.72;

  let hovering =
    mouseX > btnX && mouseX < btnX + btnW &&
    mouseY > btnY && mouseY < btnY + btnH;

  fill(hovering ? color(210, 40, 40) : color(160, 25, 25));
  rect(btnX, btnY, btnW, btnH, 10);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("START THE WEEK", width / 2, btnY + btnH / 2);
}

// ============================================================
// checkBunkerEntrance()
// FIX: bigger, easier-to-read "Press E to enter bunker" prompt.
// ============================================================
function checkBunkerEntrance() {
  if (!player || typeof bunkerEntrance === "undefined") return;

  let d = dist(player.x, player.y, bunkerEntrance.x, bunkerEntrance.y);

  if (d < bunkerEntrance.r) {
    push();
    fill(255);
    stroke(0);
    strokeWeight(4);
    textAlign(CENTER);
    textSize(28);
    text("Press E to enter bunker", player.x, player.y - 70);
    pop();

    if (keyIsDown(69) || keyIsDown(101)) {
      finishScavengeLevel();
    }
  }
}

// ============================================================
// finishScavengeLevel()
// Called from the sewer door (end of Week 1), the sewer maze
// exit (end of Week 2), and — for consistency — after Week 3, to
// advance `level` and route to the correct next state.
// ============================================================
function finishScavengeLevel() {
  sewerDoorOpen = false;
  supplies -= 2;

  if (supplies < 0) {
    gameOverTitle = "YOU DIDN'T SURVIVE";
    loseReason = "You didn't bring enough supplies back to the bunker.";
    gameState = STATE_OVER;
    return;
  }

  level++;
  if      (level === 2) { day = 14; }
  else if (level === 3) { day = 21; }
  else if (level > maxLevel) {
    gameState = STATE_WIN;
    return;
  }

  enemies  = [];
  nextWave = 0;
  timeLeft = 60;

  evidenceCollectedThisLevel = false;

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].collected = false;
  }

  for (let i = 0; i < scavengeDumpsterSpots.length; i++) {
    scavengeDumpsterSpots[i].searched = false;
    scavengeDumpsterSpots[i].open = false;
    scavengeDumpsterSpots[i].itemVisibleUntil = 0;
  }

if (level === 2) {

  gameState = STATE_LEVEL2_INTRO;

  return;
}

if (level === 3) {
  window.location.href = "./level3.html";
  return;
}
}

/* ============================================================
   WEEK 3 — "Abandoned Police Office" platformer
   Merged in from the standalone test build (level3 / player /
   platforms / movers / hazards / goal), renamed with a "week3"
   prefix so nothing collides with the top-down game's own
   `player` object or state constants. Reached via the bunker
   after Week 2 (the sewer maze) is complete — see keyPressed()'s
   `if (level === 3)` branch above and
   startNextScavengeLevel()/startDumpsterLevel() below.
   ============================================================ */

// ------------------------------------------------------------
// startWeek3PlatformerLevel()
// Equivalent of the standalone build's loadLevel3(): resets the
// platforming state fresh off WEEK3_LEVEL_DATA every time it's
// (re)entered, including on death/restart via "R".
// ------------------------------------------------------------
function startWeek3PlatformerLevel() {
  gameState = STATE_WEEK3_PLATFORMER;
  week3Phase = "level";
  week3LevelComplete = false;
  week3BannerText = "LEVEL 3";
  week3BannerTimer = 90;

  week3Platforms = WEEK3_LEVEL_DATA.platforms.map(p => ({ ...p }));
  week3Movers = WEEK3_LEVEL_DATA.movers.map(m => ({ ...m }));
  week3Hazards = WEEK3_LEVEL_DATA.hazards.map(h => ({ ...h }));
  week3Goal = { ...WEEK3_LEVEL_DATA.goal };

  if (!week3Player) {
    week3Player = {
      x: WEEK3_LEVEL_DATA.start.x,
      y: WEEK3_LEVEL_DATA.start.y,
      vx: 0,
      vy: 0,
      r: 20,
      speed: 0.55,
      maxSpeed: 4.5,
      jumpForce: -12,
      friction: 0.78,
      onGround: false,
      standingOn: null,
    };
  }

  week3Player.x = WEEK3_LEVEL_DATA.start.x;
  week3Player.y = WEEK3_LEVEL_DATA.start.y;
  week3Player.vx = 0;
  week3Player.vy = 0;
  week3Player.standingOn = null;
  week3Player.onGround = false;
}

// ------------------------------------------------------------
// drawWeek3PlatformerFlow()
// Routes between the "entrance" screen (door into the police
// station) and the "level"/"complete" platforming screens,
// mirroring the standalone build's top-level draw() switch.
// ------------------------------------------------------------
function drawWeek3PlatformerFlow() {
  if (week3Phase === "entrance") {
    drawWeek3EntranceScreen();
    return;
  }

  drawWeek3Level();
}

// ------------------------------------------------------------
// drawWeek3EntranceScreen()
// Same door-hover / glow / title text as the standalone build's
// drawEntranceScreen(), using week3EntranceBgImage (bg.png) with
// a fallback to the top-down game's bgImage if that asset isn't
// present.
// ------------------------------------------------------------
function drawWeek3EntranceScreen() {
  background(0);

  if (week3EntranceBgImage) {
    image(week3EntranceBgImage, 0, 0, width, height);
  } else if (bgImage) {
    image(bgImage, 0, 0, width, height);
  }

  const doorX = 290;
const doorY = 305;
const doorW = 140;
const doorH = 345;

let hoveringDoor =
  mouseX > doorX &&
  mouseX < doorX + doorW &&
  mouseY > doorY &&
  mouseY < doorY + doorH;

if (hoveringDoor) {

  noFill();
  stroke(255, 255, 0, 120);
  strokeWeight(4);

  rect(
    doorX - 35,
    doorY - 55,
    doorW + 15,
    doorH - 80,
    6
  );

  noStroke();
  fill(255);

  textAlign(CENTER);
  textSize(24);

  text(
    "ENTER",
    width / 2,
    height - 40
  );
}
}

// ------------------------------------------------------------
// drawWeek3Level()
// Same as the standalone build's drawLevel(): background, input
// + physics + collision updates (unless already complete), then
// draw platforms/movers/hazards/goal/player/HUD/banner, finishing
// with the complete overlay if the goal's been reached.
// ------------------------------------------------------------
function drawWeek3Level() {
  background(255, 0, 255);

  if (week3BackgroundImage) {
    image(week3BackgroundImage, 0, 0, width, height);
  } else if (bunkerEnterImage) {
    image(bunkerEnterImage, 0, 0, width, height);
  }

  if (!week3LevelComplete) {
    handleWeek3Input();
    applyWeek3Physics();
    updateWeek3Movers();
    resolveWeek3PlatformCollisions();
    checkWeek3Hazards();
    checkWeek3Goal();
  }

  drawWeek3Platforms();
  drawWeek3Movers();
  drawWeek3Hazards();
  drawWeek3Goal();
  drawWeek3Player();
  drawWeek3HUD();
  drawWeek3Banner();

  if (week3LevelComplete) {
    drawWeek3CompleteScreen();
  }
}

function handleWeek3Input() {
  if (keyIsDown(LEFT_ARROW)) {
    week3Player.vx -= week3Player.speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    week3Player.vx += week3Player.speed;
  }

  week3Player.vx = constrain(week3Player.vx, -week3Player.maxSpeed, week3Player.maxSpeed);

  if (!keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
    week3Player.vx *= week3Player.friction;
  }

  if (keyIsDown(UP_ARROW) && week3Player.onGround) {
    week3Player.vy = week3Player.jumpForce;
    week3Player.onGround = false;
    week3Player.standingOn = null;
  }
}

function applyWeek3Physics() {
  week3Player.vy += WEEK3_GRAVITY;

  if (week3Player.onGround && week3Player.standingOn) {
    week3Player.x += week3Player.standingOn.dx;
    week3Player.y += week3Player.standingOn.dy;
  }

  week3Player.x += week3Player.vx;
  week3Player.y += week3Player.vy;
  week3Player.x = constrain(week3Player.x, week3Player.r, width - week3Player.r);

  if (week3Player.y > height + 100) {
    resetWeek3Player();
  }

  week3Player.onGround = false;
  week3Player.standingOn = null;
}

function resetWeek3Player() {
  week3Player.x = WEEK3_LEVEL_DATA.start.x;
  week3Player.y = WEEK3_LEVEL_DATA.start.y;
  week3Player.vx = 0;
  week3Player.vy = 0;
  week3Player.standingOn = null;
}

function updateWeek3Movers() {
  for (let i = 0; i < week3Movers.length; i++) {
    let m = week3Movers[i];
    let prevX = m.x;
    let prevY = m.y;
    let offset = sin(frameCount * m.speed) * m.range;

    if (m.axis === "x") {
      m.x = m.base + offset;
    } else {
      m.y = m.base + offset;
    }

    m.dx = m.x - prevX;
    m.dy = m.y - prevY;
  }
}

function resolveWeek3PlatformCollisions() {
  let allSolids = week3Platforms.concat(week3Movers);

  for (let i = 0; i < allSolids.length; i++) {
    let p = allSolids[i];
    let playerLeft = week3Player.x - week3Player.r;
    let playerRight = week3Player.x + week3Player.r;
    let playerBottom = week3Player.y + week3Player.r;
    let platLeft = p.x;
    let platRight = p.x + p.w;
    let platTop = p.y;
    let overlapsHorizontally = playerRight > platLeft && playerLeft < platRight;
    let landingOnTop = week3Player.vy >= 0 && playerBottom >= platTop && playerBottom <= platTop + 20;

    if (overlapsHorizontally && landingOnTop) {
      week3Player.y = platTop - week3Player.r;
      week3Player.vy = 0;
      week3Player.onGround = true;
      week3Player.standingOn = p.axis !== undefined ? p : null;
    }
  }
}

function checkWeek3Hazards() {
  for (let i = 0; i < week3Hazards.length; i++) {
    let h = week3Hazards[i];
    let overlapsX = (week3Player.x + week3Player.r) > h.x && (week3Player.x - week3Player.r) < h.x + h.w;
    let overlapsY = (week3Player.y + week3Player.r) > h.y && (week3Player.y - week3Player.r) < h.y + h.h;

    if (overlapsX && overlapsY) {
      resetWeek3Player();
      return;
    }
  }
}

// ------------------------------------------------------------
// checkWeek3Goal()
// On reaching the flag, marks the level complete. Unlike the
// standalone build (which had nothing after Level 3), this hooks
// back into the main game's progression: pressing "back to
// bunker" style advancement happens via finishScavengeLevel()
// so the story can continue past Week 3 if maxLevel is raised.
// ------------------------------------------------------------
function checkWeek3Goal() {
  if (!week3Goal) return;
  let overlapsX = (week3Player.x + week3Player.r) > week3Goal.x && (week3Player.x - week3Player.r) < week3Goal.x + week3Goal.w;
  let overlapsY = (week3Player.y + week3Player.r) > week3Goal.y && (week3Player.y - week3Player.r) < week3Goal.y + week3Goal.h;

  if (overlapsX && overlapsY) {
    week3LevelComplete = true;
    week3Phase = "complete";
  }
}

function drawWeek3Platforms() {
  fill(255, 255, 255, 40);
  stroke(255, 255, 255, 60);
  for (let i = 0; i < week3Platforms.length; i++) {
    let p = week3Platforms[i];
    rect(p.x, p.y, p.w, p.h, 6);
  }
}

function drawWeek3Movers() {
  fill(WEEK3_MOVER_COLOR[0], WEEK3_MOVER_COLOR[1], WEEK3_MOVER_COLOR[2]);
  noStroke();
  for (let i = 0; i < week3Movers.length; i++) {
    let m = week3Movers[i];
    rect(m.x, m.y, m.w, m.h, 6);
  }
}

function drawWeek3Hazards() {
  let pulse = map(sin(frameCount * 0.15), -1, 1, 120, 255);
  fill(255, 0, 0, pulse);
  noStroke();
  for (let i = 0; i < week3Hazards.length; i++) {
    let h = week3Hazards[i];
    rect(h.x, h.y, h.w, h.h);
  }
}

function drawWeek3Goal() {
  if (!week3Goal) return;
  push();
  stroke(230);
  strokeWeight(3);
  line(week3Goal.x, week3Goal.y, week3Goal.x, week3Goal.y + week3Goal.h);
  noStroke();
  fill(WEEK3_GOAL_COLOR[0], WEEK3_GOAL_COLOR[1], WEEK3_GOAL_COLOR[2]);
  triangle(week3Goal.x, week3Goal.y, week3Goal.x, week3Goal.y + week3Goal.h * 0.5, week3Goal.x + week3Goal.w, week3Goal.y + week3Goal.h * 0.25);
  pop();
}

function drawWeek3Player() {
  push();
  fill(40);
  ellipse(week3Player.x, week3Player.y, week3Player.r * 2, week3Player.r * 2);
  fill(255);
  ellipse(week3Player.x - 6, week3Player.y - 4, 5, 5);
  ellipse(week3Player.x + 6, week3Player.y - 4, 5, 5);
  pop();
}

function drawWeek3HUD() {
  fill(180);
  noStroke();
  textSize(18);
  textAlign(LEFT);
  text("Move: Arrow Keys \u2190 \u2192   Jump: Up Arrow \u2191", 16, 26);
  text("Reach the flag! Avoid the red hazards.", 16, 48);
  textAlign(RIGHT);
  text("WEEK 3 — ABANDONED POLICE OFFICE", width - 16, 24);
  text("Press R to restart", width - 16, 42);
}

function drawWeek3Banner() {
  if (week3BannerTimer <= 0) return;
  let alpha = constrain(map(week3BannerTimer, 90, 60, 0, 255), 0, 255);
  push();
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255, alpha);
  text(week3BannerText, width / 2, height / 2 - 60);
  pop();
  week3BannerTimer--;
}

function drawWeek3CompleteScreen() {
  push();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("LEVEL 3 COMPLETE!", width / 2, height / 2 - 20);
  textSize(16);
  text("Press R to try again", width / 2, height / 2 + 20);
  pop();
}

// ============================================================
// startNextScavengeLevel()
// Routes from the Week Intro "START THE WEEK" button to the
// correct level: Week 2 -> sewer maze, Week 3 -> police station
// platformer (right after the sewer maze), otherwise back to
// the top-down scavenge level.
// ============================================================
function startNextScavengeLevel() {
  if (level === 2) {
    startDumpsterLevel();
    return;
  }

  if (level === 3) {
    startWeek3PlatformerLevel();
    return;
  }

  timeLeft = 60;
  spawnInitialScavengeCops();

  player.x = WORLD_W / 2;
  player.y = WORLD_H - 200;

  camX = player.x - width / 2;
  camY = player.y - height / 2;

  gameState = STATE_SCAVENGE;
}

/* ============================================================
   WEEK 1 helper functions
   ============================================================ */

// ------------------------------------------------------------
// drawScavengeDumpsters()
// Draws each scattered dumpster (closed or open) in world space —
// called from inside the camera-translated push()/pop() block in
// draw(), the same way drawObstacles() is, so no camera offset
// math is needed here.
//
// FIX (Week 7 A2 merge): once a dumpster has been searched, the
// found item only stays visible for ~3 seconds (itemVisibleUntil)
// before fading from view, even though the dumpster itself stays
// open.
// ------------------------------------------------------------
function drawScavengeDumpsters() {
  for (let i = 0; i < scavengeDumpsterSpots.length; i++) {
    let spot = scavengeDumpsterSpots[i];

    if (
      spot.x < camX - SCAVENGE_DUMPSTER_SIZE ||
      spot.x > camX + width  + SCAVENGE_DUMPSTER_SIZE ||
      spot.y < camY - SCAVENGE_DUMPSTER_SIZE ||
      spot.y > camY + height + SCAVENGE_DUMPSTER_SIZE
    ) continue;

    let nearby = dist(player.x, player.y, spot.x, spot.y) < SCAVENGE_DUMPSTER_RADIUS;

    push();
    imageMode(CENTER);

    if (nearby) {
      drawingContext.shadowBlur  = 25;
      drawingContext.shadowColor = "yellow";
    }

    if (spot.open) {
      image(dumpsterOpenImage, spot.x, spot.y, SCAVENGE_DUMPSTER_SIZE, SCAVENGE_DUMPSTER_SIZE);

      let itemStillVisible = spot.itemVisibleUntil && millis() < spot.itemVisibleUntil;
      if (itemStillVisible) {
        image(spot.image, spot.x, spot.y - SCAVENGE_DUMPSTER_SIZE * 0.3, 30, 30);
      }
    } else {
      image(dumpsterImage, spot.x, spot.y, SCAVENGE_DUMPSTER_SIZE, SCAVENGE_DUMPSTER_SIZE);
    }

    drawingContext.shadowBlur = 0;

    if (nearby) {
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(22);
      text(
        spot.open ? "Press Space to close dumpster" : "Press Space to search dumpster",
        spot.x,
        spot.y - SCAVENGE_DUMPSTER_SIZE * 0.75
      );
    }

    pop();
  }
}

// ------------------------------------------------------------
// searchNearestScavengeDumpster()
// Fired once per Space keypress while in STATE_SCAVENGE.
//
// FIX (Week 7 A2 merge): a dumpster search always adds to the
// player's SUPPLY count (regardless of the item's original
// "type"), the found item fades out after ~3 seconds, and a fake
// find still triggers the intro cutscene (or the wife
// hallucination once the intro's already played) as before.
// ------------------------------------------------------------
function searchNearestScavengeDumpster() {
  for (let i = 0; i < scavengeDumpsterSpots.length; i++) {
    let spot = scavengeDumpsterSpots[i];

    if (dist(player.x, player.y, spot.x, spot.y) < SCAVENGE_DUMPSTER_RADIUS) {
      spot.open = !spot.open;

      if (spot.open && !spot.searched) {
        spot.searched = true;
        spot.itemVisibleUntil = millis() + DUMPSTER_ITEM_VISIBLE_MS;

        if (pickupSound.isLoaded()) {
          pickupSound.stop();
          pickupSound.play();
        }

        if (spot.real) {
          // Whatever you find in a dumpster counts as a supply.
          supplies++;
        } else {
          if (!introNarrationPlayed) {
            startIntroNarrationCutscene();
          } else {
            wifeVisible = true;
            wifeTimer = 180;
          }
        }
      }

      return;
    }
  }
}

/* ============================================================
   WEEK 2 — sewer maze crawl functions
   ============================================================ */

// ------------------------------------------------------------
// startDumpsterLevel()
// Generates a fresh sewer maze and drops the player at its spawn
// point. Reaching the sewer exit (checkSewerMazeExit()) hands off
// to the Week 3 police station platformer.
// ------------------------------------------------------------
function startDumpsterLevel() {
  buildSewerMazeLevel();

  player.x = sewerSpawnPoint.x;
  player.y = sewerSpawnPoint.y;
  player.direction = { x: 0, y: -1 };

  camX = player.x - width / 2;
  camY = player.y - height / 2;

  dumpsterTimeLeft = DUMPSTER_TIME_LIMIT;

  gameState = STATE_DUMPSTER;
}

// ------------------------------------------------------------
// updateSewerMazeCamera()
// Same free-roam camera behavior as Week 1's updateCamera(), just
// clamped to the sewer maze's own world size.
// ------------------------------------------------------------
function updateSewerMazeCamera() {
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  targetX = constrain(targetX, 0, SEWER_WORLD_W - width);
  targetY = constrain(targetY, 0, SEWER_WORLD_H - height);

  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

// ------------------------------------------------------------
// updateDumpsterTimer()
// Counts the sewer-maze clock down; running out catches the
// player, same as running out of night in the top-down level.
// Merged from Week 7 A2 — sets a specific game-over reason.
// ------------------------------------------------------------
function updateDumpsterTimer() {
  if (gameState !== STATE_DUMPSTER) return;

  dumpsterTimeLeft -= deltaTime / 1000;

  if (dumpsterTimeLeft <= 0) {
    dumpsterTimeLeft = 0;
    gameOverTitle = "TIME'S UP!";
    loseReason = "The police caught up to you before you found the way out.";
    gameState = STATE_OVER;
  }
}

// ------------------------------------------------------------
// drawSewerMazeBackground()
// Tiles the sewer floor texture across whatever part of the maze
// is on screen, then renders the maze grid: dark brick/concrete
// walls, and the tunnel floor texture showing through for open
// cells. Same "1 = wall, 0 = open" grid concept as the Pac-Man
// maze array. Finishes by scattering the decorative watching
// eyes through the open tunnels, the same way Week 1's world does.
//
// FIX: open-tunnel cells used to paint an opaque checker tile
// (fill(...) + rect(...)) over themselves, which fully covered
// the sewerFloor texture tiled in underneath. Now only a faint
// translucent puddle highlight is drawn, so the floor art is
// actually visible.
// ------------------------------------------------------------
function drawSewerMazeBackground() {
  imageMode(CORNER);

  let tileSize = SEWER_CELL_SIZE;

  let floorStartCol = floor(camX / tileSize) - 1;
  let floorEndCol   = ceil((camX + width) / tileSize) + 1;
  let floorStartRow = floor(camY / tileSize) - 1;
  let floorEndRow   = ceil((camY + height) / tileSize) + 1;

  for (let row = floorStartRow; row < floorEndRow; row++) {
    for (let col = floorStartCol; col < floorEndCol; col++) {
      image(sewerFloor, col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }

  noStroke();

  let startCol = max(0, floor(camX / SEWER_CELL_SIZE) - 1);
  let endCol   = min(SEWER_MAZE_COLS - 1, ceil((camX + width) / SEWER_CELL_SIZE) + 1);
  let startRow = max(0, floor(camY / SEWER_CELL_SIZE) - 1);
  let endRow   = min(SEWER_MAZE_ROWS - 1, ceil((camY + height) / SEWER_CELL_SIZE) + 1);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      let x = col * SEWER_CELL_SIZE;
      let y = row * SEWER_CELL_SIZE;

      if (sewerMaze[row][col] === 1) {
        fill(70, 75, 70);
        rect(x, y, SEWER_CELL_SIZE, SEWER_CELL_SIZE);

        noFill();
        stroke(24, 28, 22);
        strokeWeight(2);
        rect(x + 3, y + 3, SEWER_CELL_SIZE - 6, SEWER_CELL_SIZE - 6, 3);
        noStroke();
      } else {
        // sewerFloor is already tiled in underneath — no opaque
        // fill here anymore, just a faint translucent puddle
        // highlight so the floor texture actually shows through.
        fill(46, 90, 70, 40);
        ellipse(x + SEWER_CELL_SIZE / 2, y + SEWER_CELL_SIZE / 2, SEWER_CELL_SIZE * 0.5, SEWER_CELL_SIZE * 0.3);
      }
    }
  }

  noFill();
  stroke(20, 24, 18);
  strokeWeight(4);
  rect(0, 0, SEWER_WORLD_W, SEWER_WORLD_H);
  noStroke();

  drawSewerBgShapes();
  drawSewerExitWallLights();
}

// ------------------------------------------------------------
// drawSewerBgShapes()
// Decorative watching eyes scattered through the tunnels, drawn
// the same way Week 1's world eyes are (drawEyeImage(), each one
// rotating to track the player). Purely atmospheric — no
// collision, no gameplay effect.
// ------------------------------------------------------------
function drawSewerBgShapes() {
  for (let i = 0; i < sewerBgShapes.length; i++) {
    let s = sewerBgShapes[i];

    if (
      s.x < camX - s.size ||
      s.x > camX + width + s.size ||
      s.y < camY - s.size ||
      s.y > camY + height + s.size
    ) continue;

    drawEyeImage(s.x, s.y, s.size);
  }
}

// ------------------------------------------------------------
// drawSewerItems()
// Draws every uncollected scattered pickup using the same real
// item art (wire, water, watch, tape, survivor note, radio,
// notes, medkit, lighter, food) Week 1 uses, instead of a
// sprite-sheet frame. Highlights and shows a prompt when the
// player is close enough to inspect.
// ------------------------------------------------------------
function drawSewerItems() {
  for (let i = 0; i < sewerItems.length; i++) {
    let it = sewerItems[i];
    if (it.collected) continue;

    if (
      it.x < camX - it.size ||
      it.x > camX + width  + it.size ||
      it.y < camY - it.size ||
      it.y > camY + height + it.size
    ) continue;

    let nearby = dist(player.x, player.y, it.x, it.y) < 120;

    push();
    imageMode(CENTER);

    if (nearby) {
      drawingContext.shadowBlur  = 25;
      drawingContext.shadowColor = "yellow";
    }

    image(it.image, it.x, it.y, it.size, it.size);

    drawingContext.shadowBlur = 0;

    if (nearby) {
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(22);
      text("Press Space to inspect", it.x, it.y - it.size);
    }

    pop();
  }
}

// ------------------------------------------------------------
// checkSewerItemPickup()
// Space-bar pickup for the sewer maze's scattered items.
//
// FIX (Week 7 A2 merge): evidence is capped at evidenceNeeded so
// sewer items can't push evidence past one collected per level.
// A "fake" find (it.real === false, same as Week 1's obstacles)
// triggers the intro narration cutscene the first time ever (or
// the quick ghost-wife hallucination afterward), matching Week
// 1's checkItemPickup() behavior.
// ------------------------------------------------------------
function checkSewerItemPickup() {
  for (let i = 0; i < sewerItems.length; i++) {
    let it = sewerItems[i];
    if (it.collected) continue;

    let nearPlayer = dist(player.x, player.y, it.x, it.y) < 120;
    if (!nearPlayer) continue;

    it.collected = true;
    score++;

    if (pickupSound && pickupSound.isLoaded()) {
      pickupSound.stop();
      pickupSound.play();
    }

    if (it.real) {

      if (it.type === "evidence") {
        if (!evidenceCollectedThisLevel) {
          evidence++;
          evidenceCollectedThisLevel = true;
        }
      }
      if (it.type === "supply") supplies++;

    } else {

      if (!introNarrationPlayed) {
        startIntroNarrationCutscene();
      } else {
        wifeVisible = true;
        wifeTimer = 180; // 3 seconds
      }

    }

    return;
  }
}

// ------------------------------------------------------------
// drawSewerExitDoor()
// Marks the way out of the sewer maze (leads to the Week 3
// police office entrance) with the tunnel-door art, highlighting
// it and showing a prompt when the player is close.
// ------------------------------------------------------------
function drawSewerExitDoor() {
  let nearby = dist(player.x, player.y, sewerExitPoint.x, sewerExitPoint.y) < SEWER_CELL_SIZE * 1.2;
  let level2Complete = hasBeatenLevel2();

  push();
  imageMode(CENTER);

  if (nearby) {
    drawingContext.shadowBlur  = 25;
    drawingContext.shadowColor = "yellow";
  }

  image(sewerDoorOpenImage, sewerExitPoint.x, sewerExitPoint.y, SEWER_CELL_SIZE * 1.8, SEWER_CELL_SIZE * 1.8);

  drawingContext.shadowBlur = 0;

  if (nearby) {
    fill(level2Complete ? color(255) : color(255, 190, 90));
    textAlign(CENTER);
    textSize(16);
    text(
      level2Complete
        ? "LEVEL 2 COMPLETE — Press E to enter Level 3"
        : "Find 1 evidence and " + suppliesNeeded + " supplies before leaving",
      sewerExitPoint.x,
      sewerExitPoint.y - SEWER_CELL_SIZE
    );
  }

  pop();
}

// ------------------------------------------------------------
// checkSewerMazeExit()
// Near the sewer exit door, lets the player press E to finish
// Week 2 and move on to the Week 3 police station platformer.
// ------------------------------------------------------------
function hasBeatenLevel2() {
  return (
    gameState === STATE_DUMPSTER &&
    level === 2 &&
    evidenceCollectedThisLevel &&
    supplies >= suppliesNeeded
  );
}

function checkSewerMazeExit() {
  const nearExit =
    dist(player.x, player.y, sewerExitPoint.x, sewerExitPoint.y) <
    SEWER_CELL_SIZE * 1.2;

  const level2Beaten =
    level === 2 &&
    evidenceCollectedThisLevel &&
    supplies >= suppliesNeeded;

  if (
    nearExit &&
    level2Beaten &&
    keyIsDown(69) &&
    !level3Starting
  ) {
    level3Starting = true; // prevents the transition repeating every frame
    window.location.href = "./level3.html";
  }
}
// Opens the newer standalone Level 3 inside this combined game package.
// Keeping it on its own page prevents its p5 globals from colliding with
// the large Levels 1–2 sketch while preserving one continuous game flow.
function launchLevel3() {
  stopCopSiren();

  if (backgroundMusic && backgroundMusic.isPlaying()) {
    backgroundMusic.stop();
  }

  window.location.href = "level3.html";
}

// ------------------------------------------------------------
// drawSewerPoliceGlow()
// A flashing red/blue full-screen glow that intensifies as
// dumpsterTimeLeft counts down — a visual "they're getting
// closer" cue independent of the HUD countdown text, drawn in
// screen space over the whole maze view (there's no single
// "edge" for it to creep in from once the level is a maze).
// ------------------------------------------------------------
function drawSewerPoliceGlow() {
  let elapsedFrac = 1 - (dumpsterTimeLeft / DUMPSTER_TIME_LIMIT);
  elapsedFrac = constrain(elapsedFrac, 0, 1);
  if (elapsedFrac <= 0) return;

  let flashOn = floor(frameCount / 15) % 2 === 0;
  let c = flashOn ? color(255, 40, 40) : color(40, 90, 255);

  push();
  noStroke();
  drawingContext.save();
  drawingContext.globalCompositeOperation = 'lighter';
  fill(red(c), green(c), blue(c), 45 * elapsedFrac);
  rect(0, 0, width, height);
  drawingContext.restore();
  pop();
}

// ------------------------------------------------------------
// drawSewerMazeMinimap()
// Same idea as Week 1's drawMinimap(), sized to the sewer maze's
// own world/grid instead. Also plots patrolling cops the same
// way Week 1's minimap does.
// ------------------------------------------------------------
function drawSewerMazeMinimap() {
  let mapX = width  - MAP_W - 16;
  let mapY = height - MAP_H - 16;

  fill(0, 0, 0, 180);
  stroke(80, 60, 120);
  strokeWeight(1);
  rect(mapX, mapY, MAP_W, MAP_H, 4);
  noStroke();

  fill(50, 60, 45, 200);
  let cellW = MAP_W / SEWER_MAZE_COLS;
  let cellH = MAP_H / SEWER_MAZE_ROWS;
  for (let row = 0; row < SEWER_MAZE_ROWS; row++) {
    for (let col = 0; col < SEWER_MAZE_COLS; col++) {
      if (sewerMaze[row][col] === 1) {
        rect(mapX + col * cellW, mapY + row * cellH, cellW, cellH);
      }
    }
  }

  function worldToMap(wx, wy) {
    return {
      x: mapX + map(wx, 0, SEWER_WORLD_W, 0, MAP_W),
      y: mapY + map(wy, 0, SEWER_WORLD_H, 0, MAP_H),
    };
  }

  if (floor(frameCount / 20) % 2 === 0) {
    fill(255, 0, 0);
  } else {
    fill(0, 80, 255);
  }

  for (let i = 0; i < sewerEnemies.length; i++) {
    let p = worldToMap(sewerEnemies[i].x, sewerEnemies[i].y);
    ellipse(p.x, p.y, 6);
  }

  fill(0, 255, 0);
  let exitPos = worldToMap(sewerExitPoint.x, sewerExitPoint.y);
  ellipse(exitPos.x, exitPos.y, 8);

  fill(0, 200, 180);
  let pp = worldToMap(player.x, player.y);
  ellipse(pp.x, pp.y, 7);

  fill(255);
  textSize(22);
  textAlign(LEFT);
  textFont("monospace");
  text("SEWER MAP", mapX + 4, mapY + MAP_H - 4);
}

// ============================================================
// drawDumpsterHUD()
// FIX: full arrow-key cluster (same as Week 1's HUD) since the
// player now moves in every direction through the maze instead
// of just left/right.
// ============================================================
function drawDumpsterHUD() {
  noStroke();
  textFont("monospace");

  let keySize = 26;
  drawArrowKeyCluster(16, height - 16, keySize);

  fill(255);
  textAlign(LEFT);
  textSize(22);
  text("Space: Inspect   E: Exit at tunnel door   Avoid cops", 16 + keySize * 3 + 20, height - 34);

  textSize(22);
  text("Evidence: " + (evidenceCollectedThisLevel ? 1 : 0) + " / " + evidenceNeeded, 16, 30);
  text("Supplies: " + supplies + " / " + suppliesNeeded, 16, 56);
  text("Time: " + ceil(dumpsterTimeLeft), 16, 82);

  if (dumpsterTimeLeft < 15) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(26);
    text("THE POLICE ARE CLOSING IN", width / 2, 40);
  }

  if (evidenceCollectedThisLevel && supplies >= suppliesNeeded) {
    fill(120, 255, 150);
    textAlign(CENTER);
    textSize(18);
    text("FULLY STOCKED — HEAD FOR THE TUNNEL EXIT", width / 2, 108);
  }
}

// ============================================================
// drawHomeScreen()
// ============================================================
function drawHomeScreen() {
  clear();
  imageMode(CENTER);

  let imgW = homeImage.width  * 1.2;
  let imgH = homeImage.height * 0.6;

  image(homeImage, width / 2, height / 2, imgW, imgH);

  fill(0, 0, 0, 100);
  rect(0, 0, width, height);

  textAlign(CENTER);
  textFont("monospace");

  textSize(22);
  stroke(0);
  strokeWeight(6);
  fill(255);
  text("Press ENTER to start", width / 2, 320);
  noStroke();
}

// ============================================================
// restartGame()
// ============================================================
function restartGame() {
  sewerDoorOpen = false;
  gameState = STATE_SCAVENGE;

  level    = 1;
  day      = 7;
  score    = 0;
  supplies = 0;
  evidence = 0;
  evidenceCollectedThisLevel = false;
  timeLeft = 60;

  gameOverTitle = "GAME OVER";
  loseReason = "";

  wifeVisible = false;
  wifeTimer = 0;
  wifeFrame = 0;
  wifeRow = 0;

  // Reset the intro narration cutscene flags so a fresh
  // playthrough sees it again on the first fake pickup.
  introNarrationPlayed = false;
  introCutsceneActive = false;
  introCutscene = null;

  spawnInitialScavengeCops();
  boss     = null;

  // Reset the Week 2 sewer maze's patrolling cops too — a fresh
  // set is spawned every time buildSewerMazeLevel() runs, but
  // clear the array here as well so a restart from Week 3+ doesn't
  // leave stale cop positions lying around.
  sewerEnemies = [];

  // AUDIO — make sure a restart doesn't leave the siren looping
  // from wherever the previous run left off.
  stopCopSiren();

  player.x         = WORLD_W / 2;
  player.y         = WORLD_H - 200;
  player.direction = { x: 0, y: -1 };

  camX = player.x - width / 2;
  camY = player.y - height / 2;

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].collected = false;
  }

  // Reset the Week 1 scavenge dumpsters
  for (let i = 0; i < scavengeDumpsterSpots.length; i++) {
    scavengeDumpsterSpots[i].searched = false;
    scavengeDumpsterSpots[i].open = false;
    scavengeDumpsterSpots[i].itemVisibleUntil = 0;
  }

  // Reset the Week 2 sewer maze countdown (the maze, its items,
  // its cops, and its decorative eyes are all regenerated fresh
  // whenever startDumpsterLevel() runs)
  dumpsterTimeLeft = DUMPSTER_TIME_LIMIT;

  // Reset Week 3 police station platformer state too
  week3Phase = "entrance";
  week3LevelComplete = false;
  week3BannerTimer = 0;
  if (week3Player) {
    week3Player.x = WEEK3_LEVEL_DATA.start.x;
    week3Player.y = WEEK3_LEVEL_DATA.start.y;
    week3Player.vx = 0;
    week3Player.vy = 0;
    week3Player.standingOn = null;
  }
}

function handleDebugKeys() {
  // D opens and closes debug mode
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    return true;
  }

  if (!debugMode) {
    return false;
  }

  // Jump to Level 1
  if (key === "1") {
    debugMode = false;
    restartGame();
    return true;
  }

  // Jump to Level 2
  if (key === "2") {
    debugMode = false;

    level = 2;
    day = 14;
    supplies = 0;
    evidenceCollectedThisLevel = false;

    startDumpsterLevel();
    return true;
  }

  // Jump to Level 3
  if (key === "3") {
    window.location.href = "./level3.html";
    return true;
  }

  return true; // blocks normal game controls while menu is open
}

function drawDebugMode() {
  push();

  // Darken the frozen game
  resetMatrix();
  fill(0, 0, 0, 210);
  noStroke();
  rect(0, 0, width, height);

  const panelW = min(700, width - 40);
  const panelH = 430;
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;

  // Debug panel
  fill(8, 8, 10);
  stroke(255, 205, 45);
  strokeWeight(5);
  rect(panelX, panelY, panelW, panelH, 18);

  noStroke();
  textFont("monospace");
  textAlign(LEFT);

  fill(255, 210, 45);
  textSize(36);
  text("DEBUG MODE", panelX + 35, panelY + 60);

  fill(255);
  textSize(21);

  const instructions = [
    "D  — Close debug mode",
    "1  — Jump to Level 1",
    "2  — Jump to Level 2",
    "3  — Jump to Level 3"
  ];

  for (let i = 0; i < instructions.length; i++) {
    text(
      instructions[i],
      panelX + 35,
      panelY + 125 + i * 42
    );
  }

  fill(170);
  textSize(18);
  text("CURRENT GAME VALUES", panelX + panelW / 2, panelY + 125);
  text("Game state: " + gameState, panelX + panelW / 2, panelY + 165);
  text("Current level: " + level, panelX + panelW / 2, panelY + 200);
  text("Supplies: " + supplies, panelX + panelW / 2, panelY + 235);
  text(
    "Evidence: " + (evidenceCollectedThisLevel ? 1 : 0),
    panelX + panelW / 2,
    panelY + 270
  );

  fill(255, 210, 45);
  textAlign(CENTER);
  textSize(16);
  text(
    "The game is paused while debug mode is open",
    width / 2,
    panelY + panelH - 35
  );

  pop();
}

function findSewerPathToExit() {

  const startCol =
    constrain(
      floor(player.x / SEWER_CELL_SIZE),
      0,
      SEWER_MAZE_COLS - 1
    );

  const startRow =
    constrain(
      floor(player.y / SEWER_CELL_SIZE),
      0,
      SEWER_MAZE_ROWS - 1
    );

  const exitCol =
    constrain(
      floor(sewerExitPoint.x / SEWER_CELL_SIZE),
      0,
      SEWER_MAZE_COLS - 1
    );

  const exitRow =
    constrain(
      floor(sewerExitPoint.y / SEWER_CELL_SIZE),
      0,
      SEWER_MAZE_ROWS - 1
    );

  const queue = [
    {
      c: startCol,
      r: startRow
    }
  ];

  const visited =
    new Set([
      startCol + "," + startRow
    ]);

  const cameFrom =
    new Map();

  const directions = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ];

  let foundExit = false;

  while (queue.length > 0) {

    const current =
      queue.shift();

    if (
      current.c === exitCol &&
      current.r === exitRow
    ) {

      foundExit = true;
      break;
    }

    for (const direction of directions) {

      const nextCol =
        current.c +
        direction.dc;

      const nextRow =
        current.r +
        direction.dr;

      if (
        nextCol < 0 ||
        nextCol >= SEWER_MAZE_COLS ||
        nextRow < 0 ||
        nextRow >= SEWER_MAZE_ROWS
      ) {
        continue;
      }

      // Only travel through open tunnel cells.
      if (
        sewerMaze[nextRow][nextCol] !== 0
      ) {
        continue;
      }

      const nextKey =
        nextCol + "," + nextRow;

      if (
        visited.has(nextKey)
      ) {
        continue;
      }

      visited.add(nextKey);

      cameFrom.set(
        nextKey,
        current.c + "," + current.r
      );

      queue.push({
        c: nextCol,
        r: nextRow
      });
    }
  }

  if (!foundExit) {
    return [];
  }

  const path = [];

  let currentKey =
    exitCol + "," + exitRow;

  const startKey =
    startCol + "," + startRow;

  while (currentKey !== startKey) {

    const parts =
      currentKey.split(",");

    path.push({
      c: Number(parts[0]),
      r: Number(parts[1])
    });

    currentKey =
      cameFrom.get(currentKey);

    if (!currentKey) {
      return [];
    }
  }

  path.reverse();

  return path;
}

function drawSewerExitWallLights() {

  if (
    gameState !== STATE_DUMPSTER
  ) {
    return;
  }

  sewerPathUpdateTimer--;

  if (
    sewerPathUpdateTimer <= 0 ||
    sewerExitPath.length === 0
  ) {

    sewerExitPath =
      findSewerPathToExit();

    sewerPathUpdateTimer =
      SEWER_PATH_UPDATE_RATE;
  }

  if (
    sewerExitPath.length === 0
  ) {
    return;
  }

  const travellingPosition =
    (
      frameCount *
      SEWER_LIGHT_SPEED
    ) %
    sewerExitPath.length;

  const surroundingDirections = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 }
  ];

  /*
  Store each highlighted wall once.

  The key is "column,row".
  The value is the strongest brightness that wall receives.
  */
  const wallsToLight =
    new Map();

  for (
    let pathIndex = 0;
    pathIndex < sewerExitPath.length;
    pathIndex++
  ) {

    let distanceBehind =
      travellingPosition -
      pathIndex;

    if (
      distanceBehind < 0
    ) {
      distanceBehind +=
        sewerExitPath.length;
    }

    if (
      distanceBehind >
      SEWER_LIGHT_LENGTH
    ) {
      continue;
    }

    const brightness =
      map(
        distanceBehind,
        0,
        SEWER_LIGHT_LENGTH,
        230,
        0
      );

    const pathCell =
      sewerExitPath[pathIndex];

    for (
      const direction of
      surroundingDirections
    ) {

      const wallCol =
        pathCell.c +
        direction.dc;

      const wallRow =
        pathCell.r +
        direction.dr;

      if (
        wallCol < 0 ||
        wallCol >= SEWER_MAZE_COLS ||
        wallRow < 0 ||
        wallRow >= SEWER_MAZE_ROWS
      ) {
        continue;
      }

      if (
        sewerMaze[wallRow][wallCol] !== 1
      ) {
        continue;
      }

      const wallKey =
        wallCol + "," + wallRow;

      const previousBrightness =
        wallsToLight.get(wallKey) || 0;

      /*
      If multiple path cells touch the same wall,
      only keep the strongest light.
      */
      if (
        brightness >
        previousBrightness
      ) {

        wallsToLight.set(
          wallKey,
          brightness
        );
      }
    }
  }

  push();

  noFill();
  strokeWeight(4);

  for (
    const [
      wallKey,
      brightness
    ] of wallsToLight
  ) {

    const parts =
      wallKey.split(",");

    const wallCol =
      Number(parts[0]);

    const wallRow =
      Number(parts[1]);

    const wallX =
      wallCol *
      SEWER_CELL_SIZE;

    const wallY =
      wallRow *
      SEWER_CELL_SIZE;

    /*
    Do not draw walls outside the visible camera area.
    */
    if (
      wallX < camX - SEWER_CELL_SIZE ||
      wallX > camX + width + SEWER_CELL_SIZE ||
      wallY < camY - SEWER_CELL_SIZE ||
      wallY > camY + height + SEWER_CELL_SIZE
    ) {
      continue;
    }

    stroke(
      255,
      brightness
    );

    rect(
      wallX + 4,
      wallY + 4,
      SEWER_CELL_SIZE - 8,
      SEWER_CELL_SIZE - 8,
      4
    );
  }

  pop();
}

function drawLevel2Intro() {

  background(
    5,
    8,
    7
  );

  /* ============================================================
     DARK BACKGROUND PANEL
     ============================================================ */

  const panelW =
    Math.min(
      760,
      width - 60
    );

  const panelH =
    430;

  const panelX =
    width / 2 -
    panelW / 2;

  const panelY =
    height / 2 -
    panelH / 2;

  fill(
    12,
    18,
    16,
    245
  );

  stroke(
    220,
    230,
    225
  );

  strokeWeight(3);

  rect(
    panelX,
    panelY,
    panelW,
    panelH,
    16
  );

  /* ============================================================
     TITLE
     ============================================================ */

  noStroke();

  fill(255);

  textFont(
    "monospace"
  );

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(38);

  text(
    "LEVEL 2 — SEWER MAZE",
    width / 2,
    panelY + 65
  );

  /* ============================================================
     OBJECTIVES
     ============================================================ */

  textStyle(NORMAL);

  textSize(22);

  fill(
    235
  );

  text(
    "Find the evidence and collect enough supplies.",
    width / 2,
    panelY + 145
  );

  text(
    "Follow the travelling white lights toward the exit.",
    width / 2,
    panelY + 195
  );

  text(
    "Avoid the police and escape before time runs out.",
    width / 2,
    panelY + 245
  );

  /* ============================================================
     LIGHT EXAMPLE
     ============================================================ */

  const pulse =
    map(
      sin(frameCount * 0.1),
      -1,
      1,
      100,
      255
    );

  stroke(
    255,
    pulse
  );

  strokeWeight(6);

  line(
    width / 2 - 95,
    panelY + 300,
    width / 2 + 95,
    panelY + 300
  );

  noStroke();

  fill(
    255,
    pulse
  );

  ellipse(
    width / 2 + 95,
    panelY + 300,
    14,
    14
  );

  /* ============================================================
     CONTINUE
     ============================================================ */

  fill(255);

  textStyle(BOLD);

  textSize(22);

  text(
    "Press ENTER to begin",
    width / 2,
    panelY + panelH - 55
  );

  textStyle(NORMAL);
}