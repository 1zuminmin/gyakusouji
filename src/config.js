// Time: milliseconds; distance: meters. Difficulty never uses bonus distance.
export const CONFIG = Object.freeze({
  grades: [
    { maxMs: 1, name: 'CRITICAL', bonus: 1000, color: '#ff83db' },
    { maxMs: 220, name: 'GREAT', bonus: 150, color: '#fbd35d' },
    { maxMs: 400, name: 'GOOD', bonus: 50, color: '#dce8ee' },
    { maxMs: Infinity, name: 'OK', bonus: 0, color: '#cb9369' },
  ],
  earlyThresholdMs: 800,
  earlyGrade: { name: 'EARLY', bonus: 0, penalty: 200, color: '#ff985a' },
  driveSpeed: 32, approachSpeed: 68, maxApproachSpeed: 142,
  speedIncreasePerMeter: .025, spawnDistance: 135, minReactionMs: 950,
  firstSpawnMs: 1100, spawnGapMinMs: 650, spawnGapMaxMs: 1250,
  passMs: 180, returnMs: 300, dodgeMs: 115, dodgeOffset: 2.9,
  flickThresholdPx: 26, horizontalRatio: 1.15,
  crashCloseupMs: 650, crashExteriorMs: 1250,
  bestStorageKey: 'gyakusouji.best.v1',
});
