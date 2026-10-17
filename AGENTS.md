# AGENTS.md

Vanilla JS + HTML5 Canvas clone of Asteroids. No frameworks, no bundler, no dependencies.

## Verify

- No tests, lint, typecheck, or `package.json` exist — don't hunt for npm scripts.
- Only verification is manual: open `index.html` directly in a browser (works without a server), or `npx serve .` and visit `http://localhost:3000`.

## Architecture

- All game logic lives in `game.js`, loaded by `index.html` as a single classic `<script>` (not an ES module).
- Layout: input handling → utils → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, each owning its `update(dt)`/`draw()`) → module-level game state with `update()`/`draw()` → `requestAnimationFrame` loop.
- Game flow is a 3-value state machine: `state` is `'playing' | 'dead' | 'gameover'`, all branches handled in `update()`.

## Conventions & gotchas

- Canvas size is hardcoded in **two places** that must stay in sync: the `width`/`height` attributes in `index.html` and the `W`/`H` constants in `game.js`.
- Input has two mechanisms: `keys` (held state) and `justPressed`/`pressed()` (consume-on-read, single-press). New one-shot actions must use `pressed()`. Add any new key that scrolls the page to the `preventDefault` list in the `keydown` handler.
- Difficulty tuning tables `RADII`, `SPEEDS`, `POINTS` are arrays indexed by asteroid `size` (1–3; index 0 unused).
- Space is toroidal: every moving entity wraps via `wrap()` — never add manual edge checks. `dt` is clamped to 0.05 s in `loop()`.
- Comments, README, and in-game HUD strings are in Spanish — keep new code and UI text in Spanish.
- The README's feature list has drifted from the code before (it once advertised power-ups and asteroid types that didn't exist). Trust `game.js` as the source of truth, and update the README's "Características" section when adding features.
- Gameplay details (controls, scoring) are documented in `README.md`.
