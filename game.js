const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const menu = document.querySelector('#menu');
const message = document.querySelector('#message');
const start = document.querySelector('#start');
const pause = document.querySelector('#pause');
const width = canvas.width;
const height = canvas.height;
const ground = 339;
const pack = './assets/great-monkey-beer-run/monkey-phaser-skin';
const route = [
  { art: 'apartment', label: 'Apartment', length: 960 },
  { art: 'garage', label: 'Garage', length: 960, pickup: 475 },
  { art: 'residential-a', label: 'Residential A', length: 1620, obstacles: [[460, 2], [830, 0], [1290, 3]] },
  { art: 'downtown', label: 'Downtown', length: 2180, obstacles: [[460, 1], [800, 5], [1140, 3], [1500, 4], [1830, 0]] },
  { art: 'residential-b', label: 'Residential B', length: 1640, obstacles: [[450, 2], [790, 5], [1190, 3]] },
  { art: 'destination', label: 'Destination', length: 960, door: 485, obstacles: [[300, 6]] },
  { art: 'bar', label: 'Inside', length: 960, delivery: 510 },
];
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(url));
    image.src = url;
  });
}

let backgrounds, player, cast, cargo;
let level = 0;
let x = 75;
let y = ground;
let velocity = 0;
let direction = 1;
let carrying = false;
let hits = 0;
let invincible = 0;
let mode = 'title';
let clock = 0;
let previousTime = 0;
const held = new Set();
const touches = new Map();
const pressed = new Set();
const keys = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyF: 'action' };
const active = key => held.has(key) || [...touches.values()].includes(key);
const near = point => point !== undefined && Math.abs(x - point) < 62 && y > ground - 30;

function clearInput() {
  held.clear();
  touches.clear();
  pressed.clear();
}
function showMenu(next, copy, label) {
  mode = next;
  clearInput();
  message.textContent = copy;
  start.textContent = label;
  menu.hidden = false;
}
function play() {
  mode = 'play';
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
  x = 75;
  y = ground;
  velocity = 0;
  direction = 1;
  invincible = 0;
}
start.disabled = true;
start.onclick = () => {
  if (mode !== 'paused') {
    carrying = false;
    hits = 0;
    enter(0);
  }
  play();
};
pause.onclick = togglePause;

window.addEventListener('keydown', event => {
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
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', event => {
    if (mode !== 'play') return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, button.dataset.key);
    pressed.add(button.dataset.key);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(event, pointer => touches.delete(pointer.pointerId));
  }
}

function obstacleY(kind) {
  return kind === 3 ? ground - 70 + Math.sin(clock * 4) * 15 : ground;
}
function update(dt) {
  clock += dt;
  const scene = route[level];
  const move = Number(active('right')) - Number(active('left'));
  if (move) direction = move;
  x = Math.max(18, Math.min(scene.length + 24, x + move * (carrying ? 243 : 272) * dt));
  if (pressed.has('jump') && y === ground) velocity = -520;
  velocity += 1280 * dt;
  y = Math.min(ground, y + velocity * dt);
  if (y === ground) velocity = 0;
  invincible = Math.max(0, invincible - dt);
  for (const [position, kind] of scene.obstacles ?? []) {
    const feet = obstacleY(kind);
    if (!invincible && Math.abs(x - position) < 33 && y > feet - 55 && y - 65 < feet) {
      hits += 1;
      invincible = 1.1;
      x = Math.max(18, x - 45);
    }
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
    else x = scene.length - 16;
  }
  pressed.clear();
}

function draw() {
  const scene = route[level];
  const camera = Math.min(scene.length - width, Math.max(0, x - width * 0.4));
  ctx.drawImage(backgrounds[level], -camera, 0, scene.length, height);
  const position = scene.pickup ?? scene.door ?? scene.delivery;
  const prompt = scene.pickup !== undefined
    ? (carrying ? '' : 'Pick up beer')
    : scene.door !== undefined ? 'Enter building' : scene.delivery !== undefined ? 'Deliver beer' : '';
  if (scene.pickup !== undefined && !carrying) {
    ctx.drawImage(cargo, scene.pickup - camera - 47, ground - 86, 94, 86);
  }
  if (prompt) {
    ctx.fillStyle = '#092038';
    ctx.fillRect(position - camera - 74, ground - 125, 148, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, position - camera, ground - 107);
  }
  const cellWidth = cast.width / 4;
  const cellHeight = cast.height / 2;
  for (const [position, kind] of scene.obstacles ?? []) {
    const size = kind === 3 ? 72 : 86;
    ctx.drawImage(cast, (kind % 4) * cellWidth, Math.floor(kind / 4) * cellHeight,
      cellWidth, cellHeight, position - camera - size / 2, obstacleY(kind) - size, size, size);
  }
  const moving = active('left') || active('right');
  const frame = y < ground ? (velocity < 0 ? 4 : 5) : moving ? 1 + Math.floor(clock * 10) % 3 : 0;
  ctx.save();
  ctx.translate(x - camera, y);
  ctx.scale(direction, 1);
  if (invincible && Math.floor(clock * 14) % 2) ctx.globalAlpha = 0.45;
  ctx.drawImage(player, frame * 362, 0, 362, 724, -27, -84, 54, 108);
  ctx.restore();
  if (carrying) ctx.drawImage(cargo, x - camera - 39, y - 141, 78, 71);
  const hint = prompt && near(position) ? ` · F / Action: ${prompt}` : '';
  const line = `${scene.label} · ${level + 1}/${route.length} · Bumps: ${hits}${hint}`;
  if (status.textContent !== line) status.textContent = line;
}
function frame(time) {
  const dt = Math.min(0.033, (time - previousTime) / 1000);
  previousTime = time;
  if (mode === 'play') update(dt);
  draw();
  requestAnimationFrame(frame);
}

try {
  [backgrounds, player, cast, cargo] = await Promise.all([
    Promise.all(route.map(scene => loadImage(`${pack}/backdrops/${scene.art}.png`))),
    loadImage(`${pack}/sprites/lil-g.png`),
    loadImage('./assets/obstacles/obstacle-cast.png'),
    loadImage('./docs/references/great-monkey-beer-run/beer-cargo/mixed-beer-stack.png'),
  ]);
  start.disabled = false;
  requestAnimationFrame(frame);
} catch (error) {
  message.textContent = `Could not load game art: ${error.message}`;
}
