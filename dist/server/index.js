import { handleMessage } from './mcp.js';
import { page, motionModule, physicsModule, animeModule, matterModule, animeLicense, matterLicense } from './assets.js';

const js = 'text/javascript; charset=utf-8';
const plain = 'text/plain; charset=utf-8';
const assets = new Map([
  ['/', [page, 'text/html; charset=utf-8']],
  ['/motion.js', [motionModule, js]],
  ['/physics.js', [physicsModule, js]],
  ['/anime.js', [animeModule, js]],
  ['/matter.js', [matterModule, js]],
  ['/license', [animeLicense, plain]],
  ['/matter-license', [matterLicense, plain]],
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp') {
      if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
      let message;
      try {
        message = await request.json();
      } catch {
        return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
      }
      const response = handleMessage(message, { playground: url.origin });
      if (!response) return new Response(null, { status: 202 });
      return Response.json(response, { status: response.error?.code === -32600 ? 400 : 200 });
    }
    const asset = assets.get(url.pathname);
    if (!asset || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404 });
    const [body, contentType] = asset;
    return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': contentType } });
  },
};
