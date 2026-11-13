// Enter, greet for one second, show the back while leaving, then wait two seconds.
export function mascotCameo(elapsed, width) {
  const entrance = 0.7, greeting = 1, departure = 0.7, wait = 2;
  const phase = Math.max(0, elapsed) % (entrance + greeting + departure + wait);
  const outside = width + 65, inside = width * 0.85;
  if (phase < entrance) return { x: outside + (inside - outside) * phase / entrance, back: false, running: true };
  if (phase < entrance + greeting) return { x: inside, back: false, running: false };
  if (phase < entrance + greeting + departure) return {
    x: inside + (outside - inside) * (phase - entrance - greeting) / departure, back: true, running: true,
  };
  return null;
}

export function mascotSprite(elapsed, width, height, aspect) {
  const cameo = mascotCameo(elapsed, width);
  if (!cameo) return null;
  const size = 78;
  const bounce = cameo.running ? Math.abs(Math.sin(elapsed * 22)) * 6 : Math.sin(elapsed * 5) * 1.5;
  return { ...cameo, y: height * 0.76 - bounce, width: size * aspect, height: size,
    angle: cameo.running ? Math.sin(elapsed * 22) * 0.12 : 0 };
}

export function hitMascot(sprite, clientX, clientY, bounds, width, height) {
  if (!sprite || bounds.width <= 0 || bounds.height <= 0) return false;
  // Canvas uses object-fit: contain in landscape/fullscreen layouts.
  const scale = Math.min(bounds.width / width, bounds.height / height);
  const x = (clientX - bounds.left - (bounds.width - width * scale) / 2) / scale - sprite.x;
  const y = (clientY - bounds.top - (bounds.height - height * scale) / 2) / scale - sprite.y;
  const localX = x * Math.cos(sprite.angle) + y * Math.sin(sprite.angle);
  const localY = -x * Math.sin(sprite.angle) + y * Math.cos(sprite.angle);
  return Math.abs(localX) <= sprite.width / 2 + 5 && localY >= -sprite.height - 5 && localY <= 5;
}
