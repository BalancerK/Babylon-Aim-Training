import { sounds } from './sounds.js';

export function createPlayer(scene) {
  const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.4 }, scene);
  player.position = new BABYLON.Vector3(0, 3, 0);
  player.checkCollisions = true;
  player.ellipsoid = new BABYLON.Vector3(0.4, 1, 0.4);
  player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

  // Manual state tracking
  player.velocity = new BABYLON.Vector3(0, 0, 0);
  player.isGrounded = false;
  player.simulateForward = false;
  player.simulateSprint = false;
  player.jumpTime = 0;

  return player;
}

export function updatePlayerMovement(scene, player, camera, input) {
  const forward = camera.getDirection(BABYLON.Axis.Z).normalize();
  const right = camera.getDirection(BABYLON.Axis.X).normalize();

  const gravityY = -15;
  const walkSpeed = 10;
  const sprintSpeed = 20;
  const jumpForce = 8;
  const tpDistance = 12;

  if (!player.velocity) {
    player.velocity = new BABYLON.Vector3(0, 0, 0);
  }

  const ray = new BABYLON.Ray(player.position, BABYLON.Vector3.Down(), 1.1);
  const hit = scene.pickWithRay(ray, mesh => mesh.name === "ground");
  const isGrounded = hit.hit;

  if (player.wasGrounded === undefined) {
    player.wasGrounded = true;
    input.simulateForward = false;
    input.simulateSprint = false;
  }

  if (player.wasGrounded && !isGrounded) {
    input.simulateForward = input.w;
    input.simulateSprint = input.shift;
  }

  if (isGrounded) {
    input.simulateForward = false;
    input.simulateSprint = false;
    player.velocity.y = 0;
  }

  player.wasGrounded = isGrounded;

// Preserve forward and sprint state when jumping
const useW = input.w || (!isGrounded && input.simulateForward);

// ✅ Only allow sprinting if:
// - grounded and holding shift
// - OR airborne and was sprinting before jumping
const useShift = (isGrounded && input.shift) || (!isGrounded && input.simulateSprint);

// Final speed
const speed = useShift ? sprintSpeed : walkSpeed;

  let move = BABYLON.Vector3.Zero();
  if (useW) move.addInPlace(forward);
  if (input.s) move.subtractInPlace(forward);
  if (input.a) move.subtractInPlace(right);
  if (input.d) move.addInPlace(right);
  move.y = 0;

  const isMoving = move.lengthSquared() > 0.01;

  // ✅ Play movement sounds
  if (isGrounded && isMoving) {
    if (useShift) {
      if (!sounds.sprint.playing()) {
        sounds.walk.stop();
        sounds.sprint.play();
      }
    } else {
      if (!sounds.walk.playing()) {
        sounds.sprint.stop();
        sounds.walk.play();
      }
    }
  } else {
    sounds.walk.stop();
    sounds.sprint.stop();
  }

  if (isMoving) {
    move.normalize().scaleInPlace(speed);
  }

  if (!isGrounded) {
    player.velocity.y += gravityY * scene.getEngine().getDeltaTime() / 1000;
  }

  if (input.jump && isGrounded) {
    player.velocity.y = jumpForce;
    sounds.jump?.play();
  }

  const deltaTime = scene.getEngine().getDeltaTime() / 1000;
  const totalMove = new BABYLON.Vector3(move.x, player.velocity.y, move.z);
  player.moveWithCollisions(totalMove.scale(deltaTime));

  if (!player.wasTeleporting) {
    player.wasTeleporting = false; // initialize if undefined
  }

  if (input.teleport && !player.wasTeleporting) {
    player.wasTeleporting = true; // mark as used

    const origin = camera.position.clone();
    const direction = camera.getDirection(BABYLON.Axis.Z).normalize();
    const ray = new BABYLON.Ray(origin, direction, tpDistance);
    const hit = scene.pickWithRay(ray, mesh => mesh.isPickable && mesh !== player);

    let target = origin.add(direction.scale(tpDistance));
    if (hit.hit && hit.pickedPoint) {
      target = hit.pickedPoint.clone();
      target.y += 2;
    }

    player.position.copyFrom(target);
    player.velocity.y = 0;
    sounds.teleport?.play();
  }
  // Reset teleport state when Q is released
  if (!input.teleport) {
    player.wasTeleporting = false;
  }
}