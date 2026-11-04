import { installDialogRotationRecovery } from './src/dialog-rotation.mjs';
import { installTouchViewport } from './src/touch-viewport.mjs';
import { checkForUpdate } from './src/updates.mjs?v=0.1.1';
import { touch } from './src/touch.mjs';
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const menu = document.querySelector('#menu');
const message = document.querySelector('#message');
const start = document.querySelector('#start');
const progress = document.querySelector('#loading-progress');
const restart = document.querySelector('#restart');
const pause = document.querySelector('#pause');
const sound = document.querySelector('#sound');
const fullscreen = document.querySelector('#fullscreen');
const shell = document.querySelector('main');
const soundtrack = document.querySelector('#soundtrack');
const soundtrackKey = 'lil-g-in-ec.soundtrack';
try {
  const saved = localStorage.getItem(soundtrackKey);
  if ([...soundtrack.options].some(option => option.value === saved)) soundtrack.value = saved;
} catch {}
const music = new Audio(soundtrack.value);
soundtrack.onchange = () => {
  music.src = soundtrack.value;
  try { localStorage.setItem(soundtrackKey, soundtrack.value); } catch {}
  syncMusic();
};
music.loop = true;
music.volume = 0.65;
const finaleMusic = new Audio('./assets/audio/beertastic-success.mp3');
finaleMusic.volume = music.volume;
finaleMusic.loop = true;
let celebrationAt = null;
let soundOn = true;
const width = canvas.width;
const height = canvas.height;
const defaultGround = 339;
const pack = './assets/great-monkey-beer-run/monkey-phaser-skin';
const route = [
  { art: 'apartment', label: 'Apartment', length: 960, spawn: 220 },
  { backdrop: './assets/unicorn-beer-distribution.png', label: 'Unicorn Beer Distribution', length: 960, pickup: 475 },
  { art: 'residential-a', label: 'Residential A1', length: 1620, obstacles: [[550, 2], [1280, 3]], traffic: [[940, 0]] },
  { neighborhood: 0, label: 'Residential A2', length: 1580, obstacles: [[480, 0]], traffic: [[800, 5], [1240, 3], [800, 1]] },
  { neighborhood: 1, label: 'Residential A3', length: 1710, spring: 200, obstacles: [[520, 5], [1370, 2]], traffic: [[950, 2]] },
  { art: 'downtown', label: 'Downtown', length: 3100, ground: 270, obstacles: [[410, 7], [680, 8], [940, 9], [1220, 4], [1490, 10], [1760, 11], [2030, 12], [2300, 13], [2570, 14], [2840, 0]] },
  { art: 'residential-b', label: 'Residential B1', length: 1640, obstacles: [[450, 2], [1190, 3]], traffic: [[830, 4]] },
  { neighborhood: 2, label: 'Residential B2', length: 1580, obstacles: [[470, 1]], traffic: [[820, 6], [1230, 1], [820, 0]] },
  { neighborhood: 3, label: 'Residential B3', length: 1710, obstacles: [[490, 3], [1380, 5]], traffic: [[930, 2]] },
  { art: 'destination', label: 'Destination', length: 960, ground: 252, door: 525, rightLimit: 585, obstacles: [[300, 6]] },
  { backdrop: './assets/3rd-and-vine-interior.png', label: 'Inside 3rd & Vine', length: 960, delivery: 450, ground: 355 },
];
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(url));
    image.src = url;
  });
}

let backgrounds, player, carrier, cast, cargo, cargoLeft, vehicleArt, garageVehicleArt, downtownCast, toastCast, danceArt;
let megaUnlocked = false;
let jumpStarted = -Infinity;
let riding = null;
let enteredAt = 0;
let tutorialUntil = 0;
let level = 0;
let x = route[0].spawn;
let y = defaultGround;
let velocity = 0;
let direction = 1;
let carrying = false;
let moving = false;
const pedestrianPasses = new Map();
let repeatPedestriansAt = null;
let pedestrianEncore = false;
let apartmentIntroMoved = false;
const maxStamina = 10;
let hits = 0;
let spillAt = null;
let spillHeight = 0;
let collapseArt;
let invincible = 0;
let mode = 'title';
// Cover missed taps between controls and in the safe-area margins. The input
// module reads pointer events, so cancelling touchend does not swallow jumps.
document.addEventListener('touchend', event => {
  if (mode === 'play' && event.cancelable && !event.target.closest('#options')) event.preventDefault();
}, { capture: true, passive: false });
let clock = 0;
let previousTime = 0;
const held = new Set();

const pressed = new Set();
const keys = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyF: 'action' };
const active = key => held.has(key);
const groundY = () => route[level].ground ?? defaultGround;
const near = point => point !== undefined && Math.abs(x - point) < 62 && y > groundY() - 30;

function clearInput() {
  held.clear();
  touch.clear();
  moving = false;
  pressed.clear();
}
function syncMusic() {
  const track = celebrationAt === null ? music : finaleMusic;
  const otherTrack = track === music ? finaleMusic : music;
  otherTrack.pause();
  if (soundOn && mode === 'play') {
    track.play().catch(() => {
      if (soundOn && mode === 'play') sound.textContent = 'Retry sound';
    });
  } else track.pause();
}
function toggleSound() {
  if (sound.textContent !== 'Retry sound') soundOn = !soundOn;
  sound.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
  sound.setAttribute('aria-pressed', String(soundOn));
  syncMusic();
}
function updateFullscreen() {
  const expanded = Boolean(document.fullscreenElement) || shell.classList.contains('expanded');
  fullscreen.textContent = expanded ? 'Exit full screen' : 'Full screen';
  fullscreen.setAttribute('aria-pressed', String(expanded));
  touchViewport.sync();
}
async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else if (shell.classList.contains('expanded')) {
    shell.classList.remove('expanded');
  } else {
    try {
      await shell.requestFullscreen();
    } catch {
      shell.classList.add('expanded');
    }
  }
  updateFullscreen();
}
sound.onclick = toggleSound;
fullscreen.onclick = () => {
  settings.close();
  void toggleFullscreen();
};
document.addEventListener('fullscreenchange', updateFullscreen);

function showMenu(next, copy, label) {
  mode = next;
  document.documentElement.classList.remove('playing');
  touch.enabled = false;
  menu.dataset.mode = next;
  syncMusic();
  clearInput();
  message.textContent = copy;
  start.textContent = label;
  menu.hidden = false;
}
function play() {
  mode = 'play';
  document.documentElement.classList.add('playing');
  touch.enabled = true;
  restart.disabled = false;
  syncMusic();
  menu.hidden = true;
  pause.textContent = 'Pause';
}
function togglePause() {
  if (mode === 'play') {
    showMenu('paused', 'Run paused', 'Resume');
    pause.textContent = 'Resume';
  } else if (mode === 'paused') play();
}
function enter(index) {
  level = index;
  pedestrianPasses.clear();
  repeatPedestriansAt = null;
  pedestrianEncore = false;
  enteredAt = clock;
  riding = null;
  jumpStarted = -Infinity;
  x = route[index].spawn ?? 75;
  y = groundY();
  velocity = 0;
  direction = 1;
}
function restartRun() {
  if (start.disabled) return;
  clearInput();
  carrying = false;
  apartmentIntroMoved = false;
  hits = 0;
  invincible = 0;
  spillAt = null;
  clock = 0;
  megaUnlocked = false;
  tutorialUntil = 0;
  celebrationAt = null;
  finaleMusic.currentTime = 0;
  music.currentTime = 0;
  enter(0);
  play();
}
start.disabled = true;
start.onclick = () => {
  if (mode === 'paused') play();
  else restartRun();
};
restart.onclick = () => { settings.close(); restartRun(); };
pause.onclick = () => { resumeAfterSettings = false; settings.close(); };

window.addEventListener('keydown', event => {
  if (document.querySelector('#settings').open) return;
  if (event.code === 'Escape' && shell.classList.contains('expanded')) {
    shell.classList.remove('expanded');
    updateFullscreen();
  }
  if (event.code === 'KeyR' && !event.repeat && mode !== 'title') restartRun();
  if (event.code === 'KeyS' && !event.repeat) toggleSound();
  if (event.code === 'KeyV' && !event.repeat) toggleFullscreen();
  if (event.code === 'KeyP' && !event.repeat) togglePause();
  const key = keys[event.code];
  if (!key || mode !== 'play') return;
  event.preventDefault();
  if (!event.repeat) pressed.add(key);
  held.add(key);
});
window.addEventListener('keyup', event => held.delete(keys[event.code]));
window.addEventListener('blur', () => {
  clearInput();
  if (mode === 'play') togglePause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') togglePause();
});
const settings = document.querySelector('#settings');
const controls = ['layout', 'spacing', 'large', 'quick'].map(id => document.getElementById(id));
const [layout, spacing, large, quick] = controls;
const controlKey = 'lil-g-in-ec.touch.v1';
try {
  const saved = JSON.parse(localStorage.getItem(controlKey));
  if (['default', 'slider', 'stick'].includes(saved?.layout)) layout.value = saved.layout;
  if (saved?.spacing >= 1 && saved.spacing <= 5) spacing.value = saved.spacing;
  large.checked = saved?.large === true;
  quick.checked = saved?.quick === true;
} catch {}
function applyControls() {
  touch.clear();
  touch.style = layout.value;
  document.querySelector('#arrow-settings').disabled = layout.value !== 'default';
  document.querySelector('#layout-description').textContent = {
    default: 'Left / right arrows',
    slider: 'Slide · edges sprint',
    stick: 'Circle · left/right sprint',
  }[layout.value];
  touch.quickSprintEnabled = quick.checked;
  const stick = document.getElementById('touch-stick');
  stick.hidden = layout.value === 'default';
  stick.dataset.style = layout.value;
  document.getElementById('touch-arrows').style.display = stick.hidden ? 'flex' : 'none';
  shell.style.setProperty('--arrow-gap', `${Number(spacing.value) * 5}px`);
  shell.style.setProperty('--arrow-size', large.checked ? '81px' : '54px');
}
applyControls();
for (const control of controls) control.addEventListener('input', () => {
  applyControls();
  try {
    localStorage.setItem(controlKey, JSON.stringify({
      layout: layout.value, spacing: Number(spacing.value), large: large.checked, quick: quick.checked,
    }));
  } catch {}
});
let resumeAfterSettings = false;
const menuButton = document.querySelector('#options');
function openSettings() {
  if (settings.open) return;
  resumeAfterSettings = mode === 'play';
  if (resumeAfterSettings) togglePause();
  settings.showModal();
}
menuButton.onclick = openSettings;
// Touch activation must not depend on Safari synthesizing a click after
// the gameplay gesture guards have handled the same tap.
menuButton.addEventListener('pointerup', event => {
  if (event.pointerType !== 'touch') return;
  const bounds = menuButton.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
  openSettings();
});
settings.addEventListener('close', () => {
  if (resumeAfterSettings && mode === 'paused') play();
});
shell.addEventListener('contextmenu', event => event.preventDefault());
const mobile = matchMedia('(pointer: coarse)').matches
  || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
shell.classList.toggle('touch-mode', mobile);
shell.classList.toggle('expanded', mobile);
const touchViewport = installTouchViewport(shell, { onCancel: clearInput, onResize: resizeCanvas });
installDialogRotationRecovery(shell, {
  onCancel: clearInput,
  onSettled: () => { touchViewport.sync(); resizeCanvas(); },
});
updateFullscreen();

const eagleKind = 13;
function patrolX(anchor, kind) {
  if (kind === eagleKind) return anchor + Math.sin(clock * 2.1 + anchor) * 145;
  return anchor + Math.sin(clock * (1.15 + kind * 0.12) + anchor) * (kind === 3 ? 90 : 65);
}
const downtownPassSpeeds = new Map([[7, 82], [8, 75], [10, 90], [11, 86], [12, 165], [14, 78]]);
function cameraLeft(scene) {
  return Math.min(scene.length - width, Math.max(0, x - width * 0.4));
}
function pedestrianX(pass) {
  return pass.startX - (clock - pass.startedAt) * pass.speed;
}
function updatePedestrianPasses(scene) {
  if (scene.art !== 'downtown') return;
  const leftEdge = cameraLeft(scene);
  if (pedestrianPasses.size === downtownPassSpeeds.size
      && [...pedestrianPasses.values()].every(pass => pedestrianX(pass) < leftEdge - 80)) {
    repeatPedestriansAt ??= clock + 2;
    if (clock >= repeatPedestriansAt) {
      pedestrianPasses.clear();
      repeatPedestriansAt = null;
      pedestrianEncore = true;
    }
  }
  if ([...pedestrianPasses.values()].some(pass => pedestrianX(pass) >= x - 100)) return;
  for (const [anchor, kind] of scene.obstacles) {
    const speed = downtownPassSpeeds.get(kind);
    if (!speed || pedestrianPasses.has(kind) || (!pedestrianEncore && x < anchor - 320)) continue;
    pedestrianPasses.set(kind, { startX: leftEdge + width + 80, startedAt: clock, speed });
    break;
  }
}
function obstacleX(scene, anchor, kind) {
  if (scene.art !== 'downtown' || !downtownPassSpeeds.has(kind)) return patrolX(anchor, kind);
  const pass = pedestrianPasses.get(kind);
  if (!pass) return null;
  const position = pedestrianX(pass);
  return position >= -80 ? position : null;
}
// Tight source rectangles remove the atlas padding below each character's feet.
const obstacleFrames = [
  [58, 18, 351, 401], [484, 30, 345, 389], [915, 96, 367, 323],
  [1378, 18, 363, 394], [54, 463, 327, 395], [480, 460, 376, 398],
  [930, 462, 357, 396],
];
const downtownFrames = [
  [98, 10, 279, 426], [525, 12, 253, 424], [897, 10, 405, 426], [1383, 0, 342, 437],
  [90, 452, 255, 427], [450, 467, 374, 416], [879, 446, 429, 404], [1410, 447, 319, 436],
];
const neighborhoodStrips = [[0, 312], [312, 315], [627, 313], [940, 314]];
const vehicleFrames = [
  [14, 286, 362, 193], [430, 227, 173, 252], [645, 267, 599, 210],
  [1277, 295, 387, 182], [1699, 262, 463, 214],
  [128, 245, 813, 339], [1135, 100, 922, 531],
];
const vehicles = [
  { width: 196, height: 104 }, { width: 69, height: 101 },
  { width: 382, height: 134 }, { width: 204, height: 96 },
  { width: 294, height: 136 },
  { width: 208, height: 87 }, { width: 248, height: 143 },
];
const trafficSpeed = 380;
const trafficGap = 0.8;
function trafficPass(scene, time) {
  if (!scene.traffic?.length) return null;
  const margin = 210;
  const firstStart = width + margin;
  const firstDuration = (firstStart + margin) / trafficSpeed;
  const elapsed = Math.max(0, time - enteredAt);
  if (elapsed < firstDuration) {
    return { vehicle: scene.traffic[0], x: firstStart - elapsed * trafficSpeed, active: true };
  }
  const repeatElapsed = elapsed - firstDuration;
  const slot = (scene.length + 2 * margin) / trafficSpeed + trafficGap;
  const phase = repeatElapsed % slot;
  const vehicle = scene.traffic[(1 + Math.floor(repeatElapsed / slot)) % scene.traffic.length];
  return {
    vehicle,
    x: scene.length + margin - (phase - trafficGap) * trafficSpeed,
    active: phase >= trafficGap,
  };
}
function birdLift(anchor, kind) {
  if (kind === eagleKind) {
    const dive = Math.max(0, Math.cos(clock * 2.45 + anchor)) ** 8;
    return 176 - dive * 163;
  }
  if (kind !== 3) return 0;
  const dive = Math.max(0, Math.cos(clock * 1.45 + anchor)) ** 5;
  return 122 - dive * 105;
}
function bump() {
  if (invincible > 0 || spillAt !== null) return;
  hits += 1;
  invincible = 1.1;
  riding = null;
  x = Math.max(18, x - 45);
  if (hits === maxStamina) {
    spillAt = clock;
    spillHeight = groundY() - y + 60;
    touch.enabled = false;
    clearInput();
  }
}
function update(dt) {
  clock += dt;
  if (spillAt !== null) {
    y = Math.min(groundY(), y + 420 * dt);
    if (clock - spillAt >= 1.85) showMenu('failed', 'Lil’ G ran out of stamina. Run failed!', 'Try again');
    return;
  }
  if (celebrationAt !== null) {
    pressed.clear();
    return;
  }
  const scene = route[level];
  const ground = groundY();
  const input = touch.sample();
  if (input.jump) pressed.add('jump');
  if (input.interact) pressed.add('action');
  const move = (Number(active('right')) - Number(active('left'))) || input.move;
  moving = Boolean(move);
  if (level === 0 && moving) apartmentIntroMoved = true;
  if (move) direction = move;
  const pass = trafficPass(scene, clock);
  if (riding && (!pass?.active || pass.vehicle !== riding)) riding = null;
  if (riding) x -= trafficSpeed * dt;
  x = Math.max(18, Math.min(scene.rightLimit ?? scene.length + 24, x + move * (carrying ? 243 : 272) * (input.sprint ? 1.35 : 1) * dt));
  if (riding && Math.abs(x - pass.x) > vehicles[riding[1]].width / 2 + 9) riding = null;
  if (!megaUnlocked && scene.spring !== undefined && Math.abs(x - scene.spring) < 28 && y > ground - 64) {
    megaUnlocked = true;
    tutorialUntil = clock + 7;
  }
  if (pressed.has('jump')) {
    if (riding || y === ground) {
      riding = null;
      velocity = -575;
      jumpStarted = clock;
    } else if (megaUnlocked && clock - jumpStarted <= 0.32) {
      velocity = -690;
      jumpStarted = -Infinity;
    }
  }
  const previousY = y;
  if (!riding) {
    velocity += 1280 * dt;
    y = Math.min(ground, y + velocity * dt);
    if (y === ground) velocity = 0;
  }
  invincible = Math.max(0, invincible - dt);
  if (pass?.active) {
    const vehicle = pass.vehicle;
    const kind = vehicle[1];
    const shape = vehicles[kind];
    const top = ground - shape.height;
    const overlaps = Math.abs(x - pass.x) < shape.width / 2 + 9;
    if (overlaps && riding !== vehicle && velocity >= 0 && previousY <= top && y >= top) {
      riding = vehicle;
      y = top;
      velocity = 0;
    } else if (overlaps && riding !== vehicle && y > top + 2 && y - 48 < ground) {
      bump();
    }
  }
  updatePedestrianPasses(scene);
  for (const [position, kind] of scene.obstacles ?? []) {
    const obstacle = obstacleX(scene, position, kind);
    if (obstacle === null) continue;
    const bottom = ground - birdLift(position, kind);
    if (Math.abs(x - obstacle) < 33 && y > bottom - 55 && y - 55 < bottom) bump();
  }
  if (spillAt !== null) return;
  if (pressed.has('action')) {
    if (near(scene.pickup)) carrying = true;
    if (near(scene.door)) enter(level + 1);
    if (near(scene.delivery)) {
      carrying = false;
      celebrationAt = clock;
      finaleMusic.currentTime = 0;
      clearInput();
      syncMusic();
    }
  }
  if (x >= scene.length && scene.door === undefined && scene.delivery === undefined) {
    if (scene.pickup === undefined || carrying) enter(level + 1);
    else x = scene.length - 36;
  }
  pressed.clear();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const scale = Math.min(bounds.width / width, bounds.height / height) * window.devicePixelRatio;
  const pixelWidth = Math.max(1, Math.round(width * scale));
  const pixelHeight = Math.max(1, Math.round(height * scale));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  ctx.imageSmoothingQuality = 'high';
}
new ResizeObserver(resizeCanvas).observe(canvas);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawCargo(center, base, size, art = cargo) {
  const tall = size * art.height / art.width;
  ctx.drawImage(art, center - size / 2, base - tall, size, tall);
}

const carryScale = 0.19;
// Body center, feet baseline and palm position within each carrying cell.
const carryAnchors = [
  [147, 511, 86, 213], [146, 510, 81, 213], [146, 510, 77, 213],
  [146, 508, 79, 213], [142, 450, 78, 163], [133, 516, 63, 225],
];

function drawSpring(center, ground) {
  ctx.save();
  ctx.translate(center, ground - 20);
  const metal = ctx.createLinearGradient(-13, 0, 13, 0);
  metal.addColorStop(0, '#506077');
  metal.addColorStop(0.35, '#e5eff9');
  metal.addColorStop(0.55, '#fff');
  metal.addColorStop(1, '#697e96');
  ctx.lineWidth = 4;
  ctx.strokeStyle = metal;
  for (let turn = 0; turn < 5; turn++) {
    ctx.beginPath();
    ctx.ellipse(0, 12 - turn * 6, 13, 4, -0.12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px system-ui';
  ctx.fillText('Mega Jump', 0, -28);
  ctx.restore();
}
const danceFrames = [
  [65, 127, 418, 473], [586, 127, 417, 473],
  [1083, 126, 499, 479], [1670, 144, 450, 453],
];
function drawCelebration(ground) {
  const elapsed = clock - celebrationAt;
  const toastDuration = 2.6;
  const dancing = elapsed >= toastDuration;
  const guestWidth = toastCast.width / 4;
  const guestHeight = toastCast.height / 2;
  const guestPositions = [
    [92, 7], [322, 13], [610, 9], [839, 15],
    [203, 0], [446, 2], [728, 0],
  ];
  guestPositions.forEach(([guestX, depth], index) => {
    const sway = dancing ? Math.sin(elapsed * 5 + index * 0.8) * 0.1 : 0;
    ctx.save();
    ctx.translate(guestX, ground - depth);
    ctx.rotate(sway);
    ctx.drawImage(toastCast, index % 4 * guestWidth, Math.floor(index / 4) * guestHeight,
      guestWidth, guestHeight, -98, -196, 196, 196);
    ctx.restore();
  });
  if (dancing) {
    const beat = Math.floor((elapsed - toastDuration) * 5);
    const [left, top, spriteWidth, spriteHeight] = danceFrames[beat % danceFrames.length];
    const displayWidth = 160 * spriteWidth / spriteHeight;
    const danceX = 584 + Math.sin(elapsed * 5) * 12;
    ctx.drawImage(danceArt, left, top, spriteWidth, spriteHeight,
      danceX - displayWidth / 2, ground - 160, displayWidth, 160);
  } else {
    ctx.drawImage(player, 0, 0, 362, 724, 584 - 54, ground - 168, 108, 216);
  }
  if (elapsed < toastDuration + 5) {
    ctx.fillStyle = '#092038e6';
    ctx.fillRect(0, 25, width, 58);
    ctx.fillStyle = '#ffd563';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px system-ui';
    ctx.fillText("Great Job Lil’ G!!!", width / 2, 65);
  }
  const caption = dancing ? 'Beer delivered!' : 'Cheers to Lil’ G!';
  if (status.textContent !== caption) status.textContent = caption;
}

function drawStamina() {
  ctx.fillStyle = '#092038ed';
  ctx.fillRect(14, 14, 170, 44);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`Stamina ${maxStamina - hits}/${maxStamina}`, 22, 32);
  for (let i = 0; i < maxStamina; i++) {
    ctx.fillStyle = i < maxStamina - hits ? (hits >= 7 ? '#ff8873' : '#ffd563') : '#3b5366';
    ctx.fillRect(22 + 15 * i, 39, 13, 11);
  }
}

// Source outlines in the 460 × 420 reference view of beer-tray.png.
const spillCases = [
  [48, [[8,287],[22,274],[115,287],[112,377],[9,360]]],
  [68, [[115,296],[226,313],[220,392],[112,378]]],
  [90, [[226,312],[340,306],[337,383],[220,392]]],
  [114, [[340,317],[453,273],[452,360],[337,384]]],
  [33, [[18,203],[40,191],[135,211],[130,289],[18,272]]],
  [67, [[136,212],[257,224],[251,305],[132,287]]],
  [104, [[258,223],[420,196],[442,199],[441,275],[375,321],[251,302]]],
  [46, [[40,125],[86,105],[154,128],[151,216],[40,196]]],
  [78, [[154,130],[272,125],[272,223],[151,213]]],
  [120, [[274,126],[389,124],[422,134],[421,197],[391,236],[271,222]]],
  [28, [[86,60],[106,53],[184,57],[184,106],[157,130],[86,118]]],
  [72, [[185,68],[211,57],[287,65],[290,112],[271,138],[185,123]]],
  [134, [[287,70],[310,64],[382,69],[381,118],[355,144],[287,131]]],
];
const spillBottles = [
  [62, '#b2d98a', [[120,12],[137,11],[138,24],[143,37],[141,63],[119,61],[118,39],[122,25]]],
  [101, '#e9ad69', [[203,17],[219,17],[219,29],[225,40],[224,66],[202,63],[201,42],[205,29]]],
  [145, '#c49bea', [[351,30],[369,30],[367,43],[371,56],[369,79],[348,77],[348,55],[353,42]]],
];
const trayScale = 84 / 460;
const trayImpactTime = 0.32;

function drawTrayPiece(outline, x, y, angle) {
  const centerX = (Math.min(...outline.map(([px]) => px)) + Math.max(...outline.map(([px]) => px))) / 2;
  const baseY = Math.max(...outline.map(([, py]) => py));
  ctx.save();
  ctx.translate(direction * x, y);
  ctx.rotate(direction * angle);
  ctx.scale(trayScale, trayScale);
  ctx.translate(-centerX, -baseY);
  ctx.beginPath();
  outline.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(cargo, 0, 0, 460, 420);
  ctx.restore();
}

function drawSpill(screenX, ground, elapsed) {
  if (elapsed < trayImpactTime) {
    const fall = (elapsed / trayImpactTime) ** 2;
    drawCargo(screenX + direction * (-12 + 46 * fall), ground - spillHeight * (1 - fall),
      84, direction < 0 ? cargoLeft : cargo);
    return;
  }
  elapsed -= trayImpactTime;
  ctx.save();
  ctx.translate(screenX, ground);
  spillCases.forEach(([distance, outline], i) => {
    const t = Math.min(1, elapsed / (0.38 + i * 0.024));
    const xs = outline.map(([px]) => px);
    const launchX = 34 + ((Math.min(...xs) + Math.max(...xs)) / 2 - 230) * trayScale;
    const launchY = (420 - Math.max(...outline.map(([, py]) => py))) * trayScale;
    const travel = 1 - (1 - t) ** 2;
    const bounce = 4 * t * (1 - t) * (9 + i);
    drawTrayPiece(outline, launchX + (distance - launchX) * travel,
      -launchY * (1 - t) - bounce + (i % 3) * 8 * t, (i % 2 ? -1 : 1) * (0.45 + i * 0.11) * Math.sin(t * 2.1));
  });
  for (const [distance, color, outline] of spillBottles) {
    const duration = 0.56 + distance / 450;
    const t = Math.min(1, elapsed / duration);
    const bottleX = 30 + (distance - 30) * t;
    if (t < 1) {
      drawTrayPiece(outline, bottleX, -59 * (1 - t) - 130 * t * (1 - t), t * 10);
    } else {
      ctx.fillStyle = color;
      const burst = Math.min(1, (elapsed - duration) / 0.22);
      for (let i = 0; i < 6; i++) {
        const shardX = direction * bottleX + (i - 2.5) * (2 + 4 * burst);
        const shardY = 2 - Math.sin(burst * Math.PI) * (3 + i);
        ctx.beginPath();
        ctx.moveTo(shardX, shardY);
        ctx.lineTo(shardX + 3, shardY - 1);
        ctx.lineTo(shardX + 1, shardY - 4);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

const collapseFrames = [
  // End time, source bounds, horizontal offset and height above the ground.
  [0.13, 37, 93, 214, 189, -25, 0],
  [0.29, 280, 78, 227, 186, -21, 7],
  [0.49, 534, 123, 224, 159, -16, 0],
  [Infinity, 788, 160, 282, 122, -13, 0],
];

function drawCollapse(elapsed) {
  const [, left, top, wide, tall, offset, lift] = collapseFrames.find(([end]) => elapsed < end);
  const scale = 0.32;
  ctx.drawImage(collapseArt, left, top, wide, tall, offset, -tall * scale - lift, wide * scale, tall * scale);
}

function draw() {
  const scene = route[level];
  const ground = groundY();
  const camera = cameraLeft(scene);
  const background = backgrounds[level];
  if (scene.neighborhood !== undefined) {
    const strip = neighborhoodStrips[scene.neighborhood];
    ctx.drawImage(background, 0, strip[0], background.width, strip[1], -camera, 0, scene.length, height);
  } else ctx.drawImage(background, -camera, 0, scene.length, height);
  if (celebrationAt !== null) {
    drawCelebration(ground);
    return;
  }
  if (!megaUnlocked && scene.spring !== undefined) drawSpring(scene.spring - camera, ground);
  const pass = trafficPass(scene, clock);
  if (pass?.active) {
    const kind = pass.vehicle[1];
    const shape = vehicles[kind];
    const [left, top, sourceWidth, sourceHeight] = vehicleFrames[kind];
    ctx.drawImage(kind >= 5 ? garageVehicleArt : vehicleArt, left, top, sourceWidth, sourceHeight,
      pass.x - camera - shape.width / 2, ground - shape.height, shape.width, shape.height);
  }
  const position = scene.pickup ?? scene.door ?? scene.delivery;
  const prompt = scene.pickup !== undefined
    ? (carrying ? '' : 'Pick up beer')
    : scene.door !== undefined ? 'Enter building' : scene.delivery !== undefined ? 'Deliver beer' : '';
  if (scene.pickup !== undefined && !carrying) {
    drawCargo(scene.pickup - camera, ground, 94);
  }
  if (scene.door !== undefined && near(scene.door)) {
    ctx.fillStyle = '#092038bd';
    ctx.fillRect(position - camera - 33, ground - 17, 66, 17);
    ctx.fillStyle = '#fff';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Enter', position - camera, ground - 5);
  } else if (prompt && scene.door === undefined) {
    ctx.fillStyle = '#092038';
    ctx.fillRect(position - camera - 74, ground - 125, 148, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, position - camera, ground - 107);
  }
  for (const [position, kind] of scene.obstacles ?? []) {
    const obstacle = obstacleX(scene, position, kind);
    if (obstacle === null) continue;
    const [left, top, sourceWidth, sourceHeight] = kind < 7 ? obstacleFrames[kind] : downtownFrames[kind - 7];
    const size = kind === eagleKind ? 67 : kind === 3 || kind === 12 ? 62 : 76;
    const spriteWidth = size * sourceWidth / sourceHeight;
    ctx.drawImage(kind < 7 ? cast : downtownCast, left, top, sourceWidth, sourceHeight,
      obstacle - camera - spriteWidth / 2, ground - size - birdLift(position, kind), spriteWidth, size);
    if (kind === eagleKind) {
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd563';
      ctx.fillText('Evil Old Abe', obstacle - camera,
        ground - size - birdLift(position, kind) - 6);
    }
  }

  const frame = y < ground && !riding ? (velocity < 0 ? 4 : 5) : moving ? 1 + Math.floor(clock * 10) % 3 : 0;
  ctx.save();
  ctx.translate(x - camera, y);
  const playerScale = level === 0 ? 1.5 : scene.delivery !== undefined ? 2 : 1;
  ctx.scale(direction * playerScale, playerScale);
  if (spillAt !== null) {
    drawCollapse(clock - spillAt);
  } else if (carrying) {
    if (invincible && Math.floor(clock * 14) % 2) ctx.globalAlpha = 0.45;
    const [bodyX, feetY, palmX, palmY] = carryAnchors[frame];
    ctx.drawImage(carrier, frame * 362, 0, 362, 724,
      -bodyX * carryScale, -feetY * carryScale, 362 * carryScale, 724 * carryScale);
    // Flip the pose and its palm position, while leaving the cargo text readable.
    ctx.scale(direction, 1);
    drawCargo((palmX - bodyX) * carryScale * direction,
      (palmY - feetY) * carryScale + 2, 84 / playerScale, direction < 0 ? cargoLeft : cargo);
  } else {
    if (invincible && Math.floor(clock * 14) % 2) ctx.globalAlpha = 0.45;
    ctx.drawImage(player, frame * 362, 0, 362, 724, -27, -84, 54, 108);
  }
  ctx.restore();
  if (spillAt !== null && carrying) drawSpill(x - camera, ground, clock - spillAt);
  drawStamina();
  if (level === 0 && !apartmentIntroMoved) {
    const markerX = x - camera;
    const markerY = y - 84 * playerScale - 6;
    ctx.fillStyle = '#092038ed';
    ctx.beginPath();
    ctx.roundRect(markerX - 62, markerY - 32, 124, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd563';
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px system-ui';
    ctx.fillText("Meet Lil’ G", markerX, markerY - 10);
    ctx.beginPath();
    ctx.moveTo(markerX - 9, markerY + 4);
    ctx.lineTo(markerX + 9, markerY + 4);
    ctx.lineTo(markerX, markerY + 17);
    ctx.fill();
  }
  const trafficFront = pass?.active ? pass.x - camera - vehicles[pass.vehicle[1]].width / 2 : Infinity;
  if (trafficFront >= width && trafficFront < width + trafficSpeed * 1.4) {
    ctx.fillStyle = '#092038';
    ctx.fillRect(width - 170, 14, 156, 28);
    ctx.fillStyle = '#ffd563';
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('Traffic from right →', width - 24, 33);
  }
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const hint = prompt && near(position) ? ` · ${mobile ? 'Action' : 'F'}: ${prompt}`
    : scene.pickup !== undefined && !carrying && x > scene.pickup + 62 ? ' · Go back for the beer' : '';
  if (clock < tutorialUntil) {
    ctx.fillStyle = '#092038eb';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 175, 30, 350, 59, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = '#ffd563';
    ctx.fillText('Mega Jump unlocked!', width / 2, 55);
    ctx.font = '15px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText(mobile ? 'Tap Jump twice quickly' : 'Press Space twice quickly', width / 2, 77);
  }
  const intro = level === 0 ? (apartmentIntroMoved
    ? ' · Guide him downstairs to Unicorn Beer Distribution to pick up his beer delivery →'
    : ' · Meet Lil’ G') : '';
  const line = `${scene.label} · ${level + 1}/${route.length} · Stamina: ${maxStamina - hits}/${maxStamina}${hint}${intro}`;
  if (status.textContent !== line) status.textContent = line;
}
function frame(time) {
  const dt = Math.min(0.033, (time - previousTime) / 1000);
  previousTime = time;
  if (mode === 'play') update(dt);
  draw();
  requestAnimationFrame(frame);
}

function backdropUrl(scene) {
  return scene.neighborhood !== undefined ? './assets/residential-variants.png'
    : scene.backdrop ?? `${pack}/backdrops/${scene.art}.png`;
}

const updateToggle = document.querySelector('#auto-update');
const updateStatus = document.querySelector('#update-status');
const updateButton = document.querySelector('#check-updates');
const version = document.querySelector('#game-version').textContent.slice(1);
try { updateToggle.checked = localStorage.getItem('lil-g.auto-update') !== 'false'; } catch {}
let lastUpdateCheck = 0;
async function checkUpdates(manual = false) {
  if (updateButton.disabled || (!manual && (!updateToggle.checked || Date.now() - lastUpdateCheck < 10000))) return;
  lastUpdateCheck = Date.now();
  updateButton.disabled = true;
  updateStatus.textContent = `v${version} · Checking…`;
  let storage;
  try { storage = sessionStorage; } catch {}
  const result = await checkForUpdate({
    current: version, url: location.href, storage, manual,
    navigate: url => location.replace(url),
  });
  const messages = {
    updating: 'Updating…', current: 'Up to date',
    stale: 'Update found. Try checking again.', unavailable: 'Could not check. Try again online.',
  };
  updateStatus.textContent = `v${version} · ${messages[result]}`;
  updateButton.disabled = result === 'updating';
}
updateToggle.onchange = () => {
  try { localStorage.setItem('lil-g.auto-update', String(updateToggle.checked)); } catch {}
  if (updateToggle.checked) void checkUpdates(true);
};
updateButton.onclick = () => void checkUpdates(true);
window.addEventListener('pageshow', () => void checkUpdates());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void checkUpdates();
});
void checkUpdates();

try {
  const backdropUrls = [...new Set(route.map(backdropUrl))];
  const resources = [
    loadImage(`${pack}/sprites/lil-g.png`),
    loadImage('./assets/lil-g-carry.png'),
    loadImage('./assets/obstacles/obstacle-cast.png'),
    loadImage('./assets/beer-tray.png'),
    loadImage('./assets/beer-tray-left.png'),
    loadImage('./assets/obstacles/residential-vehicles.png'),
    loadImage('./assets/obstacles/garage-vehicles.png'),
    loadImage('./assets/obstacles/downtown-cast.png'),
    loadImage('./assets/celebration-toast.png'),
    loadImage('./assets/lil-g-dance.png'),
    loadImage('./assets/lil-g-collapse.png'),
    ...backdropUrls.map(loadImage),
  ];
  progress.max = resources.length;
  progress.value = 0;
  let loadedBackdrops;
  [player, carrier, cast, cargo, cargoLeft, vehicleArt, garageVehicleArt, downtownCast, toastCast, danceArt, collapseArt, ...loadedBackdrops] = await Promise.all(
    resources.map(async resource => {
      const art = await resource;
      progress.value += 1;
      return art;
    }),
  );
  const byUrl = new Map(backdropUrls.map((url, index) => [url, loadedBackdrops[index]]));
  backgrounds = route.map(scene => byUrl.get(backdropUrl(scene)));
  progress.parentElement.hidden = true;
  start.disabled = false;
  requestAnimationFrame(frame);
} catch (error) {
  progress.parentElement.hidden = true;
  message.textContent = `Could not load game art: ${error.message}`;
}
