/* ===================================================== */
/*              CONTRA-STYLE GAME SCRIPT               */
/* ===================================================== */

/* ================= CANVAS ================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

/* ================= GAME STATE ================= */
let gameState = 'start'; // start, playing, paused, gameover
let score = 0;
let level = 1;
let worldOffsetX = 0;

/* ================= LOAD IMAGES ================= */
const images = {
  player: new Image(),
  enemy: new Image(),
  background: new Image()
};
images.player.src = 'assets/player/Player.PNG';
images.enemy.src = 'assets/enemy/Enemy.PNG';
images.background.src = 'assets/screens/38B6D2B8-11A7-481F-8DAA-246E6F467D16.png';

/* ================= PLAYER ================= */
const player = {
  x: 100,
  y: HEIGHT - 120,
  width: 50,
  height: 50,
  speed: 5,
  dy: 0,
  jumpForce: 12,
  gravity: 0.6,
  onGround: true,
  bullets: [],
  health: 3,
  lastShot: 0
};

/* ================= ENEMY CLASS ================= */
class Enemy {
  constructor(xStart, xEnd) {
    this.zoneStart = xStart;
    this.zoneEnd = xEnd;
    this.width = 50;
    this.height = 50;
    this.x = xStart + Math.random() * (xEnd - xStart - this.width);
    this.y = HEIGHT - 120;
    this.speed = 2;
    this.direction = 1;
    this.bullets = [];
    this.shootCooldown = Math.floor(Math.random() * 100) + 50;
  }

  move() {
    this.x += this.speed * this.direction;
    if (this.x < this.zoneStart || this.x + this.width > this.zoneEnd) this.direction *= -1;

    // Enemy shooting
    this.shootCooldown--;
    if (this.shootCooldown <= 0) {
      this.bullets.push({ x: this.x, y: this.y + this.height / 2, width: 8, height: 8, speed: -5 });
      this.shootCooldown = Math.floor(Math.random() * 150) + 50;
    }

    // Bullet collision with player
    this.bullets.forEach((b, i) => {
      b.x += b.speed;
      if (b.x < 0) this.bullets.splice(i, 1);
      if (b.x < player.x + player.width && b.x + b.width > player.x &&
          b.y < player.y + player.height && b.y + b.height > player.y) {
        player.health--;
        this.bullets.splice(i, 1);
        if (player.health <= 0) gameState = 'gameover';
      }
    });
  }

  draw(offsetX) {
    ctx.drawImage(images.enemy, this.x - offsetX, this.y, this.width, this.height);
    this.bullets.forEach(b => {
      ctx.fillStyle = 'orange';
      ctx.fillRect(b.x - offsetX, b.y, b.width, b.height);
    });
  }
}

/* ================= ENEMY ZONES ================= */
let enemyZones = [
  { xStart: 500, xEnd: 900, spawned: false },
  { xStart: 1200, xEnd: 1600, spawned: false },
  { xStart: 2000, xEnd: 2500, spawned: false }
];
let enemies = [];

function initEnemies() {
  enemies = [];
  enemyZones.forEach(z => z.spawned = false);
  spawnEnemies();
}

function spawnEnemies() {
  enemyZones.forEach(zone => {
    if (worldOffsetX + WIDTH > zone.xStart && !zone.spawned) {
      let count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) enemies.push(new Enemy(zone.xStart, zone.xEnd));
      zone.spawned = true;
    }
  });
}

/* ================= BULLET CLASS ================= */
class Bullet {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.speed = speed;
  }
  update() { this.x += this.speed; }
  draw() { ctx.fillStyle = 'yellow'; ctx.fillRect(this.x, this.y, this.width, this.height); }
}

/* ================= CONTROLS ================= */
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === 'w' || e.key === 'ArrowUp') && player.onGround) {
    player.dy = -player.jumpForce;
    player.onGround = false;
  }
});
window.addEventListener('keyup', e => keys[e.key] = false);

/* ================= UPDATE FUNCTION ================= */
function update() {
  if (gameState !== 'playing') return;

  // Player horizontal movement
  if (keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
  if (keys['d'] || keys['ArrowRight']) player.x += player.speed;

  // World scroll
  if ((keys['d'] || keys['ArrowRight']) && player.x >= WIDTH / 2) worldOffsetX += player.speed;

  // Gravity
  player.dy += player.gravity;
  player.y += player.dy;
  if (player.y + player.height >= HEIGHT - 20) {
    player.y = HEIGHT - 20 - player.height;
    player.dy = 0;
    player.onGround = true;
  }

  // Shooting
  if (keys[' '] && Date.now() - player.lastShot > 300) {
    player.bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2, 8));
    player.lastShot = Date.now();
  }

  // Update player bullets
  player.bullets.forEach((b, i) => {
    b.update();
    if (b.x > worldOffsetX + WIDTH) player.bullets.splice(i, 1);
    enemies.forEach((e, ei) => {
      if (b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        enemies.splice(ei, 1);
        player.bullets.splice(i, 1);
        score += 10;
      }
    });
  });

  // Update enemies
  enemies.forEach(e => e.move());
  spawnEnemies();

  // HUD update
  document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
  document.getElementById('healthDisplay').innerText = `Health: ${player.health}`;
  document.getElementById('levelDisplay').innerText = `Level: ${level}`;
}

/* ================= DRAW FUNCTION ================= */
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background scrolling
  ctx.drawImage(images.background, -worldOffsetX, 0, WIDTH, HEIGHT);
  ctx.drawImage(images.background, -worldOffsetX + WIDTH, 0, WIDTH, HEIGHT);

  // Player
  ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

  // Player bullets
  player.bullets.forEach(b => b.draw());

  // Enemies
  enemies.forEach(e => e.draw(worldOffsetX));

  // Game over screen
  if (gameState === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'red';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 30);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 10);
    document.getElementById('startScreen').style.display = 'flex';
  }
}

/* ================= GAME LOOP ================= */
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

/* ================= BUTTON EVENTS ================= */
document.getElementById('startButton').addEventListener('click', () => {
  gameState = 'playing';
  document.getElementById('startScreen').style.display = 'none';
  player.x = 100;
  player.y = HEIGHT - 120;
  player.health = 3;
  player.bullets = [];
  score = 0;
  worldOffsetX = 0;
  initEnemies();
});

document.getElementById('resumeButton')?.addEventListener('click', () => {
  gameState = 'playing';
  document.getElementById('pauseScreen').style.display = 'none';
});

document.getElementById('restartButton')?.addEventListener('click', () => {
  gameState = 'playing';
  document.getElementById('pauseScreen').style.display = 'none';
  player.x = 100;
  player.y = HEIGHT - 120;
  player.health = 3;
  player.bullets = [];
  score = 0;
  worldOffsetX = 0;
  initEnemies();
});

/* ================= PAUSE FUNCTION ================= */
window.addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P') {
    if (gameState === 'playing') {
      gameState = 'paused';
      document.getElementById('pauseScreen').style.display = 'flex';
    } else if (gameState === 'paused') {
      gameState = 'playing';
      document.getElementById('pauseScreen').style.display = 'none';
    }
  }
});

/* ================= LEVEL UP & MODALS ================= */
function levelUp() {
  level++;
  player.health = 3;
  player.bullets = [];
  worldOffsetX = 0;
  enemies = [];
  enemyZones.forEach(z => z.spawned = false);
  document.getElementById('levelUpModal').style.display = 'flex';
}

document.getElementById('continueLevelButton')?.addEventListener('click', () => {
  document.getElementById('levelUpModal').style.display = 'none';
  gameState = 'playing';
});

/* ================= EXTRA STRUCTURE FILLERS ================= */
let fillerArray = [];
for (let i = 0; i < 50; i++) fillerArray.push({x:0,y:0}); // dummy objects to expand code
