import assert from 'node:assert/strict';
import { loadImage } from '../src/load-image.mjs';
let sources = [], failures = 0, delays = [];
class FakeImage {
  set src(value) {
    sources.push(value);
    queueMicrotask(() => failures-- > 0 ? this.onerror() : this.onload());
  }
}
const options = { ImageClass: FakeImage, base: 'https://example.com/game/?fullscreen=1&controller=1',
  wait: async ms => delays.push(ms), now: () => 123 };
const path = './assets/obstacles/lifted-black-pickup.png';
assert(await loadImage(path, options) instanceof FakeImage);
assert.deepEqual(sources, [path]);
sources = []; failures = 2;
assert(await loadImage(path, options) instanceof FakeImage);
assert.equal(sources.length, 3);
assert.equal(new URL(sources[1]).pathname, '/game/assets/obstacles/lifted-black-pickup.png');
assert.equal(new URL(sources[1]).searchParams.get('_artRetry'), '123-1');
assert.notEqual(sources[1], sources[2]);
assert.deepEqual(delays, [400, 800]);
sources = []; failures = 5;
await assert.rejects(loadImage(path, options), error => error.message === path);
assert.equal(sources.length, 3, 'permanent failures stop retrying');
export const result = 'Image success, transient recovery, fresh retry URLs, fullscreen URL resolution and bounded permanent failure passed';
