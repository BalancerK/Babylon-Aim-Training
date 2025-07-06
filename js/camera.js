export function setupCamera(scene) {
  const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 1.5, 0), scene);
  camera.speed = 0;
  camera.inertia = 0;
  camera.minZ = 0.1;

  // Load from localStorage or use default
  const savedSensitivity = localStorage.getItem("mouseSensitivity");
  const sensitivity = savedSensitivity ? parseInt(savedSensitivity) : 1000;
  camera.angularSensibility = sensitivity;

  const savedFov = localStorage.getItem("fov");
  const fovDegrees = savedFov ? parseFloat(savedFov) : 75;
  camera.fov = BABYLON.Tools.ToRadians(fovDegrees);

  // Sync slider UI
  const sensSlider = document.getElementById("mouseSensitivity");
  const fovSlider = document.getElementById("fov");
  const sensLabel = document.getElementById("sensLabel");

  if (sensSlider) sensSlider.value = sensitivity;
  if (sensLabel) sensLabel.textContent = sensitivity;
  if (fovSlider) fovSlider.value = fovDegrees;

  return camera;
}

export function updateCamera(camera, player) {
  camera.position = player.position.add(new BABYLON.Vector3(0, 1.0, 0));
}

export function handleMouseSettings(camera) {
  const sensSlider = document.getElementById("mouseSensitivity");
  const fovSlider = document.getElementById("fov");
  const sensLabel = document.getElementById("sensLabel");

  if (sensSlider) {
    sensSlider.addEventListener("input", () => {
      const value = parseInt(sensSlider.value);
      camera.angularSensibility = value;
      localStorage.setItem("mouseSensitivity", value);
      if (sensLabel) sensLabel.textContent = value;
    });
  }

  if (fovSlider) {
    fovSlider.addEventListener("input", () => {
      const value = parseFloat(fovSlider.value);
      camera.fov = BABYLON.Tools.ToRadians(value);
      localStorage.setItem("fov", value);
    });
  }
}
