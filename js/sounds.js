export const sounds = {};

export function loadHowlerSounds() {
  sounds.bg = new Howl({
    src: ['sounds/music.mp3'],
    loop: true,
    volume: 0.5
  });

  sounds.walk = new Howl({ src: ['sounds/walk.wav'], volume: 1 });
  sounds.sprint = new Howl({ src: ['sounds/run.mp3'], volume: 0.8 });
  sounds.jump = new Howl({ src: ['sounds/jump.mp3'], volume: 1.2 });
  sounds.teleport = new Howl({ src: ['sounds/teleport.mp3'], volume: 0.8 });
  sounds.shoot = new Howl({ src: ['sounds/shoot.mp3'], volume: 0.1 });
  sounds.hit = new Howl({ src: ['sounds/hit.mp3'], volume: 1.5 });
}