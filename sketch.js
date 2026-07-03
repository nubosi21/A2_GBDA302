// =====================
// VARIABLES
// =====================
let astronautX = 150;
let astronautY = 400;
let speed = 2; // EDIT 6: gives astronaut lower gravity feel

// Obstacles array — each has x, y, w, h
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 120; // frames between spawns
let obstaclesPerWave = 1;
let nextObstacleIncreaseAt = 400;

let airSupply = 100;
let distance = 1500;
const startingDistance = distance;
let distanceBarDisplay = 0;
const DISTANCE_DRAIN_PER_SECOND = 30;

let gameSpeed = 5;
let groundOffset = 0;

let stars = [];
let airPulses = [];
let lastAirDrain = 0;

let blinkFramesLeft = 0;
const BLINK_TOGGLE_EVERY = 4; // frames per on/off switch (higher = slower blink)
const BLINK_TOGGLES = 4; // 4 toggles = 2 full blinks
let hitCooldownFrames = 0;

// Game states: "tutorial", "playing", "win", "lose"
let gameState = "tutorial";
let tutorialPage = 0;
const TUTORIAL_PAGES = 4;

//Sound
let bgMusic;
let hitSound;

// Obstacle Y positions (3 heights): ground, mid, high
const OBS_HEIGHTS = [380, 235, 70];

// =====================
// AUDIO ASSETS
// =====================
function preload() {
  bgMusic = loadSound("assets/sounds/background_music_level1.mp3");
  hitSound = loadSound("assets/sounds/hit_obstacle_sound_effect.mp3");
}

// Plays the hit SFX — cloneNode lets it overlap itself on rapid hits
function sfxHit() {
  if (hitSound) {
    hitSound.play();
  }
}

// Stops background music and resets it to the beginning
function stopMusic() {
  if (bgMusic && bgMusic.isPlaying()) {
    bgMusic.stop();
  }
}

// =====================
// SETUP
// =====================
function setup() {
  createCanvas(1200, 600);

  for (let i = 0; i < 50; i++) {
    stars.push({
      x: random(width),
      y: random(height),
    });
  }

  if (!bgMusic.isPlaying()) {
    bgMusic.setVolume(0.4);
    bgMusic.loop();
  }

  // Spawn first obstacle
  spawnObstacle();
}

// =====================
// OBSTACLE SPAWNING
// =====================
function spawnObstacle(xOffset = 0) {
  let yPos = random(OBS_HEIGHTS);
  let sizes = [
    { w: 40, h: 50 },
    { w: 55, h: 70 },
    { w: 30, h: 100 },
  ];
  let s = random(sizes);
  obstacles.push({
    x: width + 20 + xOffset,
    y: yPos,
    w: s.w,
    h: s.h,
  });
}

// =====================
// MAIN LOOP
// =====================
function draw() {
  if (gameState === "tutorial") {
    drawTutorial();
    return;
  }

  background(10, 20, 50);

  drawMars();
  updateAstronaut();
  drawAirPulses();
  drawObstacles();

  // Drain distance using real elapsed time for smooth, frame-rate independent motion.
  distance -= DISTANCE_DRAIN_PER_SECOND * (deltaTime / 1000);
  distance = max(0, distance);

  let targetProgressPct = constrain(1 - distance / startingDistance, 0, 1);
  distanceBarDisplay = lerp(distanceBarDisplay, targetProgressPct, 0.08);

  drawUI();

  // Add one extra obstacle to each spawn wave every 400m traveled.
  let distanceTravelled = startingDistance - distance;
  if (distanceTravelled >= nextObstacleIncreaseAt) {
    obstaclesPerWave++;
    nextObstacleIncreaseAt += 400;
  }

  // Drain air every 1 second
  if (millis() - lastAirDrain > 1000) {
    airSupply--;
    spawnAirPulse();
    lastAirDrain = millis();
  }

  // Spawn obstacles on a timer
  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    for (let i = 0; i < obstaclesPerWave; i++) {
      spawnObstacle(i * 120);
    }
    obstacleTimer = 0;
    // Slightly randomise next interval so it doesn't feel robotic
    obstacleInterval = floor(random(90, 160));
  }

  if (airSupply <= 0) {
    stopMusic();
    drawLoseScreen();
    noLoop();
    return;
  }

  if (distance <= 0) {
    stopMusic();
    drawWinScreen();
    noLoop();
    return;
  }
}

// =====================
// PLAYER
// =====================
function updateAstronaut() {
  // REMOVED W / S key dependencies (Key codes 87 and 83)
  if (keyIsDown(UP_ARROW)) {
    astronautY -= speed;
  }
  if (keyIsDown(DOWN_ARROW)) {
    astronautY += speed;
  }

  astronautY = constrain(astronautY, 0, 420);

  let shouldDrawAstronaut = true;
  if (blinkFramesLeft > 0) {
    let toggleIndex = floor(blinkFramesLeft / BLINK_TOGGLE_EVERY);
    shouldDrawAstronaut = toggleIndex % 2 === 0;
    blinkFramesLeft--;
  }

  if (shouldDrawAstronaut) {
    noStroke();
    fill(255);
    rect(astronautX, astronautY, 50, 80);
  }
}

function spawnAirPulse() {
  airPulses.push({
    x: astronautX,
    y: astronautY + 40 + random(-6, 6),
    size: 15,
    alpha: 120,
    speedX: 7,
  });
}

function drawAirPulses() {
  noStroke();

  for (let i = airPulses.length - 1; i >= 0; i--) {
    let p = airPulses[i];

    fill(180, 220, 255, p.alpha);
    circle(p.x, p.y, p.size);

    p.x -= p.speedX;
    p.alpha -= 3;
    p.size += 0.2;

    if (p.alpha <= 0 || p.x < -20) {
      airPulses.splice(i, 1);
    }
  }
}

// =====================
// ENVIRONMENT
// =====================
function drawMars() {
  fill(255);
  noStroke();
  for (let s of stars) {
    let wrappedX = (((s.x + groundOffset * 0.2) % width) + width) % width;
    circle(wrappedX, s.y, 2);
  }

  fill(180, 80, 50);
  for (let x = -100; x < width + 100; x += 100) {
    triangle(
      x + (((groundOffset % 100) + 100) % 100),
      500,
      x + 50 + (((groundOffset % 100) + 100) % 100),
      430,
      x + 100 + (((groundOffset % 100) + 100) % 100),
      500,
    );
  }

  rect(0, 500, width, 100);

  groundOffset -= gameSpeed;

  if (groundOffset < -10000) groundOffset += 10000;
}

// =====================
// OBSTACLES
// =====================
function drawObstacles() {
  noStroke();

  if (hitCooldownFrames > 0) {
    hitCooldownFrames--;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];

    // Draw rock
    fill(120, 65, 40);
    rect(o.x, o.y, o.w, o.h, 4);

    // Simple highlight
    fill(160, 100, 70, 80);
    rect(o.x + 4, o.y + 4, o.w - 8, 6);

    // Move
    o.x -= gameSpeed;

    // Remove if off screen
    if (o.x < -100) {
      obstacles.splice(i, 1);
      continue;
    }

    // Collision
    let hit =
      astronautX + 50 > o.x &&
      astronautX < o.x + o.w &&
      astronautY + 80 > o.y &&
      astronautY < o.y + o.h;

    if (hit) {
      // Keep original difficulty: lose air continuously while touching a rock.
      airSupply -= 1;

      // Throttle feedback so blink/sound don't retrigger every frame.
      if (hitCooldownFrames === 0) {
        sfxHit();
        blinkFramesLeft = BLINK_TOGGLES * BLINK_TOGGLE_EVERY;
        hitCooldownFrames = 20;
      }
    }
  }
}

// =====================
// UI
// =====================
function drawUI() {
  // Air bar background
  noStroke();
  fill(0, 0, 0, 100);
  rect(15, 15, 200, 22, 4);

  // Air bar fill — colour changes with supply
  let pct = constrain(airSupply / 100, 0, 1);
  if (pct > 0.5) fill(60, 200, 120);
  else if (pct > 0.25) fill(230, 160, 30);
  else fill(220, 60, 50);
  rect(16, 16, 200 * pct, 20, 4);

  // Air label
  fill(255);
  textSize(14);
  textAlign(LEFT);
  text("AIR", 22, 32);

  // Distance bar along the bottom
  let barX = 15;
  let barY = height - 38;
  let barW = width - 30;
  let barH = 22;

  fill(0, 0, 0, 120);
  rect(barX, barY, barW, barH, 6);
  fill(20, 39, 97);
  rect(barX, barY, barW * distanceBarDisplay, barH, 5);

  fill(235);
  textSize(14);
  textAlign(LEFT);
  text("PROGRESS TO BASE", barX + 6, barY + 16);

  textAlign(RIGHT);
  text(floor(distance) + "m", barX + barW - 6, barY + 16);
}

// =====================
// WIN / LOSE SCREENS
// =====================
function drawLoseScreen() {
  background(0);
  fill(255, 0, 0);
  textSize(50);
  textAlign(CENTER);
  text("YOU RAN OUT OF AIR!", width / 2, height / 2 - 20);
  textSize(24);
  fill(200);
  text("Refresh the page to try again", width / 2, height / 2 + 40);
}

function drawWinScreen() {
  background(0);
  fill(0, 255, 0);
  textSize(50);
  textAlign(CENTER);
  text("MISSION ACCOMPLISHED!", width / 2, height / 2 - 20);
  textSize(24);
  fill(200);
  text("Refresh the page to play again", width / 2, height / 2 + 40);
}

// =====================
// TUTORIAL
// =====================
function drawTutorial() {
  background(10, 20, 50);

  // Draw the mars scenery in background for atmosphere
  fill(255);
  noStroke();
  for (let s of stars) {
    circle(s.x, s.y, 2);
  }
  fill(180, 80, 50);
  for (let x = -100; x < width + 100; x += 100) {
    triangle(x, 500, x + 50, 430, x + 100, 500);
  }
  rect(0, 500, width, 100);

  // Dark panel
  fill(0, 0, 0, 170);
  noStroke();
  rect(width / 2 - 340, 80, 680, 420, 16);

  // Title
  fill(255);
  textAlign(CENTER);
  textSize(32);
  text("HOW TO PLAY", width / 2, 140);

  // Page indicator
  fill(160);
  textSize(14);
  text("Page " + (tutorialPage + 1) + " of " + TUTORIAL_PAGES, width / 2, 165);

  // Page content
  if (tutorialPage === 0) {
    drawTutPage0();
  } else if (tutorialPage === 1) {
    drawTutPage1(); // Dynamically handled below
  } else if (tutorialPage === 2) {
    drawTutPage2();
  } else if (tutorialPage === 3) {
    drawTutPage3();
  }

  // Nav buttons
  // PREV button
  if (tutorialPage > 0) {
    fill(80, 80, 120);
    noStroke();
    rect(width / 2 - 340, 460, 140, 44, 8);
    fill(255);
    textSize(18);
    textAlign(CENTER);
    text("← Back", width / 2 - 270, 487);
  }

  // NEXT or START button
  fill(60, 180, 100);
  noStroke();
  rect(width / 2 + 200, 460, 140, 44, 8);
  fill(255);
  textSize(18);
  textAlign(CENTER);
  if (tutorialPage < TUTORIAL_PAGES - 1) {
    text("Next →", width / 2 + 270, 487);
  } else {
    text("Start!", width / 2 + 270, 487);
  }
}

// --- Tutorial page 0: Goal ---
function drawTutPage0() {
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text("Your Mission", width / 2, 210);

  textSize(17);
  fill(210, 210, 210);
  text("You are an astronaut stranded on Mars.", width / 2, 255);
  text("Run to the base before your air runs out!", width / 2, 285);

  // Mini astronaut diagram
  fill(255);
  noStroke();
  rect(width / 2 - 280, 320, 30, 50);

  // Arrow
  stroke(80, 220, 120);
  strokeWeight(3);
  line(width / 2 - 240, 345, width / 2 + 220, 345);
  fill(80, 220, 120);
  noStroke();
  triangle(width / 2 + 230, 345, width / 2 + 215, 337, width / 2 + 215, 353);

  // Base marker
  fill(255, 200, 50);
  noStroke();
  rect(width / 2 + 225, 305, 20, 60);
  triangle(width / 2 + 225, 305, width / 2 + 245, 305, width / 2 + 225, 285);

  fill(160);
  textSize(14);
  textAlign(LEFT);
  noStroke();
  text("you", width / 2 - 280, 315);
  textAlign(RIGHT);
  text("base", width / 2 + 250, 300);
}

// --- Tutorial page 1: Controls ---
function drawTutPage1() {
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text("Controls", width / 2, 210);

  textSize(17);
  fill(210, 210, 210);
  text(
    "Press and hold the Arrow Keys to navigate vertical space.",
    width / 2,
    255,
  );

  textSize(16);
  fill(255, 200, 50);
  text("Press UP_ARROW to move up", width / 2, 300);
  text("Press DOWN_ARROW to move down", width / 2, 330);

  // Quick instructional box drawing
  stroke(255, 150);
  strokeWeight(1);
  noFill();
  rect(width / 2 - 60, 360, 40, 40, 4);
  rect(width / 2 + 20, 360, 40, 40, 4);

  fill(255);
  noStroke();
  textSize(14);
  text("▲", width / 2 - 40, 385);
  text("▼", width / 2 + 40, 385);
}

// --- Tutorial page 2: Obstacles ---
function drawTutPage2() {
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text("Obstacles", width / 2, 210);

  textSize(16);
  fill(210);
  text("Rocks scroll in from the right at three heights.", width / 2, 248);
  text("Touch a rock and you lose air faster!", width / 2, 272);

  // Draw three rocks at different heights
  let rockData = [
    { rx: width / 2 + 100, ry: 360, rh: 55, label: "ground" },
    { rx: width / 2 + 170, ry: 320, rh: 40, label: "mid" },
    { rx: width / 2 + 240, ry: 290, rh: 65, label: "high" },
  ];

  for (let r of rockData) {
    fill(120, 65, 40);
    noStroke();
    rect(r.rx, r.ry, 38, r.rh, 4);
    fill(160, 100, 70, 80);
    rect(r.rx + 4, r.ry + 4, 30, 6);
    fill(180);
    textSize(12);
    textAlign(CENTER);
    text(r.label, r.rx + 19, r.ry - 6);
  }

  // Astronaut dodging
  fill(255);
  noStroke();
  rect(width / 2 - 150, 298, 30, 50);

  // Arrow showing dodge upward
  stroke(255, 200, 50);
  strokeWeight(2);
  drawArrow(width / 2 - 135, 345, width / 2 - 135, 300);
  noStroke();

  fill(255, 200, 50);
  textSize(14);
  textAlign(LEFT);
  text("dodge!", width / 2 - 165, 370);
}

// --- Tutorial page 3: Air supply ---
function drawTutPage3() {
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text("Air Supply", width / 2, 210);

  textSize(16);
  fill(210);
  text(
    "Your air drains every second — and faster if you hit rocks.",
    width / 2,
    250,
  );
  text(
    "Watch the bar top-left. Reach the base before it hits zero!",
    width / 2,
    278,
  );

  // Full bar
  drawBarExample(
    width / 2 - 200,
    310,
    1.0,
    color(60, 200, 120),
    "Full — keep going!",
  );

  // Half bar
  drawBarExample(
    width / 2 - 200,
    355,
    0.5,
    color(230, 160, 30),
    "Below 50% — watch out",
  );

  // Low bar
  drawBarExample(
    width / 2 - 200,
    400,
    0.15,
    color(220, 60, 50),
    "Critical — dodge everything!",
  );

  fill(160);
  textSize(14);
  textAlign(CENTER);
  noStroke();
  text(
    "Press Start! to begin your mission. Good luck, astronaut.",
    width / 2,
    452,
  );
}

function drawBarExample(x, y, pct, col, label) {
  // Background
  fill(0, 0, 0, 120);
  noStroke();
  rect(x, y, 200, 22, 4);
  // Fill
  fill(col);
  rect(x + 1, y + 1, 198 * pct, 20, 3);
  // Label
  fill(220);
  textSize(14);
  textAlign(LEFT);
  noStroke();
  text(label, x + 210, y + 16);
}

function drawArrow(x1, y1, x2, y2) {
  line(x1, y1, x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);
  fill(255, 200, 50);
  noStroke();
  push();
  translate(x2, y2);
  rotate(angle);
  triangle(0, 0, -12, -6, -12, 6);
  pop();
}

// =====================
// MOUSE CLICK — Tutorial nav
// =====================
function mousePressed() {
  if (gameState !== "tutorial") return;

  // Unlock audio on first interaction
  userStartAudio();

  let cx = width / 2;

  // NEXT / START button area
  if (mouseX > cx + 200 && mouseX < cx + 340 && mouseY > 460 && mouseY < 504) {
    if (tutorialPage < TUTORIAL_PAGES - 1) {
      tutorialPage++;
    } else {
      // Start game
      gameState = "playing";
      lastAirDrain = millis();
    }
  }

  // PREV button area
  if (
    tutorialPage > 0 &&
    mouseX > cx - 340 &&
    mouseX < cx - 200 &&
    mouseY > 460 &&
    mouseY < 504
  ) {
    tutorialPage--;
  }
}
