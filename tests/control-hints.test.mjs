import assert from 'node:assert/strict';
import { gamepadHints } from '../src/control-hints.mjs';
const normal = gamepadHints();
assert(normal.includes('Start pause/resume'));
assert(normal.includes('Y/Triangle → A/Cross restart'));
assert(normal.includes('LB sound') && normal.includes('RB next track'));
assert(gamepadHints({ swapped: true }).includes('Jump: X/Square'));
assert(gamepadHints({ menu: true }).includes('B/Circle back'));
assert(gamepadHints({ compact: true }).includes('Select menu'));
assert(!gamepadHints({ compact: true }).includes('LB'));
for (const text of [normal, gamepadHints({ menu: true }), gamepadHints({ compact: true })]) {
  assert(!/\b(?:RT|R2)\b|mascot|poke|Easter/i.test(text), 'keep the Easter egg secret');
}
export const result = 'Gamepad hints, compact/swapped labels, shortcuts and secret preservation passed';
