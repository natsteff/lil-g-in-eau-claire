export function neutralState(pad) {
  return { axes: Array.from(pad.axes), buttons: pad.buttons.map(() => false) };
}
export function atNeutral(pad, neutral) {
  return pad.buttons.every(button => !button.pressed)
    && neutral.axes.every((value, index) => Math.abs((pad.axes[index] ?? value) - value) < 0.15);
}
export function detectDirection(pad, neutral) {
  const button = pad.buttons.findIndex((button, index) => button.pressed && !neutral.buttons[index]);
  if (button >= 0) return { type: 'button', index: button };
  let index = -1, change = 0.2;
  pad.axes.forEach((value, axis) => {
    const delta = Math.abs(value - (neutral.axes[axis] ?? value));
    if (Number.isFinite(value) && delta > change) { index = axis; change = delta; }
  });
  if (index < 0) return null;
  const value = pad.axes[index];
  // Centered axes use a sign; hat switches and other non-centered inputs use an exact value.
  if (Math.abs(neutral.axes[index]) < 0.2) {
    return Math.abs(value) > 0.5 ? { type: 'axis', index, sign: Math.sign(value) } : null;
  }
  return { type: 'value', index, value };
}
export function readDirections(pad, deadzone, profile) {
  const down = index => Boolean(pad?.buttons[index]?.pressed);
  function bound(binding) {
    if (!binding || !pad) return false;
    if (binding.type === 'button') return down(binding.index);
    const value = pad.axes[binding.index];
    if (!Number.isFinite(value)) return false;
    if (binding.type === 'axis') return value * binding.sign > deadzone;
    return binding.type === 'value' && Math.abs(value - binding.value) < 0.1;
  }
  if (profile && profile.id === pad?.id) {
    return Object.fromEntries(['left', 'right', 'up', 'down'].map(key => [key, bound(profile.bindings?.[key])]));
  }
  const axis = pad?.axes[0] ?? 0, vertical = pad?.axes[1] ?? 0;
  // Hat-switch neutral values outside [-1,1] must never become phantom stick movement.
  const horizontalValid = Math.abs(axis) <= 1, verticalValid = Math.abs(vertical) <= 1;
  return {
    left: down(14) || (horizontalValid && axis < -deadzone),
    right: down(15) || (horizontalValid && axis > deadzone),
    up: down(12) || (verticalValid && vertical < -deadzone),
    down: down(13) || (verticalValid && vertical > deadzone),
  };
}

export function chooseGamepad(pads, preferredId = '') {
  const connected = Array.from(pads ?? []).filter(pad => pad?.connected);
  // An explicit selection must never silently fall back to a different device.
  if (preferredId) return connected.find(pad => pad.id === preferredId);
  return connected.find(pad => pad.mapping === 'standard') ?? connected[0];
}
