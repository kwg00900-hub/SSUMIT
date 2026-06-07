let drumScore = 0;
let drumCombo = 0;

// 🥁 Expert 모드: false면 Hihat/Ride 노트 제외
let drumExpertMode = true;

// ==========================================
// [설정] 박자/시간 동기화용 변수
// ==========================================
let drumSONG_BPM = 126;
let drumIsPlaying = false;

let drumCurrentBeatTracker = 0;

const drumNOTE_1  = 4.0;
const drumNOTE_2  = 2.0;
const drumNOTE_4  = 1.0;
const drumNOTE_8  = 0.5;
const drumNOTE_16 = 0.25;
const drumNOTE_D4 = 1.5;
const drumNOTE_D8 = 0.75;

const drumNOTE_4_TR  = 2.0 / 3;
const drumNOTE_8_TR  = 1.0 / 3;
const drumNOTE_16_TR = 0.5 / 3;

let drumCapture;
let drumPrevFrame;

let drumYRide   = 235;
let drumYHihat  = 250;
let drumYTom1   = 265;
let drumYTom2   = 280;
let drumYSnare  = 295;
let drumYFloor  = 325;
let drumYKick   = 355;

let drumJudgeList = [];
let drumConsumedKey = false; // F키 등 충돌 방지용
let drumNotes = [];

// 🌟 히트 이펙트 시스템 (베이스 스타일 통일)
let drumHitEffects = [];

// 🌟 드럼킷 플래시 상태 (타격 시 해당 악기 하얗게)
let drumKitFlash = {
  Hihat: 0, Ride: 0, Crash: 0,
  Snare: 0, Tom1: 0, Tom2: 0, FloorTom: 0, Kick: 0,
  CrashLeft: 0, CrashRight: 0
};
const drumFLASH_DURATION = 120; // ms

// 🌟 악기별 노트 색상 (파장·플래시 공통 사용)
const drumNOTE_COLORS = {
  Crash:    [255, 140,   0],
  Hihat:    [255,   0, 255],
  Ride:     [180, 100, 255],
  Snare:    [255, 255, 255],
  Tom1:     [  0, 200, 255],
  Tom2:     [255, 220,   0],
  FloorTom: [ 80, 255, 120],
  Kick:     [255,  80,  50],
};

// 🌟 판정 색상 (베이스와 통일)
const drumCOLOR = {
  PERFECT: [0, 255, 200],
  GREAT: [255, 220, 0],
  MISS: [255, 50, 50],
  BREAK: [255, 100, 100],
};

function drumPreload(){}

let drumAUDIO_OFFSET = -90; // 시스템 입력지연 보정 (베이스와 동일 컨셉)

// 🌟 비대칭 판정 윈도우 (사람은 박자를 미리 예측해서 친다)
const drumJUDGE_WINDOW = {
  EARLY_PERFECT: 55,
  EARLY_GREAT:   200,   // 미리 치는 건 너그럽게
  LATE_PERFECT:  55,
  LATE_GREAT:    110    // 늦게 치는 건 빡세게
};


function drumBeatToTime(beat) {
  return (beat * 60 / drumSONG_BPM) * 1000;
}

function drumAddNote(type) {
  // Expert OFF면 Hihat/Ride 노트 추가 안 함
  if (!drumExpertMode && (type === 'Hihat' || type === 'Ride')) return;

  let targetY = drumYSnare;
  if (type === 'Ride') targetY = drumYRide;
  else if (type === 'Hihat') targetY = drumYHihat;
  else if (type === 'Tom1') targetY = drumYTom1;
  else if (type === 'Tom2') targetY = drumYTom2;
  else if (type === 'Snare') targetY = drumYSnare;
  else if (type === 'FloorTom') targetY = drumYFloor;
  else if (type === 'Kick') targetY = drumYKick;
  else if (type === 'Crash') targetY = drumYHihat;

  let timeMs = drumBeatToTime(drumCurrentBeatTracker);
  drumNotes.push({ time: timeMs, y: targetY, type: type });
}

function drumRest(beatLength) {
  drumCurrentBeatTracker += beatLength;
}

// ==========================================
// 채보 (원본 그대로)
// ==========================================
function drumCreateChart() {
  drumNotes = [];
  drumCurrentBeatTracker = 0;

  drumRest(drumNOTE_1 * 17);
  drumRest(drumNOTE_1);

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumAddNote('Hihat'); drumAddNote('Snare');drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumRest(drumNOTE_16);
  drumRest(drumNOTE_8);
  drumAddNote('Snare');              drumRest(drumNOTE_4);
  drumAddNote('Snare');              drumRest(drumNOTE_4);

  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);
  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);  drumRest(drumNOTE_1);

  drumRest(drumNOTE_1);

  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumRest(drumNOTE_8);

  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumRest(drumNOTE_8);

  drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_8);
  drumAddNote('Tom2'); drumRest(drumNOTE_8);
  drumAddNote('FloorTom'); drumRest(drumNOTE_4);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Tom1');  drumRest(drumNOTE_4_TR);
  drumAddNote('Tom2');  drumRest(drumNOTE_4_TR);
  drumAddNote('FloorTom');  drumRest(drumNOTE_4_TR);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('FloorTom'); drumRest(drumNOTE_16);
  drumAddNote('FloorTom'); drumRest(drumNOTE_16);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Tom1');  drumRest(drumNOTE_4_TR);
  drumAddNote('Tom2');  drumRest(drumNOTE_4_TR);
  drumAddNote('FloorTom');  drumRest(drumNOTE_4_TR);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_4);

  for (let i = 0; i < 8; i++) drumRest(drumNOTE_1); // 41~48
  for (let i = 0; i < 8; i++) drumRest(drumNOTE_1); // 49~56

  drumRest(drumNOTE_1); // 57

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);

  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_16);
                        drumAddNote('Snare');drumRest(drumNOTE_8);
                        drumAddNote('Tom1');drumRest(drumNOTE_8);
                        drumAddNote('Tom2');drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  for (let i = 0; i < 8; i++) drumRest(drumNOTE_1); // 65~72
  for (let i = 0; i < 8; i++) drumRest(drumNOTE_1); // 73~80
  for (let i = 0; i < 6; i++) drumRest(drumNOTE_1); // 81~86

  drumRest(drumNOTE_1); // 87

  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumRest(drumNOTE_8);

  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumRest(drumNOTE_8);
  drumAddNote('Ride');                       drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare'); drumRest(drumNOTE_8);
  drumAddNote('Ride');                       drumRest(drumNOTE_8);
  drumAddNote('Ride');                      drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');                      drumRest(drumNOTE_8);

  drumAddNote('Ride');                       drumRest(drumNOTE_8);
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_8);
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_8);
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_8);
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_8);
  drumAddNote('Kick'); drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_4);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Tom1');  drumRest(drumNOTE_4_TR);
  drumAddNote('Tom2');  drumRest(drumNOTE_4_TR);
  drumAddNote('FloorTom');  drumRest(drumNOTE_4_TR);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumAddNote('FloorTom'); drumRest(drumNOTE_16);
  drumAddNote('FloorTom'); drumRest(drumNOTE_16);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Tom1');  drumRest(drumNOTE_4_TR);
  drumAddNote('Tom2');  drumRest(drumNOTE_4_TR);
  drumAddNote('FloorTom');  drumRest(drumNOTE_4_TR);

  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
}

function drumMousePressed(){
  if (!drumIsPlaying) drumIsPlaying = true;
}

function drumSetup() {
  drumCapture = createCapture(VIDEO);
  drumCapture.size(400, 150);
  drumCapture.hide();
  drumPrevFrame = createImage(400, 150);
  drumCreateChart();
}

function drumWindowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drumKeyPressed() {
  if (key === '1') {
    let fs = fullscreen();
    fullscreen(!fs);
    resizeCanvas(windowWidth, windowHeight);
    return false;
  }

  let pressedType = "";
  if (key === ' ') pressedType = "Kick";
  else if (key === 'u' || key === 'U') pressedType = "Snare";
  else if (key === 'i' || key === 'I') pressedType = "Tom1";
  else if (key === 'f' || key === 'F') { pressedType = "Tom2"; drumConsumedKey = true; }
  else if (key === 'h' || key === 'H') pressedType = "FloorTom";
  else if (key === 'r' || key === 'R') pressedType = "Hihat";
  else if (key === 'e' || key === 'E') pressedType = "Ride";

  if (pressedType !== "") drumCheckHit(pressedType);
}

// 🌟 히트 판정 + 이펙트 생성 (베이스 스타일 통일)
// 🌟 베이스 판정 엔진 이식: 최근접 노트 + 비대칭 윈도우 + offset 적용 + 헛침 피드백
function drumCheckHit(pressedType, allowMiss = true) {
  let playTime = globalSongTime + drumAUDIO_OFFSET; // 판정도 화면과 동일 보정

  let closestNote = null;
  let closestIndex = -1;
  let minDiff = Infinity;
  let isEarly = false;

  // 1) 윈도우 안에서 '가장 가까운' 같은 타입 노트 탐색
  for (let i = 0; i < drumNotes.length; i++) {
    let note = drumNotes[i];
    if (note.type !== pressedType) continue;

    let timeDiff = note.time - playTime; // +면 아직 안 옴(early), -면 지나감(late)
    let absDiff = abs(timeDiff);

    if (timeDiff >= 0 && absDiff <= drumJUDGE_WINDOW.EARLY_GREAT) {
      if (absDiff < minDiff) { minDiff = absDiff; closestNote = note; closestIndex = i; isEarly = true; }
    } else if (timeDiff < 0 && absDiff <= drumJUDGE_WINDOW.LATE_GREAT) {
      if (absDiff < minDiff) { minDiff = absDiff; closestNote = note; closestIndex = i; isEarly = false; }
    }
  }

  // 2) 윈도우 안에 노트 없음 → 헛침 처리 (키 입력일 때만)
  if (!closestNote) {
    if (allowMiss) {
      let offset = (pressedType === "Hihat" || pressedType === "Ride" || pressedType === "Crash") ? -25 : 25;
      drumJudgeList.push({
        text: "MISS", color: drumCOLOR.MISS,
        timer: 12, maxTimer: 12, yOffset: offset
      });
      drumKitFlash[pressedType] = millis(); // 헛쳐도 악기는 반응 (죽은 화면 방지)
      drumCombo = 0;
    }
    return;
  }

  // 3) PERFECT / GREAT 판정
  let maxPerfect = isEarly ? drumJUDGE_WINDOW.EARLY_PERFECT : drumJUDGE_WINDOW.LATE_PERFECT;
  let textResult, colorResult;

  if (minDiff <= maxPerfect) {
    textResult = "PERFECT"; colorResult = drumCOLOR.PERFECT;
    drumScore += 100; drumCombo += 1;
  } else {
    textResult = "GREAT"; colorResult = drumCOLOR.GREAT;
    drumScore += 50; drumCombo += 1;
  }

  let offset = (pressedType === "Hihat" || pressedType === "Ride" || pressedType === "Crash") ? -25 : 25;
  drumJudgeList.push({
    text: textResult, color: colorResult,
    timer: 12, maxTimer: 12, yOffset: offset
  });

  // 히트 이펙트
  let noteColor = drumNOTE_COLORS[pressedType] || colorResult;
  drumHitEffects.push({
    x: 150, y: closestNote.y, time: millis(),
    color: noteColor, sizeFactor: textResult === 'PERFECT' ? 1.4 : 1.0
  });

  drumKitFlash[pressedType] = millis();
  drumNotes.splice(closestIndex, 1);
}


function drumCheckCircleMotion(cx, cy, r) {
  drumCapture.loadPixels();
  drumPrevFrame.loadPixels();

  if (!drumCapture.pixels || drumCapture.pixels.length === 0 || !drumPrevFrame.pixels || drumPrevFrame.pixels.length === 0) return false;

  let motionCount = 0;
  let totalPixelsChecked = 0;

  for (let y = 0; y < drumCapture.height; y += 2) {
    for (let x = 0; x < drumCapture.width; x += 2) {
      if (dist(x, y, cx, cy) < r) {
        totalPixelsChecked++;
        let index = (x + y * drumCapture.width) * 4;
        let r1 = drumCapture.pixels[index], g1 = drumCapture.pixels[index+1], b1 = drumCapture.pixels[index+2];
        let r2 = drumPrevFrame.pixels[index], g2 = drumPrevFrame.pixels[index+1], b2 = drumPrevFrame.pixels[index+2];
        if (dist(r1, g1, b1, r2, g2, b2) > 65) motionCount++;
      }
    }
  }

  if (totalPixelsChecked === 0) return false;
  return (motionCount / totalPixelsChecked) > 0.22;
}

function drumDraw() {
  background(20);

  let currentSongTime = globalSongTime;

  push();
  let scaleX = windowWidth / 1000;
  let scaleY = windowHeight / 800;
  let currentScale = min(scaleX, scaleY);
  let offsetX = (windowWidth - 1000 * currentScale) / 2;
  let offsetY = (windowHeight - 800 * currentScale) / 2;
  translate(offsetX, offsetY);
  scale(currentScale);

  // 카메라 피드
  push();
  translate(300 + 400, 20);
  scale(-1, 1);
  image(drumCapture, 0, 0, 400, 150);
  pop();

  let leftCircleHit = drumCheckCircleMotion(320, 95, 55);
  let rightCircleHit = drumCheckCircleMotion(80, 95, 55);
    if (leftCircleHit || rightCircleHit) {
    drumCheckHit("Crash", false); // ← false: 카메라는 헛침 MISS 없음
    if (rightCircleHit) drumKitFlash['CrashRight'] = millis();
    if (leftCircleHit)  drumKitFlash['CrashLeft']  = millis();
  }

  drumPrevFrame.copy(drumCapture, 0, 0, 400, 150, 0, 0, 400, 150);

  // 카메라 프레임 (네온 스타일)
  push();
  stroke(100, 100, 150, 120); strokeWeight(2); noFill();
  rect(300, 20, 400, 150, 4);
  pop();

  // 모션 감지 원 (베이스 시안 톤 통일)
  push();
  stroke(0, 255, 200, 150); strokeWeight(3); noFill();
  circle(380, 95, 110);
  circle(620, 95, 110);
  pop();

  // 🌟 오선지 (양쪽 끝까지 확장 → 뿅 사라짐 방지)
  let targetLine = 150;
  push();
  let staffStartY = 250;
  let lineSpacing = 30;
  for (let i = 0; i < 5; i++) {
    stroke(80, 80, 120, 100);
    strokeWeight(1.5);
    line(-200, staffStartY + lineSpacing * i, 1200, staffStartY + lineSpacing * i);
  }
  // 판정선 (베이스 TARGET_LINE 스타일)
  stroke(255, 50, 50, 150); strokeWeight(4);
  line(targetLine, staffStartY - 30, targetLine, staffStartY + lineSpacing * 4 + 30);
  pop();

  // 🌟 비트라인 (베이스 스타일 세로 박자선)
  push();
  let beatDuration = (60 / drumSONG_BPM);
  let currentSec = (currentSongTime + drumAUDIO_OFFSET) / 1000;
  let speedMultiplier = 0.4;
  let startBeat = Math.floor(currentSec / beatDuration) - 2;
  for (let b = startBeat; b < startBeat + 20; b++) {
    let beatTimeMs = b * beatDuration * 1000;
    let bx = targetLine + (beatTimeMs - (currentSongTime + drumAUDIO_OFFSET)) * speedMultiplier;
    if (bx > 0 && bx < 1000) {
      if (b % 4 === 0) {
        stroke(150, 150, 200, 80); strokeWeight(2);
      } else {
        stroke(100, 100, 150, 30); strokeWeight(1);
      }
      line(bx, staffStartY - 20, bx, staffStartY + lineSpacing * 4 + 20);
    }
  }
  pop();

  // 노트 렌더링
  push();
  for (let i = drumNotes.length - 1; i >= 0; i--) {
    let note = drumNotes[i];
    let noteX = targetLine + (note.time - (currentSongTime + drumAUDIO_OFFSET)) * speedMultiplier;

    if (noteX < targetLine - 60) {
      drumJudgeList.push({
        text: "MISS",
        color: drumCOLOR.MISS,
        timer: 12,
        maxTimer: 12,
        yOffset: 0
      });
      drumNotes.splice(i, 1);
      drumCombo = 0;
      continue;
    }

    // 🌟 화면 양쪽 여유 확장 (0 ~ 1000 전체)
    if (noteX > 0 && noteX < 1000) {
      if (note.type === 'Crash') drumDrawCrashCymbal(noteX, note.y);
      else if (note.type === 'Hihat') drumDrawHihat(noteX, note.y);
      else if (note.type === 'Ride') drumDrawRideCymbal(noteX, note.y);
      else if (note.type === 'Snare') drumDrawSnare(noteX, note.y);
      else if (note.type === 'Tom1') drumDrawTom1(noteX, note.y);
      else if (note.type === 'Tom2') drumDrawTom2(noteX, note.y);
      else if (note.type === 'FloorTom') drumDrawFloorTom(noteX, note.y);
      else if (note.type === 'Kick') drumDrawKick(noteX, note.y);
    }
  }
  pop();

  // 🌟 히트 이펙트 렌더링 (베이스 링 확산 스타일)
  drumDrawHitEffects();

  // 판정 텍스트 (베이스 ease-out 스타일 통일)
  push();
  textAlign(CENTER, CENTER); textStyle(BOLD);
  for (let i = drumJudgeList.length - 1; i >= 0; i--) {
    let j = drumJudgeList[i];
    let progress = 1 - (j.timer / j.maxTimer);
    let easeOut = 1 - Math.pow(2, -10 * progress);
    let alphaValue = 255 * (1 - easeOut);
    let currentScale = 1.0 + 0.3 * (1 - easeOut);

    push();
    translate(500, 200 + j.yOffset);
    scale(currentScale);
    fill(j.color[0], j.color[1], j.color[2], alphaValue);
    textSize(42);
    text(j.text, 0, 0);
    pop();

    j.yOffset -= 1.2;
    j.timer--;
    if (j.timer <= 0) drumJudgeList.splice(i, 1);
  }
  pop();

  // 드럼셋 시각화 (심벌 포함, 플래시 지원)
  drumDrawKit();


  drumDrawUI(currentSongTime);
  pop();
}

// 드럼킷 플래시 헬퍼
function kitColor(type, baseR, baseG, baseB) {
  let t = drumKitFlash[type] || 0;
  let age = millis() - t;
  if (age < drumFLASH_DURATION) {
    let f = 1 - age / drumFLASH_DURATION;
    return [lerp(baseR,255,f), lerp(baseG,255,f), lerp(baseB,255,f)];
  }
  return [baseR, baseG, baseB];
}

function drumDrawKit() {
  push();
  let drumY = 550;
  let now = millis();
  textAlign(CENTER, CENTER); textSize(24); textStyle(BOLD);

  // ── 왼쪽 히햇 심벌 (R, 마젠타) ──────────────────────
  let hhC = kitColor('Hihat', 80, 0, 80);
  stroke(80, 80, 120, 100); strokeWeight(2);
  line(250, drumY + 150, 250, drumY + 20);
  fill(hhC[0], hhC[1], hhC[2]); noStroke();
  ellipse(250, drumY + 20, 100, 20);
  fill(255, 0, 255); textSize(35); text("R", 250, drumY - 10);

  // ── 스네어 (U, 흰색) ─────────────────────────────────
  let snC = kitColor('Snare', 30, 30, 30);
  stroke(80, 80, 120, 100); strokeWeight(2);
  fill(snC[0], snC[1], snC[2]);
  ellipse(350, drumY + 100, 100, 30);
  line(300, drumY + 100, 300, drumY + 160);
  line(400, drumY + 100, 400, drumY + 160);
  arc(350, drumY + 160, 100, 30, 0, PI);
  fill(255); noStroke(); textSize(24); text("U", 350, drumY + 100);

  // ── Tom1 (I, 하늘색) ─────────────────────────────────
  let t1C = kitColor('Tom1', 0, 30, 50);
  stroke(80, 80, 120, 100); strokeWeight(2);
  fill(t1C[0], t1C[1], t1C[2]);
  ellipse(450, drumY, 80, 80);
  fill(0, 200, 255); noStroke(); textSize(24); text("I", 450, drumY);

  // ── Tom2 (F, 노란색) ─────────────────────────────────
  let t2C = kitColor('Tom2', 50, 44, 0);
  stroke(80, 80, 120, 100); strokeWeight(2);
  fill(t2C[0], t2C[1], t2C[2]);
  ellipse(550, drumY, 80, 80);
  fill(255, 220, 0); noStroke(); textSize(24); text("F", 550, drumY);

  // ── 바스드럼 페달 + Kick ──────────────────────────────
  push();
  let pedalX = 480; let pedalY = drumY + 110;
  let kkC = kitColor('Kick', 40, 15, 10);
  stroke(80, 80, 120, 100); strokeWeight(2);
  fill(kkC[0], kkC[1], kkC[2]); rect(pedalX - 15, pedalY + 30, 30, 40, 5);
  let kickAge = now - (drumKitFlash.Kick || 0);
  let kickF = max(0, 1 - kickAge / drumFLASH_DURATION);
  fill(lerp(60, 255, kickF));
  beginShape();
  vertex(pedalX-10,pedalY+35); vertex(pedalX+10,pedalY+35);
  vertex(pedalX+13,pedalY+65); vertex(pedalX-13,pedalY+65);
  endShape(CLOSE);
  stroke(80, 80, 120, 100); strokeWeight(3); line(pedalX, pedalY+30, pedalX, pedalY-5);
  fill(255); noStroke(); circle(pedalX, pedalY-5, 14);
  fill(255, 80, 50); textAlign(CENTER,CENTER); textSize(16); textStyle(BOLD); text("space", pedalX, pedalY+15);
  pop();

  // ── FloorTom (H, 연두색) ──────────────────────────────
  let flC = kitColor('FloorTom', 10, 40, 15);
  stroke(80, 80, 120, 100); strokeWeight(2);
  fill(flC[0], flC[1], flC[2]);
  ellipse(650, drumY + 110, 120, 40);
  line(590, drumY+110, 590, drumY+180);
  line(710, drumY+110, 710, drumY+180);
  arc(650, drumY+180, 120, 40, 0, PI);
  fill(80, 255, 120); noStroke(); textSize(24); text("H", 650, drumY+110);

  // ── 오른쪽 라이드 심벌 (E, 연보라) ──────────────────
  let rdC = kitColor('Ride', 30, 15, 50);
  stroke(80, 80, 120, 100); strokeWeight(2);
  line(780, drumY+180, 780, drumY-10);
  fill(rdC[0], rdC[1], rdC[2]); noStroke();
  ellipse(780, drumY-10, 120, 20);
  fill(180, 100, 255); textSize(35); text("E", 780, drumY-40);

  // ── 왼쪽 크래시 심벌 (CAM-Left, 오렌지) ─────────────
  let crLC = kitColor('CrashLeft', 50, 28, 0);
  stroke(80, 80, 120, 100); strokeWeight(2);
  line(150, drumY+180, 150, drumY-30);
  fill(crLC[0], crLC[1], crLC[2]); noStroke();
  ellipse(150, drumY-30, 130, 22);
  stroke(255, 140, 0); strokeWeight(2); noFill();
  line(135, drumY-38, 165, drumY-22); line(165, drumY-38, 135, drumY-22);
  fill(255, 140, 0); noStroke(); textSize(15); text("CAM", 150, drumY-56);

  // ── 오른쪽 크래시 심벌 (CAM-Right, 오렌지) ───────────
  let crRC = kitColor('CrashRight', 50, 28, 0);
  stroke(80, 80, 120, 100); strokeWeight(2);
  line(880, drumY+180, 880, drumY-30);
  fill(crRC[0], crRC[1], crRC[2]); noStroke();
  ellipse(880, drumY-30, 130, 22);
  stroke(255, 140, 0); strokeWeight(2); noFill();
  line(865, drumY-38, 895, drumY-22); line(895, drumY-38, 865, drumY-22);
  fill(255, 140, 0); noStroke(); textSize(15); text("CAM", 880, drumY-56);

  pop();
}

// 🌟 히트 이펙트 (베이스 bassDrawHitEffects와 동일한 링 확산)
function drumDrawHitEffects() {
  for (let i = drumHitEffects.length - 1; i >= 0; i--) {
    let fx = drumHitEffects[i];
    let age = millis() - fx.time;
    let maxAge = 400;

    if (age > maxAge) {
      drumHitEffects.splice(i, 1);
      continue;
    }

    let progress = age / maxAge;
    let alpha = 255 * (1 - progress);
    let size = (22 * fx.sizeFactor) * (0.4 + progress * 1.0);

    noFill();
    stroke(fx.color[0], fx.color[1], fx.color[2], alpha);
    strokeWeight(3 - progress * 2);
    circle(fx.x, fx.y, size);

    fill(fx.color[0], fx.color[1], fx.color[2], alpha * 0.5);
    noStroke();
    circle(fx.x, fx.y, size * 0.3);
  }
}

function drumDrawUI(currentSongTime) {
  fill(150); noStroke(); textAlign(LEFT, TOP); textStyle(NORMAL); textSize(14);
  text(`Time: ${(currentSongTime / 1000).toFixed(2)}s  |  FPS: ${Math.round(frameRate())}`, 30, 800 - 40);
}

// ==========================================
// 음표 그래픽 (형태 유지, 색상/스트로크 톤만 통일)
// ==========================================
function drumDrawCrashCymbal(x, y) {
  stroke(255, 140, 0); strokeWeight(2); noFill(); circle(x, y, 24);
  strokeWeight(3); line(x - 8, y - 8, x + 8, y + 8); line(x + 8, y - 8, x - 8, y + 8);
}
function drumDrawHihat(x, y) {
  stroke(255, 0, 255); strokeWeight(3); noFill(); line(x - 10, y - 10, x + 10, y + 10); line(x + 10, y - 10, x - 10, y + 10);
}
function drumDrawRideCymbal(x, y) {
  stroke(180, 100, 255); strokeWeight(2); fill(30); beginShape(); vertex(x, y - 12); vertex(x + 12, y); vertex(x, y + 12); vertex(x - 12, y); endShape(CLOSE);
}
function drumDrawSnare(x, y) {
  fill(255); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop();
  stroke(255); strokeWeight(2); line(x + 12, y, x + 12, y - 50);
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("U",x,y);
}
function drumDrawTom1(x, y) {
  fill(0, 200, 255); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop();
  stroke(0, 200, 255); strokeWeight(2); line(x + 12, y, x + 12, y - 30);
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("I", x, y);
}
function drumDrawTom2(x, y) {
  fill(255, 220, 0); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop();
  stroke(255, 220, 0); strokeWeight(2); line(x + 12, y, x + 12, y - 30);
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("F", x, y);
}
function drumDrawFloorTom(x, y) {
  fill(80, 255, 120); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop();
  stroke(80, 255, 120); strokeWeight(2); line(x + 12, y, x + 12, y - 70);
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("H", x, y);
}
function drumDrawKick(x, y) {
  fill(255, 80, 50); noStroke(); push(); translate(x-5, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop();
  stroke(255, 80, 50); strokeWeight(2); line(x + 12, y, x + 12, y - 90);
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD); text("SPC", x-5, y);
}

function drumPlayDrum() {
  console.log("드럼 연주 시작!");
}
