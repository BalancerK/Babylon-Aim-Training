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
  const maxH = 5; // default height
  const y = Math.random() * maxH + 1;

  const cap = BABYLON.MeshBuilder.CreateCapsule(`enemy_${id}`, { height: 1.5, radius: 0.4 }, scene);
  cap.position = new BABYLON.Vector3(x, y, z);
  cap.isPickable = true;
  cap.checkCollisions = true;

  const mat = new BABYLON.StandardMaterial(`mat_${id}`, scene);
  mat.diffuseColor = BABYLON.Color3.Red();
  cap.material = mat;

  cap.velocity = new BABYLON.Vector3(0, 0, 0);
  cap.moveDir = BABYLON.Vector3.Zero();
  cap.jumpCooldown = 0;

  enemies.push(cap);
}

export function handleShooting(scene, camera, player) {
  sounds.shoot?.play();

  const direction = camera.getDirection(BABYLON.Axis.Z).normalize();
  const origin = camera.position.add(direction.scale(0.5));
  const ray = new BABYLON.Ray(origin, direction, 100);

  const hit = scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== player);

  const endPoint = hit.hit ? hit.pickedPoint : origin.add(direction.scale(100));

  // 🔴 Create laser beam
  const laser = BABYLON.MeshBuilder.CreateTube("laser", {
    path: [origin, endPoint],
    radius: 0.05,
    updatable: false
  }, scene);

  const laserMat = new BABYLON.StandardMaterial("laserMat", scene);
  laserMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  laserMat.alpha = 0.8;
  laser.material = laserMat;

  // Gradually fade out
  let life = 0.3;
  scene.onBeforeRenderObservable.add(() => {
    if (!laser) return;
    life -= scene.getEngine().getDeltaTime() / 1000;
    laserMat.alpha = Math.max(0, life * 2.5);
    if (life <= 0) {
      laser.dispose();
    }
  });

  // 🔆 Optional hit effect
  if (hit.hit) {
    const impact = BABYLON.MeshBuilder.CreateSphere("impact", { diameter: 0.5 }, scene);
    impact.position = hit.pickedPoint;
    const mat = new BABYLON.StandardMaterial("impactMat", scene);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    mat.alpha = 1;
    impact.material = mat;

    // Fade out and dispose hit effect
    let impactLife = 0.2;
    scene.onBeforeRenderObservable.add(() => {
      if (!impact) return;
      impactLife -= scene.getEngine().getDeltaTime() / 1000;
      mat.alpha = Math.max(0, impactLife * 5);
      if (impactLife <= 0) {
        impact.dispose();
      }
    });
  }

  // 🧠 Enemy logic
  if (hit.hit) {
    let root = hit.pickedMesh;
    while (root.parent) root = root.parent;

    const idx = enemies.indexOf(root);
    if (idx !== -1) {
      root.material.emissiveColor = BABYLON.Color3.Yellow();
      sounds.hit?.play();

      setTimeout(() => {
        root.dispose();
        enemies.splice(idx, 1);
        setTimeout(() => createEnemy(scene, Date.now()), 2000);
      }, 100);
      return true;
    }
  }

  return false;
}

export function updateEnemies(scene) {
  const delta = scene.getEngine().getDeltaTime() / 1000;
  const gravity = -15;
  const walkSpeed = 10;
  const sprintSpeed = 20;
  const jumpForce = 8;

  enemies.forEach(enemy => {
    // Check if grounded
    const ray = new BABYLON.Ray(enemy.position, BABYLON.Vector3.Down(), 1.1);
    const hit = scene.pickWithRay(ray, mesh => mesh.name === "ground");
    const isGrounded = hit.hit;

    // Pick a new random direction occasionally
    if (enemy.moveDir.length() < 0.01 || Math.random() < 0.005) {
      const angle = Math.random() * Math.PI * 2;
      enemy.moveDir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
      enemy.runTimer = Math.random() < 0.2 ? 2 : 0;
    }

    const speed = enemy.runTimer > 0 ? sprintSpeed : walkSpeed;
    const move = enemy.moveDir.scale(speed);

    if (enemy.runTimer > 0) {
      enemy.runTimer -= delta;
    }

    // Random jump if grounded
    if (isGrounded) {
      if (enemy.jumpCooldown <= 0 && Math.random() < 0.02) {
        enemy.velocity.y = jumpForce;
        enemy.jumpCooldown = 1.5; // 1.5 second cooldown
      } else {
        enemy.velocity.y = 0; // Reset vertical velocity only when grounded
      }
    } else {
      enemy.velocity.y += gravity * delta; // Apply gravity mid-air
    }

    // Apply movement
    const totalMove = new BABYLON.Vector3(move.x, enemy.velocity.y, move.z);
    enemy.moveWithCollisions(totalMove.scale(delta));

    // Update jump cooldown
    if (enemy.jumpCooldown > 0) {
      enemy.jumpCooldown -= delta;
    }
  });
}
