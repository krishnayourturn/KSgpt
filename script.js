/* ==========================================================
   🌟 SCRIPT.JS — Advanced Side-Scrolling Shooter Game
   ========================================================== */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

/* ===== GAME STATE ===== */
let gameState = 'start'; // start, playing, gameover
let score = 0;
let level = 1;
let worldOffsetX = 0; // world scrolling

/* ===== PLAYER ===== */
const player = {
    x: 100,
    y: height - 100,
    width: 50,
    height: 50,
    speed: 5,
    bullets: [],
    health: 3
};

/* ===== ENEMIES ===== */
let enemies = [];
const ENEMY_WIDTH = 50;
const ENEMY_HEIGHT = 50;

/* Enemy spawn zones for advancing world */
const enemyZones = [
    { xStart: 500, xEnd: 800 },
    { xStart: 1200, xEnd: 1600 },
    { xStart: 2000, xEnd: 2500 },
    { xStart: 3000, xEnd: 3500 }
];

/* ===== BULLETS ===== */
class Bullet {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.speed = speed; // positive for right, negative for left
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/* ===== CONTROLS ===== */
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

/* ===== IMAGES ===== */
const images = {};
const imageSources = {
    player: 'assets/player/Player.PNG',
    enemy: 'assets/enemy/Enemy.PNG',
    screen: 'assets/screens/38B6D2B8-11A7-481F-8DAA-246E6F467D16.png'
};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) initGame();
    };
}

/* ===== GAME FUNCTIONS ===== */
function initGame() {
    createEnemies(); // initial enemy setup
    requestAnimationFrame(gameLoop);
}

/* ===== CREATE ENEMIES ===== */
function createEnemies() {
    enemies = [];
    enemyZones.forEach(zone => {
        const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies per zone
        for (let i = 0; i < enemyCount; i++) {
            const ex = zone.xStart + Math.random() * (zone.xEnd - zone.xStart - ENEMY_WIDTH);
            const ey = height - ENEMY_HEIGHT - 50; // ground level
            enemies.push({
                x: ex,
                y: ey,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                speed: 2 + Math.random() * 1.5,
                direction: 1, // 1: right, -1: left
                zoneStart: zone.xStart,
                zoneEnd: zone.xEnd,
                bullets: [],
                shootCooldown: Math.random() * 200 + 50
            });
        }
    });
}

/* ===== UPDATE ===== */
function update() {
    if (gameState !== 'playing') return;

    // Player movement
    if (keys['ArrowLeft'] && player.x > 50) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < width / 2) player.x += player.speed;

    // Scroll world if player moves right beyond center
    if (keys['ArrowRight'] && player.x >= width / 2) {
        worldOffsetX += player.speed;
    }

    // Player shooting
    if (keys[' ']) {
        if (!player.lastShot || Date.now() - player.lastShot > 300) {
            player.bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2, 8));
            player.lastShot = Date.now();
        }
    }

    // Update player bullets
    player.bullets.forEach((bullet, i) => {
        bullet.update();
        if (bullet.x > width + worldOffsetX) player.bullets.splice(i, 1);
    });

    // Update enemies
    enemies.forEach(enemy => {
        // Patrol in their zone
        enemy.x += enemy.speed * enemy.direction;
        if (enemy.x + ENEMY_WIDTH > enemy.zoneEnd || enemy.x < enemy.zoneStart) enemy.direction *= -1;

        // Enemy shooting
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
            enemy.bullets.push(new Bullet(enemy.x, enemy.y + enemy.height / 2, -5));
            enemy.shootCooldown = Math.random() * 200 + 50;
        }

        // Update enemy bullets
        enemy.bullets.forEach((bullet, idx) => {
            bullet.update();

            // Collision with player
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                player.health--;
                enemy.bullets.splice(idx, 1);
                if (player.health <= 0) gameState = 'gameover';
            }

            if (bullet.x < worldOffsetX - 50) enemy.bullets.splice(idx, 1);
        });
    });

    // Collision: player bullets vs enemies
    player.bullets.forEach((bullet, bIdx) => {
        enemies.forEach((enemy, eIdx) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                // Remove enemy and bullet
                enemies.splice(eIdx, 1);
                player.bullets.splice(bIdx, 1);
                score += 10;
            }
        });
    });

    // Spawn new enemies dynamically as world scrolls
    enemyZones.forEach(zone => {
        if (worldOffsetX + width > zone.xStart && !zone.spawned) {
            const enemyCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < enemyCount; i++) {
                const ex = zone.xStart + Math.random() * (zone.xEnd - zone.xStart - ENEMY_WIDTH);
                const ey = height - ENEMY_HEIGHT - 50;
                enemies.push({
                    x: ex,
                    y: ey,
                    width: ENEMY_WIDTH,
                    height: ENEMY_HEIGHT,
                    speed: 2 + Math.random() * 1.5,
                    direction: 1,
                    zoneStart: zone.xStart,
                    zoneEnd: zone.xEnd,
                    bullets: [],
                    shootCooldown: Math.random() * 200 + 50
                });
            }
            zone.spawned = true;
        }
    });
}

/* ===== DRAW ===== */
function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw background (repeat to simulate scrolling)
    ctx.drawImage(images.screen, -worldOffsetX, 0, width, height);
    ctx.drawImage(images.screen, -worldOffsetX + width, 0, width, height);

    if (gameState === 'start') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#00ffff';
        ctx.font = '50px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Start', width / 2, height / 2);
    } else if (gameState === 'playing') {
        // Draw player
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

        // Draw player bullets
        player.bullets.forEach(bullet => bullet.draw());

        // Draw enemies
        enemies.forEach(enemy => {
            ctx.drawImage(images.enemy, enemy.x - worldOffsetX, enemy.y, enemy.width, enemy.height);
            enemy.bullets.forEach(b => b.draw());
        });

        // Draw HUD
        ctx.fillStyle = '#fff';
        ctx.font = '22px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
        ctx.fillText(`Health: ${player.health}`, 20, 60);
        ctx.fillText(`Level: ${level}`, 20, 90);
    } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ff004c';
        ctx.font = '60px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Poppins';
        ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 20);
        ctx.fillStyle = '#00ffff';
        ctx.fillText('Press ENTER to Restart', width / 2, height / 2 + 70);
    }
}

/* ===== GAME LOOP ===== */
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

/* ===== START / RESTART ===== */
window.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        if (gameState === 'start' || gameState === 'gameover') {
            gameState = 'playing';
            player.x = 100;
            player.y = height - 100;
            player.health = 3;
            player.bullets = [];
            worldOffsetX = 0;
            score = 0;
            level = 1;
            enemyZones.forEach(zone => zone.spawned = false);
            createEnemies();
        }
    }
});

/* ===== LEVEL INCREASE ===== */
setInterval(() => {
    if (gameState === 'playing') {
        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel > level) {
            level = newLevel;
        }
    }
}, 1000);
