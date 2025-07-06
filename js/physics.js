export function setupPhysics(scene) {
  const gravity = new BABYLON.Vector3(0, parseFloat(document.getElementById("gravityY").value), 0);
  scene.enablePhysics(gravity, new BABYLON.AmmoJSPlugin());

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
  const grid = new BABYLON.GridMaterial("grid", scene);
  grid.gridRatio = 1;
  ground.material = grid;

  ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
    mass: 0, restitution: 0.1, friction: 1
  }, scene);
}

export function updateGravity() {
  const newGravity = parseFloat(document.getElementById("gravityY").value);
  const scene = BABYLON.EngineStore.LastCreatedScene;
  if (scene && scene.getPhysicsEngine()) {
    scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, newGravity, 0));
  }
}
