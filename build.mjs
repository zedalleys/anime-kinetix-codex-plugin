import { readFileSync, writeFileSync } from 'node:fs';

const assets = {
  page: './page.html',
  logoSvg: './assets/logo.svg',
  motionModule: './dist/server/motion.js',
  physicsModule: './dist/server/physics.js',
  animeModule: './vendor/anime.esm.min.js',
  matterModule: './vendor/matter.min.js',
  animeLicense: './vendor/LICENSE.md',
  matterLicense: './vendor/Matter.js-LICENSE',
};
const source = Object.entries(assets).map(([name, path]) => {
  const text = readFileSync(new URL(path, import.meta.url), 'utf8');
  return 'export const ' + name + ' = ' + JSON.stringify(text) + ';\n';
}).join('');
writeFileSync(new URL('./dist/server/assets.js', import.meta.url), source);
