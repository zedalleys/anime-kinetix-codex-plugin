import { fields, makeHtml, normalize, presets, version } from './motion.js';
import { page, motionModule, animeModule, animeLicense } from './assets.js';

const build = {
  name: 'generate_animation_html',
  description: 'Generate a complete, editable Anime.js v4 HTML demo. Choose a slide, pulse, staggered entrance, or orbit and tune its duration, easing, delay, and looping.',
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { type: 'object', properties: fields, additionalProperties: false },
};

const info = {
  name: 'list_animation_presets',
  description: 'List supported Anime.js animation presets, input ranges, defaults, and the playground link.',
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
};

function toolResult(value, isError = false) {
  const result = { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] };
  if (isError) result.isError = true;
  return result;
}

async function handleMcp(request, origin) {
  let message;
  try {
    message = await request.json();
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
  }

  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } }, { status: 400 });
  }
  if (!Object.hasOwn(message, 'id')) return new Response(null, { status: 202 });

  const envelope = { jsonrpc: '2.0', id: message.id };
  const result = (value) => Response.json({ ...envelope, result: value });
  if (message.method === 'server/discover') return result({ supportedVersions: ['2026-07-28'], capabilities: { tools: {} } });
  if (message.method === 'initialize') {
    return result({ protocolVersion: '2025-11-25', capabilities: { tools: {} }, serverInfo: { name: 'anime-motion-playground', version: '1.0.0' } });
  }
  if (message.method === 'ping') return result({});
  if (message.method === 'tools/list') return result({ tools: [info, build] });

  if (message.method === 'tools/call') {
    const { name, arguments: args } = message.params ?? {};
    if (name === info.name) {
      return result(toolResult({ animejsVersion: version, presets, settings: fields, playground: origin }));
    }
    if (name === build.name) {
      try {
        const settings = normalize(args);
        return result(toolResult(makeHtml(settings)));
      } catch (error) {
        return result(toolResult(error.message, true));
      }
    }
    return Response.json({ ...envelope, error: { code: -32602, message: 'Unknown tool' } });
  }
  return Response.json({ ...envelope, error: { code: -32601, message: 'Method not found' } });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/mcp') {
      if (request.method === 'POST') return handleMcp(request, url.origin);
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (url.pathname === '/motion.js' && request.method === 'GET') {
      return new Response(motionModule, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
    }
    if (url.pathname === '/anime.js' && request.method === 'GET') {
      return new Response(animeModule, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
    }
    if (url.pathname === '/license' && request.method === 'GET') {
      return new Response(animeLicense, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return new Response('Not found', { status: 404 });
  },
};
