const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const intro = document.getElementById('intro');
const tear = document.getElementById('tear');
const flash = document.getElementById('flash');

const startBtn = document.getElementById('start-btn');
const declineBtn = document.getElementById('decline-btn');
const restartBtn = document.getElementById('restart-btn');

const permissionMsg = document.getElementById('permission-msg');
const waveEl = document.getElementById('wave');
const timerEl = document.getElementById('timer');
const hpEl = document.getElementById('hp');
const scoreEl = document.getElementById('score');
const detectedEl = document.getElementById('detected');
const endTitle = document.getElementById('end-title');
const endSub = document.getElementById('end-sub');

const STATE = {
  IDLE: 'idle',
  INTRO: 'intro',
  PLAYING: 'playing',
  WIN: 'win',
  LOSE: 'lose'
};

const CONFIG = {
  waveDuration: 30,
  travelTime: 4.4,
  ringThickness: 26,
  penalty: 0,
  missPenalty: 0,
  requiredHitRate: 0.25,
  maxCents: 60,
  minRms: 0.012,
  noteEventCooldown: 350,
  particleCount: 16,
  particleLife: 0.75,
  explosionLife: 0.45,
  ringFlashMs: 260
};

const NOTE_POOL = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'
];

const WAVES = [
  {
    name: 'Twinkle',
    melody: [
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]
    ]
  },
  {
    name: 'Mary',
    melody: [
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 2],
      ['D4', 1], ['D4', 1], ['D4', 2],
      ['E4', 1], ['G4', 1], ['G4', 2],
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 1], ['E4', 1],
      ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 1], ['C4', 2]
    ]
  },
  {
    name: 'Frere',
    melody: [
      ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
      ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
      ['E4', 1], ['F4', 1], ['G4', 2],
      ['E4', 1], ['F4', 1], ['G4', 2],
      ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
      ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
      ['C4', 1], ['G4', 1], ['C4', 2],
      ['C4', 1], ['G4', 1], ['C4', 2]
    ]
  },
  {
    name: 'Ode',
    melody: [
      ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1],
      ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1],
      ['E4', 1.5], ['D4', 0.5], ['D4', 2],
      ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1],
      ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
      ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1],
      ['D4', 1.5], ['C4', 0.5], ['C4', 2]
    ]
  },
  {
    name: 'Clair',
    melody: [
      ['C4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 2],
      ['D4', 1], ['C4', 1], ['E4', 1], ['D4', 1], ['D4', 2],
      ['C4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 2],
      ['D4', 1], ['C4', 1], ['E4', 1], ['D4', 1], ['C4', 2],
      ['G4', 1], ['G4', 1], ['A4', 1], ['G4', 1], ['E4', 2],
      ['G4', 1], ['G4', 1], ['A4', 1], ['G4', 1], ['E4', 2]
    ]
  }
];

const NOTE_INDEX = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11
};

let audioContext;
let analyser;
let micSource;
let audioBuffer;
let currentState = STATE.IDLE;

let width = 0;
let height = 0;
let center = { x: 0, y: 0 };
let ringRadius = 0;
let ringInner = 0;
let ringOuter = 0;
let playerRadius = 12;

let notes = [];
let waveIndex = 0;
let waveStart = 0;
let schedule = [];
let scheduleIndex = 0;
let waveEnded = false;
let waveHits = 0;
let waveTotal = 0;
let hp = 100;
let lastFrame = 0;
let score = 0;
let currentTarget = null;
let lastNoteEvent = 0;
let lastDetectedNote = null;
let endReason = '';
let ringFlashUntil = 0;
let particles = [];
let explosions = [];

const noteFrequencies = NOTE_POOL.map((name) => ({
  name,
  freq: noteToFrequency(name)
}));

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  center = { x: width / 2, y: height / 2 };
  ringRadius = Math.min(width, height) * 0.24;
  ringInner = ringRadius - CONFIG.ringThickness / 2;
  ringOuter = ringRadius + CONFIG.ringThickness / 2;
  playerRadius = Math.min(width, height) * 0.025;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function noteToFrequency(note) {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 0;
  const [, pitch, octaveRaw] = match;
  const octave = Number(octaveRaw);
  const midi = (octave + 1) * 12 + NOTE_INDEX[pitch];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function nearestAllowedNote(freq) {
  let best = null;
  for (const note of noteFrequencies) {
    const cents = Math.abs(1200 * Math.log2(freq / note.freq));
    if (!best || cents < best.cents) {
      best = { name: note.name, cents };
    }
  }
  if (best && best.cents <= CONFIG.maxCents) {
    return best.name;
  }
  return null;
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < CONFIG.minRms) {
    return -1;
  }

  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;
  for (let i = 0; i < size / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i += 1) {
    if (Math.abs(buffer[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  const trimmed = buffer.slice(r1, r2);
  const trimmedSize = trimmed.length;
  const correlations = new Array(trimmedSize).fill(0);

  for (let i = 0; i < trimmedSize; i += 1) {
    for (let j = 0; j < trimmedSize - i; j += 1) {
      correlations[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (correlations[d] > correlations[d + 1]) {
    d += 1;
  }

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < trimmedSize; i += 1) {
    if (correlations[i] > maxVal) {
      maxVal = correlations[i];
      maxPos = i;
    }
  }

  if (maxPos <= 0 || maxPos + 1 >= correlations.length) {
    return -1;
  }

  let t0 = maxPos;
  const x1 = correlations[t0 - 1];
  const x2 = correlations[t0];
  const x3 = correlations[t0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    t0 -= b / (2 * a);
  }

  return sampleRate / t0;
}

function detectPitch() {
  if (!analyser || !audioBuffer) return null;
  analyser.getFloatTimeDomainData(audioBuffer);
  const freq = autoCorrelate(audioBuffer, audioContext.sampleRate);
  if (freq === -1) return null;
  return nearestAllowedNote(freq);
}

function formatTime(seconds) {
  const clamped = Math.max(0, seconds);
  const mm = Math.floor(clamped / 60);
  const ss = Math.floor(clamped % 60);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function buildSchedule(wave) {
  let time = 0;
  const events = [];
  for (const [note, beats] of wave.melody) {
    events.push({ note, time });
    time += beats;
  }
  const scale = CONFIG.waveDuration / time;
  return events.map((event) => ({
    note: event.note,
    time: event.time * scale
  }));
}

function randomEdgePoint() {
  const margin = 40;
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    return { x: Math.random() * width, y: -margin };
  }
  if (edge === 1) {
    return { x: width + margin, y: Math.random() * height };
  }
  if (edge === 2) {
    return { x: Math.random() * width, y: height + margin };
  }
  return { x: -margin, y: Math.random() * height };
}

function spawnNote(noteName) {
  const spawn = randomEdgePoint();
  const dx = center.x - spawn.x;
  const dy = center.y - spawn.y;
  const distance = Math.hypot(dx, dy);
  const travelDistance = Math.max(1, distance - ringRadius);
  const speed = travelDistance / CONFIG.travelTime;
  const dirX = dx / distance;
  const dirY = dy / distance;

  notes.push({
    note: noteName,
    x: spawn.x,
    y: spawn.y,
    vx: dirX * speed,
    vy: dirY * speed,
    dist: distance,
    dead: false
  });
}

function updateNotes(dt) {
  for (const note of notes) {
    note.x += note.vx * dt;
    note.y += note.vy * dt;
    note.dist = Math.hypot(note.x - center.x, note.y - center.y);

    if (note.dist < ringInner) {
      applyDamage(CONFIG.missPenalty);
      note.dead = true;
    }
  }
  notes = notes.filter((note) => !note.dead);

  currentTarget = null;
  let minDist = Infinity;
  for (const note of notes) {
    if (note.dist < minDist) {
      minDist = note.dist;
      currentTarget = note;
    }
  }
}

function applyDamage(amount) {
  hp = Math.max(0, hp - amount);
  hpEl.textContent = `HP ${hp}%`;
  if (hp <= 0) {
    endGame(false, 'HP tukenince oyun biter.');
  }
}

function spawnParticles(x, y) {
  for (let i = 0; i < CONFIG.particleCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 90;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: CONFIG.particleLife,
      age: 0
    });
  }
}

function spawnExplosion(x, y) {
  explosions.push({
    x,
    y,
    age: 0,
    life: CONFIG.explosionLife
  });
}

function updateEffects(dt) {
  particles = particles.filter((p) => {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    return p.age < p.life;
  });

  explosions = explosions.filter((e) => {
    e.age += dt;
    return e.age < e.life;
  });
}

function handleNoteEvent(noteName, now) {
  if (!noteName || notes.length === 0) return;

  if (currentTarget && currentTarget.dist >= ringInner && currentTarget.dist <= ringOuter) {
    if (noteName === currentTarget.note) {
      currentTarget.dead = true;
      score += 10;
      scoreEl.textContent = `PUAN ${score}`;
      waveHits += 1;
      ringFlashUntil = now + CONFIG.ringFlashMs;
      spawnExplosion(currentTarget.x, currentTarget.y);
      spawnParticles(currentTarget.x, currentTarget.y);
      return;
    }
  }
  applyDamage(CONFIG.penalty);
}

function updateHUD(elapsed) {
  waveEl.textContent = `Dalga ${waveIndex + 1}/${WAVES.length}`;
  timerEl.textContent = formatTime(CONFIG.waveDuration - elapsed);
}

function draw(now) {
  ctx.clearRect(0, 0, width, height);

  const ringActive = currentTarget && currentTarget.dist >= ringInner && currentTarget.dist <= ringOuter;
  const ringFlash = now < ringFlashUntil;
  ctx.lineWidth = CONFIG.ringThickness;
  if (ringFlash) {
    ctx.strokeStyle = 'rgba(50, 213, 131, 0.95)';
  } else {
    ctx.strokeStyle = ringActive ? 'rgba(255, 77, 77, 0.9)' : 'rgba(249, 230, 93, 0.75)';
  }
  ctx.beginPath();
  ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(center.x, center.y, playerRadius, 0, Math.PI * 2);
  ctx.fill();

  for (const note of notes) {
    const inRing = note.dist >= ringInner && note.dist <= ringOuter;
    ctx.fillStyle = inRing ? 'rgba(255, 77, 77, 0.95)' : 'rgba(238, 242, 247, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    const radius = 18;
    ctx.beginPath();
    ctx.arc(note.x, note.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0b0c10';
    ctx.font = '600 12px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note.note, note.x, note.y);
  }

  for (const explosion of explosions) {
    const t = explosion.age / explosion.life;
    const radius = 10 + t * 28;
    const alpha = Math.max(0, 1 - t);
    ctx.strokeStyle = `rgba(50, 213, 131, ${0.8 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const particle of particles) {
    const t = 1 - particle.age / particle.life;
    ctx.fillStyle = `rgba(50, 213, 131, ${t})`;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }
}

function update(now) {
  if (currentState !== STATE.PLAYING) return;
  if (!lastFrame) lastFrame = now;
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;

  const elapsed = (now - waveStart) / 1000;
  updateHUD(elapsed);

  while (scheduleIndex < schedule.length) {
    const hitTime = schedule[scheduleIndex].time;
    const spawnTime = hitTime - CONFIG.travelTime;
    if (elapsed >= spawnTime) {
      spawnNote(schedule[scheduleIndex].note);
      scheduleIndex += 1;
    } else {
      break;
    }
  }

  if (!waveEnded && elapsed >= CONFIG.waveDuration) {
    waveEnded = true;
  }

  updateNotes(dt);
  updateEffects(dt);

  const detected = detectPitch();
  detectedEl.textContent = `Nota: ${detected ?? '--'}`;

  if (detected) {
    if (detected !== lastDetectedNote || now - lastNoteEvent > CONFIG.noteEventCooldown) {
      handleNoteEvent(detected, now);
      lastDetectedNote = detected;
      lastNoteEvent = now;
    }
  }

  draw(now);

  if (waveEnded && notes.length === 0) {
    const hitRate = waveTotal > 0 ? waveHits / waveTotal : 0;
    if (hitRate < CONFIG.requiredHitRate) {
      endGame(false, 'Isabet orani %25 altinda.');
      return;
    }
    nextWave();
    return;
  }

  requestAnimationFrame(update);
}

function nextWave() {
  waveIndex += 1;
  if (waveIndex >= WAVES.length) {
    endGame(true);
    return;
  }
  startWave(waveIndex);
}

function startWave(index) {
  waveIndex = index;
  schedule = buildSchedule(WAVES[waveIndex]);
  scheduleIndex = 0;
  waveHits = 0;
  waveTotal = schedule.length;
  notes = [];
  particles = [];
  explosions = [];
  ringFlashUntil = 0;
  waveStart = performance.now();
  waveEnded = false;
  lastFrame = 0;
  requestAnimationFrame(update);
}

function startGame() {
  currentState = STATE.PLAYING;
  hp = 100;
  score = 0;
  hpEl.textContent = `HP ${hp}%`;
  scoreEl.textContent = `PUAN ${score}`;
  startWave(0);
}

function endGame(isWin, reason = '') {
  currentState = isWin ? STATE.WIN : STATE.LOSE;
  endReason = reason;
  endTitle.textContent = isWin ? 'You Win' : 'You Lose';
  if (isWin) {
    endSub.textContent = `5 dalgayi basariyla tamamladin. Puan: ${score}.`;
  } else {
    const reasonText = endReason ? ` ${endReason}` : '';
    endSub.textContent = `Oyun bitti.${reasonText} Puan: ${score}.`;
  }
  endScreen.classList.remove('hidden');
  endScreen.classList.add('active');
}

function resetUI() {
  endScreen.classList.add('hidden');
  endScreen.classList.remove('active');
  startScreen.classList.add('hidden');
  startScreen.classList.remove('active');
}

function startIntro() {
  currentState = STATE.INTRO;
  intro.classList.remove('hidden');
  intro.classList.add('running');
  tear.classList.remove('active');
  flash.classList.remove('active');

  const glitchDuration = 1200;
  const flashDuration = 3000;

  setTimeout(() => {
    tear.classList.add('active');
  }, glitchDuration);

  setTimeout(() => {
    flash.classList.add('active');
  }, glitchDuration + 200);

  setTimeout(() => {
    intro.classList.add('hidden');
    intro.classList.remove('running');
    startGame();
  }, glitchDuration + flashDuration + 200);
}

async function initMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { ok: false, reason: 'Tarayici mikrofonu desteklemiyor.' };
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: 'Mikrofon icin HTTPS gerekli.' };
  }

  try {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' });
        if (status.state === 'denied') {
          return { ok: false, reason: 'Mikrofon engelli. Site ayarlarindan izin verin.' };
        }
      } catch (error) {
        // Permissions API may not support microphone on some browsers.
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    audioBuffer = new Float32Array(analyser.fftSize);
    micSource = audioContext.createMediaStreamSource(stream);
    micSource.connect(analyser);
    return { ok: true };
  } catch (error) {
    let reason = 'Mikrofon izni verilmedi.';
    if (error && error.name === 'NotAllowedError') {
      reason = 'Mikrofon izni reddedildi. Site ayarlarindan izin verin.';
    } else if (error && error.name === 'NotFoundError') {
      reason = 'Mikrofon bulunamadi.';
    } else if (error && error.name === 'NotReadableError') {
      reason = 'Mikrofon baska bir uygulama tarafindan kullaniyor.';
    } else if (error && error.name === 'SecurityError') {
      reason = 'Mikrofon icin HTTPS gerekli.';
    }
    return { ok: false, reason };
  }
}

startBtn.addEventListener('click', async () => {
  permissionMsg.textContent = 'Mikrofon izni isteniyor...';
  const result = await initMic();
  if (!result.ok) {
    permissionMsg.textContent = result.reason;
    return;
  }
  permissionMsg.textContent = 'Mikrofon aktif. Hazirlaniyor...';
  resetUI();
  startIntro();
});

declineBtn.addEventListener('click', () => {
  permissionMsg.textContent = 'Oyun baslamadi.';
});

restartBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  endScreen.classList.remove('active');
  startScreen.classList.remove('hidden');
  startScreen.classList.add('active');
  permissionMsg.textContent = '';
  detectedEl.textContent = 'Nota: --';
  currentState = STATE.IDLE;
});

startScreen.classList.add('active');
