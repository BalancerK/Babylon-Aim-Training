const input = {
  w: false,
  a: false,
  s: false,
  d: false,
  shift: false,
  jump: false,
  teleport: false,
  teleportReady: true, // ✅ new flag
};

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key in input) input[key] = true;

    if (e.code === "Space") input.jump = true;

    if (key === "q" && input.teleportReady) {
      input.teleport = true;         // ✅ one-time trigger
      input.teleportReady = false;   // ❌ block until key is released
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (key in input) input[key] = false;

    if (key === "q") {
      input.teleportReady = true;   // ✅ allow next teleport
    }
  });
}

export function getInputState() {
  return input;
}

export function resetJump() {
  input.jump = false;
}

export function resetTeleport() {
  input.teleport = false; // only reset teleport, not teleportReady
}
