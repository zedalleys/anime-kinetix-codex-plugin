import { fields, makeHtml, presets, version } from './motion.js';
import { makePhysicsHtml, matterVersion, physicsFields } from './physics.js';

const annotations = {
  readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false,
};
const noFields = { type: 'object', properties: {}, additionalProperties: false };
const tools = {
  list_animation_presets: {
    description: 'List Anime.js presets, input ranges, and defaults.',
    inputSchema: noFields,
    run: () => ({ animejsVersion: version, presets, settings: fields }),
  },
  generate_animation_html: {
    description: 'Generate editable Anime.js HTML for a slide, pulse, staggered entrance, or orbit.',
    inputSchema: { type: 'object', properties: fields, additionalProperties: false },
    run: makeHtml,
  },
  list_physics_presets: {
    description: 'List the Matter.js bouncing shapes scene and supported physics settings.',
    inputSchema: noFields,
    run: () => ({ matterjsVersion: matterVersion, presets: { bounce: 'Bouncing shapes' }, settings: physicsFields }),
  },
  generate_physics_html: {
    description: 'Generate editable Matter.js HTML with gravity, collisions, and adjustable bounce.',
    inputSchema: { type: 'object', properties: physicsFields, additionalProperties: false },
    run: makePhysicsHtml,
  },
};

const toolsList = Object.entries(tools).map(([name, { description, inputSchema }]) => ({
  name, description, inputSchema, annotations,
}));

export function handleMessage(message, { playground } = {}) {
  const envelope = { jsonrpc: '2.0', id: message?.id ?? null };
  const error = (code, message) => ({ ...envelope, error: { code, message } });
  const result = (value) => ({ ...envelope, result: value });
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return error(-32600, 'Invalid request');
  }
  if (!Object.hasOwn(message, 'id')) return null;

  switch (message.method) {
    case 'server/discover':
      return result({ supportedVersions: ['2026-07-28'], capabilities: { tools: {} } });
    case 'initialize': {
      const requested = message.params?.protocolVersion;
      const supported = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
      return result({
        protocolVersion: supported.includes(requested) ? requested : supported[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'anime-kinetix-codex-plugin', version: '1.1.0' },
      });
    }
    case 'ping':
      return result({});
    case 'tools/list':
      return result({ tools: toolsList });
    case 'tools/call': {
      const { name, arguments: args } = message.params ?? {};
      if (typeof name !== 'string' || !Object.hasOwn(tools, name)) return error(-32602, 'Unknown tool');
      try {
        const value = tools[name].run(args);
        if (playground && name.startsWith('list_')) value.playground = playground;
        const output = typeof value === 'string' ? value : JSON.stringify(value);
        return result({ content: [{ type: 'text', text: output }] });
      } catch (cause) {
        return result({ isError: true, content: [{ type: 'text', text: cause.message }] });
      }
    }
    default:
      return error(-32601, 'Method not found');
  }
}
