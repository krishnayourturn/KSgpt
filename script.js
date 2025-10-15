/* ===================================================== */
/*           CONTRA-STYLE FULL GAME SCRIPT              */
/* ===================================================== */

/* ================= CANVAS SETUP ===================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

/* ================= LOAD IMAGES ===================== */
const playerImg = new Image();
playerImg.src = 'assets/player/Player.PNG'; // transparent player

const enemyImg = new Image();
enemyImg.src = 'assets/enemy/Enemy.PNG';

const bgImg = new Image();
bgImg.src = 'assets/screens/38B6D2B8-11A7-481F-8DAA-246E6F467D16.png';

/* ================= AUDIO ELEMENTS =================== */
const bgMusic = document.getElementById('bgMusic');
const shootSound = document.getElementById('shootSound');
const enemyHitSound = document.getElementById('enemyHitSound');

/* ================= PLAYER SETUP ===================== */
const player = {
    x: 100,
    y: 400,
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

/* ================= ENEMY CLASS ====================== */
class Enemy {
    constructor(xStart, xEnd) {
        this.xStart = xStart;
        this.xEnd = xEnd;
        this.x = xStart + Math.random() * (xEnd - xStart - 50);
        this.y = 400;
        this.width = 50;
        this.height = 50;
        this.bullets = [];
        this.cooldown = 0;
        this.direction = Math.random() < 0.5 ? -1 : 1; // patrol direction
        this.speed = 1.5;
    }

    update() {
        // patrol movement
        this.x += this.speed * this.direction;
        if (this.x < this.xStart) this.direction = 1;
        if (this.x + this.width > this.xEnd) this.direction = -1;

        // detection radius
        if (Math.abs(player.x - this.x) < 250) {
            if (this.cooldown <= 0) {
                this.bullets.push({
                    x: this.x,
                    y: this.y + this.height / 2,
                    width: 8,
                    height: 8,
                    speed: player.x < this.x ? -5 : 5
                });
                this.cooldown = 80;
            }
        }
        this.cooldown--;

        // update enemy bullets
        this.bullets.forEach((b, i) => {
            b.x += b.speed;
            // collision with player
            if (b.x < player.x + player.width && b.x + b.width > player.x &&
                b.y < player.y + player.height && b.y + b.height > player.y) {
                player.health--;
                this.bullets.splice(i, 1);
            }
            // remove bullet offscreen
            if (b.x < worldOffsetX || b.x > worldOffsetX + WIDTH) this.bullets.splice(i, 1);
        });
    }

    draw(offsetX) {
        ctx.drawImage(enemyImg, this.x - offsetX, this.y, this.width, this.height);
        this.bullets.forEach(b => {
            ctx.fillStyle = 'red';
            ctx.fillRect(b.x - offsetX, b.y, b.width, b.height);
        });
    }
}

/* ================= ENEMY ZONES ====================== */
let enemies = [];
let enemyZones = [
    {xStart: 600, xEnd: 900, spawned: false},
    {xStart: 1200, xEnd: 1600, spawned: false},
    {xStart: 2000, xEnd: 2400, spawned: false},
    {xStart: 3000, xEnd: 3400, spawned: false}
];

/* ================= WORLD ============================ */
let worldOffsetX = 0;
let score = 0;
let level = 1;

/* ================= CONTROLS ========================= */
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

/* ================= MOBILE BUTTON SUPPORT ============ */
document.getElementById('leftBtn').addEventListener('touchstart', ()=>keys['ArrowLeft']=true);
document.getElementById('leftBtn').addEventListener('touchend', ()=>keys['ArrowLeft']=false);
document.getElementById('rightBtn').addEventListener('touchstart', ()=>keys['ArrowRight']=true);
document.getElementById('rightBtn').addEventListener('touchend', ()=>keys['ArrowRight']=false);
document.getElementById('jumpBtn').addEventListener('touchstart', ()=>keys['ArrowUp']=true);
document.getElementById('jumpBtn').addEventListener('touchend', ()=>keys['ArrowUp']=false);
document.getElementById('fireBtn').addEventListener('touchstart', ()=>keys[' ']=true);
document.getElementById('fireBtn').addEventListener('touchend', ()=>keys[' ']=false);

/* ================= PLAYER BULLET CLASS ================= */
class Bullet {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.speed = speed;
    }

    update() { this.x += this.speed; }

    draw(offsetX) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x - offsetX, this.y, this.width, this.height);
    }
}

/* ================= SPAWN ENEMIES ==================== */
function spawnEnemies() {
    enemyZones.forEach(z => {
        if (worldOffsetX + WIDTH > z.xStart && !z.spawned) {
            let count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) enemies.push(new Enemy(z.xStart, z.xEnd));
            z.spawned = true;
        }
    });
}

/* ================= UPDATE FUNCTION ================== */
function update() {
    // player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // world scrolling
    if (player.x >= WIDTH / 2) worldOffsetX += player.speed;

    // gravity & jump
    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y + player.height >= HEIGHT - 20) {
        player.y = HEIGHT - 20 - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    if ((keys['ArrowUp'] || keys['w']) && player.onGround) {
        player.dy = -player.jumpForce;
        player.onGround = false;
    }

    // shooting
    if (keys[' '] && Date.now() - player.lastShot > 300) {
        player.bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2, 8));
        player.lastShot = Date.now();
        shootSound.play();
    }

    // update bullets
    player.bullets.forEach((b, i) => {
        b.update();
        if (b.x > worldOffsetX + WIDTH) player.bullets.splice(i, 1);
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.width && b.x + b.width > e.x &&
                b.y < e.y + e.height && b.y + b.height > e.y) {
                enemies.splice(ei, 1);
                player.bullets.splice(i, 1);
                score += 10;
                enemyHitSound.play();
            }
        });
    });

    // update enemies
    enemies.forEach(e => e.update());

    // spawn new enemies
    spawnEnemies();

    // game over check
    if (player.health <= 0) {
        alert('Game Over! Final Score: ' + score);
        location.reload();
    }
}

/* ================= DRAW FUNCTION ==================== */
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // draw background
    ctx.drawImage(bgImg, -worldOffsetX, 0, WIDTH, HEIGHT);
    ctx.drawImage(bgImg, -worldOffsetX + WIDTH, 0, WIDTH, HEIGHT);

    // draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // draw bullets
    player.bullets.forEach(b => b.draw(worldOffsetX));

    // draw enemies
    enemies.forEach(e => e.draw(worldOffsetX));

    // update HUD
    document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    document.getElementById('healthDisplay').innerText = `Health: ${player.health}`;
    document.getElementById('levelDisplay').innerText = `Level: ${level}`;
}

/* ================= GAME LOOP ======================== */
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

/* ================= START GAME ======================= */
window.onload = () => {
    bgMusic.play().catch(()=>{console.log('Autoplay blocked, click Select button to start music.')});
    gameLoop();
};
