const keys = {};
const mouse = {
  x: 0,
  y: 0,
  worldX: 0,
  worldY: 0,
  clicked: false,
  down: false,
};

let listenersAttached = false;

export function initInput(canvas) {
  if (listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouse.down = true;
      mouse.clicked = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouse.down = false;
    }
  });
}

export function isKeyPressed(codeOrKey) {
  return !!keys[codeOrKey];
}

export function consumeMouseClicked() {
  const val = mouse.clicked;
  mouse.clicked = false;
  return val;
}

export function getMouseState() {
  return mouse;
}

export function updateMouseWorldPos(cameraX, cameraY) {
  mouse.worldX = mouse.x + cameraX;
  mouse.worldY = mouse.y + cameraY;
}
