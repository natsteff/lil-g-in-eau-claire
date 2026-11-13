// One steady world-space pass; alternate the riding and pointing poses each second.
export function onewheelMotion(elapsed, width, margin) {
  const speed = 110;
  const start = width + Math.min(60, margin);
  return {
    x: start - elapsed * speed,
    vx: -speed,
    pose: Math.floor(Math.max(0, elapsed)) % 2,
    duration: (start + margin) / speed,
  };
}
