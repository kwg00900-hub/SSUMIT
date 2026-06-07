let drumScore = 0;
let drumCombo = 0;

// ==========================================
// [설정] 박자/시간 동기화용 변수
// ==========================================
let drumSONG_BPM = 126;      // 플레이할 음악의 BPM
let drumIsPlaying = false;   // 게임/음악 재생 여부

// 시퀀서 채보 작성용 임시 추적 변수
let drumCurrentBeatTracker = 0; 

// 박자 정의 상수 (4분음표 = 1.0 박자 기준)
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

// [설정] 각 악기별 오선지 기준 Y 좌표 정의
let drumYRide   = 235;  
let drumYHihat  = 250;  
let drumYTom1   = 265;  
let drumYTom2   = 280;  
let drumYSnare  = 295;  
let drumYFloor  = 325;  
let drumYKick   = 355;  

let drumJudgeList = []; 
let drumNotes = []; // 채보 함수들이 자동으로 노트를 채워 넣을 배열

function drumPreload(){
  // 메인(main.js)에서 음악을 로드하므로 드럼에서는 오디오 로드를 꺼둡니다.
}

// ==========================================
// 🎵 [핵심] 누적 박자 계산식 및 채보 작성 구역
// ==========================================
let drumAUDIO_OFFSET = 0; // 베이스와 동일한 오디오 보정값 추가

function drumBeatToTime(beat) {
  return (beat * 60 / drumSONG_BPM) * 1000; // 32281 하드코딩 제거
}

// 노트를 찍는 함수
function drumAddNote(type) {
  let targetY = drumYSnare; // 기본값
  if (type === 'Ride') targetY = drumYRide;
  else if (type === 'Hihat') targetY = drumYHihat;
  else if (type === 'Tom1') targetY = drumYTom1;
  else if (type === 'Tom2') targetY = drumYTom2;
  else if (type === 'Snare') targetY = drumYSnare;
  else if (type === 'FloorTom') targetY = drumYFloor;
  else if (type === 'Kick') targetY = drumYKick;
  else if (type === 'Crash') targetY = drumYHihat; 

  let timeMs = drumBeatToTime(drumCurrentBeatTracker);

  drumNotes.push({
    time: timeMs,
    y: targetY,
    type: type
  });
}

// 타임라인을 밀어주는 함수
function drumRest(beatLength) {
  drumCurrentBeatTracker += beatLength;
}

// 실제 채보를 작성하는 공간
function drumCreateChart() {
  drumNotes = [];
  drumCurrentBeatTracker = 0;

  drumRest(drumNOTE_1 * 17);

  // 17마디
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
  
  // 24마디
  drumRest(drumNOTE_8);
  drumAddNote('Tom1'); drumRest(drumNOTE_16);
  drumRest(drumNOTE_16);
  drumAddNote('Tom2'); drumRest(drumNOTE_16);
  drumRest(drumNOTE_16);
  drumRest(drumNOTE_8);
  drumAddNote('Snare');              drumRest(drumNOTE_4);
  drumAddNote('Snare');              drumRest(drumNOTE_4);

  drumRest(drumNOTE_1);  // 25마디
  drumRest(drumNOTE_1);  // 26마디
  drumRest(drumNOTE_1);  // 27마디
  drumRest(drumNOTE_1);  // 28마디
  drumRest(drumNOTE_1);  // 29마디
  drumRest(drumNOTE_1);  // 30마디
  drumRest(drumNOTE_1);  // 31마디
  drumRest(drumNOTE_1);  // 32마디

  // 33마디
  drumRest(drumNOTE_1);

  // [보정] Ride 패턴 1: 원래 3.5박자였던 것을 마지막에 쉬표를 주어 4박자로 맞춤
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumAddNote('Ride'); drumAddNote('Kick'); drumRest(drumNOTE_8); 
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Ride');               drumRest(drumNOTE_8);
  drumRest(drumNOTE_8); 

  // [보정] Ride 패턴 2: 마지막에 0.5박자 보정 추가
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
  drumAddNote('Ride'); drumAddNote('Snare');drumRest(drumNOTE_8);
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

  // 40마디
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_4);
  drumRest(drumNOTE_4);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Kick'); drumRest(drumNOTE_8); 
  drumAddNote('Snare'); drumAddNote('FloorTom'); drumRest(drumNOTE_4);

  drumRest(drumNOTE_1);  // 41마디
  drumRest(drumNOTE_1);  // 42마디
  drumRest(drumNOTE_1);  // 43마디
  drumRest(drumNOTE_1);  // 44마디
  drumRest(drumNOTE_1);  // 45마디
  drumRest(drumNOTE_1);  // 46마디
  drumRest(drumNOTE_1);  // 47마디
  drumRest(drumNOTE_1);  // 48마디

  drumRest(drumNOTE_1);  // 49마디
  drumRest(drumNOTE_1);  // 50마디
  drumRest(drumNOTE_1);  // 51마디
  drumRest(drumNOTE_1);  // 52마디
  drumRest(drumNOTE_1);  // 53마디
  drumRest(drumNOTE_1);  // 54마디
  drumRest(drumNOTE_1);  // 55마디
  drumRest(drumNOTE_1);  // 56마디

  // 57마디
  drumRest(drumNOTE_1);

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

  // 64마디
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_8);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_8);
  drumAddNote('Hihat');               drumRest(drumNOTE_16);
  drumAddNote('Hihat'); drumAddNote('Snare');drumRest(drumNOTE_16);
                        drumAddNote('Snare');drumRest(drumNOTE_8);
                        drumAddNote('Tom1');drumRest(drumNOTE_8);
                        drumAddNote('Tom2');drumRest(drumNOTE_8);
  drumAddNote('Crash'); drumAddNote('Kick'); drumRest(drumNOTE_8);

  drumRest(drumNOTE_1);  // 65마디
  drumRest(drumNOTE_1);  // 66마디
  drumRest(drumNOTE_1);  // 67마디
  drumRest(drumNOTE_1);  // 68마디
  drumRest(drumNOTE_1);  // 69마디
  drumRest(drumNOTE_1);  // 70마디
  drumRest(drumNOTE_1);  // 71마디
  drumRest(drumNOTE_1);  // 72마디

  drumRest(drumNOTE_1);  // 73마디
  drumRest(drumNOTE_1);  // 74마디
  drumRest(drumNOTE_1);  // 75마디
  drumRest(drumNOTE_1);  // 76마디
  drumRest(drumNOTE_1);  // 77마디
  drumRest(drumNOTE_1);  // 78마디
  drumRest(drumNOTE_1);  // 79마디
  drumRest(drumNOTE_1);  // 80마디

  drumRest(drumNOTE_1);  // 81마디
  drumRest(drumNOTE_1);  // 82마디
  drumRest(drumNOTE_1);  // 83마디
  drumRest(drumNOTE_1);  // 84마디
  drumRest(drumNOTE_1);  // 85마디
  drumRest(drumNOTE_1);  // 86마디

  // 87마디
  drumRest(drumNOTE_1);

  // [보정] 87마디 이후 첫 번째 Ride 패턴 블록 0.5박자 추가
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
  if (!drumIsPlaying) {
    drumIsPlaying = true;
  }
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
    return;
  }

  let pressedType = "";
  if (key === ' ') pressedType = "Kick";
  else if (key === 'u' || key === 'U') pressedType = "Snare";
  else if (key === 'i' || key === 'I') pressedType = "Tom1";
  else if (key === 'f' || key === 'F') pressedType = "Tom2";
  else if (key === 'h' || key === 'H') pressedType = "FloorTom";
  else if (key === 'r' || key === 'R') pressedType = "Hihat";
  else if (key === 'e' || key === 'E') pressedType = "Ride";

  if (pressedType !== "") {
    drumCheckHit(pressedType);
  }
}

function drumCheckHit(pressedType) {
  let currentSongTime = globalSongTime; 
  let hitWindowMs = 120; 

  for (let i = 0; i < drumNotes.length; i++) {
    let note = drumNotes[i];

    if (note.type === pressedType) {
      let timeDiff = abs(note.time - currentSongTime); 

      if (timeDiff <= hitWindowMs) {
        let textResult = "";
        let colorResult = [0, 0, 0];

        if (timeDiff <= 35) {
          textResult = "PERFECT";
          colorResult = [0, 220, 100]; 
          drumScore += 1000;               
          drumCombo += 1;                  
        } 
        else {
          textResult = "GREAT";
          colorResult = [255, 180, 0]; 
          drumScore += 500;                
          drumCombo += 1;                  
        }
        
        let offset = (pressedType === "Hihat" || pressedType === "Ride" || pressedType === "Crash") ? -25 : 25;

        drumJudgeList.push({
          text: textResult,
          color: colorResult,
          timer: 12,       
          maxTimer: 12,    
          yOffset: offset  
        });

        drumNotes.splice(i, 1); 
        return; 
      }
    }
  }
}

function drumCheckCircleMotion(cx, cy, r) {
  drumCapture.loadPixels();
  drumPrevFrame.loadPixels();
  
  if (!drumCapture.pixels || drumCapture.pixels.length === 0 || !drumPrevFrame.pixels || drumPrevFrame.pixels.length === 0) {
    return false;
  }

  let motionCount = 0; 
  let totalPixelsChecked = 0;

  for (let y = 0; y < drumCapture.height; y += 2) {
    for (let x = 0; x < drumCapture.width; x += 2) {
      if (dist(x, y, cx, cy) < r) {
        totalPixelsChecked++;
        let index = (x + y * drumCapture.width) * 4;
        
        let r1 = drumCapture.pixels[index];
        let g1 = drumCapture.pixels[index + 1];
        let b1 = drumCapture.pixels[index + 2];
        
        let r2 = drumPrevFrame.pixels[index];
        let g2 = drumPrevFrame.pixels[index + 1];
        let b2 = drumPrevFrame.pixels[index + 2];
        
        let diff = dist(r1, g1, b1, r2, g2, b2);
        
        if (diff > 65) {
          motionCount++;
        }
      }
    }
  }
  
  if (totalPixelsChecked === 0) return false;
  let motionRatio = motionCount / totalPixelsChecked;
  return motionRatio > 0.22; 
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

  push();
  translate(300 + 400, 20); 
  scale(-1, 1);             
  image(drumCapture, 0, 0, 400, 150); 
  pop(); 

  let leftCircleHit = drumCheckCircleMotion(320, 95, 30);
  let rightCircleHit = drumCheckCircleMotion(80, 95, 30);

  if (leftCircleHit || rightCircleHit) {
    drumCheckHit("Crash");
  }

  drumPrevFrame.copy(drumCapture, 0, 0, 400, 150, 0, 0, 400, 150);

  push();
  stroke(200); strokeWeight(3); noFill(); 
  rect(300, 20, 400, 150); 
  pop();

  push();
  stroke(100, 150, 255); strokeWeight(4); noFill();               
  circle(380, 95, 60);  
  circle(620, 95, 60);  
  pop();

  let targetLine = 150; 
  push();
  stroke(200); strokeWeight(2); 
  let staffStartY = 250;
  let lineSpacing = 30;
  for (let i = 0; i < 5; i++) {
    line(50, staffStartY + lineSpacing * i, 950, staffStartY + lineSpacing * i);
  }
  stroke(255, 0, 0); strokeWeight(5);
  line(targetLine, staffStartY - 20, 150, staffStartY + lineSpacing * 4 + 20);
  pop();

  push();
  let speedMultiplier = 0.4; 

  for (let i = drumNotes.length - 1; i >= 0; i--) {
    let note = drumNotes[i];
    let noteX = targetLine + (note.time - (currentSongTime + drumAUDIO_OFFSET)) * speedMultiplier;

    if (noteX < targetLine - 60) {
      drumJudgeList.push({
        text: "MISS",
        color: [255, 50, 50],
        timer: 12,       
        maxTimer: 12,
        yOffset: 0
      });
      drumNotes.splice(i, 1);         
      drumCombo = 0; 
      continue;
    }

    if (noteX > 40 && noteX < 960) {
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

  push();
  textAlign(CENTER, CENTER); textStyle(BOLD);
  for (let i = drumJudgeList.length - 1; i >= 0; i--) {
    let j = drumJudgeList[i];
    let alphaValue = map(j.timer, 0, j.maxTimer, 0, 255);
    fill(j.color[0], j.color[1], j.color[2], alphaValue);
    let currentTextSize = map(j.timer, 0, j.maxTimer, 38, 48);
    textSize(currentTextSize);
    text(j.text, 500, 200 + j.yOffset); 
    j.yOffset -= 1.2; 
    j.timer--; 
    if (j.timer <= 0) drumJudgeList.splice(i, 1);
  }
  pop();

  push();
  let drumY = 550; 
  textAlign(CENTER, CENTER); textSize(24); textStyle(BOLD);
  stroke(200); strokeWeight(2); line(250, drumY + 150, 250, drumY + 20); fill(40); ellipse(250, drumY + 20, 100, 20); fill(255, 0, 255); noStroke(); textSize(35); text("R", 250, drumY - 10);
  stroke(200); strokeWeight(2); fill(40); ellipse(350, drumY + 100, 100, 30); line(300, drumY + 100, 300, drumY + 160); line(400, drumY + 100, 400, drumY + 160); arc(350, drumY + 160, 100, 30, 0, PI); fill(255, 255, 255); noStroke(); textSize(24); text("U", 350, drumY + 100);
  stroke(200); strokeWeight(2); fill(40); ellipse(450, drumY, 80, 80); fill(0, 200, 255); noStroke(); text("I", 450, drumY);
  stroke(200); strokeWeight(2); fill(40); ellipse(550, drumY, 80, 80); fill(255, 220, 0); noStroke(); text("F", 550, drumY);
  
  push();
  let pedalX = 480; let pedalY = drumY + 110;
  stroke(200); strokeWeight(2); fill(50); rect(pedalX - 15, pedalY + 30, 30, 40, 5); 
  fill(80); beginShape(); vertex(pedalX - 10, pedalY + 35); vertex(pedalX + 10, pedalY + 35); vertex(pedalX + 13, pedalY + 65); vertex(pedalX - 13, pedalY + 65); endShape(CLOSE);
  stroke(200); strokeWeight(3); line(pedalX, pedalY + 30, pedalX, pedalY - 5); 
  fill(255); noStroke(); circle(pedalX, pedalY - 5, 14); 
  fill(255, 80, 50); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD); text("space", pedalX, pedalY + 15);
  pop();

  stroke(200); strokeWeight(2); fill(40); ellipse(650, drumY + 110, 120, 40); line(590, drumY + 110, 590, drumY + 180); line(710, drumY + 110, 710, drumY + 180); arc(650, drumY + 180, 120, 40, 0, PI); fill(80, 255, 120); noStroke(); textSize(24); text("H", 650, drumY + 110);
  stroke(200); strokeWeight(2); line(780, drumY + 180, 780, drumY - 10); fill(40); ellipse(780, drumY - 10, 120, 20); fill(180, 100, 255); noStroke(); textSize(35); text("E", 780, drumY - 40);
  pop();
  
  drumDrawUI(currentSongTime); 
  pop();
}

function drumDrawUI(currentSongTime) {
  fill(255); noStroke(); textAlign(LEFT, TOP); textStyle(BOLD); textSize(22);   
  textSize(14); fill(150);
  text(`Time: ${(currentSongTime / 1000).toFixed(2)}s  |  FPS: ${Math.round(frameRate())}`, 30, 800 - 40);
}
  
// ==========================================
// 개별 음표 그래픽 렌더링 함수 세트
// ==========================================
function drumDrawCrashCymbal(x, y) {
  // 크래시: 오렌지 (CAM)
  stroke(255, 140, 0); strokeWeight(2); noFill(); circle(x, y, 24); 
  strokeWeight(3); line(x - 8, y - 8, x + 8, y + 8); line(x + 8, y - 8, x - 8, y + 8); 
}
function drumDrawHihat(x, y) {
  // 히햇: 마젠타 (R)
  stroke(255, 0, 255); strokeWeight(3); noFill(); line(x - 10, y - 10, x + 10, y + 10); line(x + 10, y - 10, x - 10, y + 10); 
}
function drumDrawRideCymbal(x, y) {
  // 라이드: 연보라 (E)
  stroke(180, 100, 255); strokeWeight(2); fill(40); beginShape(); vertex(x, y - 12); vertex(x + 12, y); vertex(x, y + 12); vertex(x - 12, y); endShape(CLOSE); 
}
function drumDrawSnare(x, y) {
  // 스네어: 흰색 (U)
  fill(255); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop(); 
  stroke(255); strokeWeight(2); line(x + 12, y, x + 12, y - 50); 
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("U",x,y); 
}
function drumDrawTom1(x, y) {
  // Tom1: 하늘색 (I)
  fill(0, 200, 255); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop(); 
  stroke(0, 200, 255); strokeWeight(2); line(x + 12, y, x + 12, y - 30); 
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("I", x, y); 
}
function drumDrawTom2(x, y) {
  // Tom2: 노란색 (F)
  fill(255, 220, 0); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop(); 
  stroke(255, 220, 0); strokeWeight(2); line(x + 12, y, x + 12, y - 30); 
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("F", x, y); 
}
function drumDrawFloorTom(x, y) {
  // FloorTom: 연두색 (H)
  fill(80, 255, 120); noStroke(); push(); translate(x, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop(); 
  stroke(80, 255, 120); strokeWeight(2); line(x + 12, y, x + 12, y - 70); 
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); text("H", x, y);
}
function drumDrawKick(x, y) {
  // Kick: 주황빨강 (space)
  fill(255, 80, 50); noStroke(); push(); translate(x-5, y); rotate(-PI / 6); ellipse(0, 0, 32, 25); pop(); 
  stroke(255, 80, 50); strokeWeight(2); line(x + 12, y, x + 12, y - 90); 
  fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD); text("SPC", x-5, y);
}
