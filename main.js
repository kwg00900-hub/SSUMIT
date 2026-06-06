// ===================================================
// [통합 최종 리팩토링] 모션 악보 넘기기 + 세련된 결과 화면 스타일 반영 (main.js)
// ===================================================

let masterBgm;
let globalSongTime = 0;
let isSongPlaying = false;
let isHelpVisible = false;
let isGameEnded = false;
let isGameOver = false;

// 🏆 [수정 가능] 등급별 최종 점수 기준 컷라인
const GRADE_CUTLINE = {
  S: 15000,
  A: 10000,
  B: 5000
};

// 🔘 UI 요소 관리 (시작 화면용 p5.js 내장 버튼 위치)
let uiButtons = {
  start:  { x: 0, y: 0, w: 240, h: 55, label: "START GAME" },
  help:   { x: 0, y: 0, w: 240, h: 55, label: "HOW TO PLAY" },
  full:   { x: 0, y: 0, w: 140, h: 40, label: "FULLSCREEN" }
};

// 🔘 결과 및 게임오버 화면용 DOM 버튼
let restartBtn;

// 🌟 타임라인 정의 (ms 단위)
const SESSION_TIMELINE = {
  KEYBOARD1: { start: 0,   end: 17043  },
  BASS1:     { start: 17043,  end: 32281  },
  DRUM1:     { start: 32281,  end: 47519  },
  BASS2:     { start: 47519,  end: 62757  },
  DRUM2:     { start: 62757,  end: 77995  },
  KEYBOARD2: { start: 77995,  end: 93233  },
  BASS3:     { start: 93233,  end: 108471 },
  DRUM3:     { start: 108471, end: 123710 },
  KEYBOARD3: { start: 123710, end: 138948 },
  BASS4:     { start: 138948, end: 150376 },
  KEYBOARD4: { start: 150376, end: 165614 },
  DRUM4:     { start: 165614, end: 182757 }
};

const SESSION_ORDER = [
  { key: "KEYBOARD1", type: "KEYBOARD", name: "KEYBOARD SESSION (1)" },
  { key: "BASS1",     type: "BASS",     name: "BASS SESSION (1)" },
  { key: "DRUM1",     type: "DRUM",     name: "DRUM SESSION (1)" },
  { key: "BASS2",     type: "BASS",     name: "BASS SESSION (2)" },
  { key: "DRUM2",     type: "DRUM",     name: "DRUM SESSION (2)" },
  { key: "KEYBOARD2", type: "KEYBOARD", name: "KEYBOARD SESSION (2)" },
  { key: "BASS3",     type: "BASS",     name: "BASS SESSION (3)" },
  { key: "DRUM3",     type: "DRUM",     name: "DRUM SESSION (3)" },
  { key: "KEYBOARD3", type: "KEYBOARD", name: "KEYBOARD SESSION (3)" },
  { key: "BASS4",     type: "BASS",     name: "BASS SESSION (4)" },
  { key: "KEYBOARD4", type: "KEYBOARD", name: "KEYBOARD SESSION (4)" },
  { key: "DRUM4",     type: "DRUM",     name: "DRUM SESSION (4)" }
];

const BPM = 126;
const ONE_BEAT_MS = (60 / BPM) * 1000;
const FOUR_BEATS_MS = ONE_BEAT_MS * 4;

let mainCapture;
let mainPrevFrame;
let rightCircleTriggered = false;
let rightTriggerTime = 0;
let motionSuccessList = {};

// ============================================
// 🔧 초기화 및 셋업
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
  initRestartButton(); // PLAY AGAIN 버튼 생성
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateUIElements();
}

function updateUIElements() {
  uiButtons.start.x  = width / 2 - 120;
  uiButtons.start.y  = height / 2 + 40;
  uiButtons.help.x   = width / 2 - 120;
  uiButtons.help.y   = height / 2 + 115;
  uiButtons.full.x   = width - 170;
  uiButtons.full.y   = 20;
}

// 🔘 DOM 버튼 생성 및 스타일링 (결과/게임오버 화면용)
function initRestartButton() {
  restartBtn = createButton('GO TO MAIN');
  restartBtn.style('background-color', '#00E5FF');
  restartBtn.style('color', '#000000');
  restartBtn.style('font-family', 'Helvetica');
  restartBtn.style('font-weight', 'bold');
  restartBtn.style('border', 'none');
  restartBtn.style('border-radius', '8px');
  restartBtn.style('cursor', 'pointer');
  restartBtn.style('transition', 'all 0.2s ease');
  
  restartBtn.mouseOver(() => {
    restartBtn.style('transform', 'scale(1.05)');
    restartBtn.style('box-shadow', '0px 0px 15px rgba(0, 229, 255, 0.5)');
  });
  restartBtn.mouseOut(() => {
    restartBtn.style('transform', 'scale(1)');
    restartBtn.style('box-shadow', 'none');
  });

  // 🔔 [수정] 매개변수 e를 추가하고 e.stopPropagation() 처리로 버블링 완벽 방지
  restartBtn.mousePressed((e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation(); // p5.js 전역 mousePressed()로 이벤트가 넘어가는 것을 막음
    }
    
    isSongPlaying = false; 
    isGameOver = false;    
    isGameEnded = false;   
    isHelpVisible = false; // 혹시 모를 도움말 플래그도 안전하게 꺼두기
    globalSongTime = 0;    
    
    if (masterBgm) {
      masterBgm.stop();    
    }
    
    restartBtn.hide();     
  });
  
  restartBtn.hide(); 
}

function updateButtonPosition() {
  let btnWidth = max(220, width * 0.16);
  let btnHeight = 55;
  restartBtn.size(btnWidth, btnHeight);
  restartBtn.position(width / 2 - btnWidth / 2, height * 0.62);
}

// ============================================
// 🖼️ 메인 드로우 루프
// ============================================
function draw() {
  // 배경 그리드 및 어두운 톤 적용
  background(15, 23, 42); 
  drawBackgroundGrid();

  if (!isSongPlaying && !isGameEnded && !isGameOver) {
    restartBtn.hide();
    drawStartScreen();
  } else if (isGameOver) {
    drawGameOverScreen();
  } else if (isGameEnded) {
    drawEndScreen();
  } else {
    restartBtn.hide();
    // 🕹️ 게임 진행 중 로직
    if (masterBgm && masterBgm.isPlaying()) {
      globalSongTime = masterBgm.currentTime() * 1000;
    }

    if (globalSongTime >= SESSION_TIMELINE.DRUM4.end) {
      isSongPlaying = false;
      isGameEnded = true;
      if (masterBgm) masterBgm.stop();
      return;
    }

    let currentSessionIdx = -1;
    for (let i = 0; i < SESSION_ORDER.length; i++) {
      let sessionData = SESSION_TIMELINE[SESSION_ORDER[i].key];
      if (globalSongTime >= sessionData.start && globalSongTime < sessionData.end) {
        currentSessionIdx = i;
        break;
      }
    }

    if (currentSessionIdx !== -1) {
      let currentSession = SESSION_ORDER[currentSessionIdx];
      let currentSessionData = SESSION_TIMELINE[currentSession.key];

      if (currentSessionIdx > 0) {
        let gracePeriodEnd = currentSessionData.start + FOUR_BEATS_MS;
        if (globalSongTime >= gracePeriodEnd && !motionSuccessList[currentSession.key]) {
          triggerGameOver();
          return;
        }
      }

      if (currentSession.type === "KEYBOARD" && typeof keyboardDraw === 'function') keyboardDraw();
      else if (currentSession.type === "BASS" && typeof bassDraw === 'function') bassDraw();
      else if (currentSession.type === "DRUM" && typeof drumDraw === 'function') drumDraw();

      drawSessionIndicator(currentSession.name);

      if (currentSessionIdx > 0) {
        let gracePeriodEnd = currentSessionData.start + FOUR_BEATS_MS;
        if (globalSongTime >= currentSessionData.start && globalSongTime < gracePeriodEnd) {
          drawPageTurnOverlay(gracePeriodEnd, currentSession.key);
        }
      }
    }
    drawMasterOverlay();
  }
}

// ============================================
// 🎨 UI 리팩토링 구역 (게임오버 / 클리어 분리)
// ============================================

function drawGameOverScreen() {
  restartBtn.show();
  updateButtonPosition();

  // 총점 계산
  let totalScore = (typeof keyboardScore !== 'undefined' ? keyboardScore : 0) +
                   (typeof bassScore     !== 'undefined' ? bassScore     : 0) +
                   (typeof drumScore     !== 'undefined' ? drumScore     : 0);

  // 1. 상단 타이틀 (강렬한 레드 네온)
  push();
  textAlign(CENTER, CENTER);
  textFont('Helvetica');
  textStyle(BOLD);
  textSize(width * 0.05);
  fill('#FF4655'); 
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255, 70, 85, 0.6)';
  text("GAME OVER", width / 2, height * 0.2);
  pop();

  // 2. 안내 및 점수 표시
  push();
  textAlign(CENTER, CENTER);
  textSize(width * 0.016);
  fill(160, 170, 190);
  text("제때 악보를 넘기지 못해 연주가 중단되었습니다!", width / 2, height * 0.32);

  textSize(width * 0.025);
  fill(241, 245, 249);
  text("SCORE : " + totalScore.toLocaleString(), width / 2, height * 0.42);
  
  textSize(width * 0.04);
  textStyle(BOLD);
  fill('#FF4655');
  text("FAILED", width / 2, height * 0.52);
  pop();

  drawCredits();
}

function drawEndScreen() {
  restartBtn.show();
  updateButtonPosition();

  // 총점 및 등급 계산
  let totalScore = (typeof keyboardScore !== 'undefined' ? keyboardScore : 0) +
                   (typeof bassScore     !== 'undefined' ? bassScore     : 0) +
                   (typeof drumScore     !== 'undefined' ? drumScore     : 0);
  let gameGrade = calculateGrade(totalScore);

  // 1. 상단 타이틀 (승리의 그린/블루 네온)
  push();
  textAlign(CENTER, CENTER);
  textFont('Helvetica');
  textStyle(BOLD);
  textSize(width * 0.05);
  fill('#00E5FF'); 
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0, 229, 255, 0.6)';
  text("STAGE CLEAR", width / 2, height * 0.2);
  pop();

  // 2. 최종 점수 및 등급 구역
  push();
  textAlign(CENTER, CENTER);
  textSize(width * 0.025);
  fill(241, 245, 249);
  text("FINAL SCORE : " + totalScore.toLocaleString(), width / 2, height * 0.35);
  
  textSize(width * 0.07);
  textStyle(BOLD);
  fill('#00E5FF'); 
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(0, 229, 255, 0.7)';
  text(gameGrade, width / 2, height * 0.48); 
  pop();

  drawCredits();
}

// 📊 상단의 컷라인 상수를 참조하여 등급을 계산하는 함수
function calculateGrade(score) {
  if      (score >= GRADE_CUTLINE.S) return "👑 S";
  else if (score >= GRADE_CUTLINE.A) return "A";
  else if (score >= GRADE_CUTLINE.B) return "B";
  else                               return "C";
}

// 👥 제작 크레딧 렌더링
function drawCredits() {
  let creditY = height * 0.78;
  let boxW = min(500, width * 0.8);
  
  push();
  rectMode(CENTER);
  noFill();
  stroke(30, 41, 59);
  strokeWeight(1.5);
  rect(width / 2, creditY + 30, boxW, 100, 10);
  pop();

  push();
  textAlign(CENTER, TOP);
  textSize(13);
  textStyle(BOLD);
  fill(148, 163, 184); 
  text("— PRODUCTION CREDITS —", width / 2, creditY);
  pop();

  push();
  textAlign(CENTER, TOP);
  textSize(14);
  fill(218, 223, 230);
  
  let spacing = boxW / 4; 
  let startX = width / 2;

  text("🥁 드럼\n김도경", startX - spacing, creditY + 25);
  text("🎸 베이스\n김도현", startX, creditY + 25);
  text("🎹 건반\n방준혁", startX + spacing, creditY + 25);
  pop();
}

// 🌐 배경 그리드선
function drawBackgroundGrid() {
  stroke(30, 41, 59, 100);
  strokeWeight(1);
  for (let i = 0; i < width; i += 60) { line(i, 0, i, height); }
  for (let j = 0; j < height; j += 60) { line(0, j, width, j); }
}

// ============================================
// 📸 기존 기능 유지 (스타트 스크린 및 모션 인식)
// ============================================
function drawStartScreen() {
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(84);
  fill(0, 230, 255, 30);
  text("SSUMIT", width / 2 + 3, height / 2 - 97);
  fill(0, 230, 255);
  text("SSUMIT", width / 2, height / 2 - 100);

  textSize(16);
  textStyle(NORMAL);
  fill(160, 170, 190);
  text("합주 일렉트릭 앙상블 리듬 게임", width / 2, height / 2 - 40);

  textSize(13);
  fill(100, 110, 130);
  text("개발팀 썸썸써밋 : 김도경, 김도현, 방준혁", width / 2, height / 2 - 15);
  pop();

  drawButton(uiButtons.start);
  drawButton(uiButtons.help);
  drawButton(uiButtons.full);

  if (isHelpVisible) drawHelpPopup();
}

function drawButton(btn) {
  push();
  let isHovered = (mouseX > btn.x && mouseX < btn.x + btn.w &&
                   mouseY > btn.y && mouseY < btn.y + btn.h);
  rectMode(CORNER);
  if (isHovered) {
    fill(0, 230, 255, 35); stroke(0, 230, 255); strokeWeight(2);
  } else {
    fill(20, 22, 33, 180); stroke(255, 255, 255, 50); strokeWeight(1);
  }
  rect(btn.x, btn.y, btn.w, btn.h, 6);
  noStroke(); textAlign(CENTER, CENTER); textStyle(BOLD);
  if (isHovered) { fill(0, 230, 255); textSize(15); } 
  else { fill(220, 225, 235); textSize(14); }
  if (btn.label === "FULLSCREEN") textSize(12);
  text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  pop();
}

function drawPageTurnOverlay(targetTime, currentSessionKey) {
  if (motionSuccessList[currentSessionKey]) return;

  push();
  translate(width / 2, height / 2);
  rectMode(CENTER);
  fill(0, 0, 0, 140); stroke(255, 50, 50); strokeWeight(3);
  rect(0, 0, 500, 320, 15);

  noStroke(); fill(255, 200, 0); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD);
  text("⚠️ SWIPE HAND TO TURN PAGE! ⚠️", 0, -130);

  let timeLeft = targetTime - globalSongTime;
  let currentBeatCount = Math.ceil(timeLeft / ONE_BEAT_MS);
  if (currentBeatCount > 0 && currentBeatCount <= 4) {
    textSize(55); fill(255, 50, 50); text(currentBeatCount, 0, -80);
  }

  push(); scale(-1, 1); imageMode(CENTER); image(mainCapture, 0, 40, 360, 135); pop();

  let leftCircleX = -130, rightCircleX = 130, circlesY = 40;
  let rightHit = checkMainMotion(80,  95, 25);
  let leftHit  = checkMainMotion(320, 95, 25);
  let currentTime = millis();

  if (rightHit && !rightCircleTriggered && (currentTime - rightTriggerTime > 300)) {
    rightCircleTriggered = true; rightTriggerTime = currentTime;
  }
  if (rightCircleTriggered && currentTime - rightTriggerTime > 1000) {
    rightCircleTriggered = false;
  }
  let timeGap = currentTime - rightTriggerTime;
  if (rightCircleTriggered && leftHit && (timeGap >= 150) && (timeGap <= 1000)) {
    motionSuccessList[currentSessionKey] = true; rightCircleTriggered = false;
  }

  strokeWeight(4); noFill();
  if (rightCircleTriggered) stroke(0, 255, 100);
  else stroke(rightHit ? color(0, 255, 100) : color(255, 50, 50));
  circle(rightCircleX, circlesY, 50);

  if (motionSuccessList[currentSessionKey]) stroke(0, 255,  green);
  else if (rightCircleTriggered) stroke(0, 200, 255);
  else stroke(150);
  circle(leftCircleX, circlesY, 50);

  noStroke(); fill(255); textSize(13);
  text("1. RIGHT START", rightCircleX, circlesY + 45);
  text("2. LEFT END (IN 1s)", leftCircleX, circlesY + 45);
  mainPrevFrame.copy(mainCapture, 0, 0, 400, 150, 0, 0, 400, 150);
  pop();
}

function checkMainMotion(cx, cy, r) {
  mainCapture.loadPixels(); mainPrevFrame.loadPixels();
  if (!mainCapture.pixels || mainCapture.pixels.length === 0 || !mainPrevFrame.pixels || mainPrevFrame.pixels.length === 0) return false;
  let motionCount = 0, totalPixelsChecked = 0;
  for (let y = 0; y < mainCapture.height; y += 2) {
    for (let x = 0; x < mainCapture.width; x += 2) {
      if (dist(x, y, cx, cy) < r) {
        totalPixelsChecked++;
        let index = (x + y * mainCapture.width) * 4;
        let diff = dist(mainCapture.pixels[index], mainCapture.pixels[index+1], mainCapture.pixels[index+2], mainPrevFrame.pixels[index], mainPrevFrame.pixels[index+1], mainPrevFrame.pixels[index+2]);
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

function drawHelpPopup() {
  fill(0, 0, 0, 230); rect(0, 0, width, height);
  fill(20, 20, 30); stroke(0, 230, 255); rect(width/2 - 300, height/2 - 200, 600, 400, 20);
  fill(255); noStroke(); textAlign(LEFT, TOP); textSize(15);
  let desc = "이 게임은 한 곡 안에서 밴드의 세가지 세션(베이스, 건반, 드럼)을 모두 플레이 할 수 있는 리듬게임입니다.\n\n베이스: 마우스를 위 아래로 움직여 조준점을 줄 위에 위치시키고 타이밍을 맞춰 스페이스바/클릭 합니다.\n\n건반: 블럭이 떨어지는 타이밍에 맞추어 지정된 키보드를 누릅니다.\n\n드럼: 드럼 악보 위 지정된 키를 타이밍에 맞추어 누릅니다.\n\n🔥 중요 🔥: 새로운 악기 파트가 시작되면 첫 4박자 동안 화면에 '악보 넘기기 창'이 뜹니다. 연주를 진행하면서 동시에 카운트가 끝나기 전에 카메라의 오른쪽 원을 터치한 뒤 1초 내에 왼쪽 원을 터치하여 악보를 넘겨야 합니다. 실패 시 즉시 게임 오버됩니다!";
  text(desc, width/2 - 270, height/2 - 170, 540, 350);
  textAlign(CENTER, CENTER); text("[클릭하여 닫기]", width/2, height/2 + 170);
}

function drawSessionIndicator(sessionName) {
  push(); rectMode(CENTER); fill(0, 0, 0, 150); stroke(0, 230, 255, 100); strokeWeight(1);
  rect(width / 2, 50, 280, 35, 8); noStroke(); fill(0, 230, 255); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD);
  text(sessionName, width / 2, 50); pop();
}

function drawMasterOverlay() {
  let liveTotalScore = (typeof keyboardScore !== 'undefined' ? keyboardScore : 0) + (typeof bassScore !== 'undefined' ? bassScore : 0) + (typeof drumScore !== 'undefined' ? drumScore : 0);
  let liveCombo = 0, currentType = null;
  for (let i = 0; i < SESSION_ORDER.length; i++) {
    let session = SESSION_TIMELINE[SESSION_ORDER[i].key];
    if (globalSongTime >= session.start && globalSongTime < session.end) { currentType = SESSION_ORDER[i].type; break; }
  }
  if (currentType === "KEYBOARD") liveCombo = typeof keyboardCombo !== 'undefined' ? keyboardCombo : 0;
  else if (currentType === "BASS") liveCombo = typeof bassCombo !== 'undefined' ? bassCombo : 0;
  else if (currentType === "DRUM") liveCombo = typeof drumCombo !== 'undefined' ? drumCombo : 0;

  push(); textAlign(RIGHT, TOP); textSize(18); textStyle(BOLD); fill(255, 255, 255, 160);
  text(`SCORE: ${liveTotalScore.toLocaleString()}`, width - 30, 20);
  textSize(15); fill(0, 230, 255); text(`COMBO: ${liveCombo}`, width - 30, 48);
  textSize(12); textStyle(NORMAL); fill(150); text(`TIME: ${(globalSongTime / 1000).toFixed(1)} / ${(SESSION_TIMELINE.DRUM4.end / 1000).toFixed(0)}s`, width - 30, 75);
  pop();
}

// ============================================
// 🖱️ 입력 및 조작
// ============================================
function mousePressed() {
  if (isHelpVisible) { isHelpVisible = false; return; }

  if (mouseX > uiButtons.full.x && mouseX < uiButtons.full.x + uiButtons.full.w &&
      mouseY > uiButtons.full.y && mouseY < uiButtons.full.y + uiButtons.full.h) {
    fullscreen(!fullscreen()); 
    return;
  }

  if (!isSongPlaying && !isGameEnded && !isGameOver &&
      mouseX > uiButtons.start.x && mouseX < uiButtons.start.x + uiButtons.start.w &&
      mouseY > uiButtons.start.y && mouseY < uiButtons.start.y + uiButtons.start.h) {
    startEnsembleGame();
  }

  if (!isSongPlaying && !isGameEnded && !isGameOver &&
      mouseX > uiButtons.help.x && mouseX < uiButtons.help.x + uiButtons.help.w &&
      mouseY > uiButtons.help.y && mouseY < uiButtons.help.y + uiButtons.help.h) {
    isHelpVisible = true;
  }
}

function startEnsembleGame() {
  if (masterBgm) { masterBgm.stop(); masterBgm.play(); }
  isSongPlaying = true;
  globalSongTime = 0;
  motionSuccessList = {};
  for (let i = 1; i < SESSION_ORDER.length; i++) { motionSuccessList[SESSION_ORDER[i].key] = false; }
  rightCircleTriggered = false;

  if (typeof keyboardScore !== 'undefined') { keyboardScore = 0; keyboardCombo = 0; keyboardMaxCombo = 0; }
  if (typeof bassScore     !== 'undefined') { bassScore     = 0; bassCombo     = 0; }
  if (typeof drumScore     !== 'undefined') { drumScore     = 0; drumCombo     = 0; }

  if (typeof keyboardCreateChart === 'function') keyboardCreateChart();
  if (typeof bassCreateChart     === 'function') bassCreateChart();
  if (typeof drumCreateChart     === 'function') drumCreateChart();
}

function keyPressed() {
  // F키 풀스크린 토글 유지
  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
    return;
  }

  if (!isSongPlaying) return;
  let currentType = null;
  for (let i = 0; i < SESSION_ORDER.length; i++) {
    let session = SESSION_TIMELINE[SESSION_ORDER[i].key];
    if (globalSongTime >= session.start && globalSongTime < session.end) { currentType = SESSION_ORDER[i].type; break; }
  }
  if (currentType === "KEYBOARD" && typeof keyboardKeyPressed === 'function') keyboardKeyPressed();
  else if (currentType === "BASS" && typeof bassKeyPressed === 'function') bassKeyPressed();
  else if (currentType === "DRUM" && typeof drumKeyPressed === 'function') drumKeyPressed();
}

function keyReleased() {
  if (!isSongPlaying) return;
  let currentType = null;
  for (let i = 0; i < SESSION_ORDER.length; i++) {
    let session = SESSION_TIMELINE[SESSION_ORDER[i].key];
    if (globalSongTime >= session.start && globalSongTime < session.end) { currentType = SESSION_ORDER[i].type; break; }
  }
  if (currentType === "KEYBOARD" && typeof keyboardKeyReleased === 'function') keyboardKeyReleased();
  else if (currentType === "BASS" && typeof bassKeyReleased === 'function') bassKeyReleased();
  else if (currentType === "DRUM" && typeof drumKeyReleased === 'function') drumKeyReleased();
}
