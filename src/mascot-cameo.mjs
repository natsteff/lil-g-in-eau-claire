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
