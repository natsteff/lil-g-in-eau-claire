// Copy the pack into your game's public assets directory. Call in scene.preload().
export function preloadMonkey(scene, base = 'assets/monkey-phaser-skin') {
  for (const name of ['apartment','garage','downtown','residential-a','residential-b','destination','bar'])
    scene.load.image(`monkey-${name}`, `${base}/backdrops/${name}.png`);
  scene.load.spritesheet('lil-g', `${base}/sprites/lil-g.png`, { frameWidth: 362, frameHeight: 724 });
}
// Call once after loading. Movement, collision and touch controls belong to the host game.
export function createMonkeyAnimations(scene) {
  for (const [key, frames, frameRate, repeat] of [
    ['lil-g-idle',[0],1,-1], ['lil-g-run',[1,2,3],10,-1],
    ['lil-g-jump',[4],1,0], ['lil-g-fall',[5],1,0]]) {
    if (!scene.anims.exists(key)) scene.anims.create({key, frames: frames.map(frame => ({key:'lil-g',frame})), frameRate, repeat});
  }
}
// Example visual registration: scene.add.sprite(x, floorY, 'lil-g').setOrigin(0.5, 570/724).setScale(0.25);
// Use setFlipX(true) to face left. Configure the host physics body separately.
