export function getAutopilot(shotName) {
  if (!shotName) return null;

  if (shotName === 'start') {
    return (world, dt) => {
      // Simulate ~5 seconds on title screen
      world.drone.angle += dt;
    };
  }

  if (shotName === 'play') {
    return (world, dt) => {
      world.state = 'PLAY';
      world.score = 2450;
      world.level = 2;
      world.deliveries = 1;
      world.combo = 4;
      // Move drone towards nearest shard
      if (world.shards.length > 0) {
        const s = world.shards[0];
        const angle = Math.atan2(s.y - world.drone.y, s.x - world.drone.x);
        world.drone.x += Math.cos(angle) * 150 * dt;
        world.drone.y += Math.sin(angle) * 150 * dt;
        world.drone.angle = angle;
      }
    };
  }

  if (shotName === 'hero') {
    return (world, dt) => {
      world.state = 'PLAY';
      world.level = 3;
      world.score = 6800;
      world.combo = 12;
      world.deliveries = 2;
      world.energy = 90;
      // Dense level-3 scene
      if (world.shards.length < 5) {
        world.spawnLevelEntities();
        world.level = 3;
      }
    };
  }

  if (shotName === 'end') {
    return (world, dt) => {
      world.state = 'GAMEOVER';
      world.score = 1250;
      world.lives = 0;
    };
  }

  return null;
}
