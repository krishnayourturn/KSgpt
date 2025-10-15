const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Load images
const playerImg = new Image();
playerImg.src = 'assets/player/Player.PNG';
const enemyImg = new Image();
enemyImg.src = 'assets/enemy/Enemy.PNG';
const bgImg = new Image();
bgImg.src = 'assets/screens/38B6D2B8-11A7-481F-8DAA-246E6F467D16.png';

// Player
const player = { x:100, y:400, width:50, height:50, speed:5, dy:0, jumpForce:12, gravity:0.6, onGround:true, bullets:[], health:3 };

// Enemies
class Enemy{
  constructor(xStart, xEnd){
    this.xStart = xStart; this.xEnd = xEnd;
    this.x = xStart + Math.random()*(xEnd-xStart-50);
    this.y = 400;
    this.width = 50; this.height = 50;
    this.bullets = []; this.cooldown=0;
  }
  update(){
    if(Math.abs(player.x-this.x)<250){ // detection radius
      if(this.cooldown<=0){
        this.bullets.push({x:this.x, y:this.y+25, width:8, height:8, speed:-5});
        this.cooldown=80;
      }
    }
    this.cooldown--;
    this.bullets.forEach((b,i)=>{
      b.x += b.speed;
      if(b.x<0) this.bullets.splice(i,1);
      if(b.x < player.x+player.width && b.x+b.width>player.x && b.y<player.y+player.height && b.y+b.height>player.y){
        player.health--;
        this.bullets.splice(i,1);
      }
    });
  }
  draw(offsetX){ ctx.drawImage(enemyImg,this.x-offsetX,this.y,this.width,this.height);
    this.bullets.forEach(b=>ctx.fillRect(b.x-offsetX,b.y,b.width,b.height));
  }
}

let enemies = [];
let enemyZones = [{xStart:600,xEnd:900,spawned:false},{xStart:1200,xEnd:1600,spawned:false}];
let worldOffsetX=0;
let score=0;

// Controls
const keys = {};
window.addEventListener('keydown', e=>keys[e.key]=true);
window.addEventListener('keyup', e=>keys[e.key]=false);

// Player bullets
class Bullet{ constructor(x,y,speed){ this.x=x;this.y=y;this.width=8;this.height=8;this.speed=speed;} update(){this.x+=this.speed;} draw(){ctx.fillStyle='yellow';ctx.fillRect(this.x,this.y,this.width,this.height);}}

// Spawn enemies as player moves
function spawnEnemies(){
  enemyZones.forEach(z=>{
    if(worldOffsetX+WIDTH>z.xStart && !z.spawned){
      let count = Math.floor(Math.random()*2)+1;
      for(let i=0;i<count;i++) enemies.push(new Enemy(z.xStart,z.xEnd));
      z.spawned=true;
    }
  });
}

// Update function
function update(){
  // player left/right
  if(keys['a']) player.x-=player.speed;
  if(keys['d']) player.x+=player.speed;
  if(player.x>=WIDTH/2) worldOffsetX+=player.speed;

  // gravity
  player.dy+=player.gravity;
  player.y+=player.dy;
  if(player.y+player.height>=HEIGHT-20){ player.y=HEIGHT-20-player.height; player.dy=0; player.onGround=true;}

  // jump
  if((keys['w'] || keys['ArrowUp']) && player.onGround){ player.dy=-player.jumpForce; player.onGround=false;}

  // shoot
  if(keys[' ']){
    if(!player.lastShot || Date.now()-player.lastShot>300){
      player.bullets.push(new Bullet(player.x+player.width,player.y+25,8));
      player.lastShot=Date.now();
    }
  }

  // update bullets
  player.bullets.forEach((b,i)=>{
    b.update();
    if(b.x>worldOffsetX+WIDTH) player.bullets.splice(i,1);
    enemies.forEach((e,ei)=>{
      if(b.x<e.x+e.width && b.x+b.width>e.x && b.y<e.y+e.height && b.y+b.height>e.y){
        enemies.splice(ei,1);
        player.bullets.splice(i,1);
        score+=10;
      }
    });
  });

  // update enemies
  enemies.forEach(e=>e.update());
  spawnEnemies();
}

// Draw function
function draw(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  // background
  ctx.drawImage(bgImg,-worldOffsetX,0,WIDTH,HEIGHT);
  ctx.drawImage(bgImg,-worldOffsetX+WIDTH,0,WIDTH,HEIGHT);
  // player
  ctx.drawImage(playerImg,player.x,player.y,player.width,player.height);
  // bullets
  player.bullets.forEach(b=>b.draw());
  // enemies
  enemies.forEach(e=>e.draw(worldOffsetX));
  // HUD
  document.getElementById('hud').innerText=`Score: ${score} | Health: ${player.health}`;
}

// game loop
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
