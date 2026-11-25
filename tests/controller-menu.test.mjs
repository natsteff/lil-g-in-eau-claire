import assert from 'node:assert/strict';
import { createControllerMenu } from '../src/controller-menu.mjs';
globalThis.Event ??= class Event { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } };
const document = { activeElement: null };
let closes = 0, shareClicks = 0, restarts = 0;
function element(tagName, extra = {}) {
  return { tagName, hidden: false, visible: true,
    matches() { return Boolean(this.disabled); },
    getClientRects() { return this.visible ? [{}] : []; },
    closest(selector) {
      const details = this.details;
      if (!details) return null;
      return (selector === 'details[open]' ? details.open : !details.open) ? details : null;
    },
    focus() { document.activeElement = this; }, scrollIntoView() {}, click() {}, ...extra };
}
function disclosure(children) {
  const details = { open: false, children,
    contains(element) { return element === this.summary || children.includes(element); },
    querySelector() { return this.summary; } };
  details.summary = element('SUMMARY', { details, parentElement: details,
    click() { details.open = !details.open; } });
  for (const child of children) child.details = details;
  return details;
}
const first = element('BUTTON');
const shareGame = element('BUTTON', { click() { shareClicks++; } });
const shareTrack = element('BUTTON', { click() { shareClicks++; } });
const share = disclosure([shareGame, shareTrack]);
const options = [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }];
const events = [];
const select = element('SELECT', { options, value: 'a',
  get selectedOptions() { return options.filter(o => o.value === this.value); },
  dispatchEvent(event) { events.push(event.type); } });
let rangeValue = 2;
const range = element('INPUT', { type: 'range', stepUp() { rangeValue++; }, stepDown() { rangeValue--; },
  dispatchEvent(event) { events.push(event.type); } });
const checkbox = element('INPUT', { type: 'checkbox', checked: false, click() { this.checked = !this.checked; } });
const section = disclosure([checkbox]);
const restart = element('BUTTON', { click() { restarts++; } });
const controls = [first, element('BUTTON', { disabled: true }), element('BUTTON', { visible: false }),
  share.summary, shareGame, shareTrack, select, range, section.summary, checkbox, restart];
const dialog = { ownerDocument: document, classList: { add() {} },
  querySelectorAll: () => controls, querySelector: () => share, close() { closes++; } };
const menu = createControllerMenu(dialog);
menu.focusFirst();
menu.handle({ down: true }, 0);
assert.equal(document.activeElement, share.summary);
assert(!share.open, 'navigating to Share must not open it');
menu.handle({}, 1);
menu.handle({ right: true }, 2);
assert.equal(document.activeElement, select, 'Right skips closed Share options');
assert(!share.open);
menu.handle({}, 3);
menu.handle({ up: true }, 4);
menu.handle({ confirm: true }, 5);
assert(share.open);
assert.equal(document.activeElement, shareGame);
menu.handle({ back: true }, 6);
assert(!share.open);
assert.equal(document.activeElement, share.summary);
assert.equal(closes, 0, 'Back closes Share before the game menu');
menu.handle({ confirm: true }, 7);
menu.handle({ down: true }, 8);
assert.equal(document.activeElement, shareTrack);
menu.handle({}, 9);
menu.handle({ down: true }, 10);
assert.equal(document.activeElement, select);
assert(!share.open, 'leaving Share closes its overlay');
assert.equal(shareClicks, 0, 'navigation must not share anything');
menu.handle({}, 11);
menu.handle({ right: true }, 12);
assert.equal(select.value, 'b');
assert.deepEqual(events.slice(-2), ['input', 'change']);
menu.handle({}, 13);
range.focus();
menu.handle({ left: true }, 14);
assert.equal(rangeValue, 1);
section.summary.focus();
menu.handle({ confirm: true }, 15);
assert.equal(document.activeElement, checkbox);
menu.handle({ confirm: true }, 16);
assert(checkbox.checked);
menu.handle({ back: true }, 17);
assert(!section.open);
menu.handle({ back: true }, 18);
assert.equal(closes, 1);
menu.focusFirst(restart);
assert.equal(restarts, 0);
menu.handle({ confirm: true }, 19);
assert.equal(restarts, 1, 'restart requires explicit confirmation');
menu.focusFirst();
menu.handle({ down: true }, 100);
assert.equal(document.activeElement, share.summary);
menu.handle({ down: true }, 200);
assert.equal(document.activeElement, share.summary);
menu.handle({ down: true }, 501);
assert.equal(document.activeElement, select, 'held navigation repeats after delay');
menu.handle({ pause: true }, 502);
assert.equal(closes, 2);
export const result = 'Share skip/open/back/leave, no accidental sharing, settings adjustment, repeat navigation and restart confirmation passed';
