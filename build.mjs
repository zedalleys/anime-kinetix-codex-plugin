import { readFileSync, writeFileSync } from 'node:fs';

const assets = {
  page: './page.html',
  motionModule: './dist/server/motion.js',
  animeModule: './vendor/anime.esm.min.js',
  animeLicense: './vendor/LICENSE.md',
};
const source = Object.entries(assets).map(([name, path]) => {
  return 'export const ' + name + ' = ' + JSON.stringify(readFileSync(new URL(path, import.meta.url), 'utf8')) + ';\n';
}).join('');
writeFileSync(new URL('./dist/server/assets.js', import.meta.url), source);
