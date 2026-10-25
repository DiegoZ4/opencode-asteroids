'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Cada skin define: casco (polígono cerrado, nariz en x≈20 para que el origen
// de balas NOSE=21 siga en la punta), detalles (polilíneas internas),
// trazo/relleno/llama (colores) y llamaX/llamaW (base de la llama).
// Opcionales: escala (agranda la nave: radio de colisión, morro, llama y
// escudo se multiplican por ella) y mult (multiplica los puntos obtenidos).
const SKINS = [
  {
    id: 'clasica', nombre: 'Clásica',
    trazo: '#fff', relleno: null,
    llama: 'rgba(255, 130, 0, 0.85)', llamaX: -8, llamaW: 4,
    casco: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    detalles: [],
  },
  {
    id: 'caza', nombre: 'Caza',
    trazo: '#0ff', relleno: 'rgba(0, 255, 255, 0.08)',
    llama: 'rgba(120, 200, 255, 0.9)', llamaX: -13, llamaW: 2.5,
    casco: [[20, 0], [6, -2.5], [-4, -13], [-9, -4], [-13, -2.5],
            [-13, 2.5], [-9, 4], [-4, 13], [6, 2.5]],
    detalles: [[[4, 0], [15, 0]]],
  },
  {
    id: 'dardo', nombre: 'Dardo',
    trazo: '#f55', relleno: 'rgba(255, 85, 85, 0.08)',
    llama: 'rgba(255, 210, 70, 0.9)', llamaX: -10, llamaW: 3,
    casco: [[20, 0], [-1, -4], [-13, -7], [-9, -2],
            [-9, 2], [-13, 7], [-1, 4]],
    detalles: [[[2, -1.5], [-5, -1.5]], [[2, 1.5], [-5, 1.5]]],
  },
  {
    id: 'platillo', nombre: 'Platillo',
    trazo: '#7f7', relleno: 'rgba(127, 255, 127, 0.08)',
    llama: 'rgba(140, 255, 140, 0.9)', llamaX: -15, llamaW: 3,
    casco: [[20, 0], [16, -6], [8, -10], [-2, -10], [-10, -8], [-15, 0],
            [-10, 8], [-2, 10], [8, 10], [16, 6]],
    detalles: [[[9, -3], [13, 0], [9, 3]],
               [[-6, -4], [-2, -4]], [[-6, 4], [-2, 4]]],
  },
  {
    id: 'river', nombre: 'River',
    trazo: '#fff', relleno: 'rgba(255, 255, 255, 0.85)',
    // Banda roja diagonal (camiseta de River), recortada al casco por drawHull
    franja: [[-19, -8], [-12, -14], [26, 10], [18, 18]], franjaColor: '#e11',
    llama: 'rgba(255, 0, 0, 0.9)', llamaX: -8, llamaW: 4,
    casco: [[20, 0], [-12, -10], [-7, 0], [-12, 10]],
    detalles: [],
    escala: 2,   // el doble de grande que el resto de naves
    mult: 2,     // el doble de puntos con ella
  },
];

const SKIN_KEY = 'asteroids.skin';

function loadSkin() {
  try {
    const id = localStorage.getItem(SKIN_KEY);
    const i = SKINS.findIndex(s => s.id === id);
    return i >= 0 ? i : 0;
  } catch { return 0; }   // file:// puede bloquear localStorage
}

function selectSkin(i) {
  skinIndex = wrap(i, SKINS.length);
  try { localStorage.setItem(SKIN_KEY, SKINS[skinIndex].id); } catch {}
}

let skinIndex = loadSkin();

// Escala y multiplicador de puntos de la skin activa (1 por defecto)
const skinEscala = () => SKINS[skinIndex].escala || 1;
const skinMult   = () => SKINS[skinIndex].mult   || 1;

// Dibuja el casco de una skin (con relleno tenue opcional) a la escala dada.
// El llamador fija translate/rotate/lineWidth/lineJoin.
function drawHull(skin, escala = 1) {
  ctx.beginPath();
  ctx.moveTo(skin.casco[0][0] * escala, skin.casco[0][1] * escala);
  for (let i = 1; i < skin.casco.length; i++)
    ctx.lineTo(skin.casco[i][0] * escala, skin.casco[i][1] * escala);
  ctx.closePath();

  if (skin.relleno) {
    ctx.fillStyle = skin.relleno;
    ctx.fill();
  }
  ctx.strokeStyle = skin.trazo;
  ctx.stroke();

  // Franja cerrada recortada al casco (la banda roja de River)
  if (skin.franja) {
    ctx.save();
    ctx.clip();   // el path del casco sigue siendo el path actual
    ctx.beginPath();
    ctx.moveTo(skin.franja[0][0] * escala, skin.franja[0][1] * escala);
    for (let i = 1; i < skin.franja.length; i++)
      ctx.lineTo(skin.franja[i][0] * escala, skin.franja[i][1] * escala);
    ctx.closePath();
    ctx.fillStyle = skin.franjaColor;
    ctx.fill();
    ctx.restore();
  }

  for (const d of skin.detalles) {
    ctx.beginPath();
    ctx.moveTo(d[0][0] * escala, d[0][1] * escala);
    for (let i = 1; i < d.length; i++)
      ctx.lineTo(d[i][0] * escala, d[i][1] * escala);
    ctx.stroke();
  }
}

// Envergadura del casco de una skin (para las cajas del selector de naves)
function hullBBox(skin) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of skin.casco) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x0, x1, y0, y1 };
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, triple = false) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.triple = triple;   // bala disparada con el Triple: se dibuja en amarillo
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = this.triple ? '#ff0' : '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz (asteroide especial) ───────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);   // hereda radio, polígono irregular y rotación (tamaño 1)
    this.points = 0;  // no da puntos: soltar el power-up es la recompensa
    this.ttl   = 7;   // segundos antes de apagarse

    // Mucho más rápida que cualquier asteroide normal
    const angle = rand(0, Math.PI * 2);
    const speed = rand(280, 360);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    super.update(dt);   // envuelve bordes y rota como cualquier asteroide
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 8);   // estallido suave al apagarse
    }
  }

  split() { return []; }   // no se fragmenta

  draw() {
    // Parpadeo cuando está por apagarse
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.lineCap = 'round';

    // Estela degradada hacia atrás según su vector velocidad
    const tx = this.x - this.vx * 0.22;
    const ty = this.y - this.vy * 0.22;
    const grad = ctx.createLinearGradient(this.x, this.y, tx, ty);
    grad.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
    grad.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Polígono irregular heredado, en dorado
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12 * skinEscala();   // las naves grandes colisionan más lejos
    this.thrusting     = false;
    this.invincible    = 3;
    this.speedBoost    = 0;   // segundos restantes del power-up Velocidad
    this.tripleShot    = 0;   // segundos restantes del power-up Triple
    this.shield        = 0;   // segundos restantes del power-up Escudo
    this.shieldPulse   = 0;   // fase de la animación de la burbuja
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shield        > 0) {
      this.shield      -= dt;
      this.shieldPulse += dt * 4;
    }
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedBoost > 0 ? 2 : 1);  // px/s² (×2 con Velocidad)
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21 * skinEscala();   // el morro se aleja en naves grandes
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    // Triple: tres balas desde el morro que se abren en abanico
    if (this.tripleShot > 0) {
      const SPREAD = 5 * Math.PI / 180;   // ±5° por lado
      return [-SPREAD, 0, SPREAD].map(d => new Bullet(ox, oy, this.angle + d, true));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];
    const esc  = skin.escala || 1;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Casco según la skin activa (las naves con escala se dibujan más grandes)
    drawHull(skin, esc);

    // Llama del propulsor: color de la skin (más larga y cian con Velocidad activo)
    if (this.thrusting && Math.random() > 0.35) {
      const lx = skin.llamaX * esc;
      const lw = skin.llamaW * esc;
      ctx.beginPath();
      ctx.moveTo(lx, -lw);
      ctx.lineTo(lx - rand(6, 14) * esc * (this.speedBoost > 0 ? 1.8 : 1), 0);
      ctx.lineTo(lx, lw);
      ctx.strokeStyle = this.speedBoost > 0
        ? 'rgba(0, 255, 255, 0.9)'
        : skin.llama;
      ctx.stroke();
    }

    ctx.restore();

    // Burbuja del escudo (fuera de la rotación; parpadea cuando queda poco)
    if (this.shield > 0) {
      if (this.shield < 1.5 && Math.floor(this.shield * 8) % 2 === 0) return;
      const r = 26 * esc * (1 + Math.sin(this.shieldPulse) * 0.06);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups (Velocidad, Triple, Escudo) ─────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.x = x;
    this.y = y;
    this.type = type;   // 'velocidad' | 'triple' | 'escudo'
    this.radius = 10;
    this.ttl  = 10;   // segundos en pantalla
    this.pulse = rand(0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.pulse += dt * 4;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const s = 1 + Math.sin(this.pulse) * 0.12;   // pulso de escala
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);

    // Círculo contenedor (cian para Velocidad, naranja para Triple, verde para Escudo)
    ctx.strokeStyle = this.type === 'triple' ? '#f80'
                    : this.type === 'escudo' ? '#0f0' : '#0ff';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (this.type === 'triple') {
      // Tres balas paralelas
      ctx.lineCap   = 'round';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const dx of [-5, 0, 5]) {
        ctx.moveTo(dx, -6);
        ctx.lineTo(dx,  6);
      }
      ctx.stroke();
    } else if (this.type === 'escudo') {
      // Hexágono (símbolo del escudo)
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * 6;
        const py = Math.sin(a) * 6;
        if (i === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo (Velocidad)
      ctx.beginPath();
      ctx.moveTo( 2, -7);
      ctx.lineTo(-4,  1);
      ctx.lineTo(-1,  1);
      ctx.lineTo(-3,  7);
      ctx.lineTo( 4, -1);
      ctx.lineTo( 1, -1);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let powerUpTimer;        // cuenta atrás para el próximo power-up
let shootingStarTimer;   // cuenta atrás para la próxima estrella fugaz

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

const POWERUP_TYPES = ['velocidad', 'triple', 'escudo'];

let powerUpBag = [];   // tipos pendientes del ciclo actual (bolsa sin repetición)

function randomPowerUpType() {
  // Bolsa barajada: el orden de aparición es aleatorio, pero se sacan los
  // 3 tipos sin repetir antes de rellenar — ningún tipo puede tardar más
  // de 3 apariciones en salir.
  if (powerUpBag.length === 0) powerUpBag = [...POWERUP_TYPES];
  return powerUpBag.splice(randInt(0, powerUpBag.length - 1), 1)[0];
}

function spawnPowerUp() {
  // Aparece lejos de la nave para no regalarlo encima
  const SAFE_DIST = 130;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - ship.x, y - ship.y) < SAFE_DIST);
  powerUps.push(new PowerUp(x, y, randomPowerUpType()));
}

function spawnShootingStar() {
  // Va muy rápida: aparece más lejos de la nave que el power-up
  const SAFE_DIST = 200;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - ship.x, y - ship.y) < SAFE_DIST);
  asteroids.push(new ShootingStar(x, y));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  powerUpTimer = rand(12, 18);
  shootingStarTimer = rand(10, 20);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  powerUpTimer = rand(12, 18);
  shootingStarTimer = rand(10, 20);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoost = 0;   // los power-ups se pierden al morir
  ship.tripleShot = 0;
  ship.shield     = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    // Selector de nave: ◄/► cambian la skin (se aplican y guardan al momento)
    if (pressed('ArrowLeft'))  selectSkin(skinIndex - 1);
    if (pressed('ArrowRight')) selectSkin(skinIndex + 1);
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);   // p. ej. estrella fugaz apagada
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Aparición periódica del power-up (máximo uno en pantalla)
  powerUpTimer -= dt;
  if (powerUpTimer <= 0) {
    if (powerUps.length === 0) spawnPowerUp();
    powerUpTimer = rand(12, 18);
  }

  // Aparición periódica de la estrella fugaz (máximo una en pantalla)
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    if (!asteroids.some(a => a instanceof ShootingStar)) spawnShootingStar();
    shootingStarTimer = rand(10, 20);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points * skinMult();   // River (u otra skin con mult) duplica los puntos
        explode(a.x, a.y, a.size * 5);
        // La estrella fugaz suelta un power-up aleatorio (Velocidad, Triple o Escudo)
        if (a instanceof ShootingStar) powerUps.push(new PowerUp(a.x, a.y, randomPowerUpType()));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    const frag = [];
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0) {
          // El escudo destruye el asteroide al contacto (se fragmenta, sin puntos)
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
          frag.push(...a.split());
        } else {
          killShip();
          break;
        }
      }
    }
    asteroids = asteroids.filter(a => !a.dead).concat(frag);
  }

  // Nave vs power-up (recogerlo de nuevo refresca el tiempo)
  if (!ship.dead) {
    for (const pu of powerUps) {
      if (dist(ship, pu) < ship.radius + pu.radius) {
        pu.dead = true;
        if (pu.type === 'triple')      ship.tripleShot = 5;
        else if (pu.type === 'escudo') ship.shield     = 6;
        else                           ship.speedBoost = 5;
        explode(pu.x, pu.y, 10);
      }
    }
    powerUps = powerUps.filter(p => !p.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  // Las naves grandes se ven más grandes, pero acotadas para no invadir el HUD
  drawHull(SKINS[skinIndex], Math.min(0.55 * skinEscala(), 0.8));
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  // Aviso del multiplicador de puntos de la skin activa (River)
  let py = 46;
  if (skinMult() > 1) {
    ctx.fillStyle = '#f44';
    ctx.fillText(`PUNTOS ×${skinMult()}`, 14, py);
    py += 20;
  }

  // Cuenta regresiva de los power-ups activos
  if (ship.speedBoost > 0) {
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VELOCIDAD ${ship.speedBoost.toFixed(1)}s`, 14, py);
    py += 20;
  }
  if (ship.tripleShot > 0) {
    ctx.fillStyle = '#f80';
    ctx.fillText(`TRIPLE ${ship.tripleShot.toFixed(1)}s`, 14, py);
    py += 20;
  }
  if (ship.shield > 0) {
    ctx.fillStyle = '#0f0';
    ctx.fillText(`ESCUDO ${ship.shield.toFixed(1)}s`, 14, py);
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

// Selector de nave visible en Game Over: fila de vistas previas,
// ◄/► mueven la selección y Espacio reinicia con la elegida.
function drawSkinMenu() {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.font        = '16px monospace';
  ctx.fillText('◄ ►  CAMBIAR NAVE', W / 2, H / 2 + 60);

  for (let i = 0; i < SKINS.length; i++) {
    const skin = SKINS[i];
    const x   = W / 2 + (i - (SKINS.length - 1) / 2) * 130;
    const y   = H / 2 + 108;
    const sel = i === skinIndex;
    const s   = 1.4 * (skin.escala || 1);   // River se previsualiza a doble tamaño

    ctx.save();
    ctx.globalAlpha = sel ? 1 : 0.3;
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);   // apuntando hacia arriba, como los iconos de vidas
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    drawHull(skin, s);
    ctx.restore();

    ctx.font        = '13px monospace';
    ctx.fillStyle   = sel ? skin.trazo : 'rgba(255,255,255,0.3)';
    ctx.fillText(skin.nombre.toUpperCase(), x, y + 48);

    // Aviso del multiplicador de puntos de la skin (River)
    if (skin.mult > 1) {
      ctx.fillStyle = sel ? '#f55' : 'rgba(255, 85, 85, 0.3)';
      ctx.fillText(`PUNTOS ×${skin.mult}`, x, y + 64);
    }

    if (sel) {
      // Caja punteada ajustada a la envergadura real de la vista previa
      const b  = hullBBox(skin);
      const cy = y - (b.x0 + b.x1) / 2 * s;
      const hw = (b.y1 - b.y0) / 2 * s + 8;
      const hh = (b.x1 - b.x0) / 2 * s + 8;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - hw, cy - hh, hw * 2, hh * 2);
      ctx.setLineDash([]);
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  powerUps.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover') {
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
    drawSkinMenu();
  }
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
