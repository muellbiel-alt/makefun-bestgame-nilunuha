import { CONFIG } from './config.js';
import { World } from './world.js';
import { initInput, getMouseState, consumeMouseClicked, isKeyPressed, updateMouseWorldPos } from './input.js';
import { render } from './render.js';
import { getAutopilot } from './shots.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

initInput(canvas);

// Parse URL params for seed and shot preset
const urlParams = new URLSearchParams(window.location.search);
const seed = parseInt(urlParams.get('seed') ?? '1', 10);
const shotName = urlParams.get('shot');

const world = new World();
world.reset(seed);

const autopilotFn = getAutopilot(shotName);
if (shotName) {
  // If taking a screenshot preset, advance simulation by several seconds deterministically
  const warmupTicks = shotName === 'start' ? 300 : shotName === 'play' ? 1560 : shotName === 'hero' ? 600 : 60;
  for (let i = 0; i < warmupTicks; i++) {
    const inputState = {
      keyPressed: {},
      mouse: { worldX: world.drone.x, worldY: world.drone.y },
      clicked: false,
      spaceClicked: false,
    };
    world.update(1 / 60, inputState, autopilotFn);
  }
}

let lastTime = performance.now();
const fixedDt = 1 / 60;
let accumulator = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  accumulator += dt;
  while (accumulator >= fixedDt) {
    const camX = world.drone.x - canvas.width / 2;
    const camY = world.drone.y - canvas.height / 2;
    updateMouseWorldPos(camX, camY);

    const mouse = getMouseState();
    const inputState = {
      keyPressed: {
        'KeyW': isKeyPressed('KeyW') || isKeyPressed('arrowup'),
        'KeyS': isKeyPressed('KeyS') || isKeyPressed('arrowdown'),
        'KeyA': isKeyPressed('KeyA') || isKeyPressed('arrowleft'),
        'KeyD': isKeyPressed('KeyD') || isKeyPressed('arrowright'),
        'KeyP': isKeyPressed('KeyP'),
        'Escape': isKeyPressed('Escape'),
        'KeyR': isKeyPressed('KeyR'),
        'Enter': isKeyPressed('Enter'),
        'KeyM': isKeyPressed('KeyM'),
      },
      mouse,
      clicked: consumeMouseClicked(),
      spaceClicked: isKeyPressed('Space'),
    };

    world.update(fixedDt, inputState, autopilotFn);
    accumulator -= fixedDt;
  }

  render(ctx, world);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
