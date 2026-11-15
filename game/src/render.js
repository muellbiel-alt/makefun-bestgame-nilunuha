import { CONFIG } from './config.js';

export function render(ctx, world) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.save();

  // Screen shake
  let shakeX = 0;
  let shakeY = 0;
  if (world.screenShake > 0) {
    shakeX = (Math.random() - 0.5) * world.screenShake * 16;
    shakeY = (Math.random() - 0.5) * world.screenShake * 16;
    ctx.translate(shakeX, shakeY);
  }

  // Background
  ctx.fillStyle = CONFIG.COLOR_BG;
  ctx.fillRect(0, 0, width, height);

  // Camera offset centered on drone
  const camX = world.drone.x - width / 2;
  const camY = world.drone.y - height / 2;

  // Parallax Starfield (3 layers)
  drawParallaxStars(ctx, camX, camY, width, height);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Draw Nebula / Glow background accents
  drawNebula(ctx);

  // Draw Beacon Ring
  drawBeacon(ctx, world.beacon, world.shards.length === 0);

  // Draw Shards
  for (const shard of world.shards) {
    drawShard(ctx, shard);
  }

  // Draw Mines
  for (const mine of world.mines) {
    drawMine(ctx, mine);
  }

  // Draw Bolts
  for (const bolt of world.bolts) {
    drawBolt(ctx, bolt);
  }

  // Draw Particles
  for (const p of world.particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Draw Drone
  if (world.invulnerableTimer <= 0 || Math.floor(world.invulnerableTimer * 10) % 2 === 0) {
    drawDrone(ctx, world.drone);
  }

  // Draw Floating Texts
  for (const ft of world.floatingTexts) {
    ctx.save();
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = ft.color;
    ctx.globalAlpha = ft.life;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore(); // restore camera transform

  // Draw HUD overlay
  drawHUD(ctx, world, width, height);

  // Draw Overlays (Title, Pause, Win, GameOver)
  if (world.state === 'TITLE') {
    drawTitleScreen(ctx, width, height);
  } else if (world.state === 'PAUSE') {
    drawPauseScreen(ctx, width, height);
  } else if (world.state === 'WIN') {
    drawWinScreen(ctx, world, width, height);
  } else if (world.state === 'GAMEOVER') {
    drawGameOverScreen(ctx, world, width, height);
  }

  ctx.restore(); // restore screen shake
}

function drawParallaxStars(ctx, camX, camY, width, height) {
  // Layer 1 (slow)
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 80; i++) {
    const px = (i * 197 - camX * 0.2) % CONFIG.WORLD_WIDTH;
    const py = (i * 251 - camY * 0.2) % CONFIG.WORLD_HEIGHT;
    const sx = px < 0 ? px + CONFIG.WORLD_WIDTH : px;
    const sy = py < 0 ? py + CONFIG.WORLD_HEIGHT : py;
    if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  // Layer 2 (medium)
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 50; i++) {
    const px = (i * 131 - camX * 0.5) % CONFIG.WORLD_WIDTH;
    const py = (i * 179 - camY * 0.5) % CONFIG.WORLD_HEIGHT;
    const sx = px < 0 ? px + CONFIG.WORLD_WIDTH : px;
    const sy = py < 0 ? py + CONFIG.WORLD_HEIGHT : py;
    if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
  ctx.globalAlpha = 1.0;
}

function drawNebula(ctx) {
  ctx.save();
  const grad = ctx.createRadialGradient(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, 200, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, 1800);
  grad.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
  grad.addColorStop(0.5, 'rgba(255, 0, 123, 0.03)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
  ctx.restore();
}

function drawBeacon(ctx, beacon, ready) {
  ctx.save();
  ctx.strokeStyle = ready ? CONFIG.COLOR_GREEN : CONFIG.COLOR_DIM;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(beacon.x, beacon.y, beacon.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner glow
  const grad = ctx.createRadialGradient(beacon.x, beacon.y, 5, beacon.x, beacon.y, beacon.radius);
  grad.addColorStop(0, ready ? 'rgba(0, 255, 136, 0.3)' : 'rgba(42, 42, 64, 0.1)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(beacon.x, beacon.y, beacon.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ready ? CONFIG.COLOR_GREEN : '#888';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'BEACON ACTIVE' : 'COLLECT SHARDS', beacon.x, beacon.y - beacon.radius - 10);
  ctx.restore();
}

function drawShard(ctx, shard) {
  ctx.save();
  ctx.shadowColor = CONFIG.COLOR_PRIMARY;
  ctx.shadowBlur = 12;
  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.beginPath();
  const r = shard.radius + Math.sin(shard.pulse) * 2;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + shard.pulse * 0.5;
    const px = shard.x + Math.cos(angle) * r;
    const py = shard.y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMine(ctx, mine) {
  ctx.save();
  ctx.shadowColor = CONFIG.COLOR_ACCENT;
  ctx.shadowBlur = 10;
  ctx.fillStyle = CONFIG.COLOR_ACCENT;
  ctx.beginPath();
  ctx.arc(mine.x, mine.y, mine.radius, 0, Math.PI * 2);
  ctx.fill();

  // Spike details
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(mine.x + Math.cos(angle) * (mine.radius - 2), mine.y + Math.sin(angle) * (mine.radius - 2));
    ctx.lineTo(mine.x + Math.cos(angle) * (mine.radius + 6), mine.y + Math.sin(angle) * (mine.radius + 6));
    ctx.stroke();
  }
  ctx.restore();
}

function drawBolt(ctx, bolt) {
  ctx.save();
  ctx.shadowColor = CONFIG.COLOR_PRIMARY;
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDrone(ctx, drone) {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.rotate(drone.angle);

  ctx.shadowColor = CONFIG.COLOR_PRIMARY;
  ctx.shadowBlur = 15;

  // Hull
  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();

  // Core cockpit glow
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(2, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHUD(ctx, world, width, height) {
  ctx.save();
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = '#fff';

  // Top Bar Background
  ctx.fillStyle = 'rgba(2, 2, 8, 0.8)';
  ctx.fillRect(0, 0, width, 50);
  ctx.strokeStyle = CONFIG.COLOR_PRIMARY;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.lineTo(width, 50);
  ctx.stroke();

  // Score
  ctx.fillStyle = CONFIG.COLOR_GOLD;
  ctx.fillText(`SCORE: ${world.score}`, 30, 31);

  // Lives
  ctx.fillStyle = CONFIG.COLOR_ACCENT;
  ctx.fillText(`LIVES: ${'♥ '.repeat(world.lives)}`, 220, 31);

  // Level & Deliveries
  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.fillText(`LEVEL: ${world.level}/${CONFIG.MAX_LEVEL}`, 420, 31);
  ctx.fillText(`DELIVERIES: ${world.deliveries}/${CONFIG.DELIVERIES_PER_LEVEL}`, 580, 31);
  ctx.fillText(`COMBO: x${world.combo}`, 780, 31);

  // Energy Bar
  ctx.fillStyle = '#888';
  ctx.fillText('ENERGY', 940, 31);
  ctx.strokeStyle = CONFIG.COLOR_PRIMARY;
  ctx.strokeRect(1015, 16, 150, 16);
  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.fillRect(1017, 18, (world.energy / CONFIG.ENERGY_MAX) * 146, 12);

  // Pause hint
  ctx.fillStyle = '#666';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('[P / Esc] Pause  [M] Mute  [R] Restart', width - 20, height - 15);

  ctx.restore();
}

function drawTitleScreen(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.shadowColor = CONFIG.COLOR_PRIMARY;
  ctx.shadowBlur = 25;
  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillText('AURA DRIFT', width / 2, height / 2 - 110);

  ctx.shadowColor = CONFIG.COLOR_ACCENT;
  ctx.fillStyle = CONFIG.COLOR_ACCENT;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('— Starlight Courier —', width / 2, height / 2 - 60);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ccc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Pilot your courier drone through neon asteroid fields.', width / 2, height / 2 - 10);
  ctx.fillText('Collect star shards to build combo multipliers, then fly into the beacon ring to deliver.', width / 2, height / 2 + 20);
  ctx.fillText('Controls: WASD / Arrows to Thrust | Mouse to Aim | Click or Space to Fire Pulse Bolt', width / 2, height / 2 + 60);

  ctx.fillStyle = CONFIG.COLOR_GOLD;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press [ENTER] or Click to Start', width / 2, height / 2 + 130);
  ctx.restore();
}

function drawPauseScreen(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillText('GAME PAUSED', width / 2, height / 2 - 20);

  ctx.fillStyle = CONFIG.COLOR_PRIMARY;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press [P] or [Esc] to Resume', width / 2, height / 2 + 30);
  ctx.restore();
}

function drawWinScreen(ctx, world, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.shadowColor = CONFIG.COLOR_GREEN;
  ctx.shadowBlur = 30;
  ctx.fillStyle = CONFIG.COLOR_GREEN;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('MISSION ACCOMPLISHED!', width / 2, height / 2 - 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = CONFIG.COLOR_GOLD;
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillText(`FINAL SCORE: ${world.score}`, width / 2, height / 2 - 10);

  ctx.fillStyle = '#fff';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press [R] or [Enter] to Play Again', width / 2, height / 2 + 60);
  ctx.restore();
}

function drawGameOverScreen(ctx, world, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.shadowColor = CONFIG.COLOR_ACCENT;
  ctx.shadowBlur = 30;
  ctx.fillStyle = CONFIG.COLOR_ACCENT;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('HULL BREACH — GAME OVER', width / 2, height / 2 - 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = CONFIG.COLOR_GOLD;
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillText(`FINAL SCORE: ${world.score}`, width / 2, height / 2 - 10);

  ctx.fillStyle = '#fff';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press [R] or [Enter] to Restart', width / 2, height / 2 + 60);
  ctx.restore();
}
