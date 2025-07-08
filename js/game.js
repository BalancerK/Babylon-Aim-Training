import { createPlayer, updatePlayerMovement } from './player.js';
import { setupCamera, updateCamera, handleMouseSettings } from './camera.js';
import { createEnemies, respawnAllEnemies, handleShooting, updateEnemies } from './enemies.js';
import { initInput, getInputState, resetJump, resetTeleport } from './input.js';
import { setupUI, attachPointerEvents, updateHUD, showGameOver } from './ui.js';
import { loadHowlerSounds, sounds, setVolumes } from './sounds.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let scene, player, camera;
let score = 0;
let shotsFired = 0;
let hits = 0;
let timeLeft = 60;
let timerInterval;
let gameFrozen = false;

// Load and apply saved enemy count on start
const enemyCountInput = document.getElementById("enemyCount");
const savedEnemyCount = localStorage.getItem("enemyCount");
if (enemyCountInput && savedEnemyCount) {
  enemyCountInput.value = savedEnemyCount;
}

// Save when changed
if (enemyCountInput) {
  enemyCountInput.addEventListener("input", () => {
    localStorage.setItem("enemyCount", enemyCountInput.value);
  });
}

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

  const bgSlider = document.getElementById("bgVolume");
  const fxSlider = document.getElementById("fxVolume");

  if (bgSlider && fxSlider) {
    const applyVolumes = () => {
      const bgVol = parseFloat(bgSlider.value);
      const fxVol = parseFloat(fxSlider.value);
      setVolumes(bgVol, fxVol);
      localStorage.setItem("bgVolume", bgVol);
      localStorage.setItem("fxVolume", fxVol);
    };

    // Load saved values
    bgSlider.value = localStorage.getItem("bgVolume") || "0.5";
    fxSlider.value = localStorage.getItem("fxVolume") || "0.8";
    applyVolumes();

    bgSlider.addEventListener("input", applyVolumes);
    fxSlider.addEventListener("input", applyVolumes);
  }

  setupUI();
  updateHUD(score, timeLeft);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), newScene);

  camera = setupCamera(newScene);
  handleMouseSettings(camera); // ✅ Save & load sensitivity + FOV here

  // Create ground with grid material
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  ground.checkCollisions = true;

  const gridMaterial = new BABYLON.GridMaterial("gridMat", scene);
  gridMaterial.majorUnitFrequency = 5;
  gridMaterial.minorUnitVisibility = 0.45;
  gridMaterial.gridRatio = 1;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1); // dark base
  gridMaterial.lineColor = new BABYLON.Color3(0.8, 0.8, 0.8); // bright lines
  ground.material = gridMaterial;

  // Invisible boundary walls
  const wallThickness = 1;
  const wallHeight = 10;
  const groundSize = 100;

  // Left wall
  const leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", { width: wallThickness, height: wallHeight, depth: groundSize }, scene);
  leftWall.position = new BABYLON.Vector3(-groundSize / 2 - wallThickness / 2, wallHeight / 2, 0);
  leftWall.checkCollisions = true;
  leftWall.isVisible = false;

  // Right wall
  const rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", { width: wallThickness, height: wallHeight, depth: groundSize }, scene);
  rightWall.position = new BABYLON.Vector3(groundSize / 2 + wallThickness / 2, wallHeight / 2, 0);
  rightWall.checkCollisions = true;
  rightWall.isVisible = false;

  // Front wall
  const frontWall = BABYLON.MeshBuilder.CreateBox("frontWall", { width: groundSize, height: wallHeight, depth: wallThickness }, scene);
  frontWall.position = new BABYLON.Vector3(0, wallHeight / 2, groundSize / 2 + wallThickness / 2);
  frontWall.checkCollisions = true;
  frontWall.isVisible = false;

  // Back wall
  const backWall = BABYLON.MeshBuilder.CreateBox("backWall", { width: groundSize, height: wallHeight, depth: wallThickness }, scene);
  backWall.position = new BABYLON.Vector3(0, wallHeight / 2, -groundSize / 2 - wallThickness / 2);
  backWall.checkCollisions = true;
  backWall.isVisible = false;

  player = createPlayer(newScene);
  initInput();
  createEnemies(newScene);
  updateEnemies(newScene, engine);
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
    updateEnemies(newScene);
    updateCamera(camera, player);

    resetJump();
    resetTeleport();
  });

  BABYLON.SceneOptimizer.OptimizeAsync(newScene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed());


  return newScene;
}

createScene().then(newScene => {
  scene = newScene;
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
});
