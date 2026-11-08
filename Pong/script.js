const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const cpuScoreEl = document.getElementById('cpuScore');
const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_W = 14;
const PADDLE_H = 112;
const BALL_R = 10;
const WINNING_SCORE = 5;
const keys = new Set();

const player = { x: 28, y: (HEIGHT - PADDLE_H) / 2, score: 0 };
const cpu = { x: WIDTH - 42, y: (HEIGHT - PADDLE_H) / 2, score: 0 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, vx: 5, vy: 2, speed: 6 };
let running = false;
let finished = false;
let activePointerId = null;

function resetBall(direction = Math.random() < 0.5 ? -1 : 1) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 6;
  const angle = Math.random() * 0.9 - 0.45;
  ball.vx = direction * Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;
}

function updateScore() {
  playerScoreEl.textContent = String(player.score);
  cpuScoreEl.textContent = String(cpu.score);
}

function clampPaddles() {
  player.y = Math.max(0, Math.min(HEIGHT - PADDLE_H, player.y));
  cpu.y = Math.max(0, Math.min(HEIGHT - PADDLE_H, cpu.y));
}

function bounceFromPaddle(paddle, direction) {
  const offset = (ball.y - (paddle.y + PADDLE_H / 2)) / (PADDLE_H / 2);
  const angle = Math.max(-1, Math.min(1, offset)) * (Math.PI / 3);
  ball.speed = Math.min(12, ball.speed + 0.35);
  ball.vx = direction * Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;
}

function scorePoint(scorer) {
  scorer.score += 1;
  updateScore();
  if (scorer.score >= WINNING_SCORE) {
    running = false;
    finished = true;
    const winner = scorer === player ? '¡Has ganado!' : 'La CPU ha ganado.';
    statusEl.textContent = `${winner} Pulsa «Jugar otra vez» para empezar de nuevo.`;
    startBtn.textContent = 'Jugar otra vez';
    return;
  }
  statusEl.textContent = scorer === player ? '¡Punto para ti!' : 'Punto para la CPU';
  resetBall(scorer === player ? -1 : 1);
}

function update() {
  if (!running) return;
  if (keys.has('w') || keys.has('arrowup')) player.y -= 7;
  if (keys.has('s') || keys.has('arrowdown')) player.y += 7;

  const cpuTarget = ball.y - PADDLE_H / 2;
  const cpuDelta = cpuTarget - cpu.y;
  cpu.y += Math.sign(cpuDelta) * Math.min(Math.abs(cpuDelta), 4.7);
  clampPaddles();

  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.y - BALL_R <= 0 || ball.y + BALL_R >= HEIGHT) ball.vy *= -1;

  const hitPlayer = ball.vx < 0 && ball.x - BALL_R <= player.x + PADDLE_W &&
    ball.x + BALL_R >= player.x && ball.y + BALL_R >= player.y && ball.y - BALL_R <= player.y + PADDLE_H;
  const hitCpu = ball.vx > 0 && ball.x + BALL_R >= cpu.x && ball.x - BALL_R <= cpu.x + PADDLE_W &&
    ball.y + BALL_R >= cpu.y && ball.y - BALL_R <= cpu.y + PADDLE_H;

  if (hitPlayer) {
    bounceFromPaddle(player, 1);
    ball.x = player.x + PADDLE_W + BALL_R;
  } else if (hitCpu) {
    bounceFromPaddle(cpu, -1);
    ball.x = cpu.x - BALL_R;
  }

  if (ball.x + BALL_R < 0) scorePoint(cpu);
  else if (ball.x - BALL_R > WIDTH) scorePoint(player);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  for (let y = 0; y < HEIGHT; y += 22) ctx.fillRect(WIDTH / 2 - 2, y, 4, 12);
  ctx.fillStyle = '#61dafb';
  ctx.fillRect(player.x, player.y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = '#ff7f7f';
  ctx.fillRect(cpu.x, cpu.y, PADDLE_W, PADDLE_H);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = '#fdc645';
  ctx.fill();
  if (!running && !finished) {
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pulsa «Empezar partida»', WIDTH / 2, HEIGHT / 2 - 22);
  }
}

function frame() {
  update();
  draw();
  requestAnimationFrame(frame);
}

function movePlayerToPointer(event) {
  if (!running) return;

  const rect = canvas.getBoundingClientRect();
  const scaleY = HEIGHT / rect.height;
  const pointerY = (event.clientY - rect.top) * scaleY;

  player.y = pointerY - PADDLE_H / 2;
  clampPaddles();
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault();
  keys.add(key);
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  activePointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  movePlayerToPointer(event);
});
canvas.addEventListener('pointermove', (event) => {
  if (event.pointerId === activePointerId) {
    event.preventDefault();
    movePlayerToPointer(event);
  }
});
function releasePointer(event) {
  if (event.pointerId === activePointerId) activePointerId = null;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);

startBtn.addEventListener('click', () => {
  if (running) {
    running = false;
    statusEl.textContent = 'Partida pausada.';
    startBtn.textContent = 'Reanudar';
    return;
  }
  if (finished) {
    player.score = 0;
    cpu.score = 0;
    updateScore();
    finished = false;
  }
  resetBall();
  running = true;
  statusEl.textContent = '¡A jugar! Arrastra el dedo por el campo para mover la raqueta.';
  startBtn.textContent = 'Pausar partida';
});

updateScore();
resetBall();
draw();
requestAnimationFrame(frame);
