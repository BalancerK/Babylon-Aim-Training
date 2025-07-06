import { createPlayer, updatePlayerMovement } from './player.js';
import { setupCamera, updateCamera, handleMouseSettings } from './camera.js';
import { createEnemies, respawnAllEnemies, handleShooting } from './enemies.js';
import { initInput, getInputState, resetJump, resetTeleport } from './input.js';
import { setupUI, attachPointerEvents, updateHUD, showGameOver } from './ui.js';
import { loadHowlerSounds, sounds } from './sounds.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let scene, player, camera;
let score = 0;
let shotsFired = 0;
let hits = 0;
let timeLeft = 60;
let timerInterval;
let gameFrozen = false;

let isAudioInitialized = false;

canvas.addEventListener("pointerdown", () => {
  if (isAudioInitialized) return;
  isAudioInitialized = true;

  console.log("🔊 Pointer down triggered");

  if (sounds.bg && !sounds.bg.playing()) {
    sounds.bg.play();
    console.log("🎵 Background music started.");
  } else {
    console.warn("⚠️ sounds.bg not ready or already playing.");
  }

  // ✅ START GAME TIMER HERE
  timerInterval = setInterval(() => {
    if (gameFrozen) return;

    timeLeft--;
    updateHUD(score, timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameFrozen = true;

      if (document.pointerLockElement) {
        document.exitPointerLock();
      }

      engine.stopRenderLoop();

      const accuracy = shotsFired > 0 ? (hits / shotsFired) * 100 : 0;
      showGameOver(score, accuracy, resetGame);
    }
  }, 1000);
}, { once: true });

window.respawnAllEnemies = () => respawnAllEnemies(scene);

function resetGame() {
  score = 0;
  hits = 0;
  shotsFired = 0;
  timeLeft = 60;
  gameFrozen = false;

  clearInterval(timerInterval);

  if (scene) scene.dispose();

  // Recreate everything
  createScene().then(newScene => {
    scene = newScene;

    // Re-run engine loop
    engine.runRenderLoop(() => scene.render());

    // ✅ Show "Click to Play" again
    const instructions = document.getElementById("instructions");
    if (instructions) instructions.style.display = "flex";
  });
}

async function createScene() {
  const newScene = new BABYLON.Scene(engine);

  loadHowlerSounds();

  setupUI();
  updateHUD(score, timeLeft);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), newScene);

  camera = setupCamera(newScene);
  handleMouseSettings(camera); // ✅ Save & load sensitivity + FOV here

  // Create ground with grid material
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, newScene);
  ground.checkCollisions = true;

  const gridMaterial = new BABYLON.GridMaterial("gridMat", newScene);
  gridMaterial.majorUnitFrequency = 5;
  gridMaterial.minorUnitVisibility = 0.45;
  gridMaterial.gridRatio = 1;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  gridMaterial.lineColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material = gridMaterial;

  player = createPlayer(newScene);
  initInput();
  createEnemies(newScene);
  attachPointerEvents(newScene, camera, canvas);

  canvas.addEventListener("mousedown", () => {
    if (gameFrozen) return;

    shotsFired++;
    const hit = handleShooting(newScene, camera, player);
    if (hit) {
      hits++;
      score += 10;
      updateHUD(score, timeLeft);
    }
  });

  newScene.onBeforeRenderObservable.add(() => {
    if (gameFrozen) return;

    const deltaTime = engine.getDeltaTime() / 1000;
    const input = getInputState();

    updatePlayerMovement(newScene, player, camera, input, deltaTime);
    updateCamera(camera, player);

    resetJump();
    resetTeleport();
  });

  return newScene;
}

createScene().then(newScene => {
  scene = newScene;
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
});
