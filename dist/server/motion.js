export const version = '4.5.0';
export const cdn = 'https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js';

export const presets = {
  'slide-in': 'Slide in',
  'pulse': 'Pulse',
  'stagger': 'Staggered entrance',
  'orbit': 'Orbit',
};

export const eases = {
  'linear': 'Linear',
  'outCubic': 'Ease out cubic',
  'inOutSine': 'Ease in-out sine',
  'outBack': 'Ease out back',
  'outElastic': 'Ease out elastic',
};

export const fields = {
  preset: { type: 'string', enum: Object.keys(presets), default: 'stagger' },
  duration: { type: 'integer', minimum: 150, maximum: 3000, default: 850, description: 'Duration per animated element in milliseconds.' },
  ease: { type: 'string', enum: Object.keys(eases), default: 'outCubic' },
  stagger: { type: 'integer', minimum: 0, maximum: 500, default: 90, description: 'Delay between elements in milliseconds. Only applies to staggered entrance.' },
  loop: { type: 'boolean', default: false },
};

export function normalize(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Settings must be an object.');
  }
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(fields, key)) throw new Error('Unknown setting: ' + key);
  }
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => {
    const value = Object.hasOwn(input, key) ? input[key] : field.default;
    const valid = field.enum ? field.enum.includes(value)
      : field.type === 'boolean' ? typeof value === 'boolean'
      : Number.isInteger(value) && value >= field.minimum && value <= field.maximum;
    if (!valid) throw new Error('Invalid ' + key + '.');
    return [key, value];
  }));
}

const marks = '<i class="mark"></i>';
const scenes = {
  'slide-in': ['<div class="shape tile">' + marks + '</div>', "{ x: [-108, 0], opacity: [0, 1], rotate: [-25, 0] }"],
  'pulse': ['<div class="shape circle">' + marks + '</div>', "{ scale: [0.55, 1.15, 1] }"],
  'stagger': ['<div class="stack">' + ('<div class="shape tile">' + marks + '</div>').repeat(5) + '</div>', "{ y: [38, 0], opacity: [0, 1], scale: [0.7, 1], delay: stagger(settings.stagger) }"],
  'orbit': ['<div class="track"><div class="shape satellite"></div></div>', "{ rotate: [0, 360] }"],
};

export function makeHtml(input, moduleUrl = cdn) {
  const settings = normalize(input);
  const [scene, motion] = scenes[settings.preset];
  const orbit = settings.preset === 'orbit';
  const label = presets[settings.preset];

  return [
    '<!doctype html>',
    '<html lang="en"><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + label + ' · Anime.js</title>',
    '<style>',
    '  :root { color-scheme: dark; font: 15px system-ui, sans-serif; background: #0b1411; color: #e7f0e9; }',
    '  body { min-height: 100svh; margin: 0; display: grid; grid-template-rows: 1fr auto; }',
    '  .stage { display: grid; min-height: 210px; place-items: center; overflow: hidden;',
    '    background: radial-gradient(circle, #33433b 1px, transparent 1.5px) center / 21px 21px; }',
    '  .stack { display: flex; gap: clamp(5px,3vw,20px); }',
    '  .shape { display: grid; place-items: center; background: #a8f2a7; box-shadow: 0 0 30px #86efa444; }',
    '  .tile { width: clamp(28px,11vw,62px); aspect-ratio: 1; border-radius: 24%; }',
    '  .circle { width: 76px; aspect-ratio: 1; border-radius: 50%; }',
    '  .mark { display: block; background: #163123; width: 22%; aspect-ratio: 1; border-radius: 50%; }',
    '  .track { position: relative; width: 128px; aspect-ratio: 1; border: 1px dashed #677d6e; border-radius: 50%; }',
    '  .satellite { position: absolute; left: calc(50% - 10px); top: -10px; width: 20px; aspect-ratio: 1; border-radius: 50%; }',
    '  footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; }',
    '  button { border: 1px solid #677d6e; border-radius: 6px; padding: 6px 12px; color: inherit; background: #16231d; cursor: pointer; font: inherit; }',
    '  button:disabled { opacity: .55; cursor: default; }',
    '</style>',
    '<main class="stage" aria-label="' + label + ' animation">' + scene + '</main>',
    '<footer><button id="play" disabled>Play</button><button id="pause" disabled>Pause</button><span id="status" role="status">Loading Anime.js…</span></footer>',
    '<script type="module">',
    '  const status = document.querySelector("#status");',
    '  try {',
    '    const { animate' + (settings.preset === 'stagger' ? ', stagger' : '') + ' } = await import(' + JSON.stringify(moduleUrl) + ');',
    '    const settings = ' + JSON.stringify(settings) + ';',
    '    const motion = ' + motion + ';',
    '    const play = document.querySelector("#play");',
    '    const pause = document.querySelector("#pause");',
    '    let animation;',
    '    play.onclick = () => {',
    '      animation?.revert();',
    '      pause.textContent = "Pause";',
    '      pause.disabled = false;',
    '      animation = animate("' + (orbit ? '.track' : '.shape') + '", {',
    '        ...motion, duration: settings.duration, ease: settings.ease, loop: settings.loop,',
    '        onComplete: () => { pause.disabled = true; },',
    '      });',
    '    };',
    '    pause.onclick = () => {',
    '      if (animation.paused) { animation.resume(); pause.textContent = "Pause"; }',
    '      else { animation.pause(); pause.textContent = "Resume"; }',
    '    };',
    '    play.disabled = false;',
    '    status.textContent = "";',
    '    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play.click();',
    '  } catch (error) {',
    '    status.textContent = "Anime.js could not load. Reload to try again.";',
    '    console.error(error);',
    '  }',
    '</script>',
    '</html>',
  ].join('\n') + '\n';
}
