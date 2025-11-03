const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("start-screen");
const hud = document.getElementById("hud");
const gameArea = document.getElementById("gameArea");

const nameDisplay = document.getElementById("nameDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const crystalsDisplay = document.getElementById("crystalsDisplay");
const levelDisplay = document.getElementById("levelDisplay");

let playerName = "";
let player, platforms, crystals, exitDoor, enemies;
let gravity = 0.5;
let keys = {};
let level = 1;
let lives = 3;
let crystalsCollected = 0;
let gamePaused = false;
let animationId = null;

const levels = [
  { platforms: [[50, 450, 800, 20], [150, 350, 120, 10], [350, 300, 120, 10], [550, 250, 120, 10]] },
  { platforms: [[50, 450, 800, 20], [200, 380, 100, 10], [400, 320, 100, 10], [600, 260, 100, 10], [700, 200, 100, 10]] },
  { platforms: [[50, 450, 800, 20], [300, 400, 100, 10], [500, 340, 100, 10], [700, 280, 100, 10], [500, 200, 100, 10]] },
  { platforms: [[50, 450, 800, 20], [250, 390, 100, 10], [400, 320, 100, 10], [550, 250, 100, 10], [700, 180, 100, 10]] }
];

function startGame() {
  playerName = document.getElementById("playerName").value.trim();
  if (!playerName) {
    alert("Digite seu nome!");
    return;
  }

  startScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  gameArea.classList.remove("hidden");

  lives = 3;
  level = 1;
  crystalsCollected = 0;
  keys = {};
  nameDisplay.textContent = playerName;
  livesDisplay.textContent = lives;
  crystalsDisplay.textContent = crystalsCollected;
  levelDisplay.textContent = level;

  initLevel();

  if (animationId) cancelAnimationFrame(animationId);
  animate();
}

startBtn.addEventListener("click", startGame);

function initLevel() {
  const current = levels[level - 1];
  platforms = current.platforms.map(p => ({ x: p[0], y: p[1], w: p[2], h: p[3] }));
  crystals = platforms.slice(1).map(p => ({
    x: p.x + p.w / 2 - 10,
    y: p.y - 20,
    size: 15,
    collected: false
  }));
  exitDoor = { x: 820, y: 400, w: 20, h: 40 };

  enemies = [
    { x: 300, y: 430, w: 25, h: 25, dx: 2 },
    { x: 600, y: 430, w: 25, h: 25, dx: -2 }
  ];

  player = { x: 60, y: 400, w: 25, h: 25, dx: 0, dy: 0, speed: 4, jumping: false };
}

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function animate() {
  if (gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  updateEnemies();

  drawPlatforms();
  drawCrystals();
  drawExit();
  drawEnemies();
  drawPlayer();

  crystalsDisplay.textContent = crystalsCollected;
  levelDisplay.textContent = level;

  animationId = requestAnimationFrame(animate);
}

function updatePlayer() {
  if (keys["ArrowLeft"]) player.dx = -player.speed;
  else if (keys["ArrowRight"]) player.dx = player.speed;
  else player.dx = 0;

  if (keys["ArrowUp"] && !player.jumping) {
    player.dy = -14;
    player.jumping = true;
  }

  player.dy += gravity;
  player.x += player.dx;
  player.y += player.dy;

  // colisão com plataformas
  for (let p of platforms) {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h <= p.y + player.dy &&
      player.y + player.h + player.dy >= p.y
    ) {
      player.y = p.y - player.h;
      player.dy = 0;
      player.jumping = false;
    }
  }

  // se cair do mapa
  if (player.y > canvas.height) {
    lives--;
    livesDisplay.textContent = lives;
    if (lives <= 0) {
      endGame(false);
      return;
    } else {
      initLevel();
    }
  }

  // colisão com inimigos
  for (let e of enemies) {
    if (
      player.x < e.x + e.w &&
      player.x + player.w > e.x &&
      player.y < e.y + e.h &&
      player.y + player.h > e.y
    ) {
      lives--;
      livesDisplay.textContent = lives;
      if (lives <= 0) {
        endGame(false);
        return;
      } else {
        initLevel();
      }
    }
  }

  // coleta de cristais
  crystals.forEach(c => {
    if (!c.collected &&
      player.x < c.x + c.size &&
      player.x + player.w > c.x &&
      player.y < c.y + c.size &&
      player.y + player.h > c.y) {
      c.collected = true;
      crystalsCollected++;
    }
  });

  // vitória
  if (crystals.every(c => c.collected)) {
    ctx.fillStyle = "#33ff99";
    ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
    if (
      player.x < exitDoor.x + exitDoor.w &&
      player.x + player.w > exitDoor.x &&
      player.y < exitDoor.y + exitDoor.h &&
      player.y + player.h > exitDoor.y
    ) {
      if (level < 4) {
        level++;
        initLevel();
      } else {
        endGame(true);
        return;
      }
    }
  }
}

function updateEnemies() {
  enemies.forEach(e => {
    e.x += e.dx;
    if (e.x <= 100 || e.x + e.w >= 800) e.dx *= -1;
  });
}

function drawPlatforms() {
  ctx.fillStyle = "#444c66";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
}

function drawPlayer() {
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawEnemies() {
  ctx.fillStyle = "#ff3333";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));
}

function drawCrystals() {
  ctx.fillStyle = "#ffe066";
  crystals.forEach(c => {
    if (!c.collected) ctx.fillRect(c.x, c.y, c.size, c.size);
  });
}

function drawExit() {
  ctx.strokeStyle = "#33ff99";
  ctx.strokeRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
}

// 🧩 Mensagem de final com efeito de fade e reinício completo
function endGame(victory) {
  cancelAnimationFrame(animationId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const msg = document.createElement("div");
  msg.className = "fade-message";
  msg.textContent = victory ? "🏆 Você venceu!" : "💀 Game Over!";
  document.body.appendChild(msg);

  // mostra a mensagem (fade in)
  setTimeout(() => (msg.style.opacity = 1), 100);

  // espera 2s, depois fade out e recarrega a página
  setTimeout(() => {
    msg.style.opacity = 0;
    setTimeout(() => {
      msg.remove();
      window.location.reload();
    }, 1000);
  }, 2000);
}
