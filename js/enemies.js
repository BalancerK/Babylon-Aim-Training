import { sounds } from './sounds.js';

let enemies = [];

export function createEnemies(scene) {
  const count = parseInt(document.getElementById("enemyCount").value);
  for (let i = 0; i < count; i++) createEnemy(scene, Date.now() + i);
}

export function respawnAllEnemies(scene) {
  enemies.forEach(e => e.dispose());
  enemies = [];
  createEnemies(scene);
}

function createEnemy(scene, id) {
  const x = Math.random() * 60 - 30;
  const z = Math.random() * 60 - 30;
  const maxH = parseFloat(document.getElementById("enemyMaxHeight").value);
  const y = Math.random() * maxH + 1;

  const cap = BABYLON.MeshBuilder.CreateCapsule(`enemy_${id}`, { height: 1.5, radius: 0.4 }, scene);
  cap.position = new BABYLON.Vector3(x, y, z);
  cap.isPickable = true;

  const mat = new BABYLON.StandardMaterial(`mat_${id}`, scene);
  mat.diffuseColor = BABYLON.Color3.Red(); // Original enemy color
  cap.material = mat;

  enemies.push(cap);
}

export function handleShooting(scene, camera, player) {
  // 🔫 Play shoot sound immediately
  sounds.shoot?.play();

  const direction = camera.getDirection(BABYLON.Axis.Z).normalize();
  const origin = camera.position.add(direction.scale(0.5));
  const ray = new BABYLON.Ray(origin, direction, 100);

  const hit = scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== player);

  if (hit.hit) {
    let root = hit.pickedMesh;
    while (root.parent) root = root.parent;

    const idx = enemies.indexOf(root);
    if (idx !== -1) {
      // ✨ Hit feedback
      root.material.emissiveColor = BABYLON.Color3.Yellow();

      // ✅ Play hit sound
      sounds.hit?.play();

      setTimeout(() => {
        root.dispose();
        enemies.splice(idx, 1);
        setTimeout(() => createEnemy(scene, Date.now()));
      }, 100);

      return true; // ✅ Enemy hit
    }
  }

  return false; // ❌ No enemy hit
}
