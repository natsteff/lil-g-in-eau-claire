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
const music = new Audio('./assets/audio/retro-ec.mp3');
music.loop = true;
music.volume = 0.65;
let soundOn = true;
const width = canvas.width;
const height = canvas.height;
const defaultGround = 339;
const pack = './assets/great-monkey-beer-run/monkey-phaser-skin';
const route = [
  { art: 'apartment', label: 'Apartment', length: 960, spawn: 220 },
  { art: 'garage', label: 'Garage', length: 960, pickup: 475 },
  { art: 'residential-a', label: 'Residential A1', length: 1620, spring: 250, obstacles: [[550, 2], [1280, 3]], traffic: [[940, 0]] },
  { neighborhood: 0, label: 'Residential A2', length: 1580, obstacles: [[480, 0]], traffic: [[800, 1], [1240, 3]] },
  { neighborhood: 1, label: 'Residential A3', length: 1710, obstacles: [[520, 5], [1370, 2]], traffic: [[950, 2]] },
  { art: 'downtown', label: 'Downtown', length: 2180, ground: 270, obstacles: [[460, 1], [800, 5], [1140, 3], [1500, 4], [1830, 0]] },
  { art: 'residential-b', label: 'Residential B1', length: 1640, obstacles: [[450, 2], [1190, 3]], traffic: [[830, 4]] },
  { neighborhood: 2, label: 'Residential B2', length: 1580, obstacles: [[470, 1]], traffic: [[820, 0], [1230, 1]] },
  { neighborhood: 3, label: 'Residential B3', length: 1710, obstacles: [[490, 3], [1380, 5]], traffic: [[930, 2]] },
  { art: 'destination', label: 'Destination', length: 960, ground: 252, door: 525, obstacles: [[300, 6]] },
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

let backgrounds, player, carrier, cast, cargo, cargoLeft, vehicleArt;
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
let hits = 0;
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
  if (soundOn && mode === 'play') {
    music.play().catch(() => {
      if (soundOn && mode === 'play') sound.textContent = 'Retry sound';
    });
  } else music.pause();
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
  enteredAt = clock;
  riding = null;
  jumpStarted = -Infinity;
  x = route[index].spawn ?? 75;
  y = groundY();
  velocity = 0;
  direction = 1;
  invincible = 0;
}
function restartRun() {
  if (start.disabled) return;
  clearInput();
  carrying = false;
  hits = 0;
  clock = 0;
  megaUnlocked = false;
  tutorialUntil = 0;
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
document.querySelector('#options').onclick = () => {
  resumeAfterSettings = mode === 'play';
  if (resumeAfterSettings) togglePause();
  settings.showModal();
};
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

function patrolX(anchor, kind) {
  return anchor + Math.sin(clock * (1.15 + kind * 0.12) + anchor) * (kind === 3 ? 90 : 65);
}
// Tight source rectangles remove the atlas padding below each character's feet.
const obstacleFrames = [
  [58, 18, 351, 401], [484, 30, 345, 389], [915, 96, 367, 323],
  [1378, 18, 363, 394], [54, 463, 327, 395], [480, 460, 376, 398],
  [930, 462, 357, 396],
];
const neighborhoodStrips = [[0, 312], [312, 315], [627, 313], [940, 314]];
const vehicleFrames = [
  [14, 286, 362, 193], [430, 227, 173, 252], [645, 267, 599, 210],
  [1277, 295, 387, 182], [1699, 262, 463, 214],
];
const vehicles = [
  { width: 196, height: 104 }, { width: 69, height: 101 },
  { width: 382, height: 134 }, { width: 204, height: 96 },
  { width: 294, height: 136 },
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
function birdLift(anchor) {
  const dive = Math.max(0, Math.cos(clock * 1.45 + anchor)) ** 5;
  return 122 - dive * 105;
}
function bump() {
  hits += 1;
  invincible = 1.1;
  riding = null;
  x = Math.max(18, x - 45);
}
function update(dt) {
  clock += dt;
  const scene = route[level];
  const ground = groundY();
  const input = touch.sample();
  if (input.jump) pressed.add('jump');
  if (input.interact) pressed.add('action');
  const move = (Number(active('right')) - Number(active('left'))) || input.move;
  moving = Boolean(move);
  if (move) direction = move;
  const pass = trafficPass(scene, clock);
  if (riding && (!pass?.active || pass.vehicle !== riding)) riding = null;
  if (riding) x -= trafficSpeed * dt;
  x = Math.max(18, Math.min(scene.length + 24, x + move * (carrying ? 243 : 272) * (input.sprint ? 1.35 : 1) * dt));
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
    } else if (overlaps && riding !== vehicle && !invincible && y > top + 2 && y - 48 < ground) {
      bump();
    }
  }
  for (const [position, kind] of scene.obstacles ?? []) {
    const bottom = ground - (kind === 3 ? birdLift(position) : 0);
    if (!invincible && Math.abs(x - patrolX(position, kind)) < 33 && y > bottom - 55 && y - 55 < bottom) bump();
  }
  if (pressed.has('action')) {
    if (near(scene.pickup)) carrying = true;
    if (near(scene.door)) enter(level + 1);
    if (near(scene.delivery)) {
      carrying = false;
      showMenu('done', `Beer delivered! Bumps along the way: ${hits}.`, 'Run again');
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
function draw() {
  const scene = route[level];
  const ground = groundY();
  const camera = Math.min(scene.length - width, Math.max(0, x - width * 0.4));
  const background = backgrounds[level];
  if (scene.neighborhood !== undefined) {
    const strip = neighborhoodStrips[scene.neighborhood];
    ctx.drawImage(background, 0, strip[0], background.width, strip[1], -camera, 0, scene.length, height);
  } else ctx.drawImage(background, -camera, 0, scene.length, height);
  if (!megaUnlocked && scene.spring !== undefined) drawSpring(scene.spring - camera, ground);
  const pass = trafficPass(scene, clock);
  if (pass?.active) {
    const kind = pass.vehicle[1];
    const shape = vehicles[kind];
    const [left, top, sourceWidth, sourceHeight] = vehicleFrames[kind];
    ctx.drawImage(vehicleArt, left, top, sourceWidth, sourceHeight,
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
    const [left, top, sourceWidth, sourceHeight] = obstacleFrames[kind];
    const size = kind === 3 ? 62 : 76;
    const spriteWidth = size * sourceWidth / sourceHeight;
    ctx.drawImage(cast, left, top, sourceWidth, sourceHeight,
      patrolX(position, kind) - camera - spriteWidth / 2, ground - size - (kind === 3 ? birdLift(position) : 0), spriteWidth, size);
  }

  const frame = y < ground && !riding ? (velocity < 0 ? 4 : 5) : moving ? 1 + Math.floor(clock * 10) % 3 : 0;
  ctx.save();
  ctx.translate(x - camera, y);
  ctx.scale(direction, 1);
  if (invincible && Math.floor(clock * 14) % 2) ctx.globalAlpha = 0.45;
  if (carrying) {
    const [bodyX, feetY, palmX, palmY] = carryAnchors[frame];
    ctx.drawImage(carrier, frame * 362, 0, 362, 724,
      -bodyX * carryScale, -feetY * carryScale, 362 * carryScale, 724 * carryScale);
    // Flip the pose and its palm position, while leaving the cargo text readable.
    ctx.scale(direction, 1);
    drawCargo((palmX - bodyX) * carryScale * direction,
      (palmY - feetY) * carryScale + 2, 84, direction < 0 ? cargoLeft : cargo);
  } else {
    ctx.drawImage(player, frame * 362, 0, 362, 724, -27, -84, 54, 108);
  }
  ctx.restore();
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
  const megaHint = clock < tutorialUntil ? ' · Mega Jump unlocked! Quickly press Jump twice' : '';
  const line = `${scene.label} · ${level + 1}/${route.length} · Bumps: ${hits}${hint}${megaHint}`;
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
    ...backdropUrls.map(loadImage),
  ];
  progress.max = resources.length;
  progress.value = 0;
  let loadedBackdrops;
  [player, carrier, cast, cargo, cargoLeft, vehicleArt, ...loadedBackdrops] = await Promise.all(
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
