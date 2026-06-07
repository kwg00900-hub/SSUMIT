// ============================================
// 게임 설정 (공통)
// ============================================
const keyboardLANE_COUNT = 8;
let keyboardLANE_WIDTH = 80;
let keyboardTRACK_X_OFFSET = -100; 
let keyboardJUDGE_LINE_Y_OFFSET = 120;
let keyboardNOTE_HEIGHT = 15;
let keyboardNOTE_WIDTH = 70;
let keyboardSCROLL_SPEED = 200;

let keyboardAUDIO_OFFSET = -100;

let keyboardNotes = [];
let keyboardCurrentTime = 0;
let keyboardJudgeLine;
let keyboardFont; 
let keyboardIsGameStarted = false; 

let keyboardJumpStartTime = 0;       
let keyboardTargetStartTimeSec = 0;  

// ============================================
// 🌟 밀리초(ms) 기반 판정 기준 오차 정의 (PERFECT, GREAT, MISS 3단계)
// ============================================
const keyboardJUDGE_WINDOW = {
  // 1. 일찍 치는 경우 (Early) 허용 범위 - 노트가 판정선에 오기 전
  EARLY_PERFECT: 90,   // 판정선 전 90ms 이내
  EARLY_GREAT: 220,    // 판정선 전 220ms까지 인정 (일찍 쳐도 입력 허용!)

  // 2. 늦게 치는 경우 (Late) 허용 범위 - 노트가 판정선을 지나간 후
  LATE_PERFECT: 90,    // 판정선 지난 후 90ms 이내
  LATE_GREAT: 100      // 판정선 지난 후 100ms까지만 인정 (이 시간이 지나면 MISS 처리)
};

//==========================================BPM
let keyboardGameBPM = 126;

// 판정 피드백 시스템
let keyboardLastJudgment = null;
let keyboardJudgmentTime = 0;

// 이펙트 시스템
let keyboardHitEffects = [];
let keyboardKeyPressEffects = [];

// ============================================
// 스코어 및 콤보 변수
// ============================================
let keyboardScore = 0;
let keyboardCombo = 0;
let keyboardMaxCombo = 0;
let keyboardComboScale = 1.0; 

// 누적 비트 트래커 (keyboard_r / keyboard_nr / keyboard_hr 전용)
let keyboardCurrentBeat = 0;

// ============================================
// BPM 및 비트 변환
// ============================================

// BPM 설정
function keyboardSetGameBPM(bpm) {
  keyboardGameBPM = bpm;
}

// 비트를 시간(초)으로 변환 
function keyboardBeatToTime(beat) {
  return (beat * 60) / keyboardGameBPM;
}

// ============================================
// 초기화 및 채보 제작
// ============================================
function keyboardPreload() {
  // 폰트 로드 필요 시 해제
}

function keyboardSetup() {
  keyboardUpdateGameScale();
  if (keyboardFont) textFont(keyboardFont);
  
  keyboardCreateChart();
}

function keyboardWindowResized() {
  resizeCanvas(windowWidth, windowHeight);
  keyboardUpdateGameScale();
}

function keyboardUpdateGameScale() {
  let trackWidth = min(windowWidth * 0.75, 800); 
  if (trackWidth < 450) trackWidth = windowWidth; 
  
  keyboardLANE_WIDTH = trackWidth / keyboardLANE_COUNT;
  keyboardNOTE_WIDTH = keyboardLANE_WIDTH * 0.85;
  
  keyboardTRACK_X_OFFSET = (windowWidth - trackWidth) / 2; 
  
  keyboardJUDGE_LINE_Y_OFFSET = windowHeight * 0.2;
  keyboardJudgeLine = windowHeight - keyboardJUDGE_LINE_Y_OFFSET;
  keyboardNOTE_HEIGHT = windowHeight * 0.02;
  keyboardSCROLL_SPEED = windowHeight * 0.6; 
}

function keyboardMousePressed() {
  if (!keyboardIsGameStarted) {
    keyboardIsGameStarted = true;
    return;
  }

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

// ============================================
// 채보 시스템
// ============================================

/**
 * [절대 비트 방식] 기존 함수 - beat에 절대 비트값을 입력
 * 예: keyboard_n(5, 4.0) → 4번째 비트에 5번 레인 노트 생성
 */
function keyboard_n(lane, beat) {
  keyboardNotes.push({
    type: 'short',
    time: keyboardBeatToTime(beat) * 1000, 
    lane: lane,
    active: true,
    missed: false
  });
}

/**
 * [절대 비트 방식] 기존 함수 - startBeat에 절대 비트값을 입력
 * 예: keyboard_h(4, 7.5, 0.5) → 7.5비트에 시작해 0.5비트 길이의 홀드 노트
 */
function keyboard_h(lane, startBeat, lengthBeat) {
  let endBeat = startBeat + lengthBeat;
  keyboardNotes.push({
    type: 'hold',
    time: keyboardBeatToTime(startBeat) * 1000,
    endTime: keyboardBeatToTime(endBeat) * 1000,
    lane: lane,
    active: true,
    missed: false,
    headHit: false, 
    holding: false  
  });
}

/**
 * [누적 비트 방식] 쉼표 - keyboardCurrentBeat를 beats만큼 앞으로 이동
 * bassRest처럼 시간을 소비하는 용도
 * 예: keyboard_r(4) → 4비트 쉬기
 */
function keyboard_r(beats) {
  keyboardCurrentBeat += beats;
}

/**
 * [누적 비트 방식] 노트 - keyboardCurrentBeat 위치에 노트 생성 후 beats만큼 전진
 * 예: keyboard_nr(5, 1) → 현재 위치에 5번 레인 노트, 1비트 전진
 */
function keyboard_nr(lane, beats) {
  keyboardNotes.push({
    type: 'short',
    time: keyboardBeatToTime(keyboardCurrentBeat) * 1000,
    lane: lane,
    active: true,
    missed: false
  });
  keyboardCurrentBeat += beats;
}

/**
 * [누적 비트 방식] 홀드 노트 - keyboardCurrentBeat 위치에 홀드 노트 생성
 * @param {number} lane       - 레인 번호
 * @param {number} lengthBeats - 홀드 길이 (비트)
 * @param {number} restBeats  - 홀드 종료 후 추가 쉼표 (비트), 기본값 0
 * 예: keyboard_hr(4, 2, 0.5) → 현재 위치에 2비트 홀드, 이후 0.5비트 쉬기
 */
function keyboard_hr(lane, lengthBeats, restBeats = 0) {
  let endBeat = keyboardCurrentBeat + lengthBeats;
  keyboardNotes.push({
    type: 'hold',
    time: keyboardBeatToTime(keyboardCurrentBeat) * 1000,
    endTime: keyboardBeatToTime(endBeat) * 1000,
    lane: lane,
    active: true,
    missed: false,
    headHit: false,
    holding: false
  });
  keyboardCurrentBeat = endBeat + restBeats;
}

/**
 * 누적 비트 트래커를 특정 비트로 이동
 * 새 구간 시작 시 위치를 맞출 때 사용
 * 예: keyboardSeek(40) → 40비트 위치로 이동
 */
function keyboardSeek(beat) {
  keyboardCurrentBeat = beat;
}

function keyboardCreateChart() {
  keyboardNotes = [];
  keyboardCurrentBeat = 0;
  keyboardSetGameBPM(126);

  // ================================================================
  // 구간 1: 인트로 (beat 4 ~)
  // ================================================================
  keyboardSeek(4.0);
  keyboard_nr(5, 1.0);        // beat 4.0
  keyboard_nr(5, 1.0);        // beat 5.0
  keyboard_nr(5, 0.5);        // beat 6.0
  keyboard_nr(6, 0.5);        // beat 6.5
  keyboard_nr(5, 0.5);        // beat 7.0

  keyboardSeek(7.5);
  keyboard_hr(4, 0.5, 0.5);   // beat 7.5,  홀드 0.5, 쉼 0.5

  keyboardSeek(8.5);
  keyboard_hr(4, 0.5, 0.5);   // beat 8.5,  홀드 0.5, 쉼 0.5

  keyboardSeek(9.5);
  keyboard_hr(4, 0.5, 0.5);   // beat 9.5,  홀드 0.5, 쉼 0.5

  keyboardSeek(10.5);
  keyboard_nr(6, 1.5);        // beat 10.5  → 쉼 1.5 → beat 12.0

  keyboardSeek(12.0);
  keyboard_nr(5, 1.0);        // beat 12.0
  keyboard_nr(5, 1.0);        // beat 13.0
  keyboard_nr(5, 0.5);        // beat 14.0
  keyboard_nr(6, 0.5);        // beat 14.5
  keyboard_nr(5, 0.5);        // beat 15.0

  keyboardSeek(15.5);
  keyboard_hr(4, 1.0, 0.5);   // beat 15.5, 홀드 1.5

  keyboardSeek(17.0);
  keyboard_hr(3, 0.5, 0.5);   // beat 17.0, 홀드 1.0

  keyboardSeek(18.0);
  keyboard_hr(2, 0.5, 0.5);   // beat 18.0, 홀드 1.0

  keyboardSeek(19.0);
  keyboard_hr(1, 0.5, 0.5);   // beat 19.0, 홀드 1.0

  keyboardSeek(20.0);
  keyboard_hr(2, 2.0, 1.0);   // beat 20.0, 홀드 2.0, 쉼 1.0 → beat 23.0

  keyboardSeek(23.0);
  keyboard_nr(1, 1.0);        // beat 23.0
  keyboard_nr(2, 0.5);        // beat 24.0
  keyboard_nr(3, 0.5);        // beat 24.5
  keyboard_nr(4, 0.5);        // beat 25.0
  keyboard_nr(1, 2.5);        // beat 25.5  → 쉼 2.5 → beat 28.0

  keyboardSeek(28.0);
  keyboard_hr(2, 0.5, 0.5);   // beat 28.0, 홀드 1.0

  keyboardSeek(29.0);
  keyboard_hr(3, 0.5, 0.5);   // beat 29.0, 홀드 1.0

  keyboardSeek(30.0);
  keyboard_hr(4, 0.5, 0.5);   // beat 30.0, 홀드 1.0

  keyboardSeek(31.0);
  keyboard_hr(5, 0.5, 0.5);   // beat 31.0, 홀드 1.0

  keyboardSeek(32.0);
  keyboard_hr(6, 2.0, 130.0);   // beat 32.0, 홀드 2.0

  // ================================================================
  // 구간 2: 너에게 하고픈 말은 (beat 164 ~)
  // ================================================================
  keyboardSeek(164.0);
  keyboard_nr(6, 1.5);        // beat 164.0 → 쉼 1.5 → beat 165.5

  keyboardSeek(165.5);
  keyboard_nr(5, 3.0);        // beat 165.5 → 쉼 3.0 → beat 168.5

  keyboardSeek(168.5);
  keyboard_nr(4, 1.0);        // beat 168.5

  keyboardSeek(169.5);
  keyboard_nr(3, 2.5);       // beat 169.5 → 쉼 2.5 → beat 172.0

  keyboardSeek(172.0);
  keyboard_nr(3, 1.5);        // beat 172.0

  keyboardSeek(173.5);
  keyboard_nr(2, 3.0);        // beat 173.5 → 쉼 3.0 → beat 176.5

  keyboardSeek(176.5);
  keyboard_nr(1, 1.0);        // beat 176.5

  keyboardSeek(177.5);
  keyboard_nr(0, 2.5);        // beat 177.5 → 쉼 2.5 → beat 180.0

  keyboardSeek(180.0);
  keyboard_hr(4, 4.0, 77.0);   // beat 180.0, 홀드 4.0

  // ================================================================
  // 구간 3: 오 기다림 (beat 261 ~)
  // ================================================================
  keyboardSeek(261.0);
  keyboard_hr(5, 2.0, 0.5);   // beat 261.0, 홀드 2.0, 쉼 0.5

  keyboardSeek(263.5);
  keyboard_hr(4, 1.0, 1.0);   // beat 263.5, 홀드 1.0, 쉼 1.0

  keyboardSeek(265.5);
  keyboard_nr(6, 0.5);        // beat 265.5
  keyboard_nr(6, 0.5);        // beat 266.0
  keyboard_nr(6, 0.5);        // beat 266.5
  keyboard_nr(5, 1.0);        // beat 267.0

  keyboardSeek(268.0);
  keyboard_hr(4, 1.0, 1.0);   // beat 268.0, 홀드 1.0, 쉼 1.0

  keyboardSeek(270.0);
  keyboard_nr(4, 0.5);        // beat 270.0
  keyboard_nr(2, 1.0);        // beat 270.5
  keyboard_nr(4, 1.0);        // beat 271.5

  keyboardSeek(272.5);
  keyboard_hr(2, 1.0, 2.5);   // beat 272.5, 홀드 1.0, 쉼 2.5

  keyboardSeek(276.0);
  keyboard_hr(3, 2.0, 1.5);   // beat 276.0, 홀드 2.0, 쉼 1.5

  keyboardSeek(279.5);
  keyboard_hr(4, 1.0, 35.5);   // beat 279.5, 홀드 1.0

  // ================================================================
  // 구간 4: (beat 316 ~)
  // ================================================================
  keyboardSeek(316.0);
  keyboard_nr(4, 1.0);        // beat 316.0
  keyboard_nr(4, 1.0);        // beat 317.0
  keyboard_nr(4, 0.5);        // beat 318.0
  keyboard_nr(4, 1.0);        // beat 318.5
  keyboard_nr(3, 1.0);        // beat 319.5
  keyboard_nr(3, 1.5);        // beat 320.5 → 쉼 1.5 → beat 322.0

  keyboardSeek(322.0);
  keyboard_nr(3, 1.0);        // beat 322.0
  keyboard_nr(3, 2.0);        // beat 323.0 → 쉼 2.0 → beat 325.0

  keyboardSeek(325.0);
  keyboard_nr(4, 1.5);        // beat 325.0

  keyboardSeek(326.5);
  keyboard_nr(4, 1.0);        // beat 326.5
  keyboard_nr(3, 1.0);        // beat 327.5
  keyboard_nr(3, 1.5);        // beat 328.5 → 쉼 1.5 → beat 330.0

  keyboardSeek(330.0);
  keyboard_nr(4, 1.0);        // beat 330.0
  keyboard_nr(3, 1.0);        // beat 331.0
  keyboard_nr(2, 1.0);        // beat 332.0

  // ================================================================
  // 구간 5: (beat 333 ~)
  // ================================================================
  keyboardSeek(333.0);
  keyboard_nr(2, 1.0);        // beat 333.0
  keyboard_nr(2, 0.5);        // beat 334.0
  keyboard_nr(2, 1.0);        // beat 334.5
  keyboard_nr(1, 1.0);        // beat 335.5

  keyboardSeek(336.5);
  keyboard_hr(1, 1.0, 0.5);   // beat 336.5, 홀드 1.0, 쉼 0.5

  keyboardSeek(338.0);
  keyboard_nr(1, 1.0);        // beat 338.0
  keyboard_nr(1, 2.0);        // beat 339.0 → 쉼 2.0 → beat 341.0

  keyboardSeek(341.0);
  keyboard_nr(2, 1.5);        // beat 341.0

  keyboardSeek(342.5);
  keyboard_nr(2, 1.0);        // beat 342.5
  keyboard_nr(1, 1.0);        // beat 343.5
  keyboard_nr(1, 1.5);        // beat 344.5 → 쉼 1.5 → beat 346.0

  keyboardSeek(346.0);
  keyboard_nr(2, 1.0);        // beat 346.0
  keyboard_nr(1, 0.5);        // beat 347.0

  keyboardSeek(347.5);
  keyboard_nr(0, 0.0);        // beat 347.5 (마지막 노트)
}

// ============================================
// 게임 루프 및 렌더링
// ============================================
function keyboardDraw() {
  background(20);
  
  keyboardCurrentTime = globalSongTime;
  
  // 1. 사이드 배경 UI
  keyboardDrawCustomLeftUI();  
  keyboardDrawCustomRightUI(); 
  
  // 2. 게임 플레이 영역 배경
  keyboardDrawBeatLines();
  keyboardDrawLanes();
  
  // 3. 게임 노트 렌더링
  keyboardDrawNotes();
  
  // 4. 피아노 건반 및 키 입력 이펙트
  keyboardDrawWhiteKeys();       
  keyboardDrawKeyPressEffects(); 
  keyboardDrawBlackKeys();       
  
  // 5. 판정선 및 상위 이펙트 시스템
  keyboardDrawJudgmentLine();
  keyboardCheckMissedNotes();
  keyboardDrawHitEffects();      
  keyboardDrawInfo();
}

function keyboardDrawCustomLeftUI() {}

function keyboardDrawCustomRightUI() {}

function keyboardDrawBeatLines() {
  stroke(100, 100, 150, 100);
  strokeWeight(2);
  
  let beatDuration = (60 / keyboardGameBPM) * 4;  
  let currentMeasure = (keyboardCurrentTime + keyboardAUDIO_OFFSET) / 1000 / beatDuration;
  let startMeasure = Math.floor(currentMeasure) - 2;
  
  let trackWidth = keyboardLANE_WIDTH * keyboardLANE_COUNT;
  
  for (let i = startMeasure; i < startMeasure + 15; i++) {
    let beatTime = i * beatDuration * 1000;
    let y = keyboardCalcNoteY(beatTime);
    
    if (y > -50 && y < keyboardJudgeLine + 100) {
      if (i % 4 === 0) {
        stroke(150, 150, 200, 150);
        strokeWeight(3);
      } else {
        stroke(100, 100, 150, 80);
        strokeWeight(1.5);
      }
      line(keyboardTRACK_X_OFFSET, y, keyboardTRACK_X_OFFSET + trackWidth, y);
    }
  }
}

function keyboardDrawLanes() {
  stroke(80);
  strokeWeight(2);
  for (let i = 0; i <= keyboardLANE_COUNT; i++) {
    let x = keyboardTRACK_X_OFFSET + i * keyboardLANE_WIDTH;
    line(x, 0, x, keyboardJudgeLine);
  }
}

function keyboardDrawJudgmentLine() {
  let trackWidth = keyboardLANE_WIDTH * keyboardLANE_COUNT;
  stroke(255, 50, 50);
  strokeWeight(4);
  line(keyboardTRACK_X_OFFSET, keyboardJudgeLine, keyboardTRACK_X_OFFSET + trackWidth, keyboardJudgeLine);
  
  noStroke();
  fill(255, 50, 50, 30);
  rect(keyboardTRACK_X_OFFSET, keyboardJudgeLine - 2, trackWidth, 4);
}

function keyboardCalcNoteY(noteTime) {
  let timeDiff = noteTime - (keyboardCurrentTime + keyboardAUDIO_OFFSET);
  return keyboardJudgeLine - (timeDiff / 1000) * keyboardSCROLL_SPEED;
}

function keyboardDrawNotes() {
  for (let note of keyboardNotes) {
    if (!note.active) continue;
    
    let x = keyboardTRACK_X_OFFSET + note.lane * keyboardLANE_WIDTH + (keyboardLANE_WIDTH - keyboardNOTE_WIDTH) / 2;
    
    if (note.type === 'short') {
      let y = keyboardCalcNoteY(note.time);
      if (y < -50 || y > height + 50) continue;
      
      fill(0, 0, 0, 100);
      noStroke();
      rect(x + 2, y + 2, keyboardNOTE_WIDTH, keyboardNOTE_HEIGHT, 3);
      
      fill(100, 200, 255);
      stroke(150, 220, 255);
      strokeWeight(2);
      rect(x, y, keyboardNOTE_WIDTH, keyboardNOTE_HEIGHT, 3);
    } 
    else if (note.type === 'hold') {
      let yStart = keyboardCalcNoteY(note.time);
      let yEnd = keyboardCalcNoteY(note.endTime);
      
      if (yStart < -50 && yEnd < -50) continue;
      if (yEnd > height + 50 && yStart > height + 50) continue;
      
      let yBottom = note.holding ? keyboardJudgeLine : yStart;
      let yTop = yEnd;
      
      if (yBottom > yTop) {
        fill(100, 200, 255, 100);
        stroke(150, 220, 255, 180);
        strokeWeight(2);
        rect(x, yTop, keyboardNOTE_WIDTH, yBottom - yTop, 5);
      }
      
      if (!note.headHit) {
        fill(50, 150, 255);
        stroke(200, 240, 255);
        strokeWeight(2);
        rect(x, yStart, keyboardNOTE_WIDTH, keyboardNOTE_HEIGHT, 3);
      }
      
      fill(255, 255, 255, 200);
      noStroke();
      rect(x, yEnd, keyboardNOTE_WIDTH, 4, 1);
    }
  }
}

function keyboardCheckMissedNotes() {
  let playTime = keyboardCurrentTime + keyboardAUDIO_OFFSET;

  for (let note of keyboardNotes) {
    if (note.active && !note.missed) {
      
      // 단타 노트 미스 체크
      if (note.type === 'short') {
        if (playTime > note.time + keyboardJUDGE_WINDOW.LATE_GREAT) {  
          keyboardTriggerMiss(note, 'MISS');
        }
      } 
      // 롱노트 미스 체크
      else if (note.type === 'hold') {
        // 머리를 못 누르고 지나간 경우
        if (!note.headHit && playTime > note.time + keyboardJUDGE_WINDOW.LATE_GREAT) {
          keyboardTriggerMiss(note, 'MISS');
        }
        // 홀드 도중 끝나는 시점에 도달해 정상 클리어된 경우
        else if (note.holding && playTime >= note.endTime) {
          note.active = false;
          note.holding = false;
          
          keyboardScore += 1000;
          keyboardCombo++;
          if (keyboardCombo > keyboardMaxCombo) keyboardMaxCombo = keyboardCombo;
          keyboardComboScale = 1.3;

          keyboardLastJudgment = {
            text: 'PERFECT',
            note: keyboardGetNoteName(note.lane),
            key: keyboardGetKeyLabel(note.lane),
            timing: 'HOLD CLEAR',
            startScale: 1.2
          };
          keyboardJudgmentTime = millis();
          
          keyboardHitEffects.push({
            lane: note.lane,
            time: millis(),
            color: [255, 255, 100]
          });
        }
      }
    }
  }
}

function keyboardTriggerMiss(note, reason) {
  note.active = false;
  note.missed = true;
  note.holding = false;
  
  keyboardCombo = 0; 
  
  keyboardLastJudgment = {
    text: 'MISS',
    note: keyboardGetNoteName(note.lane),
    key: keyboardGetKeyLabel(note.lane),
    timing: reason,
    startScale: 1.4 
  };
  keyboardJudgmentTime = millis();
}

function keyboardDrawKeyPressEffects() {
  for (let i = keyboardKeyPressEffects.length - 1; i >= 0; i--) {
    let effect = keyboardKeyPressEffects[i];
    let age = millis() - effect.time;
    let maxAge = 200;
    
    if (age > maxAge) {
      keyboardKeyPressEffects.splice(i, 1);
      continue;
    }
    
    let progress = age / maxAge;
    let alpha = 120 * (1 - progress);
    
    fill(100, 200, 255, alpha);
    noStroke();
    let pianoY = keyboardJudgeLine;
    let whiteKeyHeight = keyboardJUDGE_LINE_Y_OFFSET * 0.65;
    let x = keyboardTRACK_X_OFFSET + effect.lane * keyboardLANE_WIDTH; 
    rect(x + 2, pianoY, keyboardLANE_WIDTH - 4, whiteKeyHeight);
  }
}

function keyboardDrawHitEffects() {
  for (let i = keyboardHitEffects.length - 1; i >= 0; i--) {
    let effect = keyboardHitEffects[i];
    let age = millis() - effect.time;
    let maxAge = 500;
    
    if (age > maxAge) {
      keyboardHitEffects.splice(i, 1);
      continue;
    }
    
    let progress = age / maxAge;
    let alpha = 255 * (1 - progress);
    let size = keyboardLANE_WIDTH * (0.5 + progress * 1.5);
    
    let x = keyboardTRACK_X_OFFSET + effect.lane * keyboardLANE_WIDTH + keyboardLANE_WIDTH / 2; 
    noFill();
    stroke(effect.color[0], effect.color[1], effect.color[2], alpha);
    strokeWeight(3);
    circle(x, keyboardJudgeLine, size);
  }
}

function keyboardDrawWhiteKeys() {
  let pianoY = keyboardJudgeLine;
  let whiteKeyHeight = keyboardJUDGE_LINE_Y_OFFSET * 0.65;
  
  for (let i = 0; i < keyboardLANE_COUNT; i++) {
    let x = keyboardTRACK_X_OFFSET + i * keyboardLANE_WIDTH;
    
    fill(250);
    stroke(50);
    strokeWeight(2);
    rect(x + 2, pianoY, keyboardLANE_WIDTH - 4, whiteKeyHeight);
    
    fill(80);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(keyboardLANE_WIDTH * 0.18);
    text(keyboardGetKeyLabel(i), x + keyboardLANE_WIDTH / 2, pianoY + whiteKeyHeight - whiteKeyHeight * 0.25); 
    
    textSize(keyboardLANE_WIDTH * 0.14);
    fill(120);
    text(keyboardGetNoteName(i), x + keyboardLANE_WIDTH / 2, pianoY + whiteKeyHeight * 0.2);
  }
}

function keyboardDrawBlackKeys() {
  let pianoY = keyboardJudgeLine;
  let whiteKeyHeight = keyboardJUDGE_LINE_Y_OFFSET * 0.65;
  let blackKeyHeight = whiteKeyHeight * 0.6;
  
  keyboardDrawBlackKey(0, pianoY, blackKeyHeight);
  keyboardDrawBlackKey(1, pianoY, blackKeyHeight);
  keyboardDrawBlackKey(3, pianoY, blackKeyHeight);
  keyboardDrawBlackKey(4, pianoY, blackKeyHeight);
  keyboardDrawBlackKey(5, pianoY, blackKeyHeight);
}

function keyboardDrawBlackKey(whiteKeyIndex, pianoY, blackKeyHeight) {
  let x = keyboardTRACK_X_OFFSET + (whiteKeyIndex + 1) * keyboardLANE_WIDTH - keyboardLANE_WIDTH * 0.25;
  
  fill(40);
  stroke(20);
  strokeWeight(2);
  rect(x, pianoY, keyboardLANE_WIDTH * 0.5, blackKeyHeight);
}

function keyboardGetKeyLabel(lane) {
  const keys = ['W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'];
  return keys[lane];
}

function keyboardGetNoteName(lane) {
  const noteNames = ['도', '레', '미', '파', '솔', '라', '시', '도'];
  return noteNames[lane];
}

function keyboardDrawInfo() {
  fill(255, 150);
  noStroke();
  textAlign(LEFT, TOP);
  let fontSize = 12;
  textSize(fontSize);
  
  text(`FPS: ${Math.round(frameRate())}  |  Time: ${(keyboardCurrentTime / 1000).toFixed(2)}s`, 15, 15);
  
  if (keyboardLastJudgment && millis() - keyboardJudgmentTime < 1000) {
    let elapsed = millis() - keyboardJudgmentTime;
    let duration = 1000; 
    let currentScale = 1.0;
    
    if (elapsed < duration) {
      let t = elapsed / duration;
      let easeOutExp = (t === 1) ? 1 : 1 - Math.pow(2, -10 * t);
      currentScale = 1.0 + (keyboardLastJudgment.startScale - 1.0) * (1 - easeOutExp);
    }
    
    push();
    translate(width / 2, height / 2 - height * 0.15);
    scale(currentScale);
    
    textAlign(CENTER, CENTER);
    textSize(width * 0.035);
    
    // 🔥 [이 부분 변경됨] 기존 GOOD, BAD 제거하고 GREAT 추가!
    if (keyboardLastJudgment.text === 'PERFECT') fill(255, 255, 100); // 노란색
    else if (keyboardLastJudgment.text === 'GREAT') fill(255, 220, 0);   // 주황/연노랑색 (베이스와 동일)
    else fill(255, 50, 50); // MISS (빨간색)
    
    text(keyboardLastJudgment.text, 0, 0);
    pop();
    
    textAlign(CENTER, CENTER);
    textSize(width * 0.018);
    fill(255, 255, 255, 100);
    text(`${keyboardLastJudgment.note} (${keyboardLastJudgment.key}) - ${keyboardLastJudgment.timing}`, 
         width / 2, height / 2 - height * 0.1);
  }
}

function keyboardGetLaneFromKey(k) {
  if (!k) return -1;
  const upperKey = k.toUpperCase();
  const keys = ['W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'];
  return keys.indexOf(upperKey); 
}

function keyboardKeyPressed() {
  let lane = keyboardGetLaneFromKey(key);
  
  if (lane !== -1) {
    keyboardHandleInput(lane);
    keyboardKeyPressEffects.push({
      lane: lane,
      time: millis()
    });
  }
}

function keyboardKeyReleased() {
  let lane = keyboardGetLaneFromKey(key);
  let playTime = keyboardCurrentTime + keyboardAUDIO_OFFSET;
  
  if (lane !== -1) {
    for (let note of keyboardNotes) {
      if (note.lane === lane && note.active && note.type === 'hold' && note.holding) {
        let timeDiff = note.endTime - playTime;
        
        // 종료 타겟 시간보다 250ms 이상 일찍 떼버린 경우 브레이크 처리 (MISS)
        if (timeDiff > 250) {
          note.active = false;
          note.holding = false;
          note.missed = true;
          
          keyboardCombo = 0; 
          
          keyboardLastJudgment = {
            text: 'MISS',
            note: keyboardGetNoteName(lane),
            key: keyboardGetKeyLabel(lane),
            timing: 'EARLY RELEASE',
            startScale: 1.4
          };
          keyboardJudgmentTime = millis();
        } else {
          // 판정 오차 안정권 내에서 정상적으로 손을 뗀 경우 처리 유지
          note.active = false;
          note.holding = false;
        }
      }
    }
  }
}

function keyboardHandleInput(lane) {
  let closestNote = null;
  let minTimeDiff = Infinity;
  let playTime = keyboardCurrentTime + keyboardAUDIO_OFFSET;
  let isEarly = false;
  
  for (let note of keyboardNotes) {
    if (note.lane === lane && note.active) {
      if (note.type === 'hold' && note.headHit) continue;
      
      let timeDiff = note.time - playTime; 
      let absDiff = Math.abs(timeDiff);
      
      // Early 판정 윈도우 검사
      if (timeDiff >= 0 && absDiff <= keyboardJUDGE_WINDOW.EARLY_GREAT) {
        if (absDiff < minTimeDiff) {
          minTimeDiff = absDiff;
          closestNote = note;
          isEarly = true;
        }
      } 
      // Late 판정 윈도우 검사
      else if (timeDiff < 0 && absDiff <= keyboardJUDGE_WINDOW.LATE_GREAT) {
        if (absDiff < minTimeDiff) {
          minTimeDiff = absDiff;
          closestNote = note;
          isEarly = false;
        }
      }
    }
  }
  
  if (closestNote) {
    let judgment = '';
    let effectColor = [255, 255, 255];
    let scoreGain = 0;
    
    let maxPerfectWindow = isEarly ? keyboardJUDGE_WINDOW.EARLY_PERFECT : keyboardJUDGE_WINDOW.LATE_PERFECT;
    
    // 3단계 판정 세팅 (PERFECT / GREAT) -> 범위를 벗어나면 위 Miss 시스템에서 걸러짐
    if (minTimeDiff <= maxPerfectWindow) {
      judgment = 'PERFECT';
      effectColor = [255, 255, 100];
      scoreGain = 1000;
      keyboardCombo++;
    } else {
      judgment = 'GREAT';
      effectColor = [255, 220, 0]; // 베이스와 동일한 노란/주황빛 계열
      scoreGain = 500;
      keyboardCombo++;
    }
    
    keyboardScore += scoreGain;
    if (keyboardCombo > keyboardMaxCombo) keyboardMaxCombo = keyboardCombo;
    keyboardComboScale = 1.35; 

    if (closestNote.type === 'short') {
      closestNote.active = false; 
    } else if (closestNote.type === 'hold') {
      closestNote.headHit = true; 
      closestNote.holding = true; 
    }
    
    let directionLabel = isEarly ? "FAST" : "SLOW";
    keyboardLastJudgment = {
      text: judgment,
      note: keyboardGetNoteName(lane),
      key: keyboardGetKeyLabel(lane),
      timing: `${minTimeDiff.toFixed(0)}ms (${directionLabel})`, 
      startScale: 1.2
    };
    keyboardJudgmentTime = millis();
    
    keyboardHitEffects.push({
      lane: lane, 
      time: millis(),
      color: effectColor
    });
  }
}

function keyboardPlayKeyboard() {
    console.log("키보드 연주 시작!");
}
