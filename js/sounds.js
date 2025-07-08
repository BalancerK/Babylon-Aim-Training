export const sounds = {};

// Base volume ratios for each sound effect
const fxRatios = {
  walk: 1.5,
  sprint: 1.5,
  jump: 2.1,
  teleport: 1,
  shoot: 0.8,
  hit: 1.5,
};

export function loadHowlerSounds() {
  const bgVolume = parseFloat(localStorage.getItem("bgVolume")) || 0.5;
  const fxVolume = parseFloat(localStorage.getItem("fxVolume")) || 0.8;

  // 🎵 Background music
  sounds.bg = new Howl({
    src: ['sounds/music.mp3'],
    loop: true,
    volume: bgVolume
  });

  // 🔊 Sound effects with preserved ratios
  for (const key in fxRatios) {
    sounds[key] = new Howl({
      src: [`sounds/${key}.mp3`],  // assumes .mp3 (you can customize this if needed)
      volume: fxRatios[key] * fxVolume
    });
  }
}

export function setVolumes(bgVolume, fxVolume) {
  if (sounds.bg) sounds.bg.volume(bgVolume);

  for (const key in fxRatios) {
    if (sounds[key]) {
      sounds[key].volume(fxRatios[key] * fxVolume);
    }
  }
}
