export const GAME = Object.freeze({ duration: 30, lanes: [-3, 0, 3], playerZ: 6.2, spawnZ: -72, despawnZ: 14, baseSpeed: 18, maxSpeed: 27, jumpVelocity: 10.5, gravity: 27 });
export const ITEMS = Object.freeze({
  ripe: { label: 'Café maduro', points: 100, good: true, color: 0xc93c2d }, green: { label: 'Grão verde', points: -60, color: 0x78a93c },
  golden: { label: 'Café dourado', points: 400, good: true, special: true, color: 0xffc928 }, shield: { label: 'Proteção', points: 0, good: true, powerup: 'shield', color: 0x53c8a5 },
  leaf: { label: 'Folha', points: -40, color: 0x4e8b3e }, borer: { label: 'Broca', points: -100, color: 0x342018 },
  rock: { label: 'Pedra', points: -80, obstacle: true, color: 0x74766f },
  branch: { label: 'Galho', points: -90, obstacle: true, color: 0x704226 }, basket: { label: 'Cesta bônus', points: 250, good: true, bonus: true, color: 0xe8a53a },
});
