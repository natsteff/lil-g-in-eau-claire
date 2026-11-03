# Great Monkey Beer Run → Phaser skin assets

Local handoff for Seth Happens. Seven original backdrops, a transparent six-frame Lil’ G sheet, and individual registered frames. No destination repository changes or publication performed.

## Backdrops

Scene order: apartment → garage → downtown → residential-a + residential-b → destination (3rd & Vine) → bar. Originals are copied byte-for-byte at full resolution. Residential images form two consecutive blocks; they are not seamless repeating tiles.

Godot placement reference (1280-wide viewport): all backgrounds start at y=112 and render 480 high. Apartment, garage, destination and bar render 1280 wide; downtown 2700 wide; residential blocks 1650 wide each. These are reference world dimensions, not recommended mobile screen sizes. Adapt camera/viewport and preserve host touch UI safe areas.

These are flattened illustrations. Godot adds foreground masks, lamps, plants, benches, shadows, signs, collision and UI at runtime; those are not contained in these PNGs. Do not derive collision automatically from image edges. Existing garage mountain scenery remains in the source artwork.

## Lil’ G

`sprites/lil-g.png`: 2172 × 724 RGBA, six horizontal 362 × 724 cells. Frames: idle 0, run 1–3 at 10 fps, rising jump 4, falling 5. Individual PNGs retain identical cell size and registration. Face left by horizontal flip. This is the current provisional six-pose artwork, not a newly polished animation set.

Magenta transparency is baked using the exact existing Godot shader formula: alpha *= 1 - smoothstep(0.35, 0.65, min(r,b)-g). No new art or guessed silhouette was introduced. Existing edge coloration/pose variation may remain. Source filename `gunther.png` is exported under Lil’ G’s ordinary name.

Original sprite scale is 0.25 with cell top-left offset (-45.25,-142.5) from the actor's feet. Equivalent Phaser origin is (0.5,570/724). Apartment actor scale multiplier is 1.28; downtown/residential 0.78; destination changes with depth. Physics must be registered separately: original actor capsule is 34 wide × 76 high, centered 38 above feet before scene multiplier.

See `phaser-example.js` for preload/animation helpers. Integration has not been run inside Seth Happens. Browser install/home-screen behavior and custom mobile controls remain host-game responsibilities.

`manifest.json` records SHA-256 hashes for asset verification. `extract.gd` reproduces sprite extraction from this project's Godot assets with headless Godot and --mute. No local work tracking records are included in this pack.
