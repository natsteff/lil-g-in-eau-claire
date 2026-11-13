// Screen-space choreography: the camera offset is applied by the traffic system.
export function onewheelMotion(elapsed, width, margin) {
  const start = width + margin;
  const middle = width * 0.56;
  const entranceSpeed = 190;
  const exitSpeed = 105;
  const entranceDuration = (start - middle) / entranceSpeed;
  const shuffleDuration = 6;
  const duration = entranceDuration + shuffleDuration + (middle + margin) / exitSpeed;
  if (elapsed < entranceDuration) {
    return { x: start - elapsed * entranceSpeed, vx: -entranceSpeed, duration };
  }
  const shuffleTime = elapsed - entranceDuration;
  if (shuffleTime < shuffleDuration) {
    const frequency = Math.PI * 4 / shuffleDuration;
    return {
      x: middle - 90 * Math.sin(shuffleTime * frequency),
      vx: -90 * frequency * Math.cos(shuffleTime * frequency),
      duration,
    };
  }
  return { x: middle - (shuffleTime - shuffleDuration) * exitSpeed, vx: -exitSpeed, duration };
}
