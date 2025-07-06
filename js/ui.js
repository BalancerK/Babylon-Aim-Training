import { handleMouseSettings } from './camera.js';

export function attachPointerEvents(scene, camera, canvas) {
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", () => {
    canvas.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
      instructions.style.display = "none";
      scene.activeCamera.attachControl(canvas);
      camera.angularSensibility = parseFloat(document.getElementById("mouseSensitivity").value);
    } else {
      instructions.style.display = "flex";
      scene.activeCamera.detachControl();
    }
  });
}

export function setupUI() {
  setupHUD();
  setupInstructions();
}

export function setupHUD() {
  if (document.getElementById('hud')) return;

  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.style.position = 'absolute';
  hud.style.top = '10px';
  hud.style.left = '50%';
  hud.style.transform = 'translateX(-50%)';
  hud.style.color = '#00FF99';
  hud.style.fontSize = '22px';
  hud.style.fontFamily = 'Consolas, monospace';
  hud.style.textShadow = '0 0 5px #00FF99';
  hud.style.textAlign = 'center';
  hud.style.zIndex = 1000;
  hud.style.pointerEvents = 'none';
  document.body.appendChild(hud);
}

export function updateHUD(score, timer) {
  const hud = document.getElementById('hud');
  if (hud) {
    hud.innerHTML = `💥 Score: <b>${score}</b> | ⏱️ Time Left: <b>${timer}s</b>`;
  }
}

export function setupInstructions() {
  if (document.getElementById('instructions')) return;

  const instructions = document.createElement('div');
  instructions.id = 'instructions';
  instructions.style.position = 'absolute';
  instructions.style.top = 0;
  instructions.style.left = 0;
  instructions.style.width = '100%';
  instructions.style.height = '100%';
  instructions.style.background = 'radial-gradient(circle, rgba(0,0,0,0.9), rgba(0,0,0,0.95))';
  instructions.style.color = '#fff';
  instructions.style.fontFamily = 'Segoe UI, sans-serif';
  instructions.style.display = 'flex';
  instructions.style.flexDirection = 'column';
  instructions.style.alignItems = 'center';
  instructions.style.justifyContent = 'center';
  instructions.style.textAlign = 'center';
  instructions.style.zIndex = 999;

  instructions.innerHTML = `
    <h1 style="font-size: 36px; margin-bottom: 20px;">🎮 Click to Play</h1>
    <p style="font-size: 18px;">
      Move: <b>W A S D</b><br>
      Run: <b>Shift</b><br>
      Jump: <b>Space</b><br>
      Teleport: <b>Q</b><br>
      Shoot: <b>Left Click</b>
    </p>
  `;

  document.body.appendChild(instructions);
}

export function showGameOver(score, accuracy, onRestart) {
  const instructions = document.getElementById('instructions');
  if (instructions) instructions.style.display = 'none';

  const existing = document.getElementById('gameOver');
  if (existing) existing.remove();

  const gameOver = document.createElement('div');
  gameOver.id = 'gameOver';
  gameOver.style.position = 'absolute';
  gameOver.style.top = '50%';
  gameOver.style.left = '50%';
  gameOver.style.transform = 'translate(-50%, -50%)';
  gameOver.style.padding = '40px';
  gameOver.style.background = 'linear-gradient(135deg, #1c1c1c, #2c2c2c)';
  gameOver.style.border = '2px solid #444';
  gameOver.style.borderRadius = '15px';
  gameOver.style.color = '#ffffff';
  gameOver.style.fontFamily = 'Segoe UI, sans-serif';
  gameOver.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
  gameOver.style.textAlign = 'center';
  gameOver.style.zIndex = 1001;

  gameOver.innerHTML = `
    <h2 style="margin-bottom: 15px; color: #ff5555; text-shadow: 0 0 10px #ff0000;">🎯 Game Over</h2>
    <p style="font-size: 20px;">🏆 Score: <strong>${score}</strong></p>
    <p style="font-size: 20px;">🎯 Accuracy: <strong>${accuracy.toFixed(1)}%</strong></p>
  `;

  const restartBtn = document.createElement('button');
  restartBtn.textContent = '🔁 Restart Game';
  restartBtn.style.marginTop = '25px';
  restartBtn.style.padding = '12px 24px';
  restartBtn.style.fontSize = '16px';
  restartBtn.style.backgroundColor = '#28a745';
  restartBtn.style.color = '#fff';
  restartBtn.style.border = 'none';
  restartBtn.style.borderRadius = '6px';
  restartBtn.style.cursor = 'pointer';
  restartBtn.style.boxShadow = '0 0 10px #28a745';
  restartBtn.onmouseenter = () => restartBtn.style.backgroundColor = '#218838';
  restartBtn.onmouseleave = () => restartBtn.style.backgroundColor = '#28a745';

  restartBtn.onclick = () => {
    location.reload(); ; // Call passed-in resetGame
  };

  gameOver.appendChild(restartBtn);
  document.body.appendChild(gameOver);
}
