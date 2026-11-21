import assert from 'node:assert/strict';
import { createControllerMenu } from '../src/controller-menu.mjs';

// Some embedded Node runners omit the browser-compatible Event global.
globalThis.Event ??= class Event {
  constructor(type, options = {}) { this.type = type; Object.assign(this, options); }
};

// Run with: node tests/controller-menu.test.mjs
const document = { activeElement: null };
let closes = 0, clicks = 0;
function element(tagName, extra = {}) {
  return { tagName, hidden: false, visible: true,
    matches() { return Boolean(this.disabled); },
    getClientRects() { return this.visible ? [{}] : []; },
    focus() { document.activeElement = this; }, scrollIntoView() {},
    click() { clicks++; }, ...extra };
}
const first = element('BUTTON');
const disabled = element('BUTTON', { disabled: true });
const hidden = element('BUTTON', { visible: false });
const options = [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }];
const events = [];
const select = element('SELECT', {
  options, value: 'a', get selectedOptions() { return options.filter(o => o.value === this.value); },
  dispatchEvent(event) { events.push(event.type); },
});
let rangeValue = 2;
const range = element('INPUT', { type: 'range', stepUp() { rangeValue++; },
  stepDown() { rangeValue--; }, dispatchEvent(event) { events.push(event.type); } });
const summary = element('SUMMARY', { parentElement: { open: false } });
const restart = element('BUTTON');
const controls = [first, disabled, hidden, select, range, summary, restart];
const dialog = { ownerDocument: document, classList: { add() {} },
  querySelectorAll: () => controls, close() { closes++; } };
const menu = createControllerMenu(dialog);
menu.focusFirst();
assert.equal(document.activeElement, first);
menu.handle({ down: true }, 0);
assert.equal(document.activeElement, select, 'skip disabled and invisible controls');
menu.handle({ down: true }, 100);
assert.equal(document.activeElement, select, 'holding does not repeat immediately');
menu.handle({ down: true }, 401);
assert.equal(document.activeElement, range, 'holding repeats after delay');
menu.handle({}, 402);
select.focus();
menu.handle({ right: true }, 410);
assert.equal(select.value, 'b');
assert.deepEqual(events.slice(-2), ['input', 'change']);
menu.handle({}, 411);
menu.handle({ right: true }, 412);
assert.equal(select.value, 'b', 'disabled option cannot be selected');
menu.handle({}, 420);
range.focus();
menu.handle({ left: true }, 421);
assert.equal(rangeValue, 1);
menu.handle({}, 430);
summary.focus();
menu.handle({ right: true }, 431);
assert.equal(summary.parentElement.open, true);
menu.focusFirst(restart);
assert.equal(document.activeElement, restart);
menu.handle({ confirm: true }, 440);
assert.equal(clicks, 1, 'restart requires an explicit confirm');
menu.handle({ back: true }, 450);
assert.equal(closes, 1);
menu.focusFirst();
menu.handle({ up: true }, 460);
assert.equal(document.activeElement, restart, 'navigation wraps');
menu.handle({ pause: true }, 470);
assert.equal(closes, 2);
export const result = 'Controller menu navigation, repeat timing, settings, explicit restart confirmation and back checks passed';
