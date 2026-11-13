// Screen-space choreography: the camera offset is applied by the traffic system.
export function onewheelMotion(elapsed, width, margin) {
  const start = width + margin;
  const middle = width * 0.56;
  const entranceSpeed = 190;
  const exitSpeed = 150;
  const entranceDuration = (start - middle) / entranceSpeed;
  const stopDuration = 0.25;
  const moveDuration = 0.9;
  const duration = entranceDuration + stopDuration + moveDuration + (middle + margin) / exitSpeed;
  if (elapsed < entranceDuration) {
    return { x: start - elapsed * entranceSpeed, vx: -entranceSpeed, pose: 0, duration };
  }
  const stoppedTime = elapsed - entranceDuration;
  if (stoppedTime < stopDuration) return { x: middle, vx: 0, pose: 1, duration };
  const moveTime = stoppedTime - stopDuration;
  if (moveTime < moveDuration) {
    const frequency = Math.PI * 2 / moveDuration;
    return { x: middle - 24 * Math.sin(moveTime * frequency),
      vx: -24 * frequency * Math.cos(moveTime * frequency), pose: 1, duration };
  }
  return { x: middle - (moveTime - moveDuration) * exitSpeed, vx: -exitSpeed, pose: 0, duration };
}
