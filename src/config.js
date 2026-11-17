// Time: milliseconds; distance: meters. Difficulty never uses bonus distance.
export const CONFIG = Object.freeze({
  grades: [
    { maxMs: 100, name: 'PERFECT', bonus: 100, color: '#ff83db' },
    { maxMs: 220, name: 'GREAT', bonus: 50, color: '#fbd35d' },
    { maxMs: 400, name: 'GOOD', bonus: 25, color: '#dce8ee' },
    { maxMs: Infinity, name: 'OK', bonus: 0, color: '#cb9369' },
  ],
  driveSpeed: 32, approachSpeed: 68, maxApproachSpeed: 142,
  speedIncreasePerMeter: .025, spawnDistance: 135, minReactionMs: 950,
  firstSpawnMs: 1100, spawnGapMinMs: 650, spawnGapMaxMs: 1250,
  passMs: 180, returnMs: 300, dodgeMs: 115, dodgeOffset: 2.9,
  flickThresholdPx: 26, horizontalRatio: 1.15,
  crashCloseupMs: 650, crashExteriorMs: 1250,
  bestStorageKey: 'gyakusouji.best.v1',
});
