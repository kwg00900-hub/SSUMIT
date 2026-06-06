// ===================================================
// [통합 최종본] 모션 악보 넘기기 + 게임오버 + 점수/콤보 시스템 (main.js)
// ===================================================

let masterBgm;
let globalSongTime = 0;
let isSongPlaying = false;
let isHelpVisible = false;
let isGameEnded = false;
let isGameOver = false;

// 🔘 UI 요소 관리
let uiButtons = {
  start:  { x: 0, y: 0, w: 220, h: 60, label: "START GAME" },
  help:   { x: 0, y: 0, w: 220, h: 60, label: "HOW TO PLAY" },
  full:   { x: 0, y: 0, w: 120, h: 40, label: "FULLSCREEN" },
  replay: { x: 0, y: 0, w: 220, h: 60, label: "REPLAY" }
};

// 🌟 타임라인 정의 (ms 단위)
const SESSION_TIMELINE = {
  KEYBOARD: { start: 0,      end: 17500  },
  BASS1:    { start: 17500,  end: 31500  },
  DRUM:     { start: 31500,  end: 48000  },
  BASS2:    { start: 48000,  end: 100000 }
};

// 🎵 BPM 126 기준 박자 계산
const BPM = 126;
const ONE_BEAT_MS = (60 / BPM) * 1000;
const FOUR_BEATS_MS = ONE_BEAT_MS * 4;

// 📸 모션 인식 및 악보 넘기기 관련 변수
let mainCapture;
let mainPrevFrame;
let rightCircleTriggered = false;
let rightTriggerTime = 0;
let motionSuccessList = { BASS1: false, DRUM: false, BASS2: false };

// ============================================
// 🔧 초기화
// ============================================
function preload() {
  masterBgm = loadSound('126.mp3');
  if (typeof keyboardPreload === 'function') keyboardPreload();
  if (typeof bassPreload    === 'function') bassPreload();
  if (typeof drumPreload    === 'function') drumPreload();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  mainCapture = createCapture(VIDEO);
  mainCapture.size(400, 150);
  mainCapture.hide();
  mainPrevFrame = createImage(400, 150);

  if (typeof keyboardSetup === 'function') keyboardSetup();
  if (typeof bassSetup     === 'function') bassSetup();
  if (typeof drumSetup     === 'function') drumSetup();
  updateUIElements();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateUIElements();
}

function updateUIElements() {
  uiButtons.start.x  = width / 2 - 110;
  uiButtons.start.y  = height / 2 + 60;
  uiButtons.help.x   = width / 2 - 110;
  uiButtons.help.y   = height / 2 + 140;
  uiButtons.full.x   = width - 140;
  uiButtons.full.y   = 20;
  uiButtons.replay.x = width / 2 - 110;
  uiButtons.replay.y = height / 2 + 80;
}

// ============================================
// 🖼️ 메인 드로우 루프
// ============================================
function draw() {
  background(15, 15, 25);

  if (!isSongPlaying && !isGameEnded && !isGameOver) {
    drawStartScreen();
  } else if (isGameOver) {
    drawGameOverScreen();
  } else if (isGameEnded) {
    drawEndScreen();
  } else {
    // 게임 진행 중
    if (masterBgm && masterBgm.isPlaying()) {
      globalSongTime = masterBgm.currentTime() * 1000;
    }

    if (globalSongTime >= SESSION_TIMELINE.BASS2.end) {
      isSongPlaying = false;
      isGameEnded = true;
      if (masterBgm) masterBgm.stop();
      return;
    }

    // 1. KEYBOARD SESSION
    if (globalSongTime >= SESSION_TIMELINE.KEYBOARD.start && globalSongTime < SESSION_TIMELINE.KEYBOARD.end) {
      if (typeof keyboardDraw === 'function') keyboardDraw();
      drawSessionIndicator("KEYBOARD SESSION");

      if (globalSongTime >= SESSION_TIMELINE.KEYBOARD.end - FOUR_BEATS_MS) {
        drawPageTurnOverlay(SESSION_TIMELINE.KEYBOARD.end, "BASS1");
      }
    }
    // 2. BASS SESSION (1)
    else if (globalSongTime >= SESSION_TIMELINE.BASS1.start && globalSongTime < SESSION_TIMELINE.BASS1.end) {
      if (!motionSuccessList.BASS1) { triggerGameOver(); return; }

      if (typeof bassDraw === 'function') bassDraw();
      drawSessionIndicator("BASS SESSION (1)");

      if (globalSongTime >= SESSION_TIMELINE.BASS1.end - FOUR_BEATS_MS) {
        drawPageTurnOverlay(SESSION_TIMELINE.BASS1.end, "DRUM");
      }
    }
    // 3. DRUM SESSION
    else if (globalSongTime >= SESSION_TIMELINE.DRUM.start && globalSongTime < SESSION_TIMELINE.DRUM.end) {
      if (!motionSuccessList.DRUM) { triggerGameOver(); return; }

      if (typeof drumDraw === 'function') drumDraw();
      drawSessionIndicator("DRUM SESSION");

      if (globalSongTime >= SESSION_TIMELINE.DRUM.end - FOUR_BEATS_MS) {
        drawPageTurnOverlay(SESSION_TIMELINE.DRUM.end, "BASS2");
      }
    }
    // 4. BASS SESSION (2)
    else if (globalSongTime >= SESSION_TIMELINE.BASS2.start && globalSongTime < SESSION_TIMELINE.BASS2.end) {
      if (!motionSuccessList.BASS2) { triggerGameOver(); return; }

      if (typeof bassDraw === 'function') bassDraw();
      drawSessionIndicator("BASS SESSION (2)");
    }

    drawMasterOverlay();
  }
}

// ============================================
// 📸 모션 인식 오버레이 (거울 모드 + 디바운스)
// ============================================
function drawPageTurnOverlay(targetTime, nextSessionKey) {
  if (motionSuccessList[nextSessionKey]) return;

  push();
  translate(width / 2, height / 2);

  rectMode(CENTER);
  fill(0, 0, 0, 190);
  stroke(255, 50, 50);
  strokeWeight(3);
  rect(0, 0, 500, 320, 15);

  noStroke();
  fill(255, 200, 0);
  textAlign(CENTER, CENTER);
  textSize(22);
  textStyle(BOLD);
  text("⚠️ SWIPE HAND TO TURN PAGE! ⚠️", 0, -130);

  // ⏱️ BPM 126 정밀 카운트다운
  let timeLeft = targetTime - globalSongTime;
  let currentBeatCount = Math.ceil(timeLeft / ONE_BEAT_MS);

  if (currentBeatCount > 0 && currentBeatCount <= 4) {
    textSize(55);
    fill(255, 50, 50);
    text(currentBeatCount, 0, -80);
  }

  // 🔄 카메라 피드 좌우반전(거울 모드)
  push();
  scale(-1, 1);
  imageMode(CENTER);
  image(mainCapture, 0, 40, 360, 135);
  pop();

  // 원 위치 (화면 중앙 기준)
  let leftCircleX  = -130;
  let rightCircleX =  130;
  let circlesY     =   40;

  // 웹캠 원본 좌표 기준으로 모션 체크
  let rightHit = checkMainMotion(80,  95, 25);
  let leftHit  = checkMainMotion(320, 95, 25);

  let currentTime = millis();

  // 🔥 디바운스 시퀀스
  if (rightHit && !rightCircleTriggered && (currentTime - rightTriggerTime > 300)) {
    rightCircleTriggered = true;
    rightTriggerTime = currentTime;
  }

  if (rightCircleTriggered && currentTime - rightTriggerTime > 1000) {
    rightCircleTriggered = false;
  }

  let timeGap = currentTime - rightTriggerTime;
  if (rightCircleTriggered && leftHit && (timeGap >= 150) && (timeGap <= 1000)) {
    motionSuccessList[nextSessionKey] = true;
    rightCircleTriggered = false;
  }

  // 🎨 원 시각화
  strokeWeight(4);
  noFill();

  // 우측 원 (1번 타겟)
  if (rightCircleTriggered) {
    stroke(0, 255, 100);
  } else {
    stroke(rightHit ? color(0, 255, 100) : color(255, 50, 50));
  }
  circle(rightCircleX, circlesY, 50);

  // 좌측 원 (2번 타겟)
  if (motionSuccessList[nextSessionKey]) {
    stroke(0, 255, 100);
  } else if (rightCircleTriggered) {
    stroke(0, 200, 255);
  } else {
    stroke(150);
  }
  circle(leftCircleX, circlesY, 50);

  noStroke();
  fill(255);
  textSize(13);
  text("1. RIGHT START",       rightCircleX, circlesY + 45);
  text("2. LEFT END (IN 1s)",  leftCircleX,  circlesY + 45);

  mainPrevFrame.copy(mainCapture, 0, 0, 400, 150, 0, 0, 400, 150);
  pop();
}

function checkMainMotion(cx, cy, r) {
  mainCapture.loadPixels();
  mainPrevFrame.loadPixels();
  if (!mainCapture.pixels  || mainCapture.pixels.length  === 0 ||
      !mainPrevFrame.pixels || mainPrevFrame.pixels.length === 0) return false;

  let motionCount = 0;
  let totalPixelsChecked = 0;

  for (let y = 0; y < mainCapture.height; y += 2) {
    for (let x = 0; x < mainCapture.width; x += 2) {
      if (dist(x, y, cx, cy) < r) {
        totalPixelsChecked++;
        let index = (x + y * mainCapture.width) * 4;
        let diff = dist(
          mainCapture.pixels[index],   mainCapture.pixels[index+1],   mainCapture.pixels[index+2],
          mainPrevFrame.pixels[index], mainPrevFrame.pixels[index+1], mainPrevFrame.pixels[index+2]
        );
        if (diff > 65) motionCount++;
      }
    }
  }
  if (totalPixelsChecked === 0) return false;
  return (motionCount / totalPixelsChecked) > 0.22;
}

function triggerGameOver() {
  isSongPlaying = false;
  isGameOver = true;
  if (masterBgm) masterBgm.stop();
}

// ============================================
// 🎨 UI: 시작 / 게임오버 / 클리어 화면
// ============================================
function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(80);
  text("SSUMIT", width / 2, height / 2 - 100);
  textSize(20);
  fill(150);
  text("썸썸써밋: 김도경, 김도현, 김도현", width / 2, height / 2 - 40);

  drawButton(uiButtons.start);
  drawButton(uiButtons.help);
  drawButton(uiButtons.full);

  if (isHelpVisible) drawHelpPopup();
}

function drawGameOverScreen() {
  textAlign(CENTER, CENTER);
  fill(255, 50, 50);
  textSize(70);
  textStyle(BOLD);
  text("GAME OVER", width / 2, height / 2 - 80);

  textSize(20);
  fill(200);
  textStyle(NORMAL);
  text("악보를 넘기지 못해 연주가 중단되었습니다!", width / 2, height / 2);

  drawButton(uiButtons.replay);
}

function drawEndScreen() {
  // 각 세션 점수 합산
  let totalScore = (typeof keyboardScore !== 'undefined' ? keyboardScore : 0) +
                   (typeof bassScore     !== 'undefined' ? bassScore     : 0) +
                   (typeof drumScore     !== 'undefined' ? drumScore     : 0);

  let gameGrade = "C";
  if      (totalScore >= 15000) gameGrade = "👑 S";
  else if (totalScore >= 10000) gameGrade = "A";
  else if (totalScore >= 5000)  gameGrade = "B";

  textAlign(CENTER, CENTER);

  fill(255, 215, 0);
  textSize(60);
  text("STAGE CLEAR", width / 2, height / 2 - 150);

  fill(255);
  textSize(20);
  text("FINAL SCORE", width / 2, height / 2 - 80);

  textSize(42);
  fill(0, 230, 255);
  textStyle(BOLD);
  text(totalScore.toLocaleString(), width / 2, height / 2 - 40);

  textSize(26);
  fill(255, 100, 150);
  text(`GRADE : ${gameGrade}`, width / 2, height / 2 + 15);
  textStyle(NORMAL);

  fill(160);
  textSize(15);
  text("드럼: 김도경 | 베이스: 김도현 | 건반: 방준혁", width / 2, height / 2 + 70);

  drawButton(uiButtons.replay);
}

function drawButton(btn) {
  let isHovered = (mouseX > btn.x && mouseX < btn.x + btn.w &&
                   mouseY > btn.y && mouseY < btn.y + btn.h);
  fill(isHovered ? 50 : 20);
  stroke(255);
  strokeWeight(2);
  rect(btn.x, btn.y, btn.w, btn.h, 10);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

function drawHelpPopup() {
  fill(0, 0, 0, 230);
  rect(0, 0, width, height);
  fill(20, 20, 30);
  stroke(0, 230, 255);
  rect(width/2 - 300, height/2 - 200, 600, 400, 20);
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(15);
  let desc =
    "이 게임은 한 곡 안에서 밴드의 세가지 세션(베이스, 건반, 드럼)을 모두 플레이 할 수 있는 리듬게임입니다.\n\n" +
    "베이스: 마우스를 위 아래로 움직여 조준점을 줄 위에 위치시키고 타이밍을 맞춰 스페이스바/클릭 합니다.\n\n" +
    "건반: 블럭이 떨어지는 타이밍에 맞추어 지정된 키보드를 누릅니다.\n\n" +
    "드럼: 드럼 악보 위 지정된 키를 타이밍에 맞추어 누릅니다.\n\n" +
    "🔥 중요 🔥: 악기 파트가 바뀌기 4박자 전 화면에 '악보 넘기기 창'이 뜹니다. " +
    "카운트가 끝나기 전에 카메라의 오른쪽 원을 터치한 뒤 1초 내에 왼쪽 원을 터치하여 악보를 넘겨야 합니다. " +
    "실패 시 즉시 게임 오버됩니다!";
  text(desc, width/2 - 270, height/2 - 170, 540, 350);
  textAlign(CENTER, CENTER);
  text("[클릭하여 닫기]", width/2, height/2 + 170);
}

function drawSessionIndicator(sessionName) {
  push();
  rectMode(CENTER);
  fill(0, 0, 0, 150);
  stroke(0, 230, 255, 100);
  strokeWeight(1);
  rect(width / 2, 50, 280, 35, 8);
  noStroke();
  fill(0, 230, 255);
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(BOLD);
  text(sessionName, width / 2, 50);
  pop();
}

// 실시간 점수 + 콤보 + 시간 오버레이
function drawMasterOverlay() {
  let liveTotalScore = (typeof keyboardScore !== 'undefined' ? keyboardScore : 0) +
                       (typeof bassScore     !== 'undefined' ? bassScore     : 0) +
                       (typeof drumScore     !== 'undefined' ? drumScore     : 0);

  let liveCombo = 0;
  if (globalSongTime >= SESSION_TIMELINE.KEYBOARD.start && globalSongTime < SESSION_TIMELINE.KEYBOARD.end) {
    liveCombo = typeof keyboardCombo !== 'undefined' ? keyboardCombo : 0;
  } else if ((globalSongTime >= SESSION_TIMELINE.BASS1.start && globalSongTime < SESSION_TIMELINE.BASS1.end) ||
             (globalSongTime >= SESSION_TIMELINE.BASS2.start && globalSongTime < SESSION_TIMELINE.BASS2.end)) {
    liveCombo = typeof bassCombo !== 'undefined' ? bassCombo : 0;
  } else if (globalSongTime >= SESSION_TIMELINE.DRUM.start && globalSongTime < SESSION_TIMELINE.DRUM.end) {
    liveCombo = typeof drumCombo !== 'undefined' ? drumCombo : 0;
  }

  push();
  textAlign(RIGHT, TOP);

  textSize(18);
  textStyle(BOLD);
  fill(255, 255, 255, 160);
  text(`SCORE: ${liveTotalScore.toLocaleString()}`, width - 30, 20);

  textSize(15);
  fill(0, 230, 255);
  text(`COMBO: ${liveCombo}`, width - 30, 48);

  textSize(12);
  textStyle(NORMAL);
  fill(150);
  text(`TIME: ${(globalSongTime / 1000).toFixed(1)} / ${(SESSION_TIMELINE.BASS2.end / 1000).toFixed(0)}s`, width - 30, 75);
  pop();
}

// ============================================
// 🖱️ 입력 및 조작
// ============================================
function mousePressed() {
  if (isHelpVisible) { isHelpVisible = false; return; }

  // 풀스크린 버튼
  if (mouseX > uiButtons.full.x && mouseX < uiButtons.full.x + uiButtons.full.w &&
      mouseY > uiButtons.full.y && mouseY < uiButtons.full.y + uiButtons.full.h) {
    fullscreen(!fullscreen()); return;
  }

  // 시작 버튼
  if (!isSongPlaying && !isGameEnded && !isGameOver &&
      mouseX > uiButtons.start.x && mouseX < uiButtons.start.x + uiButtons.start.w &&
      mouseY > uiButtons.start.y && mouseY < uiButtons.start.y + uiButtons.start.h) {
    startEnsembleGame();
  }

  // 도움말 버튼
  if (!isSongPlaying && !isGameEnded && !isGameOver &&
      mouseX > uiButtons.help.x && mouseX < uiButtons.help.x + uiButtons.help.w &&
      mouseY > uiButtons.help.y && mouseY < uiButtons.help.y + uiButtons.help.h) {
    isHelpVisible = true;
  }

  // 리플레이 버튼 (클리어 또는 게임오버 화면)
  if ((isGameEnded || isGameOver) &&
      mouseX > uiButtons.replay.x && mouseX < uiButtons.replay.x + uiButtons.replay.w &&
      mouseY > uiButtons.replay.y && mouseY < uiButtons.replay.y + uiButtons.replay.h) {
    isGameOver  = false;
    isGameEnded = false;
    startEnsembleGame();
  }
}

function startEnsembleGame() {
  if (masterBgm) {
    masterBgm.stop();
    masterBgm.play();
  }
  isSongPlaying = true;
  globalSongTime = 0;

  // 모션 상태 초기화
  motionSuccessList   = { BASS1: false, DRUM: false, BASS2: false };
  rightCircleTriggered = false;

  // 점수 및 콤보 초기화
  if (typeof keyboardScore !== 'undefined') { keyboardScore = 0; keyboardCombo = 0; keyboardMaxCombo = 0; }
  if (typeof bassScore     !== 'undefined') { bassScore     = 0; bassCombo     = 0; }
  if (typeof drumScore     !== 'undefined') { drumScore     = 0; drumCombo     = 0; }

  // 채보 재생성 (리플레이 대응)
  if (typeof keyboardCreateChart === 'function') keyboardCreateChart();
  if (typeof bassCreateChart     === 'function') bassCreateChart();
  if (typeof drumCreateChart     === 'function') drumCreateChart();
}

function keyPressed() {
  if (!isSongPlaying) return;

  if (globalSongTime >= SESSION_TIMELINE.KEYBOARD.start && globalSongTime < SESSION_TIMELINE.KEYBOARD.end) {
    if (typeof keyboardKeyPressed === 'function') keyboardKeyPressed();
  }
  else if ((globalSongTime >= SESSION_TIMELINE.BASS1.start && globalSongTime < SESSION_TIMELINE.BASS1.end) ||
           (globalSongTime >= SESSION_TIMELINE.BASS2.start && globalSongTime < SESSION_TIMELINE.BASS2.end)) {
    if (typeof bassKeyPressed === 'function') bassKeyPressed();
  }
  else if (globalSongTime >= SESSION_TIMELINE.DRUM.start && globalSongTime < SESSION_TIMELINE.DRUM.end) {
    if (typeof drumKeyPressed === 'function') drumKeyPressed();
  }
}

function keyReleased() {
  if (!isSongPlaying) return;

  if (globalSongTime >= SESSION_TIMELINE.KEYBOARD.start && globalSongTime < SESSION_TIMELINE.KEYBOARD.end) {
    if (typeof keyboardKeyReleased === 'function') keyboardKeyReleased();
  }
  else if ((globalSongTime >= SESSION_TIMELINE.BASS1.start && globalSongTime < SESSION_TIMELINE.BASS1.end) ||
           (globalSongTime >= SESSION_TIMELINE.BASS2.start && globalSongTime < SESSION_TIMELINE.BASS2.end)) {
    if (typeof bassKeyReleased === 'function') bassKeyReleased();
  }
  else if (globalSongTime >= SESSION_TIMELINE.DRUM.start && globalSongTime < SESSION_TIMELINE.DRUM.end) {
    if (typeof drumKeyReleased === 'function') drumKeyReleased();
  }
}
