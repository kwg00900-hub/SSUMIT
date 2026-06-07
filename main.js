// ===================================================
// main.js — 통합 최종 버전 
// (시작 즉시 실행 + 일시정지 카운트다운 + 드럼 하이햇 제거 기능)
// ===================================================

let masterBgm;
let globalSongTime = 0;
let isSongPlaying  = false;
let isHelpVisible  = false;
let isGameEnded    = false;
let isGameOver     = false;
let isPaused       = false;
let volumeSlider;
let globalMaxCombo = 0;

// 화면 상태: 'start' | 'select' | 'game'
let screenState = 'start';

// ⏸️ 일시정지
let pausedTime = 0;

// ⏱️ 카운트다운 상태 변수
let isCountingDown = false;
let countdownStartTime = 0;
let countdownVal = 3;

// 🥁 드럼 하이햇 제거 기능 전역 상태 (drum.js 등에서 활용 가능)
window.globalIsHihatRemoved = false;

// 🎚️ 배속
let selectedSpeed = 1.0;
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];
const SPEED_LABELS  = ['0.5x', '0.75x', '1.0x', '1.25x', '1.5x'];

// 🏆 등급 컷라인
const GRADE_CUTLINE = {
  S: 38514,
  A: 35370,
  B: 31440,
  C: 27510,
  D: 23580,
  E: 19650
};

// ============================================
// 🎵 곡 목록 정의
// ============================================
const SONG_LIST = [
  {
    id:       'song1',
    file:     '126.mp3',
    title:    '투게더!',
    subtitle: '잔나비',
    bpm:      126,
    sessions: ['🎹 KEYBOARD', '🎸 BASS', '🥁 DRUM'],
    timeline: {
      KEYBOARD1: { start: 0,      end: 17043  },
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
    }
  },
  {
    id:       'song2',
    file:     'dance_dance.mp3',
    title:    'Dance Dance',
    subtitle: 'DAY6',
    bpm:      152,
    sessions: ['🎹 KEYBOARD', '🎸 BASS', '🥁 DRUM'],
    timeline: {
      KEYBOARD1: { start: 0,     end: 15000  },
      BASS1:     { start: 15000, end: 30000  },
      DRUM1:     { start: 30000, end: 45000  },
      BASS2:     { start: 45000, end: 60000  },
      DRUM2:     { start: 60000, end: 75000  },
      KEYBOARD2: { start: 75000, end: 90000  },
      BASS3:     { start: 90000, end: 105000 },
      DRUM3:     { start: 105000,end: 120000 },
      KEYBOARD3: { start: 120000,end: 135000 },
      BASS4:     { start: 135000,end: 147000 },
      KEYBOARD4: { start: 147000,end: 162000 },
      DRUM4:     { start: 162000,end: 178000 }
    }
  }
];

let selectedSongIdx = 0;
let SESSION_TIMELINE = {};

const SESSION_ORDER = [
  { key: "KEYBOARD1", type: "KEYBOARD", name: "KEYBOARD SESSION (1)" },
  { key: "BASS1",     type: "BASS",     name: "BASS SESSION (1)"     },
  { key: "DRUM1",     type: "DRUM",     name: "DRUM SESSION (1)"     },
  { key: "BASS2",     type: "BASS",     name: "BASS SESSION (2)"     },
  { key: "DRUM2",     type: "DRUM",     name: "DRUM SESSION (2)"     },
  { key: "KEYBOARD2", type: "KEYBOARD", name: "KEYBOARD SESSION (2)" },
  { key: "BASS3",     type: "BASS",     name: "BASS SESSION (3)"     },
  { key: "DRUM3",     type: "DRUM",     name: "DRUM SESSION (3)"     },
  { key: "KEYBOARD3", type: "KEYBOARD", name: "KEYBOARD SESSION (3)" },
  { key: "BASS4",     type: "BASS",     name: "BASS SESSION (4)"     },
  { key: "KEYBOARD4", type: "KEYBOARD", name: "KEYBOARD SESSION (4)" },
  { key: "DRUM4",     type: "DRUM",     name: "DRUM SESSION (4)"     }
];

let BPM = 126;
let ONE_BEAT_MS;
let FOUR_BEATS_MS;

let uiButtons = {
  start: { x: 0, y: 0, w: 240, h: 55, label: "START GAME" },
  help:  { x: 0, y: 0, w: 240, h: 55, label: "HOW TO PLAY" },
  full:  { x: 0, y: 0, w: 140, h: 40, label: "FULLSCREEN"  }
};

let selectButtons = {
  play:  { x: 0, y: 0, w: 220, h: 55, label: "▶  PLAY" },
  back:  { x: 0, y: 0, w: 120, h: 42, label: "← BACK"  },
  hihat: { x: 0, y: 0, w: 180, h: 42, label: "🥁 DRUM-EXPERT: ON" } // 하이햇 토글 버튼 추가
};
let speedButtons = [];  
let songCardRects = []; 

let restartBtn;
let mainCapture;
let mainPrevFrame;
let rightCircleTriggered = false;
let rightTriggerTime     = 0;
let motionSuccessList    = {};
let imgBassSSU, imgDrumSSU, imgKeyboardSSU;

// ============================================
// 🔧 배속 및 설정 적용
// ============================================
function applySpeed(speed) {
  selectedSpeed = speed;
  let base = SONG_LIST[selectedSongIdx].timeline;

  for (let key in base) {
    SESSION_TIMELINE[key] = {
      start: base[key].start,
      end:   base[key].end
    };
  }

  BPM           = SONG_LIST[selectedSongIdx].bpm;
  ONE_BEAT_MS   = (60 / BPM) * 1000;
  FOUR_BEATS_MS = ONE_BEAT_MS * 4;

  if (typeof keyboardSetGameBPM === 'function') keyboardSetGameBPM(BPM * speed);
  if (typeof bassSetGameBPM     === 'function') bassSetGameBPM(BPM * speed);
  
  if (typeof keyboardSCROLL_SPEED !== 'undefined') keyboardSCROLL_SPEED = (windowHeight * 0.6);
  if (typeof bassSCROLL_SPEED     !== 'undefined') bassSCROLL_SPEED     = (windowHeight * 0.6);
}

// ============================================
// 🔧 초기화
// ============================================
function preload() {
  masterBgm = loadSound(SONG_LIST[0].file);
  imgBassSSU = loadImage('assets/bass_ssu.png');
  imgDrumSSU = loadImage('assets/drum_ssu.png');
  imgKeyboardSSU = loadImage('assets/keyboard_ssu.png')
  
  if (typeof keyboardPreload === 'function') keyboardPreload();
  if (typeof bassPreload     === 'function') bassPreload();
  if (typeof drumPreload     === 'function') drumPreload();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  mainCapture = createCapture(VIDEO);
  mainCapture.size(400, 225); 
  mainCapture.hide();
  
  mainPrevFrame = createImage(400, 225); 

  if (typeof keyboardSetup === 'function') keyboardSetup();
  if (typeof bassSetup     === 'function') bassSetup();
  if (typeof drumSetup     === 'function') drumSetup();

  volumeSlider = createSlider(-20, 20, 0, 1);
  volumeSlider.style('cursor', 'pointer');

  applySpeed(1.0);
  updateUIElements();
  initRestartButton();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateUIElements();
}

function updateUIElements() {
  uiButtons.start.x = width / 2 - 120;
  uiButtons.start.y = height / 2 + 40;
  uiButtons.help.x  = width / 2 - 120;
  uiButtons.help.y  = height / 2 + 115;
  uiButtons.full.x  = width - 170;
  uiButtons.full.y  = 20;

  selectButtons.play.x  = width / 2 - 110;
  selectButtons.play.y  = height * 0.85;
  selectButtons.back.x  = 40;
  selectButtons.back.y  = 30;
  
  // 하이햇 토글 버튼 위치 (PLAY 버튼 바로 위)
  selectButtons.hihat.x = width / 2 - 90;
  selectButtons.hihat.y = height * 0.85 - 55;

  if (volumeSlider) {
    volumeSlider.position(width - 160, height - 35);
    volumeSlider.size(130);
  }

  speedButtons = [];
  let bw = 84, bh = 38, gap = 8;
  let totalW = SPEED_OPTIONS.length * bw + (SPEED_OPTIONS.length - 1) * gap;
  let sx = width / 2 - totalW / 2;
  let sy = height * 0.72;
  for (let i = 0; i < SPEED_OPTIONS.length; i++) {
    speedButtons.push({
      x: sx + i * (bw + gap), y: sy,
      w: bw, h: bh,
      speed: SPEED_OPTIONS[i], label: SPEED_LABELS[i]
    });
  }

  songCardRects = [];
  let cardW = min(380, width * 0.38);
  let cardH = 180;
  let cardGap = 30;
  let totalCardW = 2 * cardW + cardGap;
  let cardStartX = width / 2 - totalCardW / 2;
  let cardY = height * 0.18;
  for (let i = 0; i < SONG_LIST.length; i++) {
    songCardRects.push({ x: cardStartX + i * (cardW + cardGap), y: cardY, w: cardW, h: cardH });
  }
}

function initRestartButton() {
  restartBtn = createButton('PLAY AGAIN');
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
    restartBtn.style('box-shadow', '0px 0px 15px rgba(0,229,255,0.5)');
  });
  restartBtn.mouseOut(() => {
    restartBtn.style('transform', 'scale(1)');
    restartBtn.style('box-shadow', 'none');
  });
  restartBtn.mousePressed(() => {
    isGameOver = false; isGameEnded = false;
    screenState = 'select';
    restartBtn.hide();
  });
  restartBtn.hide();
}

function updateButtonPosition() {
  let bw = max(220, width * 0.16), bh = 55;
  restartBtn.size(bw, bh);
  restartBtn.position(width / 2 - bw / 2, height * 0.62);
}

// ============================================
// ⏸️ 일시정지 제어
// ============================================
function togglePause() {
  if (screenState !== 'game' || isGameEnded || isGameOver) return;
  
  // 카운트다운 도중 ESC를 누르면 즉시 다시 정지 상태로 전환
  if (isCountingDown) {
    isCountingDown = false;
    isPaused = true;
    if (masterBgm && masterBgm.isPlaying()) masterBgm.pause();
    return;
  }

  isPaused = !isPaused;
  if (isPaused) {
    if (masterBgm && masterBgm.isPlaying()) { 
      pausedTime = masterBgm.currentTime(); 
      masterBgm.pause(); 
    }
  } else {
    // ⏱️ 일시정지 해제할 때만 3-2-1 카운트다운 트리거
    isCountingDown = true;
    countdownStartTime = millis();
  }
}

// ============================================
// 🖼️ 메인 드로우 루프
// ============================================
function draw() {
  background(15, 23, 42);
  drawBackgroundGrid();
  handleVolumeSlider();

  if (screenState === 'start') {
    restartBtn.hide();
    drawStartScreen();
  } else if (screenState === 'select') {
    restartBtn.hide();
    drawSelectScreen();
  } else if (isGameOver) {
    drawGameOverScreen();
  } else if (isGameEnded) {
    drawEndScreen();
  } else if (isPaused) {
    drawPausedScreen();
  } else {
    restartBtn.hide();

    // ⏱️ 카운트다운(일시정지 해제 시에만) 인터셉터
    if (isCountingDown) {
      if (pausedTime > 0) globalSongTime = pausedTime * 1000;
      else globalSongTime = 0;

      let elapsed = millis() - countdownStartTime;
      if (elapsed < 1000) {
        countdownVal = 3;
      } else if (elapsed < 2000) {
        countdownVal = 2;
      } else if (elapsed < 3000) {
        countdownVal = 1;
      } else {
        isCountingDown = false;
        isSongPlaying = true;
        if (masterBgm && !masterBgm.isPlaying()) {
          masterBgm.play();
          if (pausedTime > 0) {
            masterBgm.jump(pausedTime);
            pausedTime = 0; 
          }
        }
      }

      // 배경에 현재 시점 악기와 다가올 노트 정지 상태 렌더링
      let idx = -1;
      for (let i = 0; i < SESSION_ORDER.length; i++) {
        let sd = SESSION_TIMELINE[SESSION_ORDER[i].key];
        if (globalSongTime >= sd.start && globalSongTime < sd.end) { idx = i; break; }
      }
      if (idx === -1) idx = 0;

      let cs = SESSION_ORDER[idx];
      if      (cs.type === "KEYBOARD" && typeof keyboardDraw === 'function') keyboardDraw();
      else if (cs.type === "BASS"     && typeof bassDraw     === 'function') bassDraw();
      else if (cs.type === "DRUM"     && typeof drumDraw     === 'function') drumDraw();
      
      let nextName = (idx + 1 < SESSION_ORDER.length) ? SESSION_ORDER[idx + 1].type : "FINISH";
      drawSessionIndicator(cs.name, nextName);
      drawMasterOverlay();

      // 화면 중앙 카운트다운 타이포그래피 이펙트
      push();
      textAlign(CENTER, CENTER);
      textSize(width * 0.08);
      textStyle(BOLD);
      fill(0, 230, 255);
      
      let stageElapsed = elapsed % 1000;
      let scaleVal = map(stageElapsed, 0, 1000, 1.4, 1.0); 
      translate(width / 2, height / 2);
      scale(scaleVal);
      
      drawingContext.shadowBlur = 25;
      drawingContext.shadowColor = 'rgba(0, 229, 255, 0.6)';
      text(countdownVal, 0, 0);
      pop();
      return; 
    }

    if (masterBgm && masterBgm.isPlaying()) globalSongTime = masterBgm.currentTime() * 1000;

    if (globalSongTime >= SESSION_TIMELINE.DRUM4.end) {
      isSongPlaying = false; isGameEnded = true;
      if (masterBgm) masterBgm.stop();
      return;
    }

    let idx = -1;
    for (let i = 0; i < SESSION_ORDER.length; i++) {
      let sd = SESSION_TIMELINE[SESSION_ORDER[i].key];
      if (globalSongTime >= sd.start && globalSongTime < sd.end) { idx = i; break; }
    }
    if (idx !== -1) {
      let cs = SESSION_ORDER[idx], csd = SESSION_TIMELINE[cs.key];
      
      // 🏆 콤보 동기화 및 최고 콤보 갱신 로직
      if (cs.type === "KEYBOARD") {
        let currentCombo = (typeof keyboardCombo !== 'undefined') ? keyboardCombo : 0;
        if (typeof bassCombo !== 'undefined') bassCombo = currentCombo;
        if (typeof drumCombo !== 'undefined') drumCombo = currentCombo;
        if (currentCombo > globalMaxCombo) globalMaxCombo = currentCombo; 
      } else if (cs.type === "BASS") {
        let currentCombo = (typeof bassCombo !== 'undefined') ? bassCombo : 0;
        if (typeof keyboardCombo !== 'undefined') keyboardCombo = currentCombo;
        if (typeof drumCombo !== 'undefined') drumCombo = currentCombo;
        if (currentCombo > globalMaxCombo) globalMaxCombo = currentCombo; 
      } else if (cs.type === "DRUM") {
        let currentCombo = (typeof drumCombo !== 'undefined') ? drumCombo : 0;
        if (typeof keyboardCombo !== 'undefined') keyboardCombo = currentCombo;
        if (typeof bassCombo !== 'undefined') bassCombo = currentCombo;
        if (currentCombo > globalMaxCombo) globalMaxCombo = currentCombo; 
      }

      if (idx > 0) {
        let gpe = csd.start + FOUR_BEATS_MS;
        if (globalSongTime >= gpe && !motionSuccessList[cs.key]) { triggerGameOver(); return; }
      }
      
      if      (cs.type === "KEYBOARD" && typeof keyboardDraw === 'function') keyboardDraw();
      else if (cs.type === "BASS"     && typeof bassDraw     === 'function') bassDraw();
      else if (cs.type === "DRUM"     && typeof drumDraw     === 'function') drumDraw();
      
      let nextName = "FINISH";
      if (idx + 1 < SESSION_ORDER.length) {
        nextName = SESSION_ORDER[idx + 1].type;
      }
      drawSessionIndicator(cs.name, nextName);

      if (idx > 0) {
        let gpe = csd.start + FOUR_BEATS_MS;
        if (globalSongTime >= csd.start && globalSongTime < gpe) drawPageTurnOverlay(gpe, cs.key);
      }
    }
    drawMasterOverlay();
    drawPauseHint();
  }
}

// ============================================
// 🎵 곡 선택 화면
// ============================================
function drawSelectScreen() {
  push();
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(width * 0.028);
  fill(0, 230, 255);
  drawingContext.shadowBlur = 12; drawingContext.shadowColor = 'rgba(0,229,255,0.5)';
  text("SELECT SONG", width / 2, height * 0.1);
  pop();

  for (let i = 0; i < SONG_LIST.length; i++) {
    drawSongCard(i);
  }

  push();
  textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD); fill(160, 170, 190);
  text("SPEED", width / 2, speedButtons[0].y - 18);
  pop();

  for (let btn of speedButtons) {
    let isSel = (btn.speed === selectedSpeed);
    let isHov = (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h);
    push();
    rectMode(CORNER);
    if      (isSel) { fill(0, 200, 255, 220); stroke(0, 230, 255); strokeWeight(2.5); }
    else if (isHov) { fill(0, 230, 255, 40);  stroke(0, 230, 255, 180); strokeWeight(1.5); }
    else            { fill(20, 22, 33, 180);  stroke(255, 255, 255, 40); strokeWeight(1); }
    rect(btn.x, btn.y, btn.w, btn.h, 7);
    noStroke(); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(13);
    fill(isSel ? color(0,0,0) : isHov ? color(0,230,255) : color(200,210,220));
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    pop();
  }

  // 🥁 하이햇 토글 렌더링
  let hhBtn = selectButtons.hihat;
  let hhBgColor = window.globalIsHihatRemoved ? color(0, 200, 255) : color(255, 80, 80);
  drawSelectBtn(hhBtn, hhBgColor, color(0, 0, 0));

  drawSelectBtn(selectButtons.play, color(0, 200, 255), color(0, 0, 0));
  drawSelectBtn(selectButtons.back, color(60, 70, 90), color(200, 210, 220));
}

function drawSongCard(i) {
  let song = SONG_LIST[i];
  let r    = songCardRects[i];
  let isSel = (i === selectedSongIdx);
  let isHov = (mouseX > r.x && mouseX < r.x + r.w && mouseY > r.y && mouseY < r.y + r.h);

  push();
  rectMode(CORNER);
  if (isSel) {
    fill(22, 40, 70);
    stroke(0, 200, 255); strokeWeight(2.5);
    drawingContext.shadowBlur = 18; drawingContext.shadowColor = 'rgba(0,200,255,0.35)';
  } else if (isHov) {
    fill(22, 33, 55); stroke(0, 180, 255, 120); strokeWeight(1.5);
  } else {
    fill(18, 26, 44); stroke(50, 70, 100, 120); strokeWeight(1);
  }
  rect(r.x, r.y, r.w, r.h, 14);

  if (isSel) {
    noStroke(); fill(0, 200, 255);
    rect(r.x, r.y, 60, 24, 14, 0, 0, 0);
    textAlign(CENTER, CENTER); textSize(11); textStyle(BOLD); fill(0, 0, 0);
    text("SELECTED", r.x + 30, r.y + 12);
  }

  noStroke(); textAlign(LEFT, TOP); textStyle(BOLD);
  textSize(18); fill(isSel ? color(0, 220, 255) : color(220, 230, 245));
  text(song.title, r.x + 18, r.y + 34);

  textSize(12); textStyle(NORMAL); fill(isSel ? color(120, 200, 255) : color(140, 155, 180));
  text(song.subtitle, r.x + 18, r.y + 60);

  stroke(40, 60, 90); strokeWeight(1);
  line(r.x + 18, r.y + 82, r.x + r.w - 18, r.y + 82);

  noStroke(); textAlign(LEFT, TOP); textSize(11); textStyle(BOLD);
  fill(isSel ? color(0, 200, 255) : color(100, 130, 170));
  text(`♩ ${song.bpm} BPM`, r.x + 18, r.y + 92);

  let bx = r.x + 18;
  let badgeColors = [color(0,150,220,50), color(220,100,0,50), color(80,200,100,50)];
  let textColors  = [color(0,200,255), color(255,160,60), color(120,240,140)];
  for (let j = 0; j < song.sessions.length; j++) {
    fill(badgeColors[j]); rect(bx, r.y + 118, 80, 22, 5);
    fill(textColors[j]); textAlign(CENTER, CENTER); textSize(10);
    text(song.sessions[j], bx + 40, r.y + 129);
    bx += 88;
  }

  if (song.id === 'song2') {
    textAlign(RIGHT, BOTTOM); textSize(10); textStyle(NORMAL);
    fill(180, 100, 60, 180);
    text("⚠ 타임라인 미정", r.x + r.w - 12, r.y + r.h - 8);
  }
  pop();
}

function drawSelectBtn(btn, bgCol, txtCol) {
  let isHov = (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h);
  push();
  rectMode(CORNER);
  if (isHov) {
    fill(red(bgCol), green(bgCol), blue(bgCol), 230);
    stroke(255,255,255,80); strokeWeight(1.5);
    drawingContext.shadowBlur = 14; drawingContext.shadowColor = 'rgba(0,229,255,0.4)';
  } else {
    fill(red(bgCol), green(bgCol), blue(bgCol), 180);
    stroke(255,255,255,30); strokeWeight(1);
  }
  rect(btn.x, btn.y, btn.w, btn.h, 8);
  noStroke(); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(14); fill(txtCol);
  text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  pop();
}

// ============================================
// 🎮 게임 시작 및 데이터 로드
// ============================================
function startEnsembleGame() {
  applySpeed(selectedSpeed);
  let song = SONG_LIST[selectedSongIdx];

  if (masterBgm) masterBgm.stop();
  pausedTime = 0; 

  // ⏱️ 초기 시작 시에는 카운트다운 없이 즉시 진행
  isCountingDown = false; 

  masterBgm = loadSound(song.file, () => {
    masterBgm.rate(selectedSpeed);
    
    if (volumeSlider) {
      let dbValue = volumeSlider.value();
      masterBgm.amp(pow(10, dbValue / 20));
    }
    
    isSongPlaying = true;
    masterBgm.play();
  });

  isPaused    = false;
  screenState = 'game'; 
  globalSongTime = 0;
  globalMaxCombo = 0;
  motionSuccessList = {};
  for (let i = 1; i < SESSION_ORDER.length; i++) motionSuccessList[SESSION_ORDER[i].key] = false;
  rightCircleTriggered = false;

  if (typeof keyboardScore !== 'undefined') { keyboardScore = 0; keyboardCombo = 0; keyboardMaxCombo = 0; }
  if (typeof bassScore     !== 'undefined') { bassScore     = 0; bassCombo      = 0; }
  if (typeof drumScore     !== 'undefined') { drumScore     = 0; drumCombo      = 0; }

  if (typeof drumExpertMode !== 'undefined') {
    drumExpertMode = !window.globalIsHihatRemoved;
  }

  // 외부 드럼 파일에 상태 연동 함수가 있다면 호출
  if (typeof drumSetHihatState === 'function') {
    drumSetHihatState(window.globalIsHihatRemoved);
  }

  if (typeof keyboardCreateChart === 'function') keyboardCreateChart();
  if (typeof bassCreateChart     === 'function') bassCreateChart();
  if (typeof drumCreateChart     === 'function') drumCreateChart();
}

// ============================================
// 🎨 결과 / 게임오버 / 공통 UI
// ============================================
function drawGameOverScreen() {
  restartBtn.show(); updateButtonPosition();
  let total = calcTotalScore();
  push(); textAlign(CENTER,CENTER); textFont('Helvetica'); textStyle(BOLD);
  textSize(width*0.05); fill('#FF4655');
  drawingContext.shadowBlur=20; drawingContext.shadowColor='rgba(255,70,85,0.6)';
  text("GAME OVER", width/2, height*0.2); pop();
  push(); textAlign(CENTER,CENTER);
  textSize(width*0.016); fill(160,170,190);
  text("제때 악보를 넘기지 못해 연주가 중단되었습니다!", width/2, height*0.32);
  textSize(width*0.025); fill(241,245,249);
  text("SCORE : "+total.toLocaleString(), width/2, height*0.42);
  textSize(width*0.04); textStyle(BOLD); fill('#FF4655');
  text("FAILED", width/2, height*0.52); pop();
  drawCredits();
}

function drawEndScreen() {
  restartBtn.show(); updateButtonPosition();
  let total = calcTotalScore(), grade = calculateGrade(total);
  push(); textAlign(CENTER,CENTER); textFont('Helvetica'); textStyle(BOLD);
  textSize(width*0.05); fill('#00E5FF');
  drawingContext.shadowBlur=20; drawingContext.shadowColor='rgba(0,229,255,0.6)';
  text("STAGE CLEAR", width/2, height*0.2); pop();
  
  push(); textAlign(CENTER,CENTER);
  textSize(width*0.025); fill(241,245,249);
  text("FINAL SCORE : "+total.toLocaleString(), width/2, height*0.33);
  
  textSize(width*0.02); fill(255,215,0); 
  text("MAX COMBO : " + globalMaxCombo, width/2, height*0.38); 
  
  textSize(width*0.07); textStyle(BOLD); fill('#00E5FF');
  drawingContext.shadowBlur=25; drawingContext.shadowColor='rgba(0,229,255,0.7)';
  text(grade, width/2, height*0.48); pop();
  drawCredits();
}

function calcTotalScore() {
  return (typeof keyboardScore!=='undefined'?keyboardScore:0)+
         (typeof bassScore    !==`undefined`?bassScore    :0)+
         (typeof drumScore    !==`undefined`?drumScore    :0);
}
function calculateGrade(s) {
  if (s >= GRADE_CUTLINE.S) return "👑 S";
  if (s >= GRADE_CUTLINE.A) return "A";
  if (s >= GRADE_CUTLINE.B) return "B";
  if (s >= GRADE_CUTLINE.C) return "C";
  if (s >= GRADE_CUTLINE.D) return "D";
  if (s >= GRADE_CUTLINE.E) return "E";
  return "F"; // 19649 이하
}

function drawCredits() {
  let cy=height*0.78, bw=min(500,width*0.8);
  push(); rectMode(CENTER); noFill(); stroke(30,41,59); strokeWeight(1.5);
  rect(width/2,cy+30,bw,100,10); pop();
  push(); textAlign(CENTER,TOP); textSize(13); textStyle(BOLD); fill(148,163,184);
  text("— PRODUCTION CREDITS —",width/2,cy); pop();
  push(); textAlign(CENTER,TOP); textSize(14); fill(218,223,230);
  let sp=bw/4, sx=width/2;
  text("🥁 드럼\n김도경",  sx-sp,cy+25);
  text("🎸 베이스\n김도현",sx,   cy+25);
  text("🎹 건반\n방준혁",  sx+sp,cy+25); pop();
}

function drawBackgroundGrid() {
  stroke(30,41,59,100); strokeWeight(1);
  for(let i=0;i<width; i+=60) line(i,0,i,height);
  for(let j=0;j<height;j+=60) line(0,j,width,j);
}

function drawStartScreen() {
  push();
  imageMode(CENTER);
  if (imgBassSSU) {
    let bW = width * 0.20; 
    let bH = (imgBassSSU.height / imgBassSSU.width) * bW; 
    image(imgBassSSU, width * 0.15, height * 0.30, bW, bH);
  }
  if (imgDrumSSU) {
    let dW = width * 0.22; 
    let dH = (imgDrumSSU.height / imgDrumSSU.width) * dW;
    image(imgDrumSSU, width * 0.85, height * 0.70, dW, dH);
  }
  if (imgKeyboardSSU) {
    let kW = width * 0.22; 
    let kH = (imgKeyboardSSU.height / imgKeyboardSSU.width) * kW;
    image(imgKeyboardSSU, width * 0.15, height * 0.80, kW, kH);
  }
  pop();

  push(); textAlign(CENTER,CENTER); textStyle(BOLD);
  textSize(84); fill(0,230,255,30); text("SSUMIT",width/2+3,height/2-97);
  fill(0,230,255); text("SSUMIT",width/2,height/2-100);
  textSize(16); textStyle(NORMAL); fill(160,170,190);
  text("합주 일렉트릭 앙상블 리듬 게임",width/2,height/2-40);
  textSize(13); fill(100,110,130);
  text("개발팀 썸썸써밋 : 김도경, 김도현, 김도현, 방준혁",width/2,height/2-15); pop();
  
  drawButton(uiButtons.start); drawButton(uiButtons.help); drawButton(uiButtons.full);
  if(isHelpVisible) drawHelpPopup();
}

function drawPausedScreen() {
  push(); fill(0,0,0,180); rect(0,0,width,height); pop();
  push(); textAlign(CENTER,CENTER); textFont('Helvetica'); textStyle(BOLD);
  textSize(width*0.06); fill('#FFD700');
  drawingContext.shadowBlur=20; drawingContext.shadowColor='rgba(255,215,0,0.6)';
  text("⏸ PAUSED",width/2,height*0.35); pop();
  push(); textAlign(CENTER,CENTER); textSize(width*0.022); textStyle(NORMAL); fill(200,210,230);
  text("게임이 일시정지되었습니다",width/2,height*0.48);
  textSize(width*0.018); fill(160,170,190);
  text("ESC 키를 다시 눌러 재개하세요",width/2,height*0.54);
  textSize(width*0.015); fill(100,200,255);
  text(`현재 배속: ${selectedSpeed}x`,width/2,height*0.62); pop();
}

function drawButton(btn) {
  push();
  let h=(mouseX>btn.x&&mouseX<btn.x+btn.w&&mouseY>btn.y&&mouseY<btn.y+btn.h);
  rectMode(CORNER);
  if(h){fill(0,230,255,35);stroke(0,230,255);strokeWeight(2);}
  else {fill(20,22,33,180);stroke(255,255,255,50);strokeWeight(1);}
  rect(btn.x,btn.y,btn.w,btn.h,6);
  noStroke();textAlign(CENTER,CENTER);textStyle(BOLD);
  if(h){fill(0,230,255);textSize(15);}else{fill(220,225,235);textSize(14);}
  if(btn.label==="FULLSCREEN")textSize(12);
  text(btn.label,btn.x+btn.w/2,btn.y+btn.h/2); pop();
}

function drawSessionIndicator(name, nextName) {
  push(); 
  rectMode(CENTER); 
  fill(0, 0, 0, 180); 
  stroke(0, 230, 255, 100); 
  strokeWeight(1);
  rect(width / 2, 55, 340, 55, 8); 
  noStroke(); 
  
  fill(0, 230, 255);
  textAlign(CENTER, CENTER); 
  textSize(16); 
  textStyle(BOLD);
  text(`${name} [${selectedSpeed}x]`, width / 2, 42); 
  
  textSize(13);
  if (nextName === "FINISH") {
    fill(150, 160, 180);
    text(`>> NEXT : FINISH <<`, width / 2, 65);
  } else {
    fill(255, 160, 50); 
    text(`>> NEXT : ${nextName} <<`, width / 2, 65);
  }
  pop();
}

function drawMasterOverlay() {
  let total=calcTotalScore(), combo=0, type=null;
  for(let i=0;i<SESSION_ORDER.length;i++){
    let s=SESSION_TIMELINE[SESSION_ORDER[i].key];
    if(globalSongTime>=s.start&&globalSongTime<s.end){type=SESSION_ORDER[i].type;break;}
  }
  if(type==="KEYBOARD") combo=typeof keyboardCombo!=='undefined'?keyboardCombo:0;
  else if(type==="BASS") combo=typeof bassCombo!=='undefined'?bassCombo:0;
  else if(type==="DRUM") combo=typeof drumCombo!=='undefined'?drumCombo:0;
  
  push(); textAlign(RIGHT,TOP); textSize(18); textStyle(BOLD); fill(255,255,255,160);
  text(`SCORE: ${total.toLocaleString()}`,width-30,20);
  
  textSize(15); fill(0,230,255); 
  text(`COMBO: ${combo}  |  MAX: ${globalMaxCombo}`,width-30,48); 
  
  textSize(12); textStyle(NORMAL); fill(150);
  text(`TIME: ${(globalSongTime/1000).toFixed(1)} / ${(SESSION_TIMELINE.DRUM4.end/1000).toFixed(0)}s`,width-30,75); 
  pop();
}

function drawPauseHint() {
  push(); textAlign(RIGHT,TOP); textSize(11); fill(120,130,150);
  text("ESC: 일시정지",width-30,100); pop();
}

function drawHelpPopup() {
  fill(0,0,0,230); rect(0,0,width,height);
  fill(20,20,30); stroke(0,230,255); rect(width/2-300,height/2-210,600,430,20);
  fill(255); noStroke(); textAlign(LEFT,TOP); textSize(15);
  let desc="이 게임은 한 곡 안에서 밴드의 세가지 세션(베이스, 건반, 드럼)을 모두 플레이 할 수 있는 리듬게임입니다.\n\n베이스: 마우스를 위 아래로 움직여 조준점을 줄 위에 위치시키고 타이밍을 맞춰 스페이스바/클릭 합니다.\n\n건반: 블럭이 떨어지는 타이밍에 맞추어 지정된 키보드를 누릅니다.\n\n드럼: 드럼 악보 위 지정된 키를 타이밍에 맞추어 누릅니다.\n\n🔥 중요 🔥: 새로운 악기 파트가 시작되면 첫 4박자 동안 화면에 '악보 넘기기 창'이 뜹니다. 실패 시 즉시 게임 오버됩니다!\n\n⏸ 일시정지: ESC 키\n🎚️ 배속: 곡 선택 화면에서 변경 가능";
  text(desc,width/2-270,height/2-185,540,380);
  textAlign(CENTER,CENTER); text("[클릭하여 닫기]",width/2,height/2+195);
}

function drawPageTurnOverlay(targetTime, currentSessionKey) {
  if (motionSuccessList[currentSessionKey]) return;
  
  push();
  translate(width / 2, height / 2);
  rectMode(CENTER);
  
  let w = 560; let h = 430;
  drawingContext.shadowBlur = 25; drawingContext.shadowColor = 'rgba(255, 0, 127, 0.4)';
  fill(5, 6, 12, 235); stroke(255, 0, 127, 180); strokeWeight(1);
  rect(0, 0, w, h, 4); 
  drawingContext.shadowBlur = 0; 
  noStroke(); textAlign(CENTER, CENTER);
  
  fill(255, 0, 127); textSize(11); textStyle(BOLD); text("C R I T I C A L   A L E R T", 0, -175);
  fill(255, 255, 255); textSize(18); textStyle(NORMAL); text("SWIPE TO TURN PAGE", 0, -145);
  
  let tl = targetTime - globalSongTime;
  let bc = Math.ceil(tl / ONE_BEAT_MS);
  
  if (bc > 0 && bc <= 4) {
    let cy = -95;
    noFill(); stroke(255, 255, 255, 20); strokeWeight(1); circle(0, cy, 50);
    stroke(0, 229, 255); strokeWeight(2);
    let angle = map(tl % ONE_BEAT_MS, 0, ONE_BEAT_MS, 0, TWO_PI);
    arc(0, cy, 50, 50, -HALF_PI, -HALF_PI + angle);
    noStroke(); fill(0, 229, 255); textSize(22); textStyle(BOLD); text(bc, 0, cy - 1);
  }
  
  let camW = 360, camH = 202.5, camY = 35;
  push(); scale(-1, 1); imageMode(CENTER); image(mainCapture, 0, camY, camW, camH); pop();
  
  noFill(); stroke(0, 229, 255, 60); strokeWeight(1); rect(0, camY, camW, camH);
  
  let lx = -120, rx = 120, nodeY = 35;
  let rH = checkMainMotion(67, 112, 25);
  let lH = checkMainMotion(333, 112, 25);
  let now = millis();
  
  if (rH && !rightCircleTriggered && now - rightTriggerTime > 400) { rightCircleTriggered = true; rightTriggerTime = now; }
  if (rightCircleTriggered && now - rightTriggerTime > 1500) { rightCircleTriggered = false; rightTriggerTime = now; }
  let gap = now - rightTriggerTime;
  if (rightCircleTriggered && lH && gap >= 50 && gap <= 1500) { motionSuccessList[currentSessionKey] = true; rightCircleTriggered = false; }
  
  let rColor = rightCircleTriggered ? color(0, 255, 150) : rH ? color(0, 255, 150) : color(255, 0, 127);
  push();
  if (rightCircleTriggered || rH) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = rColor; }
  noFill(); stroke(rColor); strokeWeight(1.5); circle(rx, nodeY, 50); 
  fill(red(rColor), green(rColor), blue(rColor), rightCircleTriggered ? 200 : 40); noStroke(); circle(rx, nodeY, rightCircleTriggered ? 24 : 14); pop();
  
  let lColor = motionSuccessList[currentSessionKey] ? color(0, 255, 150) : rightCircleTriggered ? color(0, 229, 255) : color(255, 255, 255, 40);
  push();
  if (rightCircleTriggered) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = lColor; }
  noFill(); stroke(lColor); strokeWeight(1.5); circle(lx, nodeY, 50);
  fill(red(lColor), green(lColor), blue(lColor), rightCircleTriggered ? 180 : 30); noStroke(); circle(lx, nodeY, rightCircleTriggered ? 24 : 14); pop();
  
  noStroke(); textStyle(BOLD); textSize(11);
  fill(rightCircleTriggered ? color(0, 255, 150) : color(255, 0, 127, 200)); text("01 // START", rx, nodeY + 45);
  fill(motionSuccessList[currentSessionKey] ? color(0, 255, 150) : rightCircleTriggered ? color(0, 229, 255) : color(255, 255, 255, 80)); text("02 // ACTION", lx, nodeY + 45);
  
  fill(140, 145, 160); textStyle(NORMAL); textSize(12);
  if (rightCircleTriggered) { fill(0, 229, 255); text("READY: SWIPE HAND LEFT IMMEDIATELY", 0, 175); } 
  else { fill(100, 105, 120); text("INTERACTION: GESTURE RIGHT TO LEFT TO FLIP SHEET", 0, 175); }
  
  mainPrevFrame.copy(mainCapture, 0, 0, 400, 225, 0, 0, 400, 225);
  pop();
}

function checkMainMotion(cx,cy,r) {
  mainCapture.loadPixels(); mainPrevFrame.loadPixels();
  if(!mainCapture.pixels?.length||!mainPrevFrame.pixels?.length) return false;
  let mc=0,tc=0;
  for(let y=0;y<mainCapture.height;y+=2){
    for(let x=0;x<mainCapture.width;x+=2){
      if(dist(x,y,cx,cy)<r){tc++;
        let i=(x+y*mainCapture.width)*4;
        if(dist(mainCapture.pixels[i],mainCapture.pixels[i+1],mainCapture.pixels[i+2],
                mainPrevFrame.pixels[i],mainPrevFrame.pixels[i+1],mainPrevFrame.pixels[i+2])>65) mc++;}
    }
  }
  return tc>0&&(mc/tc)>0.22;
}

function triggerGameOver() {
  isSongPlaying=false; isGameOver=true; isPaused=false;
  if(masterBgm) masterBgm.stop();
}

// ============================================
// 🖱️ 입력 이벤트
// ============================================
function mousePressed() {
  if(isHelpVisible){isHelpVisible=false;return;}

  if(mouseX>uiButtons.full.x&&mouseX<uiButtons.full.x+uiButtons.full.w&&
     mouseY>uiButtons.full.y&&mouseY<uiButtons.full.y+uiButtons.full.h){
    fullscreen(!fullscreen()); return;
  }

  if(screenState==='start'){
    if(mouseX>uiButtons.start.x&&mouseX<uiButtons.start.x+uiButtons.start.w&&
       mouseY>uiButtons.start.y&&mouseY<uiButtons.start.y+uiButtons.start.h){
      screenState='select'; return;
    }
    if(mouseX>uiButtons.help.x&&mouseX<uiButtons.help.x+uiButtons.help.w&&
       mouseY>uiButtons.help.y&&mouseY<uiButtons.help.y+uiButtons.help.h){
      isHelpVisible=true; return;
    }
  }

  if(screenState==='select'){
    let bk=selectButtons.back;
    if(mouseX>bk.x&&mouseX<bk.x+bk.w&&mouseY>bk.y&&mouseY<bk.y+bk.h){
      screenState='start'; return;
    }
    
// 🥁 하이햇 토글 로직
    let hh = selectButtons.hihat;
    if(mouseX>hh.x&&mouseX<hh.x+hh.w&&mouseY>hh.y&&mouseY<hh.y+hh.h){
      window.globalIsHihatRemoved = !window.globalIsHihatRemoved;
      selectButtons.hihat.label = window.globalIsHihatRemoved ? "🥁 DRUM-EXPERT: OFF" : "🥁 DRUM-EXPERT: ON";
      
      // 🌟 [추가] drum.js의 변수를 직접 제어 (하이햇 제거 여부와 반대로 설정)
      if (typeof drumExpertMode !== 'undefined') {
        drumExpertMode = !window.globalIsHihatRemoved;
      }
      
      if (typeof drumSetHihatState === 'function') {
        drumSetHihatState(window.globalIsHihatRemoved);
      }
      return;
    }

    for(let i=0;i<songCardRects.length;i++){
      let r=songCardRects[i];
      if(mouseX>r.x&&mouseX<r.x+r.w&&mouseY>r.y&&mouseY<r.y+r.h){
        selectedSongIdx=i;
        applySpeed(selectedSpeed); 
        return;
      }
    }
    for(let btn of speedButtons){
      if(mouseX>btn.x&&mouseX<btn.x+btn.w&&mouseY>btn.y&&mouseY<btn.y+btn.h){
        applySpeed(btn.speed); return;
      }
    }
    let pl=selectButtons.play;
    if(mouseX>pl.x&&mouseX<pl.x+pl.w&&mouseY>pl.y&&mouseY<pl.y+pl.h){
      startEnsembleGame(); return;
    }
  }
}

function keyPressed() {
  if(keyCode===ESCAPE){togglePause();return false;}
  if(isCountingDown) return false; 
  
  let currentSessionType = null;
  for(let i=0;i<SESSION_ORDER.length;i++){let s=SESSION_TIMELINE[SESSION_ORDER[i].key];if(globalSongTime>=s.start&&globalSongTime<s.end){currentSessionType=SESSION_ORDER[i].type;break;}}
  if((key === 'f' || key === 'F') && currentSessionType !== "DRUM"){fullscreen(!fullscreen());return;}
  if(isPaused||screenState!=='game') return;
  
  let type=null;
  for(let i=0;i<SESSION_ORDER.length;i++){
    let s=SESSION_TIMELINE[SESSION_ORDER[i].key];
    if(globalSongTime>=s.start&&globalSongTime<s.end){type=SESSION_ORDER[i].type;break;}
  }
  if(type==="KEYBOARD"&&typeof keyboardKeyPressed==='function') keyboardKeyPressed();
  else if(type==="BASS"&&typeof bassKeyPressed==='function') bassKeyPressed();
  else if(type==="DRUM"&&typeof drumKeyPressed==='function') drumKeyPressed();
}

function keyReleased() {
  if(isPaused||screenState!=='game'||isCountingDown) return; 
  let type=null;
  for(let i=0;i<SESSION_ORDER.length;i++){
    let s=SESSION_TIMELINE[SESSION_ORDER[i].key];
    if(globalSongTime>=s.start&&globalSongTime<s.end){type=SESSION_ORDER[i].type;break;}
  }
  if(type==="KEYBOARD"&&typeof keyboardKeyReleased==='function') keyboardKeyReleased();
  else if(type==="BASS"&&typeof bassKeyReleased==='function') bassKeyReleased();
  else if(type==="DRUM"&&typeof drumKeyReleased==='function') drumKeyReleased();
}

// ============================================
// 🔊 볼륨 슬라이더 제어 및 데시벨(dB) 연산
// ============================================
function handleVolumeSlider() {
  if (!volumeSlider) return;
  let dbValue = volumeSlider.value();
  if (masterBgm) masterBgm.amp(pow(10, dbValue / 20));

  let isPlayingLive = (screenState === 'game' && !isPaused && !isGameOver && !isGameEnded);
  if (isPlayingLive) {
    volumeSlider.hide();
  } else {
    volumeSlider.show();
    push();
    noStroke(); fill(160, 170, 190); textSize(11); textStyle(BOLD); textAlign(RIGHT, BOTTOM);
    let sign = dbValue > 0 ? "+" : "";
    text(`VOLUME: ${sign}${dbValue} dB`, width - 30, height - 42);
    pop();
  }
}
