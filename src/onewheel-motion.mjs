// Screen-space motion: slow for the pointing pose, then continue left without reversing.
export function onewheelMotion(elapsed, width, margin) {
  const start = width + margin;
  const middle = width * 0.56;
  const entranceSpeed = 190;
  const gestureSpeed = 45;
  const gestureDuration = 0.9;
  const exitSpeed = 150;
  const entranceDuration = (start - middle) / entranceSpeed;
  const exitStart = middle - gestureSpeed * gestureDuration;
  const duration = entranceDuration + gestureDuration + (exitStart + margin) / exitSpeed;
  if (elapsed < entranceDuration) {
    return { x: start - elapsed * entranceSpeed, vx: -entranceSpeed, pose: 0, duration };
  }
  const gestureTime = elapsed - entranceDuration;
  if (gestureTime < gestureDuration) {
    return { x: middle - gestureTime * gestureSpeed, vx: -gestureSpeed, pose: 1, duration };
  }
  return { x: exitStart - (gestureTime - gestureDuration) * exitSpeed, vx: -exitSpeed, pose: 0, duration };
}
