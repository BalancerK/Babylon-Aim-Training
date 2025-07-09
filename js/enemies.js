import { sounds } from './sounds.js';

let enemies = [];
let projectiles = []; // List to hold active enemy missiles

export function createEnemies(scene) {
  let count = parseInt(document.getElementById("enemyCount").value);
  if (count > 20) {
    count = 20;
    document.getElementById("enemyCount").value = 20;
  }
  enemies = [];
  for (let i = 0; i < count; i++) {
    createEnemy(scene, Date.now() + i);
  }
}

export function respawnAllEnemies(scene) {
  enemies.forEach(e => e.mesh.dispose());
  enemies = [];
  clearProjectiles();
  createEnemies(scene);
}

function createEnemy(scene, id) {
  const x = Math.random() * 60 - 30;
  const z = Math.random() * 60 - 30;
  const y = Math.random() * 5 + 1;

  const mesh = BABYLON.MeshBuilder.CreateCapsule(`enemy_${id}`, { height: 1.5, radius: 0.4 }, scene);
  mesh.position = new BABYLON.Vector3(x, y, z);
  mesh.isPickable = true;
  mesh.checkCollisions = true;

  const mat = new BABYLON.StandardMaterial(`mat_${id}`, scene);
  mat.diffuseColor = BABYLON.Color3.Red();
  mesh.material = mat;

  const enemy = {
    mesh,
    velocity: new BABYLON.Vector3(0, 0, 0),
    moveDir: BABYLON.Vector3.Zero(),
    jumpCooldown: 0,
    runTimer: 0,
    shootCooldown: Math.random() * 3 + 2
  };
  enemies.push(enemy);
}

export function handleShooting(scene, camera, player) {
  sounds.shoot?.play();

  const dir = camera.getDirection(BABYLON.Axis.Z).normalize();
  const origin = camera.position.add(dir.scale(0.5));
  const ray = new BABYLON.Ray(origin, dir, 100);
  const hit = scene.pickWithRay(ray, mesh => mesh.isPickable && mesh !== player);
  const endPoint = hit.hit ? hit.pickedPoint : origin.add(dir.scale(100));

  // 🔴 Laser beam
  const laser = BABYLON.MeshBuilder.CreateTube("laser", { path: [origin, endPoint], radius: 0.05 }, scene);
  const laserMat = new BABYLON.StandardMaterial("laserMat", scene);
  laserMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  laserMat.alpha = 0.8;
  laser.material = laserMat;

  let life = 0.3;
  scene.onBeforeRenderObservable.add(() => {
    if (!laser) return;
    life -= scene.getEngine().getDeltaTime() / 1000;
    laserMat.alpha = Math.max(0, life * 2.5);
    if (life <= 0) laser.dispose();
  });

  // 🔆 Hit effect
  if (hit.hit) {
    const impact = BABYLON.MeshBuilder.CreateSphere("impact", { diameter: 0.5 }, scene);
    impact.position = hit.pickedPoint;
    const mat = new BABYLON.StandardMaterial("impactMat", scene);
    mat.emissiveColor = BABYLON.Color3.Yellow();
    mat.alpha = 1;
    impact.material = mat;

    let impLife = 0.2;
    scene.onBeforeRenderObservable.add(() => {
      if (!impact) return;
      impLife -= scene.getEngine().getDeltaTime() / 1000;
      mat.alpha = Math.max(0, impLife * 5);
      if (impLife <= 0) impact.dispose();
    });

    let root = hit.pickedMesh;
    while (root.parent) root = root.parent;
    const idx = enemies.findIndex(e => e.mesh === root);
    if (idx !== -1) {
      root.material.emissiveColor = BABYLON.Color3.Yellow();
      sounds.hit?.play();
      setTimeout(() => {
        root.dispose();
        enemies.splice(idx, 1);
        setTimeout(() => createEnemy(scene, Date.now()));
      }, 100);
      return true;
    }
  }

  return false;
}

export function updateEnemies(scene, player) {
  const dt = scene.getEngine().getDeltaTime() / 1000;
  const gravity = -15, walk = 5, sprint = 10, jumpForce = 9;

  // Enemy movement & shooting
  enemies.forEach(enemy => {
    const { mesh } = enemy;
    const down = new BABYLON.Ray(mesh.position, BABYLON.Vector3.Down(), 1.1);
    const ground = scene.pickWithRay(down, m => m.name === "ground");
    const grounded = ground.hit;

    if (enemy.moveDir.length() < 0.01 || Math.random() < 0.005) {
      const angle = Math.random() * Math.PI * 2;
      enemy.moveDir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
      enemy.runTimer = Math.random() < 0.2 ? 2 : 0;
    }

    const speed = enemy.runTimer > 0 ? sprint : walk;
    const mv = enemy.moveDir.scale(speed);
    enemy.runTimer = Math.max(0, enemy.runTimer - dt);

    if (grounded) {
      if (enemy.jumpCooldown <= 0 && Math.random() < 0.02) {
        enemy.velocity.y = jumpForce;
        enemy.jumpCooldown = 1.5;
      } else enemy.velocity.y = 0;
    } else {
      enemy.velocity.y += gravity * dt;
    }
    enemy.jumpCooldown = Math.max(0, enemy.jumpCooldown - dt);

    const total = new BABYLON.Vector3(mv.x, enemy.velocity.y, mv.z);
    mesh.moveWithCollisions(total.scale(dt));

    // 🔫 Enemy projectile shooting
    enemy.shootCooldown -= dt;
    if (enemy.shootCooldown <= 0) {
      shootAtPlayer(scene, enemy.mesh, player);
      enemy.shootCooldown = Math.random() * 1 + 0.5;
    }
  });

  // Projectile updates
  projectiles = projectiles.filter(p => {
    p.life -= dt;
    if (p.mesh.intersectsMesh(player, false)) {
      window.score = (window.score || 0) - 20;
      if (typeof updateHUD === "function") updateHUD(window.score, window.timeLeft);
      p.mesh.dispose();
      return false;
    }
    if (p.life <= 0) {
      p.mesh.dispose();
      return false;
    }
    p.mesh.moveWithCollisions(p.dir.scale(p.speed * dt));
    return true;
  });
}

function shootAtPlayer(scene, enemyMesh, player) {
  const origin = enemyMesh.position.clone();
  const dir = player.position.subtract(origin).normalize();
  const bullet = BABYLON.MeshBuilder.CreateSphere("enemyBullet", { diameter: 0.3 }, scene);
  bullet.position = origin.add(dir.scale(1.2));

  const mat = new BABYLON.StandardMaterial("bulletMat", scene);
  mat.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange
  bullet.material = mat;

  bullet.direction = dir;
  bullet.speed = 30;
  bullet.owner = "enemy";

  const update = () => {
    if (!bullet || bullet.isDisposed()) return;

    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    bullet.position.addInPlace(bullet.direction.scale(bullet.speed * deltaTime));

    // ✅ Check collision with player
    if (bullet.intersectsMesh(player, false)) {
      console.log("💥 player get hit");

      bullet.dispose();
      scene.onBeforeRenderObservable.removeCallback(update);

      if (!player._recentlyHit) {
        if (sounds.playerhit) sounds.playerhit.play();
        player._recentlyHit = true;
        setTimeout(() => {
          player._recentlyHit = false;
        }, 500);
      }

      // ✅ Flash red
      const flash = document.getElementById("hitFlash");
      if (flash) {
        flash.style.opacity = "1";
        setTimeout(() => {
          flash.style.opacity = "0";
        }, 150);
      }

      // ✅ Deduct score
      if (typeof window.modifyScore === "function") {
        window.modifyScore(-20);
      }

      return;
    }

    // ✅ Check collision with any wall
    const hitWall = scene.meshes.some(mesh =>
      mesh.name.toLowerCase().includes("wall") && bullet.intersectsMesh(mesh, false)
    );
    if (hitWall) {
      bullet.dispose();
      scene.onBeforeRenderObservable.removeCallback(update);
      return;
    }

    // ✅ Out of bounds
    if (bullet.position.length() > 150) {
      bullet.dispose();
      scene.onBeforeRenderObservable.removeCallback(update);
    }
  };

  scene.onBeforeRenderObservable.add(update);
}


function clearProjectiles() {
  projectiles.forEach(p => p.mesh.dispose());
  projectiles = [];
}
