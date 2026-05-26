// PHẦN 1: GLOBAL STATE & CONSTANTS
let currentScreen = "loading"; 

// MUSIC 
const MUSIC_MUTED_KEY = "bgMusicMuted";
let musicCtx       = null;
let musicBuffer    = null;
let musicSource    = null;
let musicStartTime = 0;
let musicOffset    = 0;
let musicReady     = false;
let musicStarted   = false;
let gainNode       = null;
let isMuted        = false;

// BACKGROUND DUST 
const BACKGROUND_DUST_DENSITY = 7000;
let dustParticlesBg = [];

// UI ICONS
const ICON_SIZE   = 60;
const ICON_MARGIN = 18;
const ICON_TOP    = 16;


// PHẦN 2: LOADING SCREEN
const LOADING_FULL_TEXT    = "Loading...";
const LOADING_TYPING_SPEED = 100;

let loadingState = {
  charIndex:   0,
  lastTypeAt:  0,
  done:        false
};

function setupLoading() {
  loadingState = { charIndex: 0, lastTypeAt: millis(), done: false };
}

function updateDrawLoading() {
  const now = millis();

  if (!loadingState.done && now - loadingState.lastTypeAt >= LOADING_TYPING_SPEED) {
    loadingState.charIndex++;
    if (loadingState.charIndex > LOADING_FULL_TEXT.length) loadingState.charIndex = 0;
    loadingState.lastTypeAt = now;

    if (loadingState.charIndex === LOADING_FULL_TEXT.length) {
      loadingState.done = true;
      setTimeout(() => {
        currentScreen = "landing";
        buildLanding();
      }, 600);
    }
  }

  // Draw loading text 
  push();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);
  textSize(64);
  fill(153, 148, 54);
  noStroke();
  text(LOADING_FULL_TEXT.slice(0, loadingState.charIndex), floor(width / 2), floor(height / 2));
  pop();
}


// PHẦN 3: LANDING PAGE
const LANDING_TITLE      = "QUEN QUEN";
const LANDING_HEADPHONES = "Headphones on for the best experience";

const TITLE_TYPING_SPEED      = 300;
const HEADPHONES_TYPING_SPEED = 80;
const START_BUT_SIZE          = 60;
const TRANSITION_DURATION     = 950;

let landingState;
let transitionState = null;

function buildLanding() {
  const now = millis();
  landingState = {
    titleCount:         0,
    headphonesCount:    0,
    titleLastType:      now,
    headphonesLastType: 0,
    titleDone:          null,
    headphonesDone:     null,
    buttonProgress:     0
  };
}

function updateLanding() {
  const now = millis();

  if (landingState.titleCount < LANDING_TITLE.length) {
    const elapsed = now - landingState.titleLastType;
    if (elapsed >= TITLE_TYPING_SPEED) {
      const steps = floor(elapsed / TITLE_TYPING_SPEED);
      landingState.titleCount = min(LANDING_TITLE.length, landingState.titleCount + steps);
      landingState.titleLastType += steps * TITLE_TYPING_SPEED;
      if (landingState.titleCount === LANDING_TITLE.length && landingState.titleDone === null) {
        landingState.titleDone = now;
        landingState.headphonesLastType = now;
      }
    }
    return;
  }

  if (landingState.headphonesCount < LANDING_HEADPHONES.length) {
    const elapsed = now - landingState.headphonesLastType;
    if (elapsed >= HEADPHONES_TYPING_SPEED) {
      const steps = max(1, floor(elapsed / HEADPHONES_TYPING_SPEED));
      landingState.headphonesCount = min(LANDING_HEADPHONES.length, landingState.headphonesCount + steps);
      landingState.headphonesLastType += steps * HEADPHONES_TYPING_SPEED;
      if (landingState.headphonesCount === LANDING_HEADPHONES.length && landingState.headphonesDone === null)
        landingState.headphonesDone = now;
    }
    return;
  }

  if (landingState.headphonesDone !== null && now - landingState.headphonesDone < 500) {
    landingState.buttonProgress = 0;
    return;
  }
  landingState.buttonProgress = min(1, landingState.buttonProgress + 0.006);
}

function drawLanding(opts = {}) {
  const { updateState = true, forceComplete = false, interactive = true } = opts;
  if (updateState) updateLanding();

  const layout          = landingLayout();
  const titleCount      = forceComplete ? LANDING_TITLE.length      : landingState.titleCount;
  const headphonesCount = forceComplete ? LANDING_HEADPHONES.length : landingState.headphonesCount;
  const buttonProgress  = forceComplete ? 1 : landingState.buttonProgress;

  push();
  fill(95, 168, 194);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(min(width * 0.25, 250));
  textFont("Jersey 15");
  text(LANDING_TITLE.slice(0, titleCount), floor(width / 2), floor(layout.titleY));
  pop();

  if (titleCount === LANDING_TITLE.length) {
    push();
    fill(125, 32, 39);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    textSize(min(width * 0.028, 36));
    textFont("Jersey 15");
    text(LANDING_HEADPHONES.slice(0, headphonesCount), floor(width / 2), floor(layout.headphonesY));
    pop();
  }

  if (headphonesCount === LANDING_HEADPHONES.length) {
    drawStartBut(layout.buttonY, buttonProgress, interactive);
  } else if (interactive) {
    cursor(ARROW);
  }
}

function landingLayout() {
  return {
    titleY:      height * 0.42,
    buttonY:     height * 0.58,
    headphonesY: height - max(32, height * 0.05)
  };
}

function drawStartBut(y, progressValue, interactive = true) {
  const progress = easeOutCubic(progressValue);
  const button   = getStartButRect(y);
  const hovered  = interactive && hoverStartBut(button);
  cursor(hovered ? HAND : ARROW);

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  noStroke();
  fill(173, 168, 54, 220 * progress);
  rect(floor(button.x), floor(button.y), button.w * (0.92 + progress * 0.08), button.h, 8);
  fill(125, 32, 39, (hovered ? 255 : 235) * progress);
  textFont("Jersey 15");
  textSize(START_BUT_SIZE);
  text("START", floor(button.x), floor(button.y) - 1);
  pop();
}

function getStartButRect(y) {
  push();
  textFont("Jersey 15");
  textSize(START_BUT_SIZE);
  textStyle(NORMAL);
  const textW = textWidth("START");
  pop();
  return { x: width / 2, y, w: max(120, textW + 50), h: START_BUT_SIZE + 24 };
}

function hoverStartBut(button) {
  return (
    landingState.buttonProgress > 0.95 &&
    mouseX >= button.x - button.w / 2 && mouseX <= button.x + button.w / 2 &&
    mouseY >= button.y - button.h / 2 && mouseY <= button.y + button.h / 2
  );
}

function enterOrbitalScene() {
  if (transitionState !== null) return;
  transitionState = { startTime: millis() };

  playMusic(0);

  orb_mainTextTypingState = {
    messageIndex: 0, charCount: 0, lastType: millis(),
    completedTime: null, finishedAll: false, finishedTime: null
  };
  orb_finalMainTextState = {
    started: false, charCount: 0, lastType: 0,
    completed: false, completedTime: null, _realFinished: null
  };
  orb_nextAlpha  = 0; orb_nextAppear = null;
  orb_barAlpha   = 0; orb_barAppear  = null;
  orb_guidePhase1Done = null;
  orb_mainTextAllowed = false;
  orb_guideState = {
    charCount: 0, lastType: 0, started: false,
    startTime: millis() + TRANSITION_DURATION,
    done: false, phase2Started: false, phase2CharCount: 0,
    phase2LastType: 0, phase2Done: false, phase2Trigger: null
  };
  orb_guideFlicker = { indices: [], nextFlicker: 0, flickerSpeed: 2800 };
  orb_barValue = 0;
  cursor(ARROW);
}


// PHẦN 4: SCREEN TRANSITION 
function drawTransitionLandingToOrb() {
  const elapsed        = millis() - transitionState.startTime;
  const transitionRaw  = constrain(elapsed / TRANSITION_DURATION, 0, 1);
  const transitionEased = easeInOutCubic(transitionRaw);

  cursor(ARROW);
  drawLayerAlpha(() => drawOrbitalScene(), transitionEased, 1);
  drawLayerAlpha(
    () => drawLanding({ updateState: false, forceComplete: true, interactive: false }),
    1 - transitionEased, 1
  );

  if (transitionRaw >= 1) {
    transitionState = null;
    currentScreen   = "orbitals";
    cursor(ARROW);
    orb_guideState.startTime = millis();
  }
}

function drawLayerAlpha(renderFn, alpha) {
  if (alpha <= 0.001) return;
  push();
  const prev = drawingContext.globalAlpha;
  drawingContext.globalAlpha = alpha;
  renderFn();
  drawingContext.globalAlpha = prev;
  pop();
}


// PHẦN 5: ORBITALS SCREEN
const CAMERA_DISTANCE = 300;
const wordsSphere = [
  ["F","A","T","E"], ["T","R","A","C","E"], ["L","O","S","E"],
  ["L","I","N","G","E","R"], ["B","O","N","D"]
];
const sphereColors = [
  [224, 98, 36], [142, 171, 58], [0, 157, 173], [115, 73, 142], [186, 62, 142]
];
let spheres    = [];
let morphRatio = 0;
let orb_barValue    = 0;
let orb_barDragging = false;

const ORB_MAIN_TEXT_MESSAGES = [
  "\u201cFATE\u201d, \u201cTRACE\u201d, \u201cLOSE\u201d, \u201cLINGER\u201d, and \u201cBOND\u201d are the elements that form the emotional cycle of a relationship...",
  "From the moment people meet until they drift apart, those elements still remain...",
  "Even the connections that seem to have ended continue to exist in quieter ways...",
];
const ORB_FINAL_MAIN_TEXT      = "And even when forgotten or changed by time, those memories still exist somewhere within us.";
const ORB_MAIN_TEXT_DELAY      = 2000;
const ORB_FINAL_MAIN_TEXT_DELAY = 8000;
const ORB_BAR_LEAD_TIME        = 2500;
const ORB_NEXT_DELAY           = 2200;
const ORB_GUIDE_TEXT_1 = "move your mouse to break the spheres";
const ORB_GUIDE_TEXT_2 = "drag the bar and let the memories scatter";
const ORB_GUIDE_TYPING_SPEED = 70;
const ORB_GUIDE_1_DELAY      = 1;
const ORB_MAIN_TEXT_DELAY_AFTER_GUIDE = 100;
const ORB_MAIN_TEXT_TYPING_SPEED = 55;
const ORB_BAR_DELAY = 0;

let orb_mainTextTypingState = {
  messageIndex: 0, charCount: 0, lastType: 0,
  completedTime: null, finishedAll: false, finishedTime: null
};
let orb_finalMainTextState = {
  started: false, charCount: 0, lastType: 0,
  completed: false, completedTime: null, _realFinished: null
};
let orb_nextAlpha  = 0;
let orb_nextAppear = null;
let orb_barAlpha   = 0;
let orb_barAppear  = null;
let orb_guidePhase1Done  = null;
let orb_mainTextAllowed  = false;
let orb_guideState = {
  charCount: 0, lastType: 0, started: false, startTime: 0, done: false,
  phase2Started: false, phase2CharCount: 0, phase2LastType: 0,
  phase2Done: false, phase2Trigger: null
};
let orb_guideFlicker = { indices: [], nextFlicker: 0, flickerSpeed: 2800 };

function setupOrbitals() {
  spheres = [];
  for (let i = 0; i < 5; i++) {
    spheres.push(new Sphere(
      random(220, width - 220), random(220, height - 220),
      random(155, 190), wordsSphere[i], sphereColors[i]
    ));
  }
}

function getOrbMainBoxLayout() {
  const BOX_W_FACTOR = 0.95;
  const TEXT_SIZE    = 37;
  const LINE_H       = TEXT_SIZE * 1.35;
  const PAD_V        = 28;
  const NEXT_W       = 190;
  const NEXT_H       = 76;
  const BAR_W        = 250;

  const boxW      = min(width * BOX_W_FACTOR, 1500);
  const x         = width / 2 - boxW / 2;
  const hasNext   = orb_nextAlpha > 0;
  const textAreaW = hasNext ? boxW - NEXT_W - 68 - 20 : boxW - 68;

  textFont("Jersey 15");
  textSize(TEXT_SIZE);

  const typed = !orb_finalMainTextState.started
    ? ORB_MAIN_TEXT_MESSAGES[orb_mainTextTypingState.messageIndex].slice(0, orb_mainTextTypingState.charCount)
    : ORB_FINAL_MAIN_TEXT.slice(0, orb_finalMainTextState.charCount);

  const lines = max(1, countLines(typed, textAreaW));
  const boxH  = lines * LINE_H + PAD_V * 2;
  const y     = height - 48 - boxH;

  return {
    boxW, boxH, x, y, textAreaW, typed, TEXT_SIZE, LINE_H, PAD_V,
    NEXT_W, NEXT_H, BAR_W,
    nextButX: x + boxW - NEXT_W / 2 - 20,
    nextButY: y + boxH / 2,
    barX: x + boxW - BAR_W,
    barY: y - 32
  };
}

function updateOrbitalScene() {
  orb_updateMainText();
  orb_updateFinalMainText();

  if (orb_nextAppear !== null && millis() >= orb_nextAppear)
    orb_nextAlpha = min(255, orb_nextAlpha + 5);
  if (orb_barAppear !== null && millis() >= orb_barAppear)
    orb_barAlpha  = min(255, orb_barAlpha  + 8);

  morphRatio = orb_barValue / 100;
  for (let s of spheres) { s.separate(spheres); s.update(); }
  for (let s of spheres) s.interact();
}

function orb_updateMainText() {
  if (!orb_mainTextAllowed) return;
  const now = millis();
  if (orb_mainTextTypingState.finishedAll) return;

  const msg = ORB_MAIN_TEXT_MESSAGES[orb_mainTextTypingState.messageIndex];
  if (orb_mainTextTypingState.charCount < msg.length) {
    const elapsed = now - orb_mainTextTypingState.lastType;
    if (elapsed >= ORB_MAIN_TEXT_TYPING_SPEED) {
      const steps = floor(elapsed / ORB_MAIN_TEXT_TYPING_SPEED);
      orb_mainTextTypingState.charCount = min(msg.length, orb_mainTextTypingState.charCount + steps);
      orb_mainTextTypingState.lastType += steps * ORB_MAIN_TEXT_TYPING_SPEED;
      if (orb_mainTextTypingState.charCount === msg.length)
        orb_mainTextTypingState.completedTime = now;
    }
    return;
  }
  if (orb_mainTextTypingState.completedTime !== null &&
      now - orb_mainTextTypingState.completedTime > ORB_MAIN_TEXT_DELAY) {
    if (orb_mainTextTypingState.messageIndex < ORB_MAIN_TEXT_MESSAGES.length - 1) {
      orb_mainTextTypingState.messageIndex++;
      orb_mainTextTypingState.charCount     = 0;
      orb_mainTextTypingState.lastType      = now;
      orb_mainTextTypingState.completedTime = null;
    } else {
      orb_mainTextTypingState.finishedAll  = true;
      orb_mainTextTypingState.finishedTime = now - ORB_BAR_LEAD_TIME;
      orb_barAppear = now + ORB_BAR_DELAY;
    }
  }
}

function orb_updateFinalMainText() {
  if (!orb_mainTextTypingState.finishedAll || orb_finalMainTextState.completed) return;
  const now = millis();
  if (!orb_finalMainTextState.started) {
    if (!orb_finalMainTextState._realFinished) orb_finalMainTextState._realFinished = now;
    if (now - orb_finalMainTextState._realFinished > ORB_FINAL_MAIN_TEXT_DELAY) {
      orb_finalMainTextState.started  = true;
      orb_finalMainTextState.lastType = now;
    }
    return;
  }
  if (now - orb_finalMainTextState.lastType >= ORB_MAIN_TEXT_TYPING_SPEED) {
    orb_finalMainTextState.charCount++;
    orb_finalMainTextState.lastType = now;
    if (orb_finalMainTextState.charCount >= ORB_FINAL_MAIN_TEXT.length) {
      orb_finalMainTextState.charCount     = ORB_FINAL_MAIN_TEXT.length;
      orb_finalMainTextState.completed     = true;
      orb_finalMainTextState.completedTime = now;
      orb_nextAppear = now + ORB_NEXT_DELAY;
    }
  }
}

function updateOrbGuide() {
  const now = millis();
  if (!orb_guideState.started) {
    if (now - orb_guideState.startTime > ORB_GUIDE_1_DELAY) {
      orb_guideState.started  = true;
      orb_guideState.lastType = now;
    }
    return;
  }
  if (!orb_guideState.done) {
    if (now - orb_guideState.lastType >= ORB_GUIDE_TYPING_SPEED) {
      orb_guideState.charCount++;
      orb_guideState.lastType = now;
      if (orb_guideState.charCount >= ORB_GUIDE_TEXT_1.length) {
        orb_guideState.charCount = ORB_GUIDE_TEXT_1.length;
        orb_guideState.done      = true;
        orb_guideFlicker.nextFlicker = now + orb_guideFlicker.flickerSpeed;
        orb_guidePhase1Done = now;
      }
    }
    return;
  }
  if (!orb_mainTextAllowed && orb_guidePhase1Done !== null) {
    if (now - orb_guidePhase1Done >= ORB_MAIN_TEXT_DELAY_AFTER_GUIDE) {
      orb_mainTextAllowed = true;
      orb_mainTextTypingState.lastType = now;
    }
  }
  if (orb_guideState.done && !orb_guideState.phase2Started)
    tickFlicker(orb_guideFlicker, ORB_GUIDE_TEXT_1, now);

  if (orb_mainTextTypingState.finishedAll && orb_guideState.phase2Trigger === null)
    orb_guideState.phase2Trigger = orb_mainTextTypingState.finishedTime;

  if (orb_guideState.phase2Trigger !== null && now >= orb_guideState.phase2Trigger && !orb_guideState.phase2Done) {
    if (!orb_guideState.phase2Started) {
      orb_guideState.phase2Started   = true;
      orb_guideState.phase2CharCount = 0;
      orb_guideState.phase2LastType  = now;
    } else {
      if (now - orb_guideState.phase2LastType >= ORB_GUIDE_TYPING_SPEED) {
        orb_guideState.phase2CharCount++;
        orb_guideState.phase2LastType = now;
        if (orb_guideState.phase2CharCount >= ORB_GUIDE_TEXT_2.length) {
          orb_guideState.phase2CharCount = ORB_GUIDE_TEXT_2.length;
          orb_guideState.phase2Done      = true;
          orb_guideFlicker.indices       = [];
          orb_guideFlicker.nextFlicker   = now + orb_guideFlicker.flickerSpeed;
        }
      }
    }
  }
  if (orb_guideState.phase2Done)
    tickFlicker(orb_guideFlicker, ORB_GUIDE_TEXT_2, now);
}

function drawOrbGuide() {
  if (!orb_guideState.started || orb_guideState.charCount === 0) return;
  const usePhase2    = orb_guideState.phase2Started;
  const fullText     = usePhase2 ? ORB_GUIDE_TEXT_2 : ORB_GUIDE_TEXT_1;
  const displayCount = usePhase2 ? orb_guideState.phase2CharCount : orb_guideState.charCount;
  drawGuideText(fullText, displayCount, orb_guideFlicker);
}

function drawOrbitalScene() {
  const ordered = [...spheres].sort((a, b) => a.depth - b.depth);
  for (let s of ordered) s.display();
}

function drawOrbMainBox() {
  const L = getOrbMainBoxLayout();
  const { boxW, boxH, x, y, textAreaW, typed, nextButX, nextButY, NEXT_W, NEXT_H, barX, barY, BAR_W } = L;

  if (orb_nextAlpha > 200) {
    if (mouseX >= nextButX - NEXT_W/2 && mouseX <= nextButX + NEXT_W/2 &&
        mouseY >= nextButY - NEXT_H/2 && mouseY <= nextButY + NEXT_H/2) cursor(HAND);
  }

  push();
  fill(252, 235, 222); stroke(95, 168, 194); strokeWeight(3);
  rect(floor(x), floor(y), boxW, boxH, 8);

  // Tag
  const TAG_W = 180, TAG_H = 58;
  const tagX  = floor(x) + 18, tagCX = tagX + TAG_W / 2;
  noStroke(); fill(95, 168, 194);
  rect(tagX, floor(y) - 28, TAG_W, TAG_H, 8);
  fill(125, 32, 39); textAlign(CENTER, CENTER); textFont("Jersey 15"); textSize(45);
  text("Orbitals", tagCX, floor(y) - 28 + TAG_H / 2);

  // Bar
  if (orb_barAlpha > 0) {
    const BAR_H = 14;
    if (mouseX >= barX - 10 && mouseX <= barX + BAR_W + 10 &&
        mouseY >= barY - 24 && mouseY <= barY + 24 && orb_barAlpha > 200) cursor(HAND);
    fill(125, 32, 39, orb_barAlpha); noStroke();
    textAlign(CENTER, CENTER); textFont("Jersey 15"); textSize(27);
    text("TEXT <-> PARTICLES", floor(barX + BAR_W / 2), floor(barY - 20));
    noFill(); stroke(153, 148, 54, orb_barAlpha); strokeWeight(3);
    rect(floor(barX), floor(barY), BAR_W, BAR_H, 10);
    noStroke(); fill(125, 32, 39, orb_barAlpha);
    const handleX = map(orb_barValue, 0, 100, barX + 9, barX + BAR_W - 9);
    circle(floor(handleX), floor(barY + BAR_H / 2), 20);
  }

  // Text
  fill(125, 32, 39); noStroke();
  textAlign(LEFT, CENTER); textFont("Jersey 15"); textSize(L.TEXT_SIZE);
  if (orb_mainTextAllowed) text(typed, floor(x) + 32, floor(y) + boxH / 2, textAreaW);

  // NEXT button
  if (orb_nextAlpha > 0) {
    fill(153, 148, 54, orb_nextAlpha); noStroke(); rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), NEXT_W, NEXT_H, 6);
    fill(125, 32, 39, orb_nextAlpha);
    textAlign(CENTER, CENTER); textFont("Jersey 15"); textSize(54);
    text("NEXT", floor(nextButX), floor(nextButY) - 1);
  }
  pop();
}

// Sphere class 
class Sphere {
  constructor(x, y, r, chars, col) {
    this.pos  = createVector(x, y);
    this.vel  = p5.Vector.random2D().mult(random(0.01, 0.08));
    this.r    = r;
    this.screenRadius = r;
    this.chars = chars;
    this.col   = col;

    this.rotY = random(TWO_PI); this.rotX = random(TWO_PI); this.rotZ = random(TWO_PI);
    this.rotYSpeed = random(0.001, 0.002);
    this.rotXSpeed = random(0.0004, 0.001);
    this.rotZSpeed = random(-0.001, 0.001);

    this.depth = random(-70, 90);
    this.depthOffset  = random(1000);
    this.driftOffsetX = random(1000);
    this.driftOffsetY = random(1000);
    this.homeOffsetX  = random(2000);
    this.homeOffsetY  = random(2000);

    this.maxSpeed        = random(1.2, 2.2);
    this.freeFlight      = 0;
    this.homeBase        = createVector(x, y);
    this.home            = createVector(x, y);
    this.roamRadiusX     = random(220, 420);
    this.roamRadiusY     = random(180, 380);
    this.homeDriftRadius = random(60, 120);
    this.separationBoost = random(0.9, 1.15);

    this.points = [];
    this.makeSphere();
  }

  makeSphere() {
    const bandCount = 10;
    const bandSteps = max(22, this.chars.length * 5);
    for (let band = 0; band < bandCount; band++) {
      let bandBase = (band / bandCount) * TWO_PI;
      for (let i = 0; i < bandSteps; i++) {
        let progress   = i / (bandSteps - 1);
        let phi        = lerp(-HALF_PI * 0.82, HALF_PI * 0.82, progress);
        let theta      = bandBase + sin(progress * PI) * 0.42 + progress * 0.95;
        let ringRadius = cos(phi);
        this._addPoint(cos(theta) * ringRadius, sin(phi), sin(theta) * ringRadius, true, i);
      }
    }
    for (let i = 0; i < 800; i++) {
      let ny = 1 - (i / 799) * 2;
      let rr = sqrt(1 - ny * ny);
      let theta = i * 2.399963;
      this._addPoint(cos(theta) * rr, ny, sin(theta) * rr, false, i);
    }
  }

  _addPoint(nx, ny, nz, textSlot, charIndex) {
    this.points.push({
      baseX: nx*this.r, baseY: ny*this.r, baseZ: nz*this.r,
      x: nx*this.r, y: ny*this.r, z: nz*this.r,
      vx: 0, vy: 0, rx: 0, ry: 0, rz: 0,
      textSlot,
      scatterX: random(-11, 11), scatterY: random(-11, 11),
      char: this.chars[charIndex % this.chars.length]
    });
  }

  separate(all) {
    let repel = createVector(0, 0); let count = 0;
    for (let o of all) {
      if (o === this) continue;
      let delta = p5.Vector.sub(this.pos, o.pos);
      let preferred = (this.screenRadius + o.screenRadius) * 1.25 + 32;
      let dSq = delta.magSq();
      if (dSq > 0.0001 && dSq < preferred * preferred) {
        delta.normalize();
        repel.add(delta.mult(map(sqrt(dSq), 0, preferred, 0.015, 0) * this.separationBoost));
        count++;
      }
    }
    if (count > 0) { repel.div(count); this.vel.add(repel); }
  }

  update() {
    const t = frameCount * 0.0024, homeT = frameCount * 0.0011;
    this.freeFlight = max(0, this.freeFlight - 0.018);

    this.home.x = constrain(
      this.homeBase.x + map(noise(this.homeOffsetX, homeT), 0, 1, -this.homeDriftRadius, this.homeDriftRadius),
      this.r + 90, width - this.r - 90
    );
    this.home.y = constrain(
      this.homeBase.y + map(noise(this.homeOffsetY, homeT), 0, 1, -this.homeDriftRadius * 0.8, this.homeDriftRadius * 0.8),
      this.r + 100, height - this.r - 100
    );

    const targetX = this.home.x + map(noise(this.driftOffsetX, t), 0, 1, -this.roamRadiusX, this.roamRadiusX);
    const targetY = this.home.y + map(noise(this.driftOffsetY, t), 0, 1, -this.roamRadiusY, this.roamRadiusY);
    this.vel.add(createVector(targetX - this.pos.x, targetY - this.pos.y)
      .mult(lerp(0.00015, 0.0006, 1 - this.freeFlight)));
    this.vel.limit(this.maxSpeed + this.freeFlight * 2.4);
    this.pos.add(this.vel);

    const pad = this.r * 0.95;
    if (this.pos.x < pad)          this.vel.x += (pad - this.pos.x) * 0.03;
    if (this.pos.x > width - pad)  this.vel.x -= (this.pos.x - (width - pad)) * 0.03;
    if (this.pos.y < pad)          this.vel.y += (pad - this.pos.y) * 0.03;
    if (this.pos.y > height - pad) this.vel.y -= (this.pos.y - (height - pad)) * 0.03;
    this.vel.mult(0.999);

    this.rotY += this.rotYSpeed; this.rotX += this.rotXSpeed; this.rotZ += this.rotZSpeed;
    this.depth      = lerp(this.depth, map(noise(this.depthOffset, t * 0.8), 0, 1, -95, 120), 0.035);
    this.screenRadius = this.r * (CAMERA_DISTANCE / (CAMERA_DISTANCE - this.depth));
  }

  interact() {
    for (let p of this.points) {
      let dx = (this.pos.x + p.rx) - mouseX;
      let dy = (this.pos.y + p.ry) - mouseY;
      let d  = sqrt(dx*dx + dy*dy);
      if (d < 80) {
        let dir = createVector(dx, dy).normalize();
        let str = pow(1 - d/80, 2.2);
        p.vx *= 0.85; p.vy *= 0.85;
        p.vx += dir.x * str * 45 + random(-0.12, 0.12);
        p.vy += dir.y * str * 45 + random(-0.12, 0.12);
        let swirl = createVector(-dir.y, dir.x);
        p.vx += swirl.x * str * 1.2; p.vy += swirl.y * str * 1.2;
      }
    }
  }

  display() {
    push(); translate(this.pos.x, this.pos.y);
    const textFade     = constrain(map(morphRatio, 0, 0.5, 255, 0), 0, 255);
    const particleFade = constrain(map(morphRatio, 0.3, 1.0, 0, 255), 0, 255);
    const rp = [];

    for (let p of this.points) {
      let x = p.baseX, y = p.baseY, z = p.baseZ;
      let pulse = 1 + sin(frameCount * 0.018 + p.baseY * 0.03 + this.depthOffset) * 0.012;
      x *= pulse; y *= pulse; z *= pulse;
      p.x += (x - p.x) * 0.00001 + p.vx;
      p.y += (y - p.y) * 0.00001 + p.vy;
      p.z += (z - p.z) * 0.2;
      p.vx *= 0.92; p.vy *= 0.92;

      let rx1 = p.x*cos(this.rotY) - p.z*sin(this.rotY);
      let rz1 = p.x*sin(this.rotY) + p.z*cos(this.rotY);
      let ry1 = p.y*cos(this.rotX) - rz1*sin(this.rotX);
      let rz2 = p.y*sin(this.rotX) + rz1*cos(this.rotX);
      let rx2 = rx1*cos(this.rotZ) - ry1*sin(this.rotZ);
      let ry2 = rx1*sin(this.rotZ) + ry1*cos(this.rotZ);

      let wZ  = rz2 + this.depth;
      let per = CAMERA_DISTANCE / (CAMERA_DISTANCE - wZ);
      p.rx = rx2*per; p.ry = ry2*per; p.rz = wZ;

      rp.push({
        point: p,
        mx: lerp(p.rx, p.rx + p.scatterX*per, morphRatio),
        my: lerp(p.ry, p.ry + p.scatterY*per, morphRatio),
        alpha: constrain(map(wZ, -this.r-150, this.r+170, 0, 255), 0, 255),
        worldZ: wZ, perspective: per
      });
    }
    rp.sort((a, b) => a.worldZ - b.worldZ);

    if (textFade > 0) {
      noStroke();
      const ti = rp.filter(i => i.point.textSlot)
                   .map(i => ({ i, sz: floor(constrain(42 * i.perspective, 10, 46)) }));
      ti.sort((a, b) => a.sz - b.sz);
      let lastSz = -1;
      for (let { i, sz } of ti) {
        if (sz !== lastSz) { textFont("Jersey 15"); textSize(sz); lastSz = sz; }
        fill(this.col[0], this.col[1], this.col[2], 255 * (textFade / 255));
        text(i.point.char, floor(i.mx), floor(i.my));
      }
    }
    if (particleFade > 0) {
      noStroke();
      for (let i of rp) {
        fill(this.col[0], this.col[1], this.col[2], i.alpha * (particleFade / 255));
        circle(floor(i.mx), floor(i.my), constrain(2.8 * i.perspective, 3, 9));
      }
    }
    pop();
  }
}


// PHẦN 6: THREAD SCREEN
const CHAR_SET  = "692035184751";
const CHAR_STEP = 8;
const NODE_COUNT = 80;

let thr_img;
let thr_baseImg;
let thr_charPoints = [];
let thr_nodes      = [];
let thr_redThreads = [];

const THR_GUIDE_TEXT_1       = "click and hold to cut the red threads";
const THR_GUIDE_TYPING_SPEED = 70;
const THR_GUIDE_1_DELAY      = 800;

let thr_guideState = { charCount:0, lastType:0, started:false, startedAt:0, done:false };
let thr_guideFlicker = { indices:[], nextFlicker:0, flickerSpeed:2800 };

const THR_MAIN_TEXT_MESSAGES = [
  "\u201cThe red thread\u201d is what connects people to one another, and through it, memories are created for each of us...",
  "Many people believe that if this \u201cred thread\u201d is cut, the relationship between two people will completely end, and they will never meet again...",
  "So try cutting that thread\u2026"
];
const THR_FINAL_MAIN_TEXT       = "But even when the thread is broken, it doesn\u2019t truly disappear, it still lingers somewhere, entangled in another thread.";
const THR_MAIN_TEXT_TYPING_SPEED = 55;
const THR_MAIN_TEXT_DELAY        = 2000;
const THR_FINAL_MAIN_TEXT_DELAY  = 5000;
const THR_NEXT_DELAY             = 2200;

let thr_mainTextTypingState = {
  messageIndex:0, charCount:0, lastTypeAt:0, completedAt:null, finishedAll:false, finishedAt:null
};
let thr_finalMainTextState = { started:false, charCount:0, lastTypeAt:0, completed:false, completedAt:null };
let thr_nextAlpha  = 0;
let thr_nextAppear = null;

function setupThread() {
  thr_guideState    = { charCount:0, lastType:0, started:false, startedAt: millis(), done:false };
  thr_guideFlicker  = { indices:[], nextFlicker:0, flickerSpeed:2800 };
  thr_mainTextTypingState = {
    messageIndex:0, charCount:0, lastTypeAt: millis(), completedAt:null, finishedAll:false, finishedAt:null
  };
  thr_finalMainTextState = { started:false, charCount:0, lastTypeAt:0, completed:false, completedAt:null };
  thr_nextAlpha  = 0;
  thr_nextAppear = null;

  thr_charPoints = []; thr_nodes = []; thr_redThreads = [];
  thr_buildCharImage();
  thr_createNodes();
  thr_createThreads();
}

function getThrMainBoxLayout() {
  const BOX_W_FACTOR = 0.95, TEXT_SIZE = 37, LINE_H = TEXT_SIZE * 1.35;
  const PAD_V = 28, NEXT_W = 190, NEXT_H = 76;
  const boxW = min(width * BOX_W_FACTOR, 1500);
  const x    = width / 2 - boxW / 2;
  const textAreaW = (thr_nextAlpha > 0) ? boxW - NEXT_W - 68 - 20 : boxW - 68;
  textFont("Jersey 15"); textSize(TEXT_SIZE);
  const typed = !thr_finalMainTextState.started
    ? THR_MAIN_TEXT_MESSAGES[thr_mainTextTypingState.messageIndex].slice(0, thr_mainTextTypingState.charCount)
    : THR_FINAL_MAIN_TEXT.slice(0, thr_finalMainTextState.charCount);
  const lines = max(1, countLines(typed, textAreaW));
  const boxH  = lines * LINE_H + PAD_V * 2;
  const y     = height - 48 - boxH;
  return {
    boxW, boxH, x, y, textAreaW, typed, TEXT_SIZE, LINE_H, PAD_V, NEXT_W, NEXT_H,
    nextButX: x + boxW - NEXT_W / 2 - 20,
    nextButY: y + boxH / 2
  };
}

function thr_buildCharImage() {
  thr_charPoints = [];
  if (!thr_baseImg) return;
  let srcW = thr_baseImg.width, srcH = thr_baseImg.height;
  let imgRatio = srcW / srcH;
  let maxW = width * 0.82, maxH = height * 0.72;
  let drawW, drawH;
  if (maxW / imgRatio <= maxH) { drawW = maxW; drawH = maxW / imgRatio; }
  else { drawH = maxH; drawW = maxH * imgRatio; }
  let resized = thr_baseImg.get();
  resized.resize(floor(drawW), floor(drawH));
  resized.loadPixels();
  let offsetX = width/2 - resized.width/2;
  let offsetY = height/2 - resized.height/2 - 20;
  for (let y = 0; y < resized.height; y += CHAR_STEP) {
    for (let x = 0; x < resized.width; x += CHAR_STEP) {
      let idx = (x + y * resized.width) * 4;
      let bright = (resized.pixels[idx] + resized.pixels[idx+1] + resized.pixels[idx+2]) / 3;
      if (bright < 180) {
        thr_charPoints.push({
          x: floor(x + offsetX), y: floor(y + offsetY),
          char: CHAR_SET[floor(random(CHAR_SET.length))],
          alpha: map(bright, 0, 180, 160, 40)
        });
      }
    }
  }
}
// Create random nodes 
function thr_createNodes() {
  thr_nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    let p = random(thr_charPoints);
    if (p) thr_nodes.push({ x: p.x, y: p.y });
  }
}

function thr_createThreads() {
  thr_redThreads = [];
  for (let a of thr_nodes) {
    let b = random(thr_nodes);
    if (a !== b) {
      thr_redThreads.push(new RedThread(a, b, 0));
      thr_redThreads.push(new RedThread(a, b, 1));
    }
  }
}

// Red Thread
class RedThread {
  constructor(a, b, type) {
    this.a = a; this.b = b; this.type = type;
    this.breakable    = random() < 0.35;
    this.broken       = false;
    this.wave         = 0;
    this.waveTarget   = 0;
    this.dragOffset   = 0;
    this.fallOffset   = 0;
    this.fallVelocity = 0;
    this.seed         = random(1000);
    this.cutPoint     = random(0.2, 0.8);
    this._mx = (a.x + b.x) * 0.5;
    this._my = (a.y + b.y) * 0.5;
  }

  update() {
    const dx = mouseX - this._mx, dy = mouseY - this._my;
    const distSq = dx*dx + dy*dy;

    if (distSq < 32400) {
      const d = sqrt(distSq);
      this.waveTarget = d < 180 ? map(d, 0, 180, 60, 0) : 0;
      if (mouseIsPressed && distSq < 12100 && !this.broken)
        this.dragOffset = lerp(this.dragOffset, 90, 0.22);
      else
        this.dragOffset = lerp(this.dragOffset, 0, 0.06);
    } else {
      this.waveTarget = 0;
      if (this.dragOffset > 0.1) this.dragOffset = lerp(this.dragOffset, 0, 0.06);
    }

    this.wave = lerp(this.wave, this.waveTarget, 0.18);

    if (this.breakable && this.dragOffset > 42 && !this.broken) {
      this.broken       = true;
      this.fallOffset   = 0;
      this.fallVelocity = random(10.5, 12.5);
    }
    if (this.broken) {
      this.fallVelocity += 0.75;
      this.fallOffset   += this.fallVelocity;
    }
  }

  display() {
    stroke(190, 80, 90, 110); strokeWeight(2); noFill();
    let ax = this.a.x, ay = this.a.y, bx = this.b.x, by = this.b.y;
    let mx = this._mx, my = this._my;
    let wave = sin(frameCount * 0.12 + this.seed) * this.wave;
    let drag = this.dragOffset;

    if (!this.broken) {
      if      (this.type === 0) bezier(ax, ay, mx, my + wave + drag*0.2, mx, my - wave + drag*0.2, bx, by);
      else                      bezier(ax, ay, mx, my - 20 + wave + drag, mx, my + 20 - wave + drag, bx, by);
    } else {
      let cutX  = lerp(ax, bx, this.cutPoint);
      let cutY  = lerp(ay, by, this.cutPoint);
      let leftLen  = dist(ax, ay, cutX, cutY);
      let rightLen = dist(cutX, cutY, bx, by);
      let leftSag  = min(leftLen  * 1.4, this.fallOffset);
      let rightSag = min(rightLen * 1.4, this.fallOffset);
      bezier(ax, ay, ax, ay + leftSag*0.5, cutX - leftLen*0.15, cutY + leftSag, cutX, cutY + leftSag);
      bezier(cutX, cutY + rightSag, cutX + rightLen*0.15, cutY + rightSag, bx, by + rightSag*0.5, bx, by);
    }
  }
}

// Guide and Main Box
function drawThrMainBox() {
  const L = getThrMainBoxLayout();
  const { boxW, boxH, x, y, textAreaW, typed, nextButX, nextButY, NEXT_W, NEXT_H } = L;

  if (thr_nextAppear !== null && millis() >= thr_nextAppear)
    thr_nextAlpha = min(255, thr_nextAlpha + 5);

  if (thr_nextAlpha > 200) {
    if (mouseX >= nextButX-NEXT_W/2 && mouseX <= nextButX+NEXT_W/2 &&
        mouseY >= nextButY-NEXT_H/2 && mouseY <= nextButY+NEXT_H/2) cursor(HAND);
  }

  // Box
  push();
  fill(252,235,222); stroke(95,168,194); strokeWeight(3);
  rect(floor(x), floor(y), boxW, boxH, 8);

  // Tag
  const TAG_W = 180, TAG_H = 58;
  const tagX = floor(x) + 18, tagCX = tagX + TAG_W / 2;
  noStroke(); fill(95,168,194);
  rect(tagX, floor(y)-28, TAG_W, TAG_H, 8);
  fill(125,32,39); textAlign(CENTER,CENTER); textFont("Jersey 15"); textSize(45);
  text("Thread", tagCX, floor(y)-28+TAG_H/2);

  fill(125,32,39); noStroke();
  textAlign(LEFT,CENTER); textFont("Jersey 15"); textSize(L.TEXT_SIZE);
  text(typed, floor(x)+32, floor(y)+boxH/2, textAreaW);

  // NEXT button
  if (thr_nextAlpha > 0) {
    fill(153,148,54,thr_nextAlpha); noStroke(); rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), NEXT_W, NEXT_H, 6);
    fill(125,32,39,thr_nextAlpha);
    textAlign(CENTER,CENTER); textFont("Jersey 15"); textSize(54);
    text("NEXT", floor(nextButX), floor(nextButY)-1);
  }
  pop();
}

function thr_updateMainText() {
  const now = millis();
  if (thr_mainTextTypingState.finishedAll) return;
  const msg = THR_MAIN_TEXT_MESSAGES[thr_mainTextTypingState.messageIndex];
  if (thr_mainTextTypingState.charCount < msg.length) {
    const elapsed = now - thr_mainTextTypingState.lastTypeAt;
    if (elapsed >= THR_MAIN_TEXT_TYPING_SPEED) {
      const steps = floor(elapsed / THR_MAIN_TEXT_TYPING_SPEED);
      thr_mainTextTypingState.charCount   = min(msg.length, thr_mainTextTypingState.charCount + steps);
      thr_mainTextTypingState.lastTypeAt += steps * THR_MAIN_TEXT_TYPING_SPEED;
      if (thr_mainTextTypingState.charCount === msg.length)
        thr_mainTextTypingState.completedAt = now;
    }
    return;
  }
  if (thr_mainTextTypingState.completedAt !== null &&
      now - thr_mainTextTypingState.completedAt > THR_MAIN_TEXT_DELAY) {
    if (thr_mainTextTypingState.messageIndex < THR_MAIN_TEXT_MESSAGES.length - 1) {
      thr_mainTextTypingState.messageIndex++;
      thr_mainTextTypingState.charCount   = 0;
      thr_mainTextTypingState.lastTypeAt  = now;
      thr_mainTextTypingState.completedAt = null;
    } else {
      thr_mainTextTypingState.finishedAll = true;
      thr_mainTextTypingState.finishedAt  = now;
    }
  }
}

function thr_updateFinalMainText() {
  if (!thr_mainTextTypingState.finishedAll || thr_finalMainTextState.completed) return;
  const now = millis();
  if (!thr_finalMainTextState.started) {
    if (now - thr_mainTextTypingState.finishedAt > THR_FINAL_MAIN_TEXT_DELAY) {
      thr_finalMainTextState.started    = true;
      thr_finalMainTextState.lastTypeAt = now;
    }
    return;
  }
  if (now - thr_finalMainTextState.lastTypeAt >= THR_MAIN_TEXT_TYPING_SPEED) {
    thr_finalMainTextState.charCount++;
    thr_finalMainTextState.lastTypeAt = now;
    if (thr_finalMainTextState.charCount >= THR_FINAL_MAIN_TEXT.length) {
      thr_finalMainTextState.charCount   = THR_FINAL_MAIN_TEXT.length;
      thr_finalMainTextState.completed   = true;
      thr_finalMainTextState.completedAt = now;
      thr_nextAppear = now + THR_NEXT_DELAY;
    }
  }
}

function thr_updateGuide() {
  if (thr_guideState.done) { tickFlicker(thr_guideFlicker, THR_GUIDE_TEXT_1, millis()); return; }
  const now = millis();
  if (!thr_guideState.started) {
    if (now - thr_guideState.startedAt > THR_GUIDE_1_DELAY) {
      thr_guideState.started  = true;
      thr_guideState.lastType = now;
    }
    return;
  }
  if (now - thr_guideState.lastType >= THR_GUIDE_TYPING_SPEED) {
    thr_guideState.charCount++;
    thr_guideState.lastType = now;
    if (thr_guideState.charCount >= THR_GUIDE_TEXT_1.length) {
      thr_guideState.charCount     = THR_GUIDE_TEXT_1.length;
      thr_guideState.done          = true;
      thr_guideFlicker.nextFlicker = now + thr_guideFlicker.flickerSpeed;
    }
  }
}


// PHẦN 7: TABS SCREEN
const TEXT_BOX_W  = 500;
const IMG_BOX_MIN_W = 300, IMG_BOX_MAX_W = 420;
const IMG_BOX_MIN_H = 260, IMG_BOX_MAX_H = 380;
const TITLEBAR_HEIGHT = 58;
const BUTTON_SIZE = 28, BUTTON_GAP = 9;
const TITLE_SIZE  = 36, CHAT_SIZE  = 28;


const MESSENGER_BAR_COLOR  = [95, 168, 194];
const IMG_BAR_COLOR        = [125, 32, 39];
const IMG_TITLE_TEXT_COLOR = [95, 168, 194];

const tabMessages = [
  ["ban an com chuaa?",        "minh chuaaa"  ],
  ["u looked cute today btw",  "tks... :3"    ],
  ["u online but no reply?",   "seen"         ],
  ["will u be my girlfriend...", "i..."       ],
  ["E chi tao lam bai nay coi", "bai nao?"   ],
];

let tabImgs = [];
let tabs    = [];

const TAB_GUIDE_TEXT        = "click anywhere to reveal the memories";
const TAB_GUIDE_TYPING_SPEED = 70;
const TAB_GUIDE_1_DELAY      = 800;

let tab_guideState   = { charCount:0, lastType:0, started:false, startedAt:0, done:false };
let tab_guideFlicker = { indices:[], nextFlicker:0, flickerSpeed:2800 };

const TAB_MAIN_TEXT_MESSAGES = [
  "Messages? or images? things that always stay deep inside your devices...",
  "Things you forget even though you hold it in your hands every day...",
  "A space that preserves traces, proving that\u2026"
];
const TAB_FINAL_MAIN_TEXT       = "There was once a presence, someone who passed through our lives...";
const TAB_MAIN_TEXT_TYPING_SPEED = 55;
const TAB_MAIN_TEXT_DELAY        = 1400;
const TAB_FINAL_MAIN_TEXT_DELAY  = 5000;
const TAB_NEXT_DELAY             = 2200;

let tab_mainTextTypingState = {
  messageIndex:0, charCount:0, lastTypeAt:0, completedAt:null, finishedAll:false, finishedAt:null
};
let tab_finalMainTextState = { started:false, charCount:0, lastTypeAt:0, completed:false, completedAt:null };
let tab_nextAlpha  = 0;
let tab_nextAppear = null;

function setupTabs() {
  tabs = [];
  tab_guideState   = { charCount:0, lastType:0, started:false, startedAt: millis(), done:false };
  tab_guideFlicker = { indices:[], nextFlicker:0, flickerSpeed:2800 };
  tab_mainTextTypingState = {
    messageIndex:0, charCount:0, lastTypeAt: millis(), completedAt:null, finishedAll:false, finishedAt:null
  };
  tab_finalMainTextState = { started:false, charCount:0, lastTypeAt:0, completed:false, completedAt:null };
  tab_nextAlpha  = 0;
  tab_nextAppear = null;
}

function getTabMainBoxLayout() {
  const BOX_W_FACTOR = 0.95, TEXT_SIZE = 37, LINE_H = TEXT_SIZE * 1.35;
  const PAD_V = 28, NEXT_W = 190, NEXT_H = 76;
  const boxW = min(width * BOX_W_FACTOR, 1500);
  const x    = width / 2 - boxW / 2;
  const textAreaW = (tab_nextAlpha > 0) ? boxW - NEXT_W - 68 - 20 : boxW - 68;
  textFont("Jersey 15"); textSize(TEXT_SIZE);
  const typed = !tab_finalMainTextState.started
    ? TAB_MAIN_TEXT_MESSAGES[tab_mainTextTypingState.messageIndex].slice(0, tab_mainTextTypingState.charCount)
    : TAB_FINAL_MAIN_TEXT.slice(0, tab_finalMainTextState.charCount);
  const lines = max(1, countLines(typed, textAreaW));
  const boxH  = lines * LINE_H + PAD_V * 2;
  const y     = height - 48 - boxH;
  return {
    boxW, boxH, x, y, textAreaW, typed, TEXT_SIZE, LINE_H, PAD_V, NEXT_W, NEXT_H,
    nextButX: x + boxW - NEXT_W / 2 - 20,
    nextButY: y + boxH / 2
  };
}

// Tab class
class RetroTab {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.dragging = false; this.offsetX = 0; this.offsetY = 0;

    if (type === "text") {
      this.title     = "Messenger";
      this.barColor  = MESSENGER_BAR_COLOR;
      this.titleTextColor = [125, 32, 39];
      this.message   = random(tabMessages);
      this.w         = TEXT_BOX_W;
      this.h         = null;
    } else {
      this.title     = "Image";
      this.barColor  = IMG_BAR_COLOR;
      this.titleTextColor = IMG_TITLE_TEXT_COLOR;
      this.img       = random(tabImgs);
      this.w         = random(IMG_BOX_MIN_W, IMG_BOX_MAX_W);
      this.h         = random(IMG_BOX_MIN_H, IMG_BOX_MAX_H);
    }
  }

  _calcTextH() {
    const bH = CHAT_SIZE + 22;
    return TITLEBAR_HEIGHT + 20 + bH + 18 + bH + 24;
  }

  display() {
    if (this.type === "text" && this.h === null) this.h = this._calcTextH();
    const bx = floor(this.x), by = floor(this.y);
    const [br, bg, bb] = this.barColor;
    const [tr, tg, tb] = this.titleTextColor;

    fill(242, 238, 230); stroke(br, bg, bb); strokeWeight(3);
    rect(bx, by, this.w, this.h, 5);

    fill(br, bg, bb); noStroke();
    rect(bx, by, this.w, TITLEBAR_HEIGHT, 5, 5, 0, 0);

    fill(tr, tg, tb);
    textAlign(LEFT, CENTER); textFont("Jersey 15"); textSize(TITLE_SIZE);
    text(this.title, bx + 12, by + floor(TITLEBAR_HEIGHT / 2));

    this._drawButtons(bx, by, br, bg, bb);

    if (this.type === "text") this._drawChat(bx, by);
    else this._drawImage(bx, by);

    const cr = this._closeRect(bx, by);
    if (mouseX >= cr.x && mouseX <= cr.x + BUTTON_SIZE &&
        mouseY >= cr.y && mouseY <= cr.y + BUTTON_SIZE) cursor(HAND);
  }

  _btnPositions(bx, by) {
    const totalW = BUTTON_SIZE * 3 + BUTTON_GAP * 2;
    const startX = bx + this.w - 12 - totalW;
    const btnY   = by + floor((TITLEBAR_HEIGHT - BUTTON_SIZE) / 2);
    return [
      { x: startX,                            y: btnY, label: "—" },
      { x: startX + BUTTON_SIZE + BUTTON_GAP, y: btnY, label: "□" },
      { x: startX + (BUTTON_SIZE + BUTTON_GAP) * 2, y: btnY, label: "x" }
    ];
  }

  _closeRect(bx, by) { return this._btnPositions(bx, by)[2]; }

  // Titlebar buttons
  _drawButtons(bx, by) {
    push(); rectMode(CORNER);
    for (let btn of this._btnPositions(bx, by)) {
      fill(242, 238, 230); noStroke();
      rect(btn.x, btn.y, BUTTON_SIZE, BUTTON_SIZE, 2);
      fill(80); textAlign(CENTER, CENTER); textFont("Jersey 15");
      textSize(floor(BUTTON_SIZE * 0.65));
      text(btn.label, btn.x + floor(BUTTON_SIZE/2),
           btn.y + floor(BUTTON_SIZE/2) + (btn.label === "—" ? 1 : 0));
    }
    pop();
  }

  // Chat bubbles
  _drawChat(bx, by) {
    textFont("Jersey 15"); textSize(CHAT_SIZE);
    const pH = CHAT_SIZE + 22, maxW = this.w - 32, padH = 28;
    const lW = min(textWidth(this.message[0]) + padH, maxW);
    const rW = min(textWidth(this.message[1]) + padH, maxW);
    const tpY = by + TITLEBAR_HEIGHT + 20;
    const rbY = tpY + pH + 18;

    fill(255); noStroke();
    rect(bx + 16, tpY, lW, pH, 16, 16, 16, 4);
    fill(40); textAlign(LEFT, CENTER);
    text(this.message[0], bx + 16 + padH/2, tpY + pH/2);

    fill(95, 168, 194); noStroke();
    rect(bx + this.w - rW - 16, rbY, rW, pH, 16, 16, 4, 16);
    fill(255); textAlign(LEFT, CENTER);
    text(this.message[1], bx + this.w - rW - 16 + padH/2, rbY + pH/2);
  }

  _drawImage(bx, by) {
    if (!this.img) return;
    drawingContext.imageSmoothingEnabled = false;
    const pad = 16, aW = this.w - pad*2, aH = this.h - TITLEBAR_HEIGHT - pad*2;
    const ir = this.img.width / this.img.height, ar = aW / aH;
    let dW, dH;
    if (ir > ar) { dW = aW; dH = dW / ir; } else { dH = aH; dW = dH * ir; }
    image(this.img,
      floor(this.x + (this.w - dW) / 2),
      floor(this.y + TITLEBAR_HEIGHT + pad + (aH - dH) / 2),
      floor(dW), floor(dH));
  }

  inside(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }
  startDrag(mx, my) { this.dragging = true; this.offsetX = mx - this.x; this.offsetY = my - this.y; }
  clickClose(mx, my) {
    const r = this._closeRect(floor(this.x), floor(this.y));
    return mx > r.x && mx < r.x + BUTTON_SIZE && my > r.y && my < r.y + BUTTON_SIZE;
  }
}

function drawTabMainBox() {
  const L = getTabMainBoxLayout();
  const { boxW, boxH, x, y, textAreaW, typed, nextButX, nextButY, NEXT_W, NEXT_H } = L;

  if (tab_nextAppear !== null && millis() >= tab_nextAppear)
    tab_nextAlpha = min(255, tab_nextAlpha + 5);

  if (tab_nextAlpha > 200) {
    if (mouseX >= nextButX-NEXT_W/2 && mouseX <= nextButX+NEXT_W/2 &&
        mouseY >= nextButY-NEXT_H/2 && mouseY <= nextButY+NEXT_H/2) cursor(HAND);
  }

  push();
  fill(252,235,222); stroke(95,168,194); strokeWeight(3);
  rect(floor(x), floor(y), boxW, boxH, 8);

  const TAG_W = 180, TAG_H = 58;
  const tagX = floor(x) + 18, tagCX = tagX + TAG_W / 2;
  noStroke(); fill(95,168,194);
  rect(tagX, floor(y)-28, TAG_W, TAG_H, 8);
  fill(125,32,39); textAlign(CENTER,CENTER); textFont("Jersey 15"); textSize(45);
  text("Trace", tagCX, floor(y)-28+TAG_H/2);

  fill(125,32,39); noStroke();
  textAlign(LEFT,CENTER); textFont("Jersey 15"); textSize(L.TEXT_SIZE);
  text(typed, floor(x)+32, floor(y)+boxH/2, textAreaW);

  if (tab_nextAlpha > 0) {
    fill(153,148,54,tab_nextAlpha); noStroke(); rectMode(CENTER);
    rect(floor(nextButX), floor(nextButY), NEXT_W, NEXT_H, 6);
    fill(125,32,39,tab_nextAlpha);
    textAlign(CENTER,CENTER); textFont("Jersey 15"); textSize(54);
    text("THE END", floor(nextButX), floor(nextButY)-1);
  }
  pop();
}

function tab_updateMainText() {
  const now = millis();
  if (tab_mainTextTypingState.finishedAll) return;
  const msg = TAB_MAIN_TEXT_MESSAGES[tab_mainTextTypingState.messageIndex];
  if (tab_mainTextTypingState.charCount < msg.length) {
    const elapsed = now - tab_mainTextTypingState.lastTypeAt;
    if (elapsed >= TAB_MAIN_TEXT_TYPING_SPEED) {
      const steps = floor(elapsed / TAB_MAIN_TEXT_TYPING_SPEED);
      tab_mainTextTypingState.charCount   = min(msg.length, tab_mainTextTypingState.charCount + steps);
      tab_mainTextTypingState.lastTypeAt += steps * TAB_MAIN_TEXT_TYPING_SPEED;
      if (tab_mainTextTypingState.charCount === msg.length)
        tab_mainTextTypingState.completedAt = now;
    }
    return;
  }
  if (tab_mainTextTypingState.completedAt !== null &&
      now - tab_mainTextTypingState.completedAt > TAB_MAIN_TEXT_DELAY) {
    if (tab_mainTextTypingState.messageIndex < TAB_MAIN_TEXT_MESSAGES.length - 1) {
      tab_mainTextTypingState.messageIndex++;
      tab_mainTextTypingState.charCount   = 0;
      tab_mainTextTypingState.lastTypeAt  = now;
      tab_mainTextTypingState.completedAt = null;
    } else {
      tab_mainTextTypingState.finishedAll = true;
      tab_mainTextTypingState.finishedAt  = now;
    }
  }
}

function tab_updateFinalMainText() {
  if (!tab_mainTextTypingState.finishedAll || tab_finalMainTextState.completed) return;
  const now = millis();
  if (!tab_finalMainTextState.started) {
    if (now - tab_mainTextTypingState.finishedAt > TAB_FINAL_MAIN_TEXT_DELAY) {
      tab_finalMainTextState.started    = true;
      tab_finalMainTextState.lastTypeAt = now;
    }
    return;
  }
  if (now - tab_finalMainTextState.lastTypeAt >= TAB_MAIN_TEXT_TYPING_SPEED) {
    tab_finalMainTextState.charCount++;
    tab_finalMainTextState.lastTypeAt = now;
    if (tab_finalMainTextState.charCount >= TAB_FINAL_MAIN_TEXT.length) {
      tab_finalMainTextState.charCount   = TAB_FINAL_MAIN_TEXT.length;
      tab_finalMainTextState.completed   = true;
      tab_finalMainTextState.completedAt = now;
      tab_nextAppear = now + TAB_NEXT_DELAY;
    }
  }
}

function tab_updateGuide() {
  if (tab_guideState.done) { tickFlicker(tab_guideFlicker, TAB_GUIDE_TEXT, millis()); return; }
  const now = millis();
  if (!tab_guideState.started) {
    if (now - tab_guideState.startedAt > TAB_GUIDE_1_DELAY) {
      tab_guideState.started  = true;
      tab_guideState.lastType = now;
    }
    return;
  }
  if (now - tab_guideState.lastType >= TAB_GUIDE_TYPING_SPEED) {
    tab_guideState.charCount++;
    tab_guideState.lastType = now;
    if (tab_guideState.charCount >= TAB_GUIDE_TEXT.length) {
      tab_guideState.charCount     = TAB_GUIDE_TEXT.length;
      tab_guideState.done          = true;
      tab_guideFlicker.nextFlicker = now + tab_guideFlicker.flickerSpeed;
    }
  }
}

// PHẦN 8: SHARED HELPERS
function countLines(str, maxW) {
  if (!str || !str.length) return 1;
  const words = str.split(" "), spaceW = textWidth(" ");
  let lines = 1, cur = 0;
  for (let w of words) {
    const ww = textWidth(w);
    if (cur > 0 && cur + spaceW + ww > maxW) { lines++; cur = ww; }
    else cur += (cur > 0 ? spaceW : 0) + ww;
  }
  return lines;
}

function tickFlicker(flicker, fullText, now) {
  if (now < flicker.nextFlicker) return;
  const count = floor(random(1, 3));
  flicker.indices = [];
  for (let i = 0; i < count; i++) flicker.indices.push(floor(random(fullText.length)));
  flicker.nextFlicker = now + flicker.flickerSpeed + random(-400, 400);
}

function drawGuideText(fullText, displayCount, flicker) {
  if (!displayCount) return;
  push();
  textFont("Jersey 15"); textAlign(CENTER, CENTER); textSize(35); noStroke();
  const now = millis();
  let totalW = 0;
  for (let i = 0; i < displayCount; i++) totalW += textWidth(fullText[i]);
  let startX = width / 2 - totalW / 2;
  for (let i = 0; i < displayCount; i++) {
    const isFlickering = flicker.indices.includes(i);
    const fp = sin(now * 0.012 + i * 0.8);
    const a  = isFlickering ? map(fp, -1, 1, 80, 200) : 255;
    fill(125, 32, 39, a);
    const cw = textWidth(fullText[i]);
    text(fullText[i], floor(startX + cw / 2), 42);
    startX += cw;
  }
  pop();
}


// PHẦN 9: BACKGROUND DUST
function setupDustParticlesBg() {
  dustParticlesBg = [];
  const total = max(80, floor((width * height) / BACKGROUND_DUST_DENSITY));
  for (let i = 0; i < total; i++) {
    const sizeRoll = random();
    const size = sizeRoll < 0.62 ? 3 : sizeRoll < 0.88 ? 7 : random(4, 8);
    const driftAngle = random(TWO_PI);
    const driftSpeed = map(size, 2, 8, 0.12, 0.05);
    dustParticlesBg.push({
      x: random(width), y: random(height), renderX: 0, renderY: 0, size,
      glowSize: size * random(2.4, 4.8), alpha: random(75, 185),
      driftAngle, driftHeading: driftAngle, driftSpeed,
      vx: cos(driftAngle) * driftSpeed, vy: sin(driftAngle) * driftSpeed,
      turnOffset: random(1000), turnSpeed: random(0.0005, 0.0015),
      swayPhaseX: random(TWO_PI), swayPhaseY: random(TWO_PI),
      swaySpeedX: random(0.006, 0.018), swaySpeedY: random(0.006, 0.018),
      swayRadiusX: random(0.2, 0.8), swayRadiusY: random(0.3, 1.2),
      alphaPhase: random(TWO_PI), alphaSpeed: random(0.002, 0.006)
    });
  }
}

function updateDustParticlesBg() {
  const t = frameCount;
  for (let p of dustParticlesBg) {
    const targetAngle = p.driftAngle + map(noise(p.turnOffset, t * p.turnSpeed), 0, 1, -0.9, 0.9);
    p.driftHeading = lerpAngle(p.driftHeading, targetAngle, 0.02);
    p.vx = lerp(p.vx, cos(p.driftHeading) * p.driftSpeed, 0.06);
    p.vy = lerp(p.vy, sin(p.driftHeading) * p.driftSpeed, 0.06);
    p.x += p.vx; p.y += p.vy;
    p.renderX = p.x + sin(t * p.swaySpeedX + p.swayPhaseX) * p.swayRadiusX;
    p.renderY = p.y + cos(t * p.swaySpeedY + p.swayPhaseY) * p.swayRadiusY;
    const margin = p.glowSize * 0.5 + 4;
    if (p.x < -margin)            p.x = width  + margin;
    else if (p.x > width + margin) p.x = -margin;
    if (p.y < -margin)            p.y = height + margin;
    else if (p.y > height + margin) p.y = -margin;
  }
}

function drawDustParticlesBg() {
  push(); noStroke(); rectMode(CENTER);
  for (let p of dustParticlesBg) {
    const ap = 0.82 + sin(frameCount * p.alphaSpeed + p.alphaPhase) * 0.18;
    fill(147, 174, 191, p.alpha * ap);
    square(floor(p.renderX), floor(p.renderY), p.size);
  }
  pop();
}


// PHẦN 10: MUSIC
function buildMusic() {
  const savedMuted = localStorage.getItem(MUSIC_MUTED_KEY);
  if (savedMuted !== null) isMuted = savedMuted === "true";
  musicCtx = new (window.AudioContext || window.webkitAudioContext)();
  fetch("bgS.wav")
    .then(r => r.arrayBuffer())
    .then(buf => musicCtx.decodeAudioData(buf))
    .then(decoded => { musicBuffer = decoded; musicReady = true; })
    .catch(e => console.warn("Music load failed:", e));
}

function playMusic(fromOffset) {
  if (!musicReady || !musicCtx) return;
  if (musicSource) { try { musicSource.stop(); } catch(e) {} musicSource = null; }
  if (musicCtx.state === "suspended") musicCtx.resume();
  musicSource = musicCtx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop   = true;
  gainNode = musicCtx.createGain();
  gainNode.gain.value = isMuted ? 0 : 1;
  musicSource.connect(gainNode);
  gainNode.connect(musicCtx.destination);
  musicOffset    = fromOffset % musicBuffer.duration;
  musicSource.start(0, musicOffset);
  musicStartTime = musicCtx.currentTime;
  musicStarted   = true;
}

function setMusicMute(muted) {
  isMuted = muted;
  localStorage.setItem(MUSIC_MUTED_KEY, muted.toString());
  if (gainNode) gainNode.gain.setTargetAtTime(muted ? 0 : 1, musicCtx.currentTime, 0.05);
}


// PHẦN 11: UI ICONS
function getIconRects() {
  const musicX = width - ICON_MARGIN - ICON_SIZE / 2;
  const camX   = width - ICON_MARGIN - ICON_SIZE - ICON_MARGIN - ICON_SIZE / 2;
  const iconY  = ICON_TOP + ICON_SIZE / 2;
  return { music: { x: musicX, y: iconY }, cam: { x: camX, y: iconY } };
}

function drawUIIcons() {
  const icons = getIconRects();
  const hC = mouseX >= icons.cam.x-ICON_SIZE/2   && mouseX <= icons.cam.x+ICON_SIZE/2   && mouseY >= icons.cam.y-ICON_SIZE/2   && mouseY <= icons.cam.y+ICON_SIZE/2;
  const hM = mouseX >= icons.music.x-ICON_SIZE/2 && mouseX <= icons.music.x+ICON_SIZE/2 && mouseY >= icons.music.y-ICON_SIZE/2 && mouseY <= icons.music.y+ICON_SIZE/2;
  if (hC || hM) cursor(HAND);

  push(); rectMode(CENTER);
  // Camera icon
  stroke(95,168,194); strokeWeight(2.5); fill(252,235,222);
  rect(floor(icons.cam.x), floor(icons.cam.y), ICON_SIZE, ICON_SIZE, 6);
  let cx = floor(icons.cam.x), cy = floor(icons.cam.y)+2;
  noFill(); stroke(125,32,39); strokeWeight(2.3); rectMode(CENTER);
  rect(cx, cy, 32, 22, 5); circle(cx, cy, 14);
  noFill(); stroke(127,34,41);
  rect(cx-8, cy-14, 13, 7, 3);

  // Music icon
  stroke(95,168,194); strokeWeight(2.5); fill(252,235,222); rectMode(CENTER);
  rect(floor(icons.music.x), floor(icons.music.y), ICON_SIZE, ICON_SIZE, 6);
  let mx = floor(icons.music.x)-5, my = floor(icons.music.y);
  noFill(); stroke(125,32,39); strokeWeight(2.3);
  beginShape();
  vertex(mx-8,my-6); vertex(mx,my-6); vertex(mx+8,my-12);
  vertex(mx+8,my+12); vertex(mx,my+6); vertex(mx-8,my+6);
  endShape(CLOSE);
  if (!isMuted) {
    noFill(); stroke(125,32,39); strokeWeight(2.3);
    arc(mx+13, my, 12, 18, -PI*0.5, PI*0.5);
    arc(mx+13, my, 20, 28, -PI*0.5, PI*0.5);
  } else {
    stroke(95,168,194); strokeWeight(2.3);
    line(mx+10,my-10,mx+20,my+10); line(mx+20,my-10,mx+10,my+10);
  }
  pop();
}

function saveScreenshot() {
  saveCanvas("screenshot_" + day() + "_" + hour() + minute() + second(), "png");
}


// PHẦN 12: FADE OVERLAY 
let fadeOverlay     = 0;     
let fadeDirection   = 0;     
let fadeCallback    = null;  

function startFadeOut(callback) {
  fadeOverlay   = 0;
  fadeDirection = 1;
  fadeCallback  = callback;
}

function updateFade() {
  if (fadeDirection === 0) return;
  if (fadeDirection === 1) {
    fadeOverlay += 12;
    if (fadeOverlay >= 255) {
      fadeOverlay = 255;
      fadeDirection = -1;
      if (fadeCallback) { fadeCallback(); fadeCallback = null; }
    }
  } else if (fadeDirection === -1) {
    fadeOverlay -= 8;
    if (fadeOverlay <= 0) { fadeOverlay = 0; fadeDirection = 0; }
  }
}

function drawFade() {
  if (fadeOverlay <= 0) return;
  push(); noStroke(); fill(252, 235, 222, fadeOverlay); rect(0, 0, width, height); pop();
}


// PHẦN 13: p5.js LIFECYCLE
function preload() {
  thr_img = loadImage("img/thread.jpg");
  tabImgs.push(loadImage("img/city.png"));
  tabImgs.push(loadImage("img/me.jpg"));
  tabImgs.push(loadImage("img/cat.jpg"));
  tabImgs.push(loadImage("img/staff.jpg"));
  tabImgs.push(loadImage("img/walk.png"));
  tabImgs.push(loadImage("img/thread.jpg"));
}

function disableSmoothing() {
  noSmooth();
  drawingContext.imageSmoothingEnabled       = false;
  drawingContext.msImageSmoothingEnabled     = false;
  drawingContext.webkitImageSmoothingEnabled = false;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(window.devicePixelRatio || 1);
  disableSmoothing();
  textFont("Jersey 15");
  textAlign(CENTER, CENTER);

  setupDustParticlesBg();
  buildMusic();
  setupOrbitals();

  thr_baseImg = thr_img.get();

  setupLoading();
}

function draw() {
  background(252, 235, 222);
  disableSmoothing();

  updateDustParticlesBg();
  drawDustParticlesBg();

  if (currentScreen === "loading") {
    updateDrawLoading();

  } else if (currentScreen === "landing") {
    drawLanding();

  } else if (currentScreen === "landing_to_orbitals") {
    drawTransitionLandingToOrb();

  } else if (currentScreen === "orbitals") {
    cursor(ARROW);
    updateOrbitalScene();
    drawOrbitalScene();
    drawOrbMainBox();
    updateOrbGuide();
    drawOrbGuide();
    drawUIIcons();
    if (orb_barDragging) orb_updateBar();

  } else if (currentScreen === "thread") {
    cursor(ARROW);
    drawCharImageThr();
    for (let t of thr_redThreads) t.update();
    for (let t of thr_redThreads) t.display();
    for (let n of thr_nodes) { noStroke(); fill(95,168,194); circle(n.x, n.y, 4); }
    thr_updateGuide();
    drawGuideText(THR_GUIDE_TEXT_1, thr_guideState.charCount, thr_guideFlicker);
    thr_updateMainText();
    thr_updateFinalMainText();
    drawThrMainBox();
    drawUIIcons();

  } else if (currentScreen === "tabs") {
    cursor(ARROW);
    for (let tab of tabs) tab.display();
    tab_updateGuide();
    drawGuideText(TAB_GUIDE_TEXT, tab_guideState.charCount, tab_guideFlicker);
    tab_updateMainText();
    tab_updateFinalMainText();
    drawTabMainBox();
    drawUIIcons();
  }

  updateFade();
  drawFade();
}

function drawCharImageThr() {
  push(); noStroke(); textSize(9); textFont("monospace");
  for (let p of thr_charPoints) {
    fill(34, 103, 119, p.alpha);
    text(p.char, p.x, p.y);
  }
  pop();
}


// PHẦN 14: INPUT EVENTS
function mousePressed() {
  // UI icons
  if (currentScreen === "orbitals" || currentScreen === "thread" || currentScreen === "tabs") {
    const icons = getIconRects();
    if (mouseX >= icons.cam.x-ICON_SIZE/2   && mouseX <= icons.cam.x+ICON_SIZE/2   &&
        mouseY >= icons.cam.y-ICON_SIZE/2   && mouseY <= icons.cam.y+ICON_SIZE/2)   { saveScreenshot(); return; }
    if (mouseX >= icons.music.x-ICON_SIZE/2 && mouseX <= icons.music.x+ICON_SIZE/2 &&
        mouseY >= icons.music.y-ICON_SIZE/2 && mouseY <= icons.music.y+ICON_SIZE/2) { setMusicMute(!isMuted); return; }
  }

  if (currentScreen === "landing") {
    const layout = landingLayout();
    if (hoverStartBut(getStartButRect(layout.buttonY))) {
      currentScreen = "landing_to_orbitals";
      enterOrbitalScene();
      return;
    }
  }

  if (currentScreen === "orbitals") {
    // NEXT button
    if (orb_nextAlpha > 200) {
      const L = getOrbMainBoxLayout();
      if (mouseX >= L.nextButX-L.NEXT_W/2 && mouseX <= L.nextButX+L.NEXT_W/2 &&
          mouseY >= L.nextButY-L.NEXT_H/2 && mouseY <= L.nextButY+L.NEXT_H/2) {
        startFadeOut(() => {
          setupThread();
          currentScreen = "thread";
        });
        return;
      }
    }
    // Bar drag
    if (orb_barAlpha > 200) {
      const L = getOrbMainBoxLayout();
      const { barX, barY, BAR_W } = L;
      if (mouseX >= barX-20 && mouseX <= barX+BAR_W+20 &&
          mouseY >= barY-20 && mouseY <= barY+20) {
        orb_barDragging = true; orb_updateBar(); return;
      }
    }
  }

  if (currentScreen === "thread") {
    if (thr_nextAlpha > 200) {
      const L = getThrMainBoxLayout();
      if (mouseX >= L.nextButX-L.NEXT_W/2 && mouseX <= L.nextButX+L.NEXT_W/2 &&
          mouseY >= L.nextButY-L.NEXT_H/2 && mouseY <= L.nextButY+L.NEXT_H/2) {
        startFadeOut(() => {
          setupTabs();
          currentScreen = "tabs";
        });
        return;
      }
    }
  }

  if (currentScreen === "tabs") {
    if (tab_nextAlpha > 200) {
      const L = getTabMainBoxLayout();
      if (mouseX >= L.nextButX-L.NEXT_W/2 && mouseX <= L.nextButX+L.NEXT_W/2 &&
          mouseY >= L.nextButY-L.NEXT_H/2 && mouseY <= L.nextButY+L.NEXT_H/2) {
        // THE END
        startFadeOut(() => {
          buildLanding();
          currentScreen = "landing";
        });
        return;
      }
    }
    // Close tab
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].clickClose(mouseX, mouseY)) { tabs.splice(i, 1); return; }
    }
    // Bring to front / drag
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].inside(mouseX, mouseY)) {
        let tab = tabs.splice(i, 1)[0];
        tabs.push(tab);
        tab.startDrag(mouseX, mouseY);
        return;
      }
    }
    // Create new tab
    tabs.push(new RetroTab(mouseX, mouseY, random(["text", "image"])));
  }
}

function mouseReleased() {
  orb_barDragging = false;
  for (let tab of tabs) tab.dragging = false;
}

function mouseDragged() {
  let top = tabs[tabs.length - 1];
  if (top && top.dragging) { top.x = mouseX - top.offsetX; top.y = mouseY - top.offsetY; }
}

function orb_updateBar() {
  const L = getOrbMainBoxLayout();
  orb_barValue = constrain(map(mouseX, L.barX, L.barX + L.BAR_W, 0, 100), 0, 100);
}


// PHẦN 15: UTILITIES
function lerpAngle(start, end, amt) {
  let diff = ((end - start + PI) % TWO_PI) - PI;
  if (diff < -PI) diff += TWO_PI;
  return start + diff * amt;
}
function easeOutCubic(t)   { return 1 - pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - pow(-2*t+2, 3)/2; }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disableSmoothing();
  setupDustParticlesBg();
  if (currentScreen === "thread") {
    thr_charPoints = []; thr_nodes = []; thr_redThreads = [];
    thr_buildCharImage(); thr_createNodes(); thr_createThreads();
  }
}