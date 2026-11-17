import { CONFIG } from './config.js';
export function gradeFor(remainingMs, config = CONFIG) {
  if (remainingMs > config.earlyThresholdMs) return config.earlyGrade;
  return remainingMs > 0 ? config.grades.find(g => remainingMs <= g.maxMs) : null;
}
export class Game {
  constructor(config = CONFIG, random = Math.random) { this.c = config; this.random = random; this.mode = 'intro'; }
  start(now) {
    Object.assign(this, { mode: 'playing', distance: 0, bonus: 0, penalty: 0, dodged: 0, car: null,
      nextSpawn: now + this.c.firstSpawnMs, lastTime: now, returnStart: null, direction: 0, crashAt: null });
  }
  get score() { return Math.floor((this.distance || 0) + (this.bonus || 0) - (this.penalty || 0)); }
  tick(now) {
    if (this.mode !== 'playing') return;
    const end = this.car && !this.car.evaded ? Math.min(now, this.car.deadline) : now;
    this.distance += Math.max(0, end - this.lastTime) * this.c.driveSpeed / 1000;
    this.lastTime = now;
    if (this.car && !this.car.evaded && now >= this.car.deadline) {
      this.mode = 'crashed'; this.crashAt = this.car.deadline; return;
    }
    if (this.car?.evaded && now >= this.car.deadline + this.c.passMs) {
      this.returnStart = this.car.deadline + this.c.passMs;
      this.car = null;
      this.nextSpawn = this.returnStart + this.c.returnMs + this.c.spawnGapMinMs + this.random() * (this.c.spawnGapMaxMs - this.c.spawnGapMinMs);
    }
    if (!this.car && now >= this.nextSpawn) {
      const speed = Math.min(this.c.maxApproachSpeed, this.c.approachSpeed + this.distance * this.c.speedIncreasePerMeter);
      const duration = Math.max(this.c.minReactionMs, this.c.spawnDistance / speed * 1000);
      this.car = { spawnAt: now, deadline: now + duration, speed, duration, evaded: false };
      this.returnStart = null; this.direction = 0;
    }
  }
  dodge(direction, now) {
    if (this.mode !== 'playing' || !this.car || this.car.evaded) return null;
    const grade = gradeFor(this.car.deadline - now, this.c);
    if (!grade) { this.tick(now); return null; }
    this.car.evaded = true; this.car.dodgeAt = now; this.direction = direction < 0 ? -1 : 1;
    this.bonus += grade.bonus; this.penalty += grade.penalty || 0; this.dodged++; return grade;
  }
  offset(now) {
    if (this.car?.evaded) return this.direction * this.c.dodgeOffset * (1 - Math.pow(1 - Math.min(1, Math.max(0, now - this.car.dodgeAt) / this.c.dodgeMs), 3));
    if (this.returnStart !== null) return this.direction * this.c.dodgeOffset * (1 - Math.min(1, Math.max(0, now - this.returnStart) / this.c.returnMs));
    return 0;
  }
  shiftTime(delta) {
    this.lastTime += delta; this.nextSpawn += delta;
    if (this.car) { this.car.spawnAt += delta; this.car.deadline += delta; if (this.car.dodgeAt !== undefined) this.car.dodgeAt += delta; }
    if (this.returnStart !== null) this.returnStart += delta;
  }
}
export class Flick {
  constructor(config = CONFIG) { this.c = config; this.clear(); }
  begin(id, x, y) { if (this.id !== null) return; this.id = id; this.x = x; this.y = y; this.used = false; }
  move(id, x, y) {
    if (id !== this.id || this.used) return 0;
    const dx = x - this.x, dy = y - this.y;
    if (Math.abs(dx) < this.c.flickThresholdPx || Math.abs(dx) <= Math.abs(dy) * this.c.horizontalRatio) return 0;
    this.used = true; return Math.sign(dx);
  }
  clear(id = this.id) { if (this.id !== undefined && id !== this.id) return; this.id = null; this.used = false; }
}
