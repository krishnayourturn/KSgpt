const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
playerImg.src = 'assets/player/Player.PNG';

const enemyImg = new Image();
enemyImg.src = 'assets/enemy/Enemy.PNG';

const player = { x:100, y:400, width:50, height:50, speed:5 };
const enemy = { x:600, y:400, width:50, height:50 };

const keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('startScreen').style.display = 'none';
  requestAnimationFrame(gameLoop);
});

function update() {
  if(keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
  if(keys['d'] || keys['ArrowRight']) player.x += player.speed;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
