export const matterVersion = '0.20.0';
export const matterCdn = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js';

export const physicsFields = {
  gravity: { type: 'number', minimum: 0, maximum: 2, default: 1, description: 'Downward gravity multiplier.' },
  restitution: { type: 'number', minimum: 0, maximum: 0.95, default: 0.75, description: 'Fraction of bounce retained on impact.' },
  count: { type: 'integer', minimum: 2, maximum: 12, default: 6, description: 'Number of falling shapes.' },
};

function normalizePhysics(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Physics settings must be an object.');
  }
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(physicsFields, key)) throw new Error('Unknown setting: ' + key);
  }
  return Object.fromEntries(Object.entries(physicsFields).map(([key, field]) => {
    const value = Object.hasOwn(input, key) ? input[key] : field.default;
    const validNumber = field.type === 'integer' ? Number.isInteger(value) : Number.isFinite(value);
    if (!validNumber || value < field.minimum || value > field.maximum) {
      throw new Error('Invalid ' + key + '.');
    }
    return [key, value];
  }));
}

// This function is embedded in exported HTML, so its runtime is self-contained.
function runPhysics(settings) {
  const { Engine, Bodies, Body, Composite } = window.Matter;
  const stage = document.querySelector('#stage');
  const sprites = document.querySelector('#sprites');
  const play = document.querySelector('#play');
  const pause = document.querySelector('#pause');
  const reset = document.querySelector('#reset');
  const status = document.querySelector('#status');
  const width = 560;
  const height = 300;
  const step = 1000 / 60;
  const colors = ['#a8f2a7', '#b6a9fc', '#f8bc78', '#7dd8e3'];
  const engine = Engine.create({ enableSleeping: true, gravity: { y: settings.gravity } });
  let pairs = [];
  let requestId = null;
  let lastTime;
  let accumulator = 0;

  function draw() {
    for (const { body, shape } of pairs) {
      const { x, y } = body.position;
      shape.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + body.angle * 180 / Math.PI + ')');
    }
  }

  function tick(now) {
    if (lastTime !== undefined) accumulator += Math.min(now - lastTime, 4 * step);
    lastTime = now;
    while (accumulator >= step) {
      Engine.update(engine, step);
      accumulator -= step;
    }
    draw();
    requestId = requestAnimationFrame(tick);
  }

  function stop() {
    if (requestId !== null) cancelAnimationFrame(requestId);
    requestId = null;
    lastTime = undefined;
    accumulator = 0;
    play.disabled = false;
    pause.disabled = true;
  }

  function resetScene() {
    stop();
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    engine.timing.timestamp = 0;
    sprites.replaceChildren();
    const wall = { isStatic: true, restitution: 0, friction: 0.2 };
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, height + 16, width + 64, 48, wall),
      Bodies.rectangle(-24, height / 2, 48, height + 48, wall),
      Bodies.rectangle(width + 24, height / 2, 48, height + 48, wall),
      Bodies.rectangle(width / 2, -24, width + 64, 48, wall),
    ]);
    pairs = Array.from({ length: settings.count }, (_, i) => {
      const circle = i % 2 === 0;
      const x = 100 + (i % 6) * 72 + Math.floor(i / 6) * 10;
      const y = 64 + (i % 3) * 25 + Math.floor(i / 6) * 98;
      const options = { restitution: settings.restitution, friction: 0.2, frictionAir: 0.008 };
      const body = circle ? Bodies.circle(x, y, 16, options) : Bodies.rectangle(x, y, 34, 34, options);
      Body.setVelocity(body, { x: (i % 3 - 1) * 2.5, y: 0 });
      Body.setAngularVelocity(body, (i % 3 - 1) * 0.05);
      const shape = document.createElementNS(stage.namespaceURI, circle ? 'circle' : 'rect');
      const geometry = circle ? { r: 16 } : { x: -17, y: -17, width: 34, height: 34, rx: 2 };
      for (const [key, value] of Object.entries(geometry)) shape.setAttribute(key, value);
      shape.setAttribute('fill', colors[i % colors.length]);
      sprites.append(shape);
      Composite.add(engine.world, body);
      return { body, shape };
    });
    draw();
    status.textContent = 'Ready';
  }

  play.onclick = () => {
    if (requestId !== null) return;
    play.disabled = true;
    pause.disabled = false;
    status.textContent = 'Playing';
    requestId = requestAnimationFrame(tick);
  };
  pause.onclick = () => {
    stop();
    status.textContent = 'Paused';
  };
  reset.onclick = resetScene;
  reset.disabled = false;
  resetScene();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', ({ matches }) => {
    if (matches && requestId !== null) pause.click();
  });
  if (!reducedMotion.matches) play.click();
}

export function makePhysicsHtml(input, scriptUrl = matterCdn) {
  const settings = normalizePhysics(input);
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bouncing shapes · Matter.js</title>
<style>
  :root { color-scheme: dark; font: 15px system-ui, sans-serif; color: #e7f0e9; background: #0b1411; }
  body { min-height: 100svh; margin: 0; display: grid; grid-template-rows: 1fr auto; }
  main { display: grid; place-items: center; min-width: 0; }
  svg { display: block; width: min(100%, 560px); height: auto; }
  footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; padding: 12px; }
  button { font: inherit; color: inherit; padding: 6px 12px; background: #16231d; border: 1px solid #677d6e; border-radius: 6px; }
  button:disabled { opacity: .55; }
  button:focus-visible { outline: 2px solid #a8f2a7; outline-offset: 2px; }
</style>
<main>
  <svg id="stage" viewBox="0 0 560 300" role="img" aria-label="Colored circles and squares fall, collide, and bounce.">
    <defs><pattern id="dots" width="21" height="21" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#33433b"/></pattern></defs>
    <rect width="560" height="292" fill="url(#dots)"/>
    <path d="M0 292H560" stroke="#677d6e"/>
    <g id="sprites"></g>
  </svg>
</main>
<footer>
  <button id="play" disabled>Play</button>
  <button id="pause" disabled>Pause</button>
  <button id="reset" disabled>Reset</button>
  <span id="status" role="status">Loading Matter.js…</span>
</footer>
<script>
  const script = document.createElement('script');
  script.src = ${JSON.stringify(scriptUrl)};
  script.onload = () => (${runPhysics})(${JSON.stringify(settings)});
  script.onerror = () => { document.querySelector('#status').textContent = 'Matter.js could not load. Reload to try again.'; };
  document.head.append(script);
</script>
</html>
`;
}
