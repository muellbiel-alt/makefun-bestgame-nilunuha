import { CONFIG } from './config.js';
import { setSeed, random, randomRange, randomInt } from './random.js';
import { playPickup, playFire, playExplosion, playLevelUp, playWin, playGameOver, setMuted, isMuted } from './audio.js';

export class World {
  constructor() {
    this.reset(1);
  }

  reset(seed = 1) {
    setSeed(seed);
    this.seed = seed;
    this.state = 'TITLE'; // TITLE, PLAY, PAUSE, WIN, GAMEOVER
    this.score = 0;
    this.lives = CONFIG.MAX_LIVES;
    this.level = 1;
    this.deliveries = 0;
    this.combo = 1;
    this.energy = CONFIG.ENERGY_MAX;
    this.invulnerableTimer = 0;
    this.screenShake = 0;

    // Drone
    this.drone = {
      x: CONFIG.WORLD_WIDTH / 2,
      y: CONFIG.WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: 0,
    };

    // Entities
    this.shards = [];
    this.mines = [];
    this.bolts = [];
    this.particles = [];
    this.floatingTexts = [];

    // Beacon ring location
    this.beacon = {
      x: CONFIG.WORLD_WIDTH / 2 + 800,
      y: CONFIG.WORLD_HEIGHT / 2 - 400,
      radius: CONFIG.BEACON_RADIUS,
    };

    this.spawnLevelEntities();
  }

  spawnLevelEntities() {
    this.shards = [];
    this.mines = [];

    // Spawn star shards
    const shardCount = 8 + this.level * 3;
    for (let i = 0; i < shardCount; i++) {
      this.shards.push({
        x: randomRange(200, CONFIG.WORLD_WIDTH - 200),
        y: randomRange(200, CONFIG.WORLD_HEIGHT - 200),
        radius: CONFIG.SHARD_RADIUS,
        pulse: random() * Math.PI * 2,
      });
    }

    // Spawn void mines
    const mineCount = 6 + this.level * 4;
    for (let i = 0; i < mineCount; i++) {
      this.mines.push({
        x: randomRange(300, CONFIG.WORLD_WIDTH - 300),
        y: randomRange(300, CONFIG.WORLD_HEIGHT - 300),
        vx: randomRange(-40, 40) * (1 + this.level * 0.15),
        vy: randomRange(-40, 40) * (1 + this.level * 0.15),
        radius: CONFIG.MINE_RADIUS,
        chaser: random() < 0.4,
      });
    }

    // Reposition beacon somewhat randomly within world
    this.beacon.x = randomRange(600, CONFIG.WORLD_WIDTH - 600);
    this.beacon.y = randomRange(600, CONFIG.WORLD_HEIGHT - 600);
  }

  addParticles(x, y, color, count = 15, speed = 120) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const spd = randomRange(20, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 1.0,
        maxLife: randomRange(0.4, 0.8),
        size: randomRange(2, 5),
      });
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1.0,
      vy: -40,
    });
  }

  update(dt, inputState, autopilotFn = null) {
    if (this.state === 'PAUSE') {
      if (inputState.keyPressed['KeyP'] || inputState.keyPressed['Escape']) {
        this.state = 'PLAY';
      }
      return;
    }

    if (this.state === 'TITLE') {
      if (inputState.keyPressed['Enter'] || inputState.clicked) {
        this.state = 'PLAY';
        playLevelUp();
      }
      if (autopilotFn) autopilotFn(this, dt);
      return;
    }

    if (this.state === 'WIN' || this.state === 'GAMEOVER') {
      if (inputState.keyPressed['KeyR'] || inputState.keyPressed['Enter']) {
        this.reset(this.seed);
        this.state = 'PLAY';
      }
      return;
    }

    if (inputState.keyPressed['KeyP'] || inputState.keyPressed['Escape']) {
      this.state = 'PAUSE';
      return;
    }

    if (inputState.keyPressed['KeyM']) {
      setMuted(!isMuted());
    }

    // Regenerate energy
    if (this.energy < CONFIG.ENERGY_MAX) {
      this.energy = Math.min(CONFIG.ENERGY_MAX, this.energy + CONFIG.ENERGY_RECHARGE_RATE * dt);
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 5);
    }

    // Invulnerability timer decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Handle Autopilot if provided (for screenshot presets)
    if (autopilotFn) {
      autopilotFn(this, dt);
    } else {
      // Manual Controls
      let thrustX = 0;
      let thrustY = 0;
      if (inputState.keyPressed['KeyW'] || inputState.keyPressed['ArrowUp']) thrustY -= 1;
      if (inputState.keyPressed['KeyS'] || inputState.keyPressed['ArrowDown']) thrustY += 1;
      if (inputState.keyPressed['KeyA'] || inputState.keyPressed['ArrowLeft']) thrustX -= 1;
      if (inputState.keyPressed['KeyD'] || inputState.keyPressed['ArrowRight']) thrustX += 1;

      if (thrustX !== 0 || thrustY !== 0) {
        const len = Math.hypot(thrustX, thrustY);
        thrustX /= len;
        thrustY /= len;
        this.drone.vx += thrustX * CONFIG.DRONE_THRUST * dt;
        this.drone.vy += thrustY * CONFIG.DRONE_THRUST * dt;

        if (random() < 0.3) {
          this.particles.push({
            x: this.drone.x - thrustX * 15,
            y: this.drone.y - thrustY * 15,
            vx: -thrustX * 50 + randomRange(-20, 20),
            vy: -thrustY * 50 + randomRange(-20, 20),
            color: CONFIG.COLOR_PRIMARY,
            life: 0.5,
            maxLife: 0.5,
            size: 3,
          });
        }
      }

      // Mouse aim
      const dx = inputState.mouse.worldX - this.drone.x;
      const dy = inputState.mouse.worldY - this.drone.y;
      this.drone.angle = Math.atan2(dy, dx);

      // Fire bolt
      if ((inputState.clicked || inputState.spaceClicked) && this.energy >= CONFIG.ENERGY_COST_BOLT) {
        this.energy -= CONFIG.ENERGY_COST_BOLT;
        playFire();
        const boltSpeed = 900;
        this.bolts.push({
          x: this.drone.x,
          y: this.drone.y,
          vx: Math.cos(this.drone.angle) * boltSpeed,
          vy: Math.sin(this.drone.angle) * boltSpeed,
          radius: 5,
          life: 1.2,
        });
      }
    }

    // Apply damping and max speed to drone
    this.drone.vx *= CONFIG.DRONE_DAMPING;
    this.drone.vy *= CONFIG.DRONE_DAMPING;
    const spd = Math.hypot(this.drone.vx, this.drone.vy);
    if (spd > CONFIG.DRONE_MAX_SPEED) {
      this.drone.vx = (this.drone.vx / spd) * CONFIG.DRONE_MAX_SPEED;
      this.drone.vy = (this.drone.vy / spd) * CONFIG.DRONE_MAX_SPEED;
    }

    this.drone.x += this.drone.vx * dt;
    this.drone.y += this.drone.vy * dt;

    // World boundary wrap
    if (this.drone.x < 0) this.drone.x += CONFIG.WORLD_WIDTH;
    if (this.drone.x > CONFIG.WORLD_WIDTH) this.drone.x -= CONFIG.WORLD_WIDTH;
    if (this.drone.y < 0) this.drone.y += CONFIG.WORLD_HEIGHT;
    if (this.drone.y > CONFIG.WORLD_HEIGHT) this.drone.y -= CONFIG.WORLD_HEIGHT;

    // Update bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }

      // Check bolt vs mine collision
      for (let m = this.mines.length - 1; m >= 0; m--) {
        const mine = this.mines[m];
        if (Math.hypot(b.x - mine.x, b.y - mine.y) < b.radius + mine.radius) {
          playExplosion();
          this.addParticles(mine.x, mine.y, CONFIG.COLOR_ACCENT, 20, 150);
          this.score += 50 * this.combo;
          this.addFloatingText(mine.x, mine.y, `+${50 * this.combo}`, CONFIG.COLOR_GOLD);
          this.mines.splice(m, 1);
          this.bolts.splice(i, 1);
          break;
        }
      }
    }

    // Update mines
    for (const mine of this.mines) {
      if (mine.chaser) {
        const angle = Math.atan2(this.drone.y - mine.y, this.drone.x - mine.x);
        mine.vx += Math.cos(angle) * 30 * dt;
        mine.vy += Math.sin(angle) * 30 * dt;
      }
      mine.x += mine.vx * dt;
      mine.y += mine.vy * dt;

      if (mine.x < 0) mine.x += CONFIG.WORLD_WIDTH;
      if (mine.x > CONFIG.WORLD_WIDTH) mine.x -= CONFIG.WORLD_WIDTH;
      if (mine.y < 0) mine.y += CONFIG.WORLD_HEIGHT;
      if (mine.y > CONFIG.WORLD_HEIGHT) mine.y -= CONFIG.WORLD_HEIGHT;

      // Mine vs Drone collision
      if (this.invulnerableTimer <= 0) {
        if (Math.hypot(this.drone.x - mine.x, this.drone.y - mine.y) < CONFIG.DRONE_RADIUS + mine.radius) {
          this.lives--;
          this.combo = 1;
          this.invulnerableTimer = 2.0;
          this.screenShake = 1.0;
          playExplosion();
          this.addParticles(this.drone.x, this.drone.y, CONFIG.COLOR_ACCENT, 30, 200);
          this.addFloatingText(this.drone.x, this.drone.y, '-1 LIFE!', CONFIG.COLOR_ACCENT);

          if (this.lives <= 0) {
            this.state = 'GAMEOVER';
            playGameOver();
          }
        }
      }
    }

    // Update Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const shard = this.shards[i];
      shard.pulse += dt * 3;

      if (Math.hypot(this.drone.x - shard.x, this.drone.y - shard.y) < CONFIG.DRONE_RADIUS + shard.radius) {
        playPickup(this.combo);
        this.score += 100 * this.combo;
        this.addFloatingText(shard.x, shard.y, `+${100 * this.combo} (x${this.combo})`, CONFIG.COLOR_PRIMARY);
        this.addParticles(shard.x, shard.y, CONFIG.COLOR_PRIMARY, 12, 100);
        this.combo++;
        this.shards.splice(i, 1);
      }
    }

    // Check Beacon delivery (if all shards collected)
    if (this.shards.length === 0) {
      if (Math.hypot(this.drone.x - this.beacon.x, this.drone.y - this.beacon.y) < CONFIG.BEACON_RADIUS + CONFIG.DRONE_RADIUS) {
        this.deliveries++;
        this.score += 500 * this.combo;
        playLevelUp();
        this.addParticles(this.beacon.x, this.beacon.y, CONFIG.COLOR_GREEN, 40, 250);
        this.addFloatingText(this.beacon.x, this.beacon.y, 'DELIVERY COMPLETE!', CONFIG.COLOR_GREEN);

        if (this.deliveries >= CONFIG.DELIVERIES_PER_LEVEL) {
          this.deliveries = 0;
          this.level++;
          if (this.level > CONFIG.MAX_LEVEL) {
            this.state = 'WIN';
            playWin();
          } else {
            this.spawnLevelEntities();
            this.addFloatingText(this.drone.x, this.drone.y, `LEVEL ${this.level}!`, CONFIG.COLOR_GOLD);
          }
        } else {
          // Spawn next batch of shards
          const shardCount = 8 + this.level * 3;
          for (let i = 0; i < shardCount; i++) {
            this.shards.push({
              x: randomRange(200, CONFIG.WORLD_WIDTH - 200),
              y: randomRange(200, CONFIG.WORLD_HEIGHT - 200),
              radius: CONFIG.SHARD_RADIUS,
              pulse: random() * Math.PI * 2,
            });
          }
          this.beacon.x = randomRange(600, CONFIG.WORLD_WIDTH - 600);
          this.beacon.y = randomRange(600, CONFIG.WORLD_HEIGHT - 600);
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}
