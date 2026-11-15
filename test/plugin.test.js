import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import worker from '../dist/server/index.js';

const rpc = (method, params = {}, id = 1) => ({ jsonrpc: '2.0', id, method, params });
const call = (name, args) => rpc('tools/call', { name, arguments: args });
const text = (message) => message.result.content[0].text;
const send = (message) => worker.fetch(new Request('http://localhost/mcp', {
  method: 'POST', body: JSON.stringify(message),
}));

test('Codex MCP stdio exposes both engines and generates editable HTML', () => {
  const requests = [
    rpc('initialize', { protocolVersion: '2025-11-25' }),
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    rpc('tools/list'),
    call('generate_animation_html', { preset: 'orbit', loop: true }),
    call('generate_physics_html', { gravity: 0, restitution: 0.95, count: 12 }),
    call('generate_physics_html', { gravity: '1' }),
    call('generate_physics_html', { count: 2.5 }),
    call('generate_physics_html', { count: 13 }),
    call('generate_physics_html', { unexpected: 1 }),
  ];
  const process = spawnSync('node', ['server/stdio.js'], {
    input: requests.map((request) => JSON.stringify(request)).join('\n'),
    encoding: 'utf8',
  });
  assert.equal(process.status, 0, process.stderr);
  const results = process.stdout.trim().split('\n').map(JSON.parse);
  const [init, list, anime, matter, ...errors] = results;
  assert.equal(init.result.serverInfo.name, 'anime-kinetix-codex-plugin');
  assert.equal(init.result.protocolVersion, '2025-11-25');
  assert.deepEqual(list.result.tools.map(({ name }) => name), [
    'list_animation_presets', 'generate_animation_html', 'list_physics_presets', 'generate_physics_html',
  ]);
  assert.match(text(anime), /animejs@4\.5\.0/);
  assert.match(text(anime), /"preset":"orbit"/);
  assert.match(text(matter), /matter-js@0\.20\.0/);
  assert.match(text(matter), /"gravity":0,"restitution":0\.95,"count":12/);
  assert.equal(errors.length, 4);
  assert.ok(errors.every(({ result }) => result.isError));
});

test('playground worker serves the prior API and the bundled physics runtime', async () => {
  const list = await (await send(call('list_animation_presets', {}))).json();
  assert.equal(JSON.parse(text(list)).playground, 'http://localhost');
  const physics = await (await send(call('list_physics_presets', {}))).json();
  assert.equal(JSON.parse(text(physics)).settings.count.default, 6);
  const matter = await worker.fetch(new Request('http://localhost/matter.js'));
  assert.equal(matter.status, 200);
  assert.match(matter.headers.get('content-type'), /javascript/);
  assert.match(await matter.text(), /matter-js 0\.20\.0/);
});
