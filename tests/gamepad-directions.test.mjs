import assert from 'node:assert/strict';
import { neutralState, atNeutral, detectDirection, readDirections, chooseGamepad } from '../src/gamepad-directions.mjs';
const makePad = (axes, count = 16) => ({ id: 'USB NES pad', axes,
  buttons: Array.from({ length: count }, () => ({ pressed: false })) });
const standard = makePad([0, 0]);
assert(!Object.values(readDirections(standard, 0.25)).some(Boolean));
standard.buttons[14].pressed = true;
assert(readDirections(standard, 0.25).left);
standard.buttons[14].pressed = false;
standard.axes[0] = 0.5;
assert(readDirections(standard, 0.25).right);
standard.axes[0] = 0.1;
assert(!readDirections(standard, 0.25).right);
const raw = makePad([0, 0, 0, 0, 0, 0, 0, 0, 0, 3.2857], 4);
const neutral = neutralState(raw);
const bindings = {};
// A hat-switch on an alternate axis: up/right/down/left are encoded on one axis.
for (const [direction, value] of [['left', 0.7143], ['right', -0.4286], ['up', -1], ['down', 0.1429]]) {
  raw.axes[9] = value;
  bindings[direction] = detectDirection(raw, neutral);
  assert.equal(bindings[direction].type, 'value');
  assert(!atNeutral(raw, neutral));
  raw.axes[9] = neutral.axes[9];
  assert(atNeutral(raw, neutral));
}
const profile = JSON.parse(JSON.stringify({ id: raw.id, bindings }));
for (const [direction, binding] of Object.entries(bindings)) {
  raw.axes[9] = binding.value;
  assert.deepEqual(Object.entries(readDirections(raw, 0.25, profile)).filter(([, active]) => active).map(([key]) => key), [direction]);
}
raw.axes[9] = neutral.axes[9];
assert(!Object.values(readDirections(raw, 0.25, profile)).some(Boolean));
const axesPad = makePad([0, 0], 4);
const axesNeutral = neutralState(axesPad);
axesPad.axes[0] = -1;
assert.deepEqual(detectDirection(axesPad, axesNeutral), { type: 'axis', index: 0, sign: -1 });
axesPad.axes[0] = 0;
axesPad.buttons[2].pressed = true;
assert.deepEqual(detectDirection(axesPad, axesNeutral), { type: 'button', index: 2 });
assert(!atNeutral(axesPad, axesNeutral));
assert(!readDirections(null, 0.25).left);
const badHat = makePad([3.2857, 3.2857]);
assert(!Object.values(readDirections(badHat, 0.25)).some(Boolean), 'hat neutral cannot cause phantom movement');
axesPad.id = 'other device';
axesPad.axes[0] = 0.7;
assert(readDirections(axesPad, 0.25, profile).right, 'profiles are isolated by controller ID');
export const result = 'Standard D-pad/stick, raw buttons, alternate hat axis, calibration capture/release, saved profiles, dead zone and neutral checks passed';

const modern = { id: 'GamePad-1', connected: true, mapping: 'standard' };
const nes = { id: 'USB Gamepad', connected: true, mapping: '' };
assert.equal(chooseGamepad([null, nes, modern]), modern);
assert.equal(chooseGamepad([modern, nes], nes.id), nes);
assert.equal(chooseGamepad([modern], nes.id), undefined, 'never switch silently to another controller');
assert.equal(chooseGamepad([nes]), nes);
