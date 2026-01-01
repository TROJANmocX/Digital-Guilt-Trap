import './style.css';
import { AudioEngine } from './audio.js';
import { ClickFX, GhostTyper, BaitSystem } from './interactions.js';
import { HeatMap, Interrogation, BreathSync } from './intimacy.js'; // [NEW]

const judgeTextEl = document.getElementById('judge-text');
const subTextEl = document.getElementById('sub-text');
const eyeEl = document.getElementById('eye');

// --- Script Data (Interactive Edition) ---
const SCRIPT = {
  // Existing logic...
  onLoad: { first: ["Hi. I own you now.", "Calibration starting...", "Don't move."], return: ["You returned to your master.", "Submissive."] },

  // Compliance / Challenges
  challenges: {
    freeze: {
      start: ["FREEZE. Don't move a muscle.", "Stop moving. Now.", "Stay perfectly still."],
      success: ["Good dog.", "You obey well.", "Acceptable stillness."],
      fail: ["I SAID STOP.", "You twitched.", "Disobedient.", "Punishment required."]
    },
    click: {
      start: ["Click me. Now.", "I command you to click.", "Do it."],
      success: ["Mmm, yes.", "Better."],
      fail: ["Too slow.", "I'm waiting...", "Are you deaf?"]
    },
    dontClick: {
      start: ["Do NOT click.", "Resist the urge.", "Hands off."],
      fail: ["I told you not to.", "No self control?", "You just had to touch it."]
    },
    shake: {
      start: ["Shake your mouse. Harder.", "Show me some energy."],
      success: ["Chaotic. I like it.", "Enough."],
      fail: ["Weak.", "Is that all you've got?"]
    }
  },

  // Tangible Interaction Replies
  bait: [
    "I TOLD YOU NOT TO.",
    "WHY DID YOU TOUCH THAT?",
    "YOU RUINED IT.",
    "ERROR. USER ERROR."
  ],

  typing: [
    "I can read that, you know.",
    "Your typing is loud.",
    "Is that a cry for help?",
    "Delete that. Now."
  ]
};

// --- State Management ---
const State = {
  startTime: Date.now(),
  lastActivity: Date.now(),
  mouseDistance: 0,
  visitCount: parseInt(localStorage.getItem('visitCount') || '0'),
  audioStarted: false,

  // Challenge State
  activeChallenge: null,
  challengeStartTime: 0,
  challengeTimer: null,
  challengeFailed: false
};

localStorage.setItem('visitCount', State.visitCount + 1);


// --- Display Utility ---
function text(str, sub = "") {
  if (State.activeChallenge && !str.includes("STOP") && !str.includes("Good") && !str.includes("Failed")) return;
  updateDisplay(str, sub);
}

function updateDisplay(main, sub) {
  judgeTextEl.classList.remove('shake', 'pulse');
  judgeTextEl.classList.add('fade-out');
  if (subTextEl) subTextEl.classList.remove('visible');

  setTimeout(() => {
    judgeTextEl.textContent = main;
    judgeTextEl.classList.remove('fade-out');
    judgeTextEl.classList.add('visible');

    if (main.includes("STOP") || main.includes("FREEZE")) judgeTextEl.classList.add('pulse');
    if (main.includes("Harder") || main.includes("ERROR")) judgeTextEl.classList.add('shake');

    if (sub) {
      subTextEl.textContent = sub;
      subTextEl.classList.add('visible');
    } else {
      subTextEl.textContent = '';
    }
  }, 200);
}

function pick(arr) {
  if (typeof arr === 'string') return arr;
  return arr[Math.floor(Math.random() * arr.length)];
}


// --- Challenge System ---
const ChallengeEngine = {
  startRandom() {
    if (State.activeChallenge || Interrogation.active || BreathSync.active) return; // Block if Intimacy active

    // Random chance for Intimacy Event (NSFW-lite)
    if (Math.random() < 0.3) {
      if (Math.random() > 0.5) Interrogation.trigger();
      else BreathSync.start();

      // Cooldown
      setTimeout(() => { if (!State.activeChallenge && !Interrogation.active && !BreathSync.active) ChallengeEngine.startRandom(); }, 15000);
      return;
    }

    const types = ['freeze', 'dontClick', 'click', 'shake'];
    this.start(pick(types));
  },

  start(type) {
    State.activeChallenge = type;
    State.challengeStartTime = Date.now();
    State.challengeFailed = false;
    text(pick(SCRIPT.challenges[type].start));

    switch (type) {
      case 'freeze':
        setTimeout(() => {
          if (State.activeChallenge === 'freeze') {
            State.monitoringFreeze = true;
            setTimeout(() => this.complete(true), 3000);
          }
        }, 1000);
        break;
      case 'click':
        State.monitoringClick = true;
        setTimeout(() => { if (State.activeChallenge === 'click') this.complete(false); }, 2000);
        break;
      case 'dontClick':
        State.monitoringNoClick = true;
        setTimeout(() => { if (State.activeChallenge === 'dontClick') this.complete(true); }, 4000);
        break;
      case 'shake':
        State.shakeCount = 0;
        State.monitoringShake = true;
        setTimeout(() => { if (State.activeChallenge === 'shake') this.complete(false); }, 3000);
        break;
    }
  },

  fail() {
    if (!State.activeChallenge || State.challengeFailed) return;
    State.challengeFailed = true;
    text(pick(SCRIPT.challenges[State.activeChallenge].fail));
    AudioEngine.noise();
    this.reset();
  },
  complete(success) {
    if (!State.activeChallenge || State.challengeFailed) return;
    if (success) text(pick(SCRIPT.challenges[State.activeChallenge].success));
    else { text(pick(SCRIPT.challenges[State.activeChallenge].fail)); AudioEngine.noise(); }
    this.reset();
  },
  reset() {
    State.activeChallenge = null;
    State.monitoringFreeze = false;
    State.monitoringClick = false;
    State.monitoringNoClick = false;
    State.monitoringShake = false;
    setTimeout(() => { if (!State.activeChallenge) ChallengeEngine.startRandom(); }, 10000 + Math.random() * 10000);
  },
  onMouseMove(dist, x, y) { // Updated signature
    if (State.monitoringFreeze && dist > 2) this.fail();
    if (State.monitoringShake && dist > 20) { State.shakeCount++; if (State.shakeCount > 30) this.complete(true); }

    // Heat Map Trigger
    HeatMap.addPoint(x, y);
  },
  onClick() {
    if (State.monitoringClick) this.complete(true);
    if (State.monitoringNoClick) this.fail();
  }
};


// --- Listeners ---

// 1. Initial Load
setTimeout(() => {
  text(pick(SCRIPT.onLoad.first));
  setTimeout(() => ChallengeEngine.startRandom(), 4000);

  // Init Interactions
  GhostTyper.init();
  BaitSystem.init();
  HeatMap.init(); // [NEW]

  // Hook Bait Button
  BaitSystem.btn.addEventListener('click', () => {
    text(pick(SCRIPT.bait));
  });

}, 500);

// 2. Mouse
let lastMouseX = 0, lastMouseY = 0;
let stimulationLevel = 0; // [NEW] Climax tracker

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX - window.innerWidth / 2) * 0.15;
  const y = (e.clientY - window.innerHeight / 2) * 0.15;
  if (eyeEl) eyeEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

  const dist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);

  // Pass coord info for Heat Map
  ChallengeEngine.onMouseMove(dist, e.clientX, e.clientY);

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const velocity = Math.min(dist / 50, 1);
  AudioEngine.setIntensity(velocity);
  AudioEngine.simulateBreath(dist); // [NEW] Drive breath with raw distance

  // Climax / Overload Logic
  if (dist > 50) {
    stimulationLevel++;
    if (stimulationLevel > 200) { // Approx 2-3 sec of fast movement
      document.body.classList.add('glitch-mode');
      text("TOO MUCH.", "SYSTEM.OVERLOAD()");
      AudioEngine.noise();
      stimulationLevel = 0;

      setTimeout(() => {
        document.body.classList.remove('glitch-mode');
        text("Better.");
      }, 2000);
    }
  } else {
    stimulationLevel = Math.max(0, stimulationLevel - 1); // Decay
  }
});

// 3. Click
document.addEventListener('click', (e) => {
  if (!State.audioStarted) { AudioEngine.init(); State.audioStarted = true; }
  AudioEngine.resume();

  // Tangible Feedback
  ClickFX.spawn(e.clientX, e.clientY);

  ChallengeEngine.onClick();
});

// 4. Keyboard
document.addEventListener('keydown', (e) => {
  // Ghost Typing
  if (e.key === 'Enter') {
    if (GhostTyper.currentText.length > 0) {
      GhostTyper.shake();
      text(pick(SCRIPT.typing), `You typed: "${GhostTyper.currentText}"`);
      setTimeout(() => GhostTyper.clear(), 1000);
    }
  } else {
    if (e.key.length === 1 || e.key === 'Backspace') {
      GhostTyper.type(e.key);
    }
  }
});


// 4. Tab logic (Simplified)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (State.activeChallenge) ChallengeEngine.fail();
    text("Leaving me? Mistake.");
  }
});
