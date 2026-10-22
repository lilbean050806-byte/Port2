/* ============================================================
   LEVEL 3 — "PRECINCT"
   ============================================================ */
let debugMode = false;

let playerSheet;
let copImage;
let eyeImage;
let policeFloorImg;
let doorOpenImg;
let doorClosedImg;
let darknessLayer;
let itemImages = {};
let itemKeys = [];
let doorStates = new Map();
let doorOpenSound;
let doorCloseSound;
let bgMusic;
let musicStarted = false;
let sirenSound;
let sirenVolume = 0;

const SIREN_MAX_VOLUME = 0.12;
const SIREN_FADE_SPEED = 0.04;
const SIREN_TRIGGER_DISTANCE = 450;
const SIREN_MIN_AUDIBLE = 0.004;

const BG_MUSIC_VOLUME = 0.15;

/* ============================================================
   GOOD ENDING CUTSCENE
   ============================================================ */

let goodEndingImages = [];

let goodEndingScenes = [];

let goodEndingSceneIndex = 0;

let goodEndingFadeAlpha = 255;

let goodEndingPhase = "fadeIn";

let goodEndingPhaseTimer = 0;

let goodEndingDisplayedText = "";

let goodEndingCharacterIndex = 0;

let goodEndingTypingTimer = 0;

const GOOD_ENDING_FADE_SPEED = 5;
const GOOD_ENDING_TYPE_SPEED = 2;
const GOOD_ENDING_HOLD_TIME = 180;
/* ============================================================
   TUTORIAL / COMMUNICATION BANNERS
   ============================================================ */
let tutorialPaused = false;
let tutorialMessage = "";
let tutorialSeen = {
  start: false,
  firstHit: false,
  greenDoor: false,
  redDoor: false,
  evidencePhase: false,
  exitUnlocked: false
};
// PHASE 1 = collect normal items
// PHASE 2 = collect 3 moving evidence pieces
let evidencePhase = false;
// Moving evidence
let movingEvidence = [];
const MOVING_EVIDENCE_NEEDED = 3;
let movingEvidenceCollected = 0;
// Exit
let exitUnlocked = false;
let exitPoint = null;
// Door feedback
let doorMessageTimer = 0;
/* ============================================================
   PLAYER SPRITESHEET
   ============================================================ */ 
const FRAME_W = 150;
const FRAME_H = 200;
const PLAYER_SCALE = 0.22;
const ANIM_SPEED = 8;
/* ============================================================
   MAZE / WORLD
   ============================================================ */
const CELL = 42;
const COLS = 39;
const ROWS = 29;
const WORLD_W = COLS * CELL;
const WORLD_H = ROWS * CELL;
let camX = 0;
let camY = 0;
const CAM_SMOOTH = 0.1;
/*
maze values:

0 = open floor
1 = normal wall
2 = fake entrance / closed door
3 = illusion wall
*/

let maze = [];
let roomOf = [];
let fakeDoorFlashKey = null;
let fakeDoorFlashTimer = 0;

const FAKE_DOOR_FLASH_TIME = 90;
const FAKE_DOOR_DAMAGE = 8;
const FAKE_DOOR_BOUNCE = 45;

/* ============================================================
   ROOMS
   ============================================================ */

const ROOMS = [

  {
    name: "RECEPTION",
    r: 70,
    g: 80,
    b: 86,
    x: 1,
    y: 1,
    w: 7,
    h: 5
  },

  {
    name: "BRIEFING ROOM",
    r: 70,
    g: 90,
    b: 90,
    x: 11,
    y: 1,
    w: 8,
    h: 6
  },

  {
    name: "LOCKER ROOM",
    r: 80,
    g: 75,
    b: 70,
    x: 23,
    y: 1,
    w: 7,
    h: 5
  },

  {
    name: "OFFICES",
    r: 70,
    g: 80,
    b: 100,
    x: 1,
    y: 9,
    w: 8,
    h: 7
  },

  {
    name: "EVIDENCE STORAGE",
    r: 100,
    g: 70,
    b: 70,
    x: 15,
    y: 9,
    w: 8,
    h: 6
  },

  {
    name: "HOLDING CELLS",
    r: 60,
    g: 60,
    b: 70,
    x: 27,
    y: 9,
    w: 9,
    h: 7
  },

  {
    name: "INTERROGATION 1",
    r: 90,
    g: 60,
    b: 60,
    x: 1,
    y: 19,
    w: 6,
    h: 6
  },

  {
    name: "INTERROGATION 2",
    r: 90,
    g: 60,
    b: 60,
    x: 9,
    y: 19,
    w: 6,
    h: 6
  },

  {
    name: "ARCHIVES",
    r: 60,
    g: 70,
    b: 60,
    x: 19,
    y: 19,
    w: 8,
    h: 7
  },

  {
    name: "???",
    r: 90,
    g: 30,
    b: 60,
    x: 33,
    y: 21,
    w: 4,
    h: 5
  }

];


const ARCHIVE_ROOM = ROOMS[ROOMS.length - 1];

/* ============================================================
   FLASHLIGHT / REVEAL
   ============================================================ */

const REVEAL_DIST = 170;

const REVEAL_HALF_ANGLE = 0.62;


/*
IMPORTANT:

Previously this set was cleared every frame.

That meant a wall could become revealed, then become hidden
again as the flashlight moved slightly.

Now revealed cells stay revealed for the entire level.
*/

let revealedCells = new Set();


/* ============================================================
   ENTITIES
   ============================================================ */

let player;
let officers = [];
let evidenceItems = [];
let evidenceCount = 0;

const EVIDENCE_NEEDED = 5;

let sanity = 100;
let gameState = "start";
let promptText = "";
let flashAlpha = 0;

let deadWifeImg;
const WIFE_FRAME_W = 256;
const WIFE_FRAME_H = 256;
const WIFE_FRAME_COUNT = 4;

let wifeBannerFrame = 0;
let wifeBannerFrameTimer = 0;

const WIFE_BANNER_ANIM_SPEED = 8;

let displayedTutorialText = "";

let tutorialCharIndex = 0;

let tutorialTypeTimer = 0;

const TUTORIAL_TYPE_SPEED = 2;


function preload() {

  doorOpenSound = loadSound("dooropen.mp3");
  doorCloseSound = loadSound("doorclose.mp3");
bgMusic =
  loadSound(
    "backgroundMusic.mp3"
  );
  sirenSound =
  loadSound(
    "papersplease.mp3"
  );

  playerSheet = loadImage(
    "paperspleasecharacterspritesheet.png"
  );

  copImage = loadImage(
    "cop.png"
  );

  eyeImage = loadImage(
    "eye.png"
  );

  policeFloorImg = loadImage(
    "policeFloorImg.png"
  );

  /* ---------------- DOORS ---------------- */

  doorOpenImg = loadImage(
    "doorOpen.png"
  );


  doorClosedImg = loadImage(
    "doorClosed.png"
  );

  /* ---------------- WIFE---------------- */
 deadWifeImg = loadImage(
  "deadwife.png"
);

  /* ---------------- ITEMS ---------------- */

  itemImages.wire = loadImage(
    "wire.png"
  );


  itemImages.water = loadImage(
    "water.png"
  );


  itemImages.watch = loadImage(
    "watch.png"
  );


  itemImages.tape = loadImage(
    "tape.png"
  );


  itemImages.survivorNote = loadImage(
    "survivornote.png"
  );


  itemImages.radio = loadImage(
    "radio.png"
  );


  itemImages.notes = loadImage(
    "notes.png"
  );


  itemImages.medkit = loadImage(
    "medki.png"
  );


  itemImages.lighter = loadImage(
    "lighter.png"
  );


  itemImages.food = loadImage(
    "food.png"
  );

  goodEndingImages[0] = loadImage("goodEnding1.png");

  goodEndingImages[1] = loadImage("goodEnding2.png");

  goodEndingImages[2] = loadImage("goodEnding3.png");

  goodEndingImages[3] = loadImage("goodEnding4.png");

  goodEndingImages[4] = loadImage("goodEnding5.png");

  goodEndingImages[5] = loadImage("goodEnding6.png");


  itemKeys = Object.keys(itemImages);
}


/* ============================================================
   SETUP
   ============================================================ */

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );


  /*
  Separate graphics canvas for the darkness.

  This is important because we use destination-out to cut
  holes in the darkness.

  If we use destination-out directly on the game's canvas,
  it can erase the player/world graphics too.
  */

  darknessLayer = createGraphics(
    windowWidth,
    windowHeight
  );


  noSmooth();

  textFont("monospace");

  goodEndingScenes = [

  {
    image: goodEndingImages[0],
    text:
      "After finally 3 weeks of searching for the necessary evidence and clues I can finally rest at my only place I can call home."
  },

  {
    image: goodEndingImages[1],
    text:
      "The police can no longer deny the truth, these files have been hidden away for too long."
  },

  {
    image: goodEndingImages[2],
    text:
      "Everyone tried to frame me, but I know deep down I didn't do it. I just wished I knew sooner that Lia wasn't okay. I should have noticed whats infront of me. I should of heard her pain, I should have felt her lack of energy."
  },

  {
    image: goodEndingImages[3],
    text:
      "After all this time I was innocent, and Lia turned out to be ill for a very long time, she didn't deserve this pain."
  },

  {
    image: goodEndingImages[4],
    text:
      "Lia wasn't just my wife, she was her own person with dreams and goals she wanted to accomplish, her story didn't deserve to be cut short. But even now when she's gone, I still feel her existence and guidance."
  },

  {
    image: goodEndingImages[5],
    text:
      "Nevertheless, someone framed me for her death, and I won't stop t'ill I find out who did it."
  }

];
}


/* ============================================================
   WINDOW RESIZE
   ============================================================ */

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  darknessLayer = createGraphics(
    windowWidth,
    windowHeight
  );
}


/* ============================================================
   MAZE GENERATION
   ============================================================ */

function inBounds(c, r) {

  return (
    c > 0 &&
    c < COLS - 1 &&
    r > 0 &&
    r < ROWS - 1
  );
}


/* ============================================================
   GENERATE MAZE
   ============================================================ */

function generateMaze() {

  let grid = [];


  for (let r = 0; r < ROWS; r++) {

    grid.push(
      new Array(COLS).fill(1)
    );
  }


  function carve(cx, cy) {

    grid[cy][cx] = 0;


    let dirs = shuffleArr([

      [0, -2],

      [0, 2],

      [-2, 0],

      [2, 0]

    ]);


    for (const d of dirs) {

      const nx = cx + d[0];

      const ny = cy + d[1];


      if (
        inBounds(nx, ny) &&
        grid[ny][nx] === 1
      ) {

        grid[
          cy + d[1] / 2
        ][
          cx + d[0] / 2
        ] = 0;


        carve(
          nx,
          ny
        );
      }
    }
  }


  carve(
    1,
    1
  );


  return grid;
}

function showTutorialMessage(message) {

  tutorialMessage = message;

  tutorialPaused = true;

  displayedTutorialText = "";

  tutorialCharIndex = 0;

  tutorialTypeTimer = 0;

  wifeBannerFrame = 0;

  wifeBannerFrameTimer = 0;
}

function dismissTutorialMessage() {

  tutorialPaused = false;

  tutorialMessage = "";

  displayedTutorialText = "";

  tutorialCharIndex = 0;

  tutorialTypeTimer = 0;

  wifeBannerFrame = 0;

  wifeBannerFrameTimer = 0;
}

/* ============================================================
   SHUFFLE
   ============================================================ */

function shuffleArr(a) {

  for (
    let i = a.length - 1;
    i > 0;
    i--
  ) {

    const j = Math.floor(
      random(i + 1)
    );


    [
      a[i],
      a[j]
    ] = [
      a[j],
      a[i]
    ];
  }


  return a;
}


/* ============================================================
   CARVE ROOMS
   ============================================================ */

function carveRooms(grid) {

  roomOf = [];


  for (
    let r = 0;
    r < ROWS;
    r++
  ) {

    roomOf.push(
      new Array(COLS).fill(null)
    );
  }


  for (const room of ROOMS) {

    for (
      let r = room.y;
      r < room.y + room.h &&
      r < ROWS - 1;
      r++
    ) {

      for (
        let c = room.x;
        c < room.x + room.w &&
        c < COLS - 1;
        c++
      ) {

        grid[r][c] = 0;

        roomOf[r][c] = room.name;
      }
    }
  }
}


function assignIllusions(grid) {

  /*
  Function name kept so the rest of your code
  does not need to change.

  0 = floor
  1 = wall
  2 = real usable door
  3 = fake / locked door
  */

  for (
    let r = 1;
    r < ROWS - 1;
    r++
  ) {

    for (
      let c = 1;
      c < COLS - 1;
      c++
    ) {

      // Only solid walls can become doors
      if (grid[r][c] !== 1) {
        continue;
      }


      const upOpen =
        grid[r - 1][c] === 0;

      const downOpen =
        grid[r + 1][c] === 0;

      const leftOpen =
        grid[r][c - 1] === 0;

      const rightOpen =
        grid[r][c + 1] === 0;


      /*
      Door must connect two opposite floor spaces.
      */

      const verticalDoor =
        upOpen &&
        downOpen &&
        !leftOpen &&
        !rightOpen;


      const horizontalDoor =
        leftOpen &&
        rightOpen &&
        !upOpen &&
        !downOpen;


      if (
        verticalDoor ||
        horizontalDoor
      ) {

        /*
        Not every valid doorway becomes a door.
        */

        if (random() < 0.50) {

          /*
          About 75% are real doors.
          About 25% are fake/locked doors.
          */

          if (random() < 0.50) {

            grid[r][c] = 2;

          } else {

            grid[r][c] = 3;
          }
        }
      }
    }
  }
}



/* ============================================================
   GRID TO WORLD
   ============================================================ */

function gridToWorld(col, row) {

  return {

    x:
      col * CELL +
      CELL / 2,

    y:
      row * CELL +
      CELL / 2

  };
}


/* ============================================================
   FIND NEAREST OPEN CELL
   ============================================================ */

function nearestOpenCell(x, y) {

  let col = Math.round(
    x / CELL
  );


  let row = Math.round(
    y / CELL
  );


  col = constrain(
    col,
    1,
    COLS - 2
  );


  row = constrain(
    row,
    1,
    ROWS - 2
  );


  if (
    maze[row][col] === 0
  ) {

    return gridToWorld(
      col,
      row
    );
  }


  for (
    let radius = 1;
    radius < Math.max(COLS, ROWS);
    radius++
  ) {

    for (
      let dc = -radius;
      dc <= radius;
      dc++
    ) {

      for (
        let dr = -radius;
        dr <= radius;
        dr++
      ) {

        const c = col + dc;

        const r = row + dr;


        if (
          c < 1 ||
          c > COLS - 2 ||
          r < 1 ||
          r > ROWS - 2
        ) {

          continue;
        }


        if (
          maze[r][c] === 0
        ) {

          return gridToWorld(
            c,
            r
          );
        }
      }
    }
  }


  return gridToWorld(
    1,
    1
  );
}


/* ============================================================
   FLASHLIGHT REVEAL
   ============================================================ */

function updateRevealed() {


  /*
  DO NOT clear revealedCells here.

  Old version did:

      revealedCells.clear();

  That caused revealed walls to flicker back into walls
  when the flashlight moved away slightly.
  */


  const pc = Math.floor(
    player.x / CELL
  );


  const pr = Math.floor(
    player.y / CELL
  );


  const range =

    Math.ceil(
      REVEAL_DIST / CELL
    ) + 1;


  const aim = Math.atan2(

    player.direction.y,

    player.direction.x

  );


  for (
    let r = pr - range;
    r <= pr + range;
    r++
  ) {

    for (
      let c = pc - range;
      c <= pc + range;
      c++
    ) {

      if (
        c < 0 ||
        c >= COLS ||
        r < 0 ||
        r >= ROWS
      ) {

        continue;
      }


      const w = gridToWorld(
        c,
        r
      );


      const dx =
        w.x -
        player.x;


      const dy =
        w.y -
        player.y;


      const d = Math.hypot(
        dx,
        dy
      );


      if (
        d > REVEAL_DIST
      ) {

        continue;
      }


      const ang = Math.atan2(
        dy,
        dx
      );


      let diff = Math.abs(
        ang - aim
      );


      if (
        diff > Math.PI
      ) {

        diff =
          2 * Math.PI -
          diff;
      }


      if (

        diff <=
          REVEAL_HALF_ANGLE ||

        d <
          CELL * 1.3

      ) {

        revealedCells.add(
          c + "," + r
        );
      }
    }
  }
}


/* ============================================================
   IS REVEALED
   ============================================================ */

function isRevealed(c, r) {

  return revealedCells.has(
    c + "," + r
  );
}

function cellBlocks(c, r) {

  if (
    c < 0 ||
    c >= COLS ||
    r < 0 ||
    r >= ROWS
  ) {
    return true;
  }


  const v = maze[r][c];


  // FLOOR
  if (v === 0) {

    return false;
  }


  // NORMAL WALL
  if (v === 1) {

    return true;
  }


  // REAL DOOR
  if (v === 2) {

    const doorKey =
      c + "," + r;


    const isOpen =
      doorStates.get(doorKey) === true;


    // Closed = blocks
    // Open = passable
    return !isOpen;
  }


  // FAKE / LOCKED DOOR
  if (v === 3) {

    return true;
  }


  return true;
}




function isWallAtPoint(x, y) {

  return cellBlocks(

    Math.floor(
      x / CELL
    ),

    Math.floor(
      y / CELL
    )

  );
}


/* ============================================================
   CAN MOVE TO
   ============================================================ */

function canMoveTo(x, y, r) {

  const pts = [

    [
      x - r,
      y - r
    ],

    [
      x + r,
      y - r
    ],

    [
      x - r,
      y + r
    ],

    [
      x + r,
      y + r
    ]

  ];


  for (
    const p of pts
  ) {

    if (
      isWallAtPoint(
        p[0],
        p[1]
      )
    ) {

      return false;
    }
  }


  return true;
}


/* ============================================================
   SPAWN EVIDENCE
   ============================================================ */

function spawnEvidence() {

  evidenceItems = [];


  const spots = [

    "EVIDENCE STORAGE",

    "OFFICES",

    "INTERROGATION 1",

    "INTERROGATION 2",

    "ARCHIVES",

    "BRIEFING ROOM",

    "HOLDING CELLS"

  ];


  shuffleArr(
    spots
  );


  for (
    let i = 0;
    i < EVIDENCE_NEEDED + 2;
    i++
  ) {

    const roomName =

      spots[
        i %
        spots.length
      ];


    const room =

      ROOMS.find(

        rm =>
          rm.name ===
          roomName

      );


    let c;

    let r;

    let tries = 0;


    do {

      c =

        room.x +
        1 +
        Math.floor(

          random(
            room.w - 2
          )

        );


      r =

        room.y +
        1 +
        Math.floor(

          random(
            room.h - 2
          )

        );


      tries++;

    }

    while (

      maze[r] &&

      maze[r][c] !== 0 &&

      tries < 20

    );


    const w = gridToWorld(
      c,
      r
    );


    const key = random(
      itemKeys
    );


    evidenceItems.push({

      x: w.x,

      y: w.y,

      collected: false,

      key: key,

      image:
        itemImages[key]

    });
  }
}


/* ============================================================
   SPAWN OFFICERS
   ============================================================ */

function spawnOfficers() {

  officers = [];


  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const c =

      1 +
      Math.floor(
        random(
          COLS - 2
        )
      );


    const r =

      1 +
      Math.floor(
        random(
          ROWS - 2
        )
      );


    const w = nearestOpenCell(

      c * CELL,

      r * CELL

    );


    officers.push({

      x: w.x,

      y: w.y,

      r: 16,

      speed: 1.5,

      dir: random(
        TWO_PI
      ),

      timer:
        Math.floor(
          random(90)
        )

    });
  }
}


function updateOfficers() {

  for (const o of officers) {

    const dx =
      player.x -
      o.x;

    const dy =
      player.y -
      o.y;


    const distanceToPlayer =
      Math.hypot(
        dx,
        dy
      );


    /*
    Increase for more aggressive cops.

    500 means they notice you from pretty far away.
    */

    const CHASE_DISTANCE = 500;


    if (
      distanceToPlayer <
      CHASE_DISTANCE
    ) {

      /* ========================================================
         CHASE PLAYER
         ======================================================== */

      let dirX = 0;

      let dirY = 0;


      if (
        distanceToPlayer > 0
      ) {

        dirX =
          dx /
          distanceToPlayer;

        dirY =
          dy /
          distanceToPlayer;
      }


      const moveX =
        dirX *
        o.speed;


      const moveY =
        dirY *
        o.speed;


      /*
      Try the larger movement axis first.

      This makes chasing through corridors work better
      than trying X and Y randomly.
      */

      if (
        Math.abs(dx) >
        Math.abs(dy)
      ) {

        // TRY HORIZONTAL FIRST

        if (
          canMoveTo(
            o.x + moveX,
            o.y,
            o.r
          )
        ) {

          o.x += moveX;

        } else if (
          canMoveTo(
            o.x,
            o.y + moveY,
            o.r
          )
        ) {

          o.y += moveY;

        } else {

          /*
          Wall is blocking both direct routes.
          Try moving perpendicular.
          */

          const side =
            random() < 0.5
              ? -1
              : 1;


          if (
            canMoveTo(
              o.x,
              o.y +
              side *
              o.speed,
              o.r
            )
          ) {

            o.y +=
              side *
              o.speed;
          }
        }

      } else {

        // TRY VERTICAL FIRST

        if (
          canMoveTo(
            o.x,
            o.y + moveY,
            o.r
          )
        ) {

          o.y += moveY;

        } else if (
          canMoveTo(
            o.x + moveX,
            o.y,
            o.r
          )
        ) {

          o.x += moveX;

        } else {

          const side =
            random() < 0.5
              ? -1
              : 1;


          if (
            canMoveTo(
              o.x +
              side *
              o.speed,
              o.y,
              o.r
            )
          ) {

            o.x +=
              side *
              o.speed;
          }
        }
      }

    } else {

      /* ========================================================
         WANDER WHEN PLAYER IS FAR AWAY
         ======================================================== */

      o.timer--;


      if (
        o.timer <= 0
      ) {

        o.dir +=
          random(
            -1.1,
            1.1
          );


        o.timer =
          60 +
          Math.floor(
            random(80)
          );
      }


      const nx =
        o.x +
        Math.cos(o.dir) *
        o.speed;


      const ny =
        o.y +
        Math.sin(o.dir) *
        o.speed;


      if (
        canMoveTo(
          nx,
          o.y,
          o.r
        )
      ) {

        o.x = nx;

      } else {

        o.dir =
          random(TWO_PI);
      }


      if (
        canMoveTo(
          o.x,
          ny,
          o.r
        )
      ) {

        o.y = ny;

      } else {

        o.dir =
          random(TWO_PI);
      }
    }
  }
}


/* ============================================================
   BUILD LEVEL
   ============================================================ */

function buildLevel() {

  maze =
    generateMaze();


  carveRooms(
    maze
  );


  assignIllusions(
    maze
  );


  /* ============================================================
     DOORS
     ============================================================ */

  doorStates.clear();


  for (
    let r = 0;
    r < ROWS;
    r++
  ) {

    for (
      let c = 0;
      c < COLS;
      c++
    ) {

      // Only real doors need an open/closed state
      if (maze[r][c] === 2) {

        doorStates.set(
          c + "," + r,
          false
        );
      }
    }
  }


  /* ============================================================
     PLAYER
     ============================================================ */

  const start =
    gridToWorld(
      3,
      3
    );


  player = {

    x: start.x,

    y: start.y,

    r: 10,

    direction: {
      x: 0,
      y: 1
    },

    speed: 3.4,

    currentFrame: 0,

    frameTimer: 0,

    row: 3
  };


  /*
  Player eventually returns here to escape.
  */

  exitPoint = {

    x: start.x,

    y: start.y

  };


  /* ============================================================
     CAMERA
     ============================================================ */

  camX =
    player.x -
    width / 2;


  camY =
    player.y -
    height / 2;


  /* ============================================================
     NORMAL ITEMS
     ============================================================ */

  spawnEvidence();


  evidenceCount = 0;


  /* ============================================================
     MOVING EVIDENCE PHASE
     ============================================================ */

  evidencePhase = false;

  movingEvidence = [];

  movingEvidenceCollected = 0;

  exitUnlocked = false;


  /* ============================================================
     ENEMIES
     ============================================================ */

  spawnOfficers();


  sanity = 100;

  promptText = "";

  doorMessageTimer = 0;

  revealedCells.clear();
}

/* ============================================================
   RESTART
   ============================================================ */

function restartLevel() {

  buildLevel();

  gameState = "play";
}


function keyPressed() {

  /* ============================================================
     DEBUG MODE
     ============================================================ */

  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    return;
  }

  if (debugMode) {

    if (key === "1") {
      window.location.href = "./index.html?debugLevel=1";
    }

    if (key === "2") {
      window.location.href = "./index.html?debugLevel=2";
    }

    if (key === "3") {
      debugMode = false;
      restartLevel();
    }

    return;
  }

  /* ============================================================
   GOOD ENDING CUTSCENE CONTROLS
   ============================================================ */

if (
  gameState ===
    "goodEnding" &&
  (
    keyCode === 32 ||
    keyCode === ENTER
  )
) {

  const scene =
    goodEndingScenes[
      goodEndingSceneIndex
    ];


  /*
  If text is typing, reveal all of it.
  */

  if (
    goodEndingPhase ===
    "typing"
  ) {

    goodEndingDisplayedText =
      scene.text;

    goodEndingCharacterIndex =
      scene.text.length;

    goodEndingPhase =
      "hold";

    goodEndingPhaseTimer =
      0;

    return;
  }


  /*
  If the full scene is showing,
  begin fading to the next image.
  */

  if (
    goodEndingPhase ===
    "hold"
  ) {

    goodEndingPhase =
      "fadeOut";

    goodEndingPhaseTimer =
      0;

    return;
  }


  return;
}


  /* ============================================================
     START GAME
     ============================================================ */

if (
  gameState === "start" &&
  (
    key === " " ||
    keyCode === ENTER
  )
) {

  userStartAudio();

  startBackgroundMusic();

  buildLevel();

  gameState = "play";

  tutorialSeen.start = true;

  return;
}


  /* ============================================================
     TUTORIAL BANNER
     ============================================================ */

  if (tutorialPaused) {

    // First press instantly finishes the typing animation.
    if (
      tutorialCharIndex <
      tutorialMessage.length
    ) {

      displayedTutorialText =
        tutorialMessage;

      tutorialCharIndex =
        tutorialMessage.length;

      return;
    }

    // Next Space or Enter press closes the tutorial.
    if (
      key === " " ||
      keyCode === ENTER
    ) {

      dismissTutorialMessage();

      return;
    }

    return;
  }


  /* ============================================================
     RESTART
     ============================================================ */

 /* ============================================================
   GAME OVER — RETURN TO MAIN SCREEN
   ============================================================ */

if (
  gameState === "over" &&
  (
    key === "r" ||
    key === "R" ||
    keyCode === ENTER ||
    keyCode === 32
  )
) {

  window.location.href =
    "./index.html";

  return;
}


/* ============================================================
   WIN SCREEN
   ============================================================ */

if (
  gameState === "win" &&
  (
    key === "r" ||
    key === "R"
  )
) {

  window.location.href =
    "./index.html";

  return;
}


  /* ============================================================
     SPACE INTERACTION — DOORS AND ITEMS
     ============================================================ */

  if (
    gameState === "play" &&
    keyCode === 32
  ) {

    const nearbyDoor =
      getNearbyDoor();

    // Prioritize doors when the player is standing near one.
    if (nearbyDoor) {

      toggleNearbyDoor();

    } else if (!evidencePhase) {

      // Otherwise, collect a nearby normal item.
      tryInteract();
    }

    return;
  }
}
  
/* ============================================================
   INTERACT
   ============================================================ */

function tryInteract() {

  for (
    const it of evidenceItems
  ) {

    if (
      it.collected
    ) {

      continue;
    }


    if (

      dist(

        it.x,
        it.y,

        player.x,
        player.y

      ) < 110

    ) {

      it.collected = true;

      evidenceCount++;

      return;
    }
  }
}

function update() {

  if (tutorialPaused) {
  return;
}

  let mx = 0;

  let my = 0;

// Arrow-key movement only
if (keyIsDown(UP_ARROW)) {
  my -= 1;
}

if (keyIsDown(DOWN_ARROW)) {
  my += 1;
}

if (keyIsDown(LEFT_ARROW)) {
  mx -= 1;
}

if (keyIsDown(RIGHT_ARROW)) {
  mx += 1;
}

  const moving =
    mx !== 0 ||
    my !== 0;


  if (moving) {

    const len =
      Math.hypot(
        mx,
        my
      );


    mx /= len;

    my /= len;


    player.direction = {

      x: mx,

      y: my

    };


    const nx =
      player.x +
      mx *
      player.speed;


    const ny =
      player.y +
      my *
      player.speed;


    if (
      canMoveTo(
        nx,
        player.y,
        player.r
      )
    ) {

      player.x = nx;
    }


    if (
      canMoveTo(
        player.x,
        ny,
        player.r
      )
    ) {

      player.y = ny;
    }


    player.frameTimer++;


    if (
      player.frameTimer >=
      ANIM_SPEED
    ) {

      player.currentFrame =

        (
          player.currentFrame +
          1
        ) % 4;


      player.frameTimer = 0;
    }

  } else {

    player.currentFrame = 0;
  }


  /* ============================================================
     PLAYER SPRITE DIRECTION
     ============================================================ */

  if (
    player.direction.y === -1 &&
    player.direction.x === 0
  ) {

    player.row = 0;

  } else if (
    player.direction.y === 1 &&
    player.direction.x === 0
  ) {

    player.row = 3;

  } else {

    player.row = 1;
  }


  /* ============================================================
     WORLD LIMITS
     ============================================================ */

  player.x =
    constrain(
      player.x,
      player.r,
      WORLD_W -
      player.r
    );


  player.y =
    constrain(
      player.y,
      player.r,
      WORLD_H -
      player.r
    );


  /* ============================================================
     CAMERA
     ============================================================ */

  camX =
    lerp(
      camX,
      player.x -
      width / 2,
      CAM_SMOOTH
    );


  camY =
    lerp(
      camY,
      player.y -
      height / 2,
      CAM_SMOOTH
    );


  const maxCamX =
    Math.max(
      0,
      WORLD_W -
      width
    );


  const maxCamY =
    Math.max(
      0,
      WORLD_H -
      height
    );


  camX =
    constrain(
      camX,
      0,
      maxCamX
    );


  camY =
    constrain(
      camY,
      0,
      maxCamY
    );


  /* ============================================================
     OFFICERS
     ============================================================ */

  updateOfficers();
  updateCopSiren();


  /* ============================================================
     DAMAGE FLASH
     ============================================================ */

  if (
    flashAlpha > 0
  ) {

    flashAlpha =
      max(
        0,
        flashAlpha - 8
      );
  }


  /* ============================================================
     COP COLLISION
     ============================================================ */

  for (
    const o of officers
  ) {

    if (
      dist(
        o.x,
        o.y,
        player.x,
        player.y
      ) <
      o.r +
      player.r
    ) {

      sanity -= 34;


      flashAlpha = 140;

      if (!tutorialSeen.firstHit) {

  tutorialSeen.firstHit = true;

  showTutorialMessage(
    "You only have 3 police strikes before the police catches you for good. Be careful, fake doors can also hurt you."
  );
}


      const spot =
        nearestOpenCell(
          random(WORLD_W),
          random(WORLD_H)
        );


      player.x =
        spot.x;


      player.y =
        spot.y;


      if (
        sanity <= 0
      ) {

        gameState =
          "over";
      }


      break;
    }
  }


  /* ============================================================
     BEGIN MOVING EVIDENCE PHASE
     ============================================================ */
if (
  evidenceCount >= EVIDENCE_NEEDED &&
  !evidencePhase
) {

  evidencePhase = true;

  spawnMovingEvidence();


  if (!tutorialSeen.evidencePhase) {

    tutorialSeen.evidencePhase = true;

    showTutorialMessage(
      "Quickly get the 3 secret pieces of evidence to reveal my death!"
    );
  }
}


  /* ============================================================
     UPDATE MOVING EVIDENCE
     ============================================================ */

  if (evidencePhase) {

    updateMovingEvidence();

    checkMovingEvidencePickup();
  }

  if (fakeDoorFlashTimer > 0) {

  fakeDoorFlashTimer--;

  if (fakeDoorFlashTimer <= 0) {
    fakeDoorFlashKey = null;
  }
}


  /* ============================================================
     UNLOCK EXIT
     ============================================================ */

if (
  movingEvidenceCollected >=
  MOVING_EVIDENCE_NEEDED
) {

  if (!exitUnlocked) {

    exitUnlocked = true;


    if (!tutorialSeen.exitUnlocked) {

      tutorialSeen.exitUnlocked = true;

      showTutorialMessage(
        "You did it! Return to the exit!"
      );
    }
  }
}

/* ============================================================
   START GOOD ENDING AT EXIT
   ============================================================ */

if (
  exitUnlocked &&
  exitPoint &&
  dist(
    player.x,
    player.y,
    exitPoint.x,
    exitPoint.y
  ) < 35
) {

  startGoodEndingCutscene();

  return;
}

  /* ============================================================
     PROMPTS
     ============================================================ */

  if (
    doorMessageTimer > 0
  ) {

    doorMessageTimer--;

    return;
  }


  promptText = "";


const nearDoor =
  getNearbyDoor();


if (nearDoor) {

  /* ============================================================
     FIRST GREEN DOOR
     ============================================================ */

  if (
    nearDoor.type === 2 &&
    !tutorialSeen.greenDoor
  ) {

    tutorialSeen.greenDoor = true;

    showTutorialMessage(
      "Click SPACE to open and close the REAL doors and push nearby cops away."
    );

    return;
  }


  /* ============================================================
     FIRST RED DOOR
     ============================================================ */

  if (
    nearDoor.type === 3 &&
    !tutorialSeen.redDoor
  ) {

    tutorialSeen.redDoor = true;

    showTutorialMessage(
      "There are fake doors that you can't open. Open them and you will be bumped back and feel tired"
    );

    return;
  }
}


  /* ============================================================
     PHASE 1 ITEM PROMPTS
     ============================================================ */

  if (!evidencePhase) {

    for (
      const it of
      evidenceItems
    ) {

      if (
        !it.collected &&
        dist(
          it.x,
          it.y,
          player.x,
          player.y
        ) < 110
      ) {

        promptText =

          itemLabel(
            it.key
          ) +

          " — press SPACE to collect";


        break;
      }
    }
  }


  /* ============================================================
     PHASE 2 PROMPTS
     ============================================================ */

  else if (
    !exitUnlocked
  ) {

    promptText =

      "Catch the evidence — " +

      movingEvidenceCollected +

      " / " +

      MOVING_EVIDENCE_NEEDED;
  }


  else {

    promptText =
      "EXIT UNLOCKED — return to where you entered.";
  }
}



function roomAt(x, y) {

  const c = Math.floor(
    x / CELL
  );


  const r = Math.floor(
    y / CELL
  );


  return (

    roomOf[r] &&

    roomOf[r][c]

  )

    ? roomOf[r][c]

    : null;
}


/* ============================================================
   ITEM LABEL
   ============================================================ */

function itemLabel(key) {

  const labels = {

    wire:
      "Loose Wire",

    water:
      "Water Bottle",

    watch:
      "Broken Watch",

    tape:
      "Audio Tape",

    survivorNote:
      "Survivor's Note",

    radio:
      "Police Radio",

    notes:
      "Case Notes",

    medkit:
      "Medkit",

    lighter:
      "Lighter",

    food:
      "Ration Pack"

  };


  return (
    labels[key] ||
    "Evidence"
  );
}


/* ============================================================
   MAIN DRAW
   ============================================================ */

function draw() {
if (debugMode) {
  drawLevel3DebugMode();
  return;
}
if (
  gameState !== "play"
) {

  stopCopSiren();
}

if (
  gameState ===
  "goodEnding"
) {

  updateGoodEndingCutscene();

  drawGoodEndingCutscene();

  return;
}

  if (
    gameState === "start"
  ) {

    drawStartScreen();

    return;
  }


  if (
    gameState === "play"
  ) {

    update();
  }


  background(
    7,
    9,
    10
  );


  /* ---------------- WORLD ---------------- */

  push();


  translate(

    -camX,

    -camY

  );


  drawFloorAndWalls();

  drawEvidence();

  drawOfficers();

  drawPlayerSprite();


  pop();


  drawExitGuide();

  drawFlashlightOverlay();


  /* ---------------- UI ---------------- */

drawHUD();

updateTutorialTyping();
updateWifeBannerAnimation();
drawTutorialBanner();


  if (
    gameState === "over"
  ) {

    drawGameOverScreen();
  }


  if (
    gameState === "win"
  ) {

    drawWinScreen();
  }
}


/* ============================================================
   DRAW POLICE FLOOR TILE
   ============================================================ */

function drawPoliceFloorTile(
  x,
  y,
  c,
  r
) {


  /*
  Fallback if image failed to load.
  */

  if (

    !policeFloorImg ||

    !policeFloorImg.width

  ) {

    fill(

      (c + r) % 2 === 0
        ? 27
        : 22,

      (c + r) % 2 === 0
        ? 34
        : 28,

      (c + r) % 2 === 0
        ? 36
        : 30

    );


    noStroke();


    rect(

      x,
      y,

      CELL,
      CELL

    );


    return;
  }


  const sw =
    policeFloorImg.width;


  const sh =
    policeFloorImg.height;


  const sx =

    (
      (
        x % sw
      ) +
      sw
    ) %
    sw;


  const sy =

    (
      (
        y % sh
      ) +
      sh
    ) %
    sh;


  const dw =
    CELL;


  const dh =
    CELL;


  const remW = Math.min(

    dw,

    sw - sx

  );


  const remH = Math.min(

    dh,

    sh - sy

  );


  image(

    policeFloorImg,

    x,
    y,

    remW,
    remH,

    sx,
    sy,

    remW,
    remH

  );


  if (
    remW < dw
  ) {

    image(

      policeFloorImg,

      x + remW,
      y,

      dw - remW,
      remH,

      0,
      sy,

      dw - remW,
      remH

    );
  }


  if (
    remH < dh
  ) {

    image(

      policeFloorImg,

      x,
      y + remH,

      remW,
      dh - remH,

      sx,
      0,

      remW,
      dh - remH

    );
  }


  if (

    remW < dw &&

    remH < dh

  ) {

    image(

      policeFloorImg,

      x + remW,
      y + remH,

      dw - remW,
      dh - remH,

      0,
      0,

      dw - remW,
      dh - remH

    );
  }
}


/* ============================================================
   DRAW FLOOR AND WALLS
   ============================================================ */

function drawFloorAndWalls() {

  const c0 = Math.max(
    0,
    Math.floor(camX / CELL) - 1
  );

  const c1 = Math.min(
    COLS - 1,
    Math.ceil((camX + width) / CELL) + 1
  );

  const r0 = Math.max(
    0,
    Math.floor(camY / CELL) - 1
  );

  const r1 = Math.min(
    ROWS - 1,
    Math.ceil((camY + height) / CELL) + 1
  );


  noStroke();


  /* ============================================================
     DRAW MAZE CELLS
     ============================================================ */

  for (
    let r = r0;
    r <= r1;
    r++
  ) {

    for (
      let c = c0;
      c <= c1;
      c++
    ) {

      const x =
        c * CELL;

      const y =
        r * CELL;

      const v =
        maze[r][c];


      /* ========================================================
         OPEN FLOOR
         ======================================================== */

      if (
        v === 0
      ) {

        drawPoliceFloorTile(
          x,
          y,
          c,
          r
        );


        /* ---------------- ROOM COLOUR TINT ---------------- */

        if (
          roomOf[r] &&
          roomOf[r][c]
        ) {

          const room =
            ROOMS.find(
              rm =>
                rm.name ===
                roomOf[r][c]
            );


          if (
            room
          ) {

            noStroke();

            fill(
              room.r,
              room.g,
              room.b,
              45
            );

            rect(
              x,
              y,
              CELL,
              CELL
            );
          }
        }
      }


      /* ========================================================
         NORMAL SOLID WALL
         ======================================================== */

      else if (
        v === 1
      ) {

        fill(
          43,
          51,
          54
        );

        noStroke();

        rect(
          x,
          y,
          CELL,
          CELL
        );


        stroke(
          18,
          24,
          26
        );

        strokeWeight(
          2
        );

        noFill();

        rect(
          x + 2,
          y + 2,
          CELL - 4,
          CELL - 4
        );

        noStroke();
      }


      /* ========================================================
         REAL USABLE DOOR — GREEN OUTLINE
         ======================================================== */

      else if (
        v === 2
      ) {

        /*
        Draw the floor underneath first.
        When the door is open, the player sees
        the floor instead of a blank square.
        */

        drawPoliceFloorTile(
          x,
          y,
          c,
          r
        );


        /* ---------------- ROOM TINT UNDER DOOR ---------------- */

        if (
          roomOf[r] &&
          roomOf[r][c]
        ) {

          const room =
            ROOMS.find(
              rm =>
                rm.name ===
                roomOf[r][c]
            );


          if (
            room
          ) {

            noStroke();

            fill(
              room.r,
              room.g,
              room.b,
              45
            );

            rect(
              x,
              y,
              CELL,
              CELL
            );
          }
        }


        /* ---------------- CHECK DOOR STATE ---------------- */

        const doorKey =
          c + "," + r;


        const isOpen =
          doorStates.get(
            doorKey
          ) === true;


        push();

        imageMode(
          CORNER
        );


        /* ---------------- OPEN DOOR ---------------- */

        if (
          isOpen
        ) {

          if (
            doorOpenImg &&
            doorOpenImg.width
          ) {

            image(
              doorOpenImg,
              x,
              y,
              CELL,
              CELL
            );

          } else {

            /*
            Fallback if open-door image fails.
            */

            noFill();

            stroke(
              100,
              180,
              120
            );

            strokeWeight(
              2
            );

            rect(
              x + 5,
              y + 5,
              CELL - 10,
              CELL - 10
            );
          }
        }


        /* ---------------- CLOSED DOOR ---------------- */

        else {

          if (
            doorClosedImg &&
            doorClosedImg.width
          ) {

            image(
              doorClosedImg,
              x,
              y,
              CELL,
              CELL
            );

          } else {

            /*
            Fallback if closed-door image fails.
            */

            noStroke();

            fill(
              75,
              58,
              44
            );

            rect(
              x + 4,
              y + 2,
              CELL - 8,
              CELL - 4
            );


            fill(
              190,
              160,
              100
            );

            ellipse(
              x + CELL - 11,
              y + CELL / 2,
              4,
              4
            );
          }
        }


        /* ---------------- GREEN OUTLINE ---------------- */


        noStroke();

        pop();
      }


      /* ========================================================
         FAKE / LOCKED DOOR — RED OUTLINE
         ======================================================== */

      else if (
        v === 3
      ) {

        /*
        Fake doors look like doors but never open.

        They remain solid through cellBlocks().
        */

        drawPoliceFloorTile(
          x,
          y,
          c,
          r
        );


        /* ---------------- ROOM TINT UNDER FAKE DOOR ---------------- */

        if (
          roomOf[r] &&
          roomOf[r][c]
        ) {

          const room =
            ROOMS.find(
              rm =>
                rm.name ===
                roomOf[r][c]
            );


          if (
            room
          ) {

            noStroke();

            fill(
              room.r,
              room.g,
              room.b,
              45
            );

            rect(
              x,
              y,
              CELL,
              CELL
            );
          }
        }


        push();

        imageMode(
          CORNER
        );


        /* ---------------- DRAW CLOSED DOOR ---------------- */

        if (
          doorClosedImg &&
          doorClosedImg.width
        ) {

          image(
            doorClosedImg,
            x,
            y,
            CELL,
            CELL
          );

        } else {

          /*
          Fallback fake-door drawing.
          */

          noStroke();

          fill(
            75,
            58,
            44
          );

          rect(
            x + 4,
            y + 2,
            CELL - 8,
            CELL - 4
          );


          fill(
            190,
            160,
            100
          );

          ellipse(
            x + CELL - 11,
            y + CELL / 2,
            4,
            4
          );
        }


        /* ---------------- RED OUTLINE ---------------- */

        noStroke();

        pop();
      }
    }
  }


  /* ============================================================
     ROOM LABELS
     ============================================================ */

  textFont(
    "monospace"
  );

  textSize(
    11
  );

  textAlign(
    CENTER
  );

  fill(
    180,
    200,
    200,
    90
  );


  for (
    const room of ROOMS
  ) {

    /*
    Hide the secret archive label.
    */

    if (
      room ===
      ARCHIVE_ROOM
    ) {

      continue;
    }


    const cx =
      (
        room.x +
        room.w / 2
      ) *
      CELL;


    const cy =
      room.y *
      CELL -
      6;


    /*
    Only draw labels if they're reasonably close
    to the visible camera area.
    */

    if (
      cx > camX - 60 &&
      cx < camX + width + 60 &&
      cy > camY - 60 &&
      cy < camY + height + 60
    ) {

      text(
        room.name,
        cx,
        cy
      );
    }
  }
}



/* ============================================================
   DRAW OFFICERS
   ============================================================ */

function drawOfficers() {


  imageMode(
    CENTER
  );


  for (
    const o of officers
  ) {


    image(

      copImage,

      o.x,
      o.y,

      o.r * 4,
      o.r * 4

    );
  }
}


/* ============================================================
   DRAW PLAYER
   ============================================================ */

function drawPlayerSprite() {


  const flip =

    player.direction.x < 0 &&

    player.row === 1;


  push();


  imageMode(
    CENTER
  );


  if (
    flip
  ) {


    translate(

      player.x,

      player.y

    );


    scale(
      -1,
      1
    );


    image(

      playerSheet,

      0,
      0,

      FRAME_W *
      PLAYER_SCALE,

      FRAME_H *
      PLAYER_SCALE,

      player.currentFrame *
      FRAME_W,

      player.row *
      FRAME_H,

      FRAME_W,
      FRAME_H

    );

  } else {


    image(

      playerSheet,

      player.x,
      player.y,

      FRAME_W *
      PLAYER_SCALE,

      FRAME_H *
      PLAYER_SCALE,

      player.currentFrame *
      FRAME_W,

      player.row *
      FRAME_H,

      FRAME_W,
      FRAME_H

    );
  }


  pop();
}


/* ============================================================
   FLASHLIGHT
   ============================================================ */

function drawFlashlightOverlay() {


  /*
  Convert player's WORLD coordinates into SCREEN coordinates.
  */

  const sx =

    player.x -
    camX;


  const sy =

    player.y -
    camY;


  const aim = Math.atan2(

    player.direction.y,

    player.direction.x

  );


  /*
  Remove whatever was drawn to the darkness layer
  last frame.
  */

  darknessLayer.clear();


  const ctx =

    darknessLayer.drawingContext;


  ctx.save();


  /* ============================================================
     DARKNESS
     ============================================================ */


  ctx.globalCompositeOperation =
    "source-over";


  /*
  Change 0.78 to alter the overall darkness.

  0.65 = lighter
  0.78 = current
  0.85 = darker
  0.92 = extremely dark
  */

  ctx.fillStyle =
    "rgba(0, 0, 0, 0.78)";


  ctx.fillRect(

    0,
    0,

    width,
    height

  );


  /* ============================================================
     REMOVE DARKNESS AROUND PLAYER
     ============================================================ */


  ctx.globalCompositeOperation =
    "destination-out";


  /*
  CIRCULAR LIGHT AROUND PLAYER

  This means the player itself never gets swallowed
  by the black overlay.
  */


  const glowRadius = 145;


  const glow =

    ctx.createRadialGradient(

      sx,
      sy,

      10,

      sx,
      sy,

      glowRadius

    );


  /*
  Alpha 1 means completely remove darkness.
  Alpha 0 means don't remove it.
  */


  glow.addColorStop(

    0,

    "rgba(0,0,0,1)"

  );


  glow.addColorStop(

    0.35,

    "rgba(0,0,0,0.95)"

  );


  glow.addColorStop(

    0.7,

    "rgba(0,0,0,0.50)"

  );


  glow.addColorStop(

    1,

    "rgba(0,0,0,0)"

  );


  ctx.fillStyle =
    glow;


  ctx.beginPath();


  ctx.arc(

    sx,
    sy,

    glowRadius,

    0,

    Math.PI * 2

  );


  ctx.fill();


  /* ============================================================
     FORWARD CONE
     ============================================================ */


  const coneLength = 245;


  const coneHalfAngle = 0.55;


  const steps = 30;


  ctx.beginPath();


  ctx.moveTo(

    sx,
    sy

  );


  for (
    let i = 0;
    i <= steps;
    i++
  ) {


    const a =

      (
        aim -
        coneHalfAngle
      ) +

      (
        i /
        steps
      ) *

      (
        coneHalfAngle *
        2
      );


    ctx.lineTo(

      sx +
      Math.cos(a) *
      coneLength,

      sy +
      Math.sin(a) *
      coneLength

    );
  }


  ctx.closePath();


  const coneGlow =

    ctx.createRadialGradient(

      sx,
      sy,

      20,

      sx,
      sy,

      coneLength

    );


  coneGlow.addColorStop(

    0,

    "rgba(0,0,0,1)"

  );


  coneGlow.addColorStop(

    0.45,

    "rgba(0,0,0,0.82)"

  );


  coneGlow.addColorStop(

    0.75,

    "rgba(0,0,0,0.45)"

  );


  coneGlow.addColorStop(

    1,

    "rgba(0,0,0,0)"

  );


  ctx.fillStyle =
    coneGlow;


  ctx.fill();


  ctx.restore();


  /* ============================================================
     DRAW DARKNESS OVER WORLD
     ============================================================ */


  push();


  imageMode(
    CORNER
  );


  image(

    darknessLayer,

    0,
    0

  );


  pop();


  /* ============================================================
     SMALL WARM LIGHT AROUND PLAYER
     ============================================================ */


  /*
  This does NOT make the whole flashlight yellow.

  It's just a tiny colour tint close to the character.
  */


  noStroke();


  fill(
    255,
    245,
    190,
    12
  );


  ellipse(

    sx,
    sy,

    170,
    170

  );


  /* ============================================================
     DAMAGE FLASH
     ============================================================ */


  if (
    flashAlpha > 0
  ) {


    noStroke();


    fill(

      180,
      40,
      40,

      flashAlpha

    );


    rect(

      0,
      0,

      width,
      height

    );
  }
}


/* ============================================================
   HUD
   ============================================================ */

function drawHUD() {


  noStroke();


  fill(
    255
  );


  textFont(
    "monospace"
  );


  textAlign(
    LEFT
  );


  textSize(
    14
  );


  text(

    "6TH DISTRICT PRECINCT — NIGHT SHIFT",

    16,

    24

  );


  text(

    "EVIDENCE " +
    evidenceCount +
    " / " +
    EVIDENCE_NEEDED,

    16,

    46

  );


  text(

    "WASD / ARROWS: move   SPACE: inspect / collect",

    16,

    height - 16

  );


  /* ============================================================
     SANITY BAR
     ============================================================ */


  fill(
    20
  );


  rect(

    16,
    56,

    220,
    10

  );


  fill(

    176,
    60,
    60

  );


  rect(

    16,
    56,

    220 *

    constrain(

      sanity,

      0,

      100

    ) /

    100,

    10

  );


  noFill();


  stroke(
    70,
    90,
    90
  );


  rect(

    16,
    56,

    220,
    10

  );


  noStroke();


  /* ============================================================
     INTERACTION PROMPT
     ============================================================ */


  if (
    promptText
  ) {


    fill(
      232,
      224,
      192
    );


    textAlign(
      CENTER
    );


    textSize(
      15
    );


    text(

      promptText,

      width / 2,

      height - 60

    );
  }
}


function drawStartScreen() {

  background(
    5,
    7,
    8
  );


  /* ============================================================
     CENTRED INSTRUCTION PANEL
     ============================================================ */

  const panelW =
    Math.min(
      760,
      width - 60
    );

  const panelH =
    Math.min(
      500,
      height - 60
    );

  const panelX =
    width / 2 -
    panelW / 2;

  const panelY =
    height / 2 -
    panelH / 2;


  fill(
    12,
    18,
    19,
    245
  );

  stroke(
    220,
    230,
    230
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
     LEVEL TITLE
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
    "LEVEL 3 — PRECINCT",
    width / 2,
    panelY + 65
  );


  /* ============================================================
     STORY INTRO
     ============================================================ */

  textStyle(NORMAL);

  fill(
    210,
    220,
    220
  );

  textSize(18);

  text(
    "You returned to the station after hours to find the files that were never logged.",
    panelX + 55,
    panelY + 115,
    panelW - 110,
    60
  );


  /* ============================================================
     OBJECTIVES
     ============================================================ */

  fill(255);

  textStyle(BOLD);

  textSize(22);

  text(
    "YOUR OBJECTIVE",
    width / 2,
    panelY + 190
  );


  textStyle(NORMAL);

  textSize(19);

  fill(
    235
  );

  text(
    "Collect all 5 objects hidden throughout the station.",
    width / 2,
    panelY + 235
  );

  text(
    "Press SPACE to collect items and test nearby doors.",
    width / 2,
    panelY + 275
  );

  text(
    "Some doors are real. Others are hallucinations.",
    width / 2,
    panelY + 315
  );

  text(
    "Avoid the police. You only have 3 strikes.",
    width / 2,
    panelY + 355
  );


  /* ============================================================
     MOVEMENT CONTROLS
     ============================================================ */

  fill(
    190,
    205,
    205
  );

  textSize(16);

  text(
    "ARROW KEYS — MOVE",
    width / 2,
    panelY + 400
  );


  /* ============================================================
     START PROMPT
     ============================================================ */

  const pulseAlpha =
    map(
      sin(frameCount * 0.08),
      -1,
      1,
      130,
      255
    );

  fill(
    255,
    pulseAlpha
  );

  textStyle(BOLD);

  textSize(22);

  text(
    "Press SPACE or ENTER to begin",
    width / 2,
    panelY + panelH - 45
  );

  textStyle(NORMAL);
}
/* ============================================================
   WIN SCREEN
   ============================================================ */

function drawWinScreen() {


  fill(
    0,
    0,
    0,
    210
  );


  rect(

    0,
    0,

    width,
    height

  );


  fill(
    156,
    194,
    168
  );


  textAlign(
    CENTER
  );


  textFont(
    "monospace"
  );


  textSize(
    30
  );


  text(

    "THE ARCHIVE REMEMBERS",

    width / 2,

    height / 2 - 40

  );


  fill(
    180
  );


  textSize(
    14
  );


  text(

    "You found the room they built over. The evidence matches.",

    width / 2,

    height / 2

  );


  fill(
    220
  );


  textSize(
    16
  );


  text(

    "Press R to return to the hallway",

    width / 2,

    height / 2 + 50

  );
}

function toggleNearbyDoor() {
  const playerCol = Math.floor(player.x / CELL);
  const playerRow = Math.floor(player.y / CELL);

  let closestDoor = null;
  let closestDistance = Infinity;

  // Search the cells surrounding the player
  for (
    let r = playerRow - 1;
    r <= playerRow + 1;
    r++
  ) {
    for (
      let c = playerCol - 1;
      c <= playerCol + 1;
      c++
    ) {
      // Ignore cells outside the maze
      if (
        c < 0 ||
        c >= COLS ||
        r < 0 ||
        r >= ROWS
      ) {
        continue;
      }

      // Type 2 = green door
      // Type 3 = red locked door
      if (
        maze[r][c] !== 2 &&
        maze[r][c] !== 3
      ) {
        continue;
      }

      const doorPos = gridToWorld(c, r);

      const d = dist(
        player.x,
        player.y,
        doorPos.x,
        doorPos.y
      );

      if (d < closestDistance) {
        closestDistance = d;

        closestDoor = {
          c: c,
          r: r,
          type: maze[r][c]
        };
      }
    }
  }

  // No door is close enough
  if (
    !closestDoor ||
    closestDistance >= CELL * 1.6
  ) {
    return;
  }

  // Red locked door
 if (closestDoor.type === 3) {

  const fakeDoorKey =
    closestDoor.c + "," + closestDoor.r;

  fakeDoorFlashKey =
    fakeDoorKey;

  fakeDoorFlashTimer =
    FAKE_DOOR_FLASH_TIME;

  promptText =
    "The door was never real.";

  doorMessageTimer =
    90;

  /* ============================================================
     SMALL SANITY PENALTY
     ============================================================ */

  sanity =
    Math.max(
      0,
      sanity - FAKE_DOOR_DAMAGE
    );

  flashAlpha =
    70;

  /* ============================================================
     PUSH PLAYER AWAY FROM THE FAKE DOOR
     ============================================================ */

  const doorPos =
    gridToWorld(
      closestDoor.c,
      closestDoor.r
    );

  let pushX =
    player.x - doorPos.x;

  let pushY =
    player.y - doorPos.y;

  const pushLength =
    Math.hypot(
      pushX,
      pushY
    );

  if (pushLength > 0) {

    pushX /= pushLength;
    pushY /= pushLength;

    const targetX =
      player.x +
      pushX *
      FAKE_DOOR_BOUNCE;

    const targetY =
      player.y +
      pushY *
      FAKE_DOOR_BOUNCE;

    if (
      canMoveTo(
        targetX,
        player.y,
        player.r
      )
    ) {
      player.x = targetX;
    }

    if (
      canMoveTo(
        player.x,
        targetY,
        player.r
      )
    ) {
      player.y = targetY;
    }
  }

  if (sanity <= 0) {
    gameState = "over";
  }

  return;
}

  // Green functional door
  const doorKey =
    closestDoor.c + "," + closestDoor.r;

  const currentlyOpen =
    doorStates.get(doorKey) === true;

  // Reverse the current door state
  doorStates.set(
    doorKey,
    !currentlyOpen
  );

  if (currentlyOpen) {
    // Door was open, so it is now closing
    if (
      doorCloseSound &&
      doorCloseSound.isLoaded()
    ) {
      doorCloseSound.stop();
      doorCloseSound.play();
    }
  } else {
    // Door was closed, so it is now opening
    if (
      doorOpenSound &&
      doorOpenSound.isLoaded()
    ) {
      doorOpenSound.stop();
      doorOpenSound.play();
    }

    // Opening the door pushes nearby cops
    knockBackNearbyOfficers(
      closestDoor.c,
      closestDoor.r
    );
  }
}

function getNearbyDoor() {

  const playerCol =
    Math.floor(
      player.x / CELL
    );


  const playerRow =
    Math.floor(
      player.y / CELL
    );


  let closest = null;

  let closestDistance =
    Infinity;


  for (
    let r = playerRow - 1;
    r <= playerRow + 1;
    r++
  ) {

    for (
      let c = playerCol - 1;
      c <= playerCol + 1;
      c++
    ) {

      if (
        c < 0 ||
        c >= COLS ||
        r < 0 ||
        r >= ROWS
      ) {

        continue;
      }


      // REAL OR FAKE DOOR
      if (
        maze[r][c] !== 2 &&
        maze[r][c] !== 3
      ) {

        continue;
      }


      const w =
        gridToWorld(
          c,
          r
        );


      const d =
        dist(
          player.x,
          player.y,
          w.x,
          w.y
        );


      if (
        d <
        closestDistance
      ) {

        closestDistance =
          d;


        closest = {

          c: c,

          r: r,

          type:
            maze[r][c]

        };
      }
    }
  }


  if (
    closestDistance <
    CELL * 1.6
  ) {

    return closest;
  }


  return null;
}

function knockBackNearbyOfficers(
  doorCol,
  doorRow
) {

  const doorPos =
    gridToWorld(
      doorCol,
      doorRow
    );


  /*
  How close the cop needs to be
  for the door to hit them.
  */

  const KNOCK_RANGE = 90;


  /*
  How far they get thrown.
  */

  const KNOCK_FORCE = 65;


  for (
    const o of officers
  ) {

    const dx =
      o.x -
      doorPos.x;


    const dy =
      o.y -
      doorPos.y;


    const d =
      Math.hypot(
        dx,
        dy
      );


    if (
      d > 0 &&
      d <
      KNOCK_RANGE
    ) {

      const dirX =
        dx / d;


      const dirY =
        dy / d;


      /*
      Move gradually instead of teleporting
      through a wall.
      */

      const steps = 8;


      for (
        let i = 0;
        i < steps;
        i++
      ) {

        const moveX =

          dirX *
          (
            KNOCK_FORCE /
            steps
          );


        const moveY =

          dirY *
          (
            KNOCK_FORCE /
            steps
          );


        if (
          canMoveTo(
            o.x + moveX,
            o.y,
            o.r
          )
        ) {

          o.x += moveX;
        }


        if (
          canMoveTo(
            o.x,
            o.y + moveY,
            o.r
          )
        ) {

          o.y += moveY;
        }
      }


      /*
      Make the cop wander briefly after getting hit.
      */

      o.dir =
        atan2(
          dirY,
          dirX
        );


      o.timer = 60;
    }
  }
}

function spawnMovingEvidence() {

  movingEvidence = [];

  movingEvidenceCollected = 0;


  for (
    let i = 0;
    i <
    MOVING_EVIDENCE_NEEDED;
    i++
  ) {

    const spot =
      nearestOpenCell(
        random(WORLD_W),
        random(WORLD_H)
      );


    movingEvidence.push({

      x: spot.x,

      y: spot.y,

      r: 9,

      vx: 0,

      vy: 0,

      hopTimer:
        Math.floor(
          random(
            25,
            65
          )
        ),

      collected: false

    });
  }
}

function updateMovingEvidence() {

  for (
    const e of
    movingEvidence
  ) {

    if (
      e.collected
    ) {

      continue;
    }


    e.hopTimer--;


    if (
      e.hopTimer <= 0
    ) {

      /*
      Pick a random cardinal direction.

      This fits the maze better than
      unrestricted diagonal movement.
      */

      const dirs = [

        [1, 0],

        [-1, 0],

        [0, 1],

        [0, -1]

      ];


      const d =
        random(dirs);


      e.vx =
        d[0] *
        2.2;


      e.vy =
        d[1] *
        2.2;


      e.hopTimer =
        Math.floor(
          random(
            30,
            75
          )
        );
    }


    const nx =
      e.x +
      e.vx;


    const ny =
      e.y +
      e.vy;


    if (
      canMoveTo(
        nx,
        e.y,
        e.r
      )
    ) {

      e.x = nx;

    } else {

      e.vx *= -1;
    }


    if (
      canMoveTo(
        e.x,
        ny,
        e.r
      )
    ) {

      e.y = ny;

    } else {

      e.vy *= -1;
    }
  }
}

function checkMovingEvidencePickup() {

  for (
    const e of
    movingEvidence
  ) {

    if (
      e.collected
    ) {

      continue;
    }


    if (
      dist(
        player.x,
        player.y,
        e.x,
        e.y
      ) <
      player.r +
      e.r +
      10
    ) {

      e.collected = true;

      movingEvidenceCollected++;
    }
  }
}

function drawEvidence() {

  imageMode(CENTER);


  /* ============================================================
     PHASE 1 — NORMAL ITEMS
     ============================================================ */

  if (!evidencePhase) {

    for (
      const it of
      evidenceItems
    ) {

      if (
        it.collected
      ) {
        continue;
      }


      const near =
        dist(
          it.x,
          it.y,
          player.x,
          player.y
        ) < 110;


      push();


      /* ============================================================
         NEARBY ITEM GLOW
         ============================================================ */

      if (near) {

        drawingContext.shadowBlur =
          20;

        drawingContext.shadowColor =
          "rgba(230,210,140,0.9)";
      }


      /* ============================================================
         ITEM IMAGE
         ============================================================ */

      image(
        it.image,
        it.x,
        it.y,
        26,
        26
      );


      drawingContext.shadowBlur = 0;


      /* ============================================================
         WHITE LOOT SPARKLE
         ============================================================ */

      drawLootSparkle(
        it.x,
        it.y - 22,
        10
      );


      pop();
    }
  }


  /* ============================================================
     PHASE 2 — MOVING EVIDENCE
     ============================================================ */

  if (evidencePhase) {

    for (
      const e of
      movingEvidence
    ) {

      if (
        e.collected
      ) {
        continue;
      }


      push();


      const bounce =
        Math.sin(
          frameCount * 0.15 +
          e.x
        ) * 5;


      drawingContext.shadowBlur =
        18;

      drawingContext.shadowColor =
        "rgba(255,230,130,0.9)";


      if (
        itemImages.notes
      ) {

        image(
          itemImages.notes,
          e.x,
          e.y + bounce,
          30,
          30
        );

      } else {

        noStroke();

        fill(255);

        ellipse(
          e.x,
          e.y + bounce,
          18,
          18
        );
      }


      drawingContext.shadowBlur = 0;


      /* ============================================================
         SPARKLE FOR MOVING EVIDENCE
         ============================================================ */

      drawLootSparkle(
        e.x,
        e.y + bounce - 24,
        11
      );


      pop();
    }
  }


  /* ============================================================
     EXIT
     ============================================================ */

  if (
    exitPoint
  ) {

    push();


    noFill();


    if (
      exitUnlocked
    ) {

      stroke(
        80,
        230,
        120
      );

      strokeWeight(4);

    } else {

      stroke(
        100,
        110,
        110
      );

      strokeWeight(2);
    }


    ellipse(
      exitPoint.x,
      exitPoint.y,
      48,
      48
    );


    noStroke();


    fill(230);

    textAlign(CENTER);

    textSize(10);


    text(
      exitUnlocked
        ? "EXIT"
        : "ENTRY",

      exitPoint.x,

      exitPoint.y - 32
    );


    pop();
  }
}

function drawExitGuide() {

  // Only show the arrow after the final evidence is collected
  // and the exit has been unlocked.
  if (
    !exitUnlocked ||
    !exitPoint
  ) {
    return;
  }

  // Direction from the player toward the exit.
  const dx =
    exitPoint.x -
    player.x;

  const dy =
    exitPoint.y -
    player.y;

  const distanceToExit =
    Math.hypot(
      dx,
      dy
    );

  // Hide the arrow when the player is already at the exit.
  if (
    distanceToExit < 45
  ) {
    return;
  }

  const angle =
    Math.atan2(
      dy,
      dx
    );

  /*
  The Level 3 arrow is drawn in screen space.

  Because drawExitGuide() is called after pop(),
  the player's screen position is:
  player world position minus the camera position.
  */

  const playerScreenX =
    player.x -
    camX;

  const playerScreenY =
    player.y -
    camY;

  // Keep the arrow close to the player, like Levels 1 and 2.
  const arrowDistance = 110;

  const arrowX =
    playerScreenX +
    Math.cos(angle) *
    arrowDistance;

  const arrowY =
    playerScreenY +
    Math.sin(angle) *
    arrowDistance;

  // Same pulsing effect used by Levels 1 and 2.
  const pulse =
    map(
      Math.sin(frameCount * 0.12),
      -1,
      1,
      0.9,
      1.25
    );

  push();

  translate(
    arrowX,
    arrowY
  );

  rotate(angle);

  scale(pulse);

  noStroke();

  /* ============================================================
     SOFT GLOW
     ============================================================ */

  fill(
    120,
    255,
    150,
    70
  );

  ellipse(
    0,
    0,
    90,
    90
  );

  /* ============================================================
     CHUNKY ARROW SHAFT
     ============================================================ */

  fill(
    120,
    255,
    150,
    230
  );

  rect(
    -42,
    -8,
    36,
    16,
    3
  );

  /* ============================================================
     CHUNKY ARROWHEAD
     ============================================================ */

  triangle(
    4,
    -22,

    40,
    0,

    4,
    22
  );

  pop();
}

function drawTutorialBanner() {

  if (!tutorialPaused) {
    return;
  }

  /* ============================================================
     DARKEN BACKGROUND
     ============================================================ */

  push();

  noStroke();

  fill(
    0,
    0,
    0,
    180
  );

  rect(
    0,
    0,
    width,
    height
  );

  /* ============================================================
     CENTRED BANNER
     ============================================================ */

  const bannerW =
    Math.min(
      720,
      width - 60
    );

  const bannerH =
    Math.min(
      520,
      height - 60
    );

  const bannerX =
    width / 2 -
    bannerW / 2;

  const bannerY =
    height / 2 -
    bannerH / 2;

  fill(
    18,
    22,
    25,
    245
  );

  stroke(
    180,
    200,
    200
  );

  strokeWeight(2);

  rect(
    bannerX,
    bannerY,
    bannerW,
    bannerH,
    12
  );

  /* ============================================================
     ANIMATED WIFE SPRITE
     ============================================================ */

  const portraitSize =
    Math.min(
      260,
      bannerH * 0.5
    );

  const portraitX =
    width / 2;

  const portraitY =
    bannerY +
    portraitSize / 2 +
    35;

  if (
    deadWifeImg &&
    deadWifeImg.width
  ) {

    push();

    imageMode(CENTER);

    drawingContext.shadowBlur =
      24;

    drawingContext.shadowColor =
      "rgba(210,225,255,0.75)";

    tint(
      220,
      235,
      255,
      230
    );

    image(
      deadWifeImg,

      portraitX,
      portraitY,

      portraitSize,
      portraitSize,

      wifeBannerFrame *
        WIFE_FRAME_W,

      0,

      WIFE_FRAME_W,
      WIFE_FRAME_H
    );

    noTint();

    drawingContext.shadowBlur = 0;

    pop();
  }

  /* ============================================================
     SPEAKER NAME
     ============================================================ */

  noStroke();

  fill(
    190,
    210,
    210
  );

  textFont(
    "monospace"
  );

  textAlign(
    CENTER,
    CENTER
  );

  textSize(15);

  text(
    "WIFE",
    width / 2,
    portraitY +
      portraitSize / 2 +
      18
  );

  /* ============================================================
     TYPEWRITER MESSAGE UNDERNEATH
     ============================================================ */

  const textBoxX =
    bannerX + 45;

  const textBoxY =
    portraitY +
    portraitSize / 2 +
    45;

  const textBoxW =
    bannerW - 90;

  const textBoxH =
    bannerY +
    bannerH -
    textBoxY -
    55;

  fill(240);

  textSize(21);

  textAlign(
    CENTER,
    TOP
  );

  text(
    displayedTutorialText,

    textBoxX,
    textBoxY,

    textBoxW,
    textBoxH
  );

  /* ============================================================
     CONTINUE MESSAGE
     ============================================================ */

  if (
    tutorialCharIndex >=
    tutorialMessage.length
  ) {

    fill(
      170,
      190,
      190
    );

    textSize(22);

    textAlign(
      CENTER,
      CENTER
    );

    text(
      "SPACE / ENTER",

      width / 2,

      bannerY +
      bannerH -
      22
    );
  }

  pop();
}

function updateTutorialTyping() {

  if (!tutorialPaused) {
    return;
  }

  if (
    tutorialCharIndex >=
    tutorialMessage.length
  ) {
    return;
  }

  tutorialTypeTimer++;

  if (
    tutorialTypeTimer >=
    TUTORIAL_TYPE_SPEED
  ) {

    tutorialTypeTimer = 0;

    displayedTutorialText +=
      tutorialMessage[
        tutorialCharIndex
      ];

    tutorialCharIndex++;
  }
}

function updateWifeBannerAnimation() {

  if (!tutorialPaused) {
    return;
  }

  wifeBannerFrameTimer++;

  if (
    wifeBannerFrameTimer >=
    WIFE_BANNER_ANIM_SPEED
  ) {

    wifeBannerFrameTimer = 0;

    wifeBannerFrame =
      (
        wifeBannerFrame + 1
      ) % WIFE_FRAME_COUNT;
  }
}

function drawLootSparkle(x, y, size = 10) {

  const pulse =
    map(
      sin(frameCount * 0.12),
      -1,
      1,
      0.65,
      1.2
    );

  const alpha =
    map(
      sin(frameCount * 0.12),
      -1,
      1,
      120,
      255
    );

  push();

  translate(x, y);

  scale(pulse);

  drawingContext.shadowBlur = 14;
  drawingContext.shadowColor = "white";

  stroke(255, alpha);
  strokeWeight(2);

  line(
    0,
    -size,
    0,
    size
  );

  line(
    -size,
    0,
    size,
    0
  );

  strokeWeight(1);

  line(
    -size * 0.55,
    -size * 0.55,
    size * 0.55,
    size * 0.55
  );

  line(
    -size * 0.55,
    size * 0.55,
    size * 0.55,
    -size * 0.55
  );

  noStroke();
  fill(255, alpha);

  ellipse(
    0,
    0,
    4,
    4
  );

  drawingContext.shadowBlur = 0;

  pop();
}



function startGoodEndingCutscene() {

  gameState =
    "goodEnding";

  goodEndingSceneIndex =
    0;

  goodEndingFadeAlpha =
    255;

  goodEndingPhase =
    "fadeIn";

  goodEndingPhaseTimer =
    0;

  goodEndingDisplayedText =
    "";

  goodEndingCharacterIndex =
    0;

  goodEndingTypingTimer =
    0;
}

function updateGoodEndingCutscene() {

  const scene =
    goodEndingScenes[
      goodEndingSceneIndex
    ];

  if (!scene) {
    return;
  }


  /* ============================================================
     FADE IMAGE IN
     ============================================================ */

  if (
    goodEndingPhase ===
    "fadeIn"
  ) {

    goodEndingFadeAlpha -=
      GOOD_ENDING_FADE_SPEED;

    if (
      goodEndingFadeAlpha <= 0
    ) {

      goodEndingFadeAlpha = 0;

      goodEndingPhase =
        "typing";

      goodEndingTypingTimer =
        0;
    }

    return;
  }


  /* ============================================================
     TYPE DIALOGUE
     ============================================================ */

  if (
    goodEndingPhase ===
    "typing"
  ) {

    goodEndingTypingTimer++;

    if (
      goodEndingTypingTimer >=
      GOOD_ENDING_TYPE_SPEED
    ) {

      goodEndingTypingTimer = 0;

      if (
        goodEndingCharacterIndex <
        scene.text.length
      ) {

        goodEndingDisplayedText +=
          scene.text[
            goodEndingCharacterIndex
          ];

        goodEndingCharacterIndex++;

      } else {

        goodEndingPhase =
          "hold";

        goodEndingPhaseTimer =
          0;
      }
    }

    return;
  }


  /* ============================================================
     HOLD FINISHED SCENE
     ============================================================ */

  if (
    goodEndingPhase ===
    "hold"
  ) {

    goodEndingPhaseTimer++;

    if (
      goodEndingPhaseTimer >=
      GOOD_ENDING_HOLD_TIME
    ) {

      goodEndingPhase =
        "fadeOut";

      goodEndingPhaseTimer =
        0;
    }

    return;
  }


  /* ============================================================
     FADE IMAGE OUT
     ============================================================ */

  if (
    goodEndingPhase ===
    "fadeOut"
  ) {

    goodEndingFadeAlpha +=
      GOOD_ENDING_FADE_SPEED;

    if (
      goodEndingFadeAlpha >= 255
    ) {

      goodEndingFadeAlpha =
        255;

      goodEndingSceneIndex++;

      /*
      End the slideshow after the sixth image.
      */

     if (
  goodEndingSceneIndex >=
  goodEndingScenes.length
) {

  window.location.href =
    "./index.html";

  return;
}


      /*
      Reset the typewriter for the next scene.
      */

      goodEndingDisplayedText =
        "";

      goodEndingCharacterIndex =
        0;

      goodEndingTypingTimer =
        0;

      goodEndingPhaseTimer =
        0;

      goodEndingPhase =
        "fadeIn";
    }
  }
}

function drawGoodEndingCutscene() {

  const scene =
    goodEndingScenes[
      goodEndingSceneIndex
    ];

  if (
    !scene ||
    !scene.image
  ) {
    return;
  }


  background(0);


  /* ============================================================
     SCALE IMAGE WITHOUT STRETCHING
     ============================================================ */

  const imageScale =
    Math.max(
      width /
        scene.image.width,

      height /
        scene.image.height
    );

  const drawWidth =
    scene.image.width *
    imageScale;

  const drawHeight =
    scene.image.height *
    imageScale;


  imageMode(CENTER);

  image(
    scene.image,

    width / 2,
    height / 2,

    drawWidth,
    drawHeight
  );


  /* ============================================================
     DARK TEXT AREA
     ============================================================ */

  const panelHeight =
    170;

  noStroke();

  fill(
    0,
    0,
    0,
    195
  );

  rect(
    0,
    height - panelHeight,
    width,
    panelHeight
  );


  /* ============================================================
     TYPEWRITER DIALOGUE
     ============================================================ */

  fill(255);

  textFont(
    "monospace"
  );

  textAlign(
    CENTER,
    CENTER
  );

  textSize(24);

  text(
    goodEndingDisplayedText,

    70,
    height -
      panelHeight +
      25,

    width - 140,
    panelHeight - 50
  );


  /* ============================================================
     CONTINUE INDICATOR
     ============================================================ */

  if (
    goodEndingPhase ===
      "hold"
  ) {

    fill(
      220
    );

    textSize(13);

    textAlign(
      RIGHT,
      BOTTOM
    );

    text(
      "SPACE / ENTER",

      width - 30,
      height - 20
    );
  }


  /* ============================================================
     BLACK FADE OVER EVERYTHING
     ============================================================ */

  noStroke();

  fill(
    0,
    goodEndingFadeAlpha
  );

  rect(
    0,
    0,
    width,
    height
  );
}

function startBackgroundMusic() {

  if (musicStarted) {
    return;
  }

  if (
    !bgMusic ||
    !bgMusic.isLoaded()
  ) {
    return;
  }

  musicStarted = true;

  bgMusic.setVolume(
    BG_MUSIC_VOLUME
  );

  bgMusic.loop();
}

function updateCopSiren() {

  if (
    !sirenSound ||
    !sirenSound.isLoaded() ||
    !player
  ) {
    return;
  }

  let nearestDistance =
    Infinity;


  /* ============================================================
     FIND THE NEAREST COP
     ============================================================ */

  for (const officer of officers) {

    const officerDistance =
      dist(
        player.x,
        player.y,
        officer.x,
        officer.y
      );

    if (
      officerDistance <
      nearestDistance
    ) {

      nearestDistance =
        officerDistance;
    }
  }


  /* ============================================================
     CALCULATE TARGET VOLUME
     ============================================================ */

  let targetVolume = 0;

  if (
    nearestDistance <
    SIREN_TRIGGER_DISTANCE
  ) {

    targetVolume =
      map(
        nearestDistance,
        0,
        SIREN_TRIGGER_DISTANCE,
        SIREN_MAX_VOLUME,
        0
      );

    targetVolume =
      constrain(
        targetVolume,
        0,
        SIREN_MAX_VOLUME
      );
  }


  /* ============================================================
     SMOOTHLY FADE TOWARD TARGET
     ============================================================ */

  sirenVolume =
    lerp(
      sirenVolume,
      targetVolume,
      SIREN_FADE_SPEED
    );


  /* ============================================================
     PLAY OR STOP AUDIO
     ============================================================ */

  if (
    sirenVolume >
    SIREN_MIN_AUDIBLE
  ) {

    if (
      !sirenSound.isPlaying()
    ) {

      sirenSound.loop();
    }

    sirenSound.setVolume(
      sirenVolume
    );

  } else {

    sirenVolume = 0;

    if (
      sirenSound.isPlaying()
    ) {

      sirenSound.stop();
    }
  }
}

function stopCopSiren() {

  sirenVolume = 0;

  if (
    sirenSound &&
    sirenSound.isPlaying()
  ) {

    sirenSound.stop();
  }
}