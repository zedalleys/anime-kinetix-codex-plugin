import { createInterface } from 'node:readline';
import { handleMessage } from '../dist/server/mcp.js';

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' },
    }) + '\n');
    continue;
  }
  const response = handleMessage(message);
  if (response) process.stdout.write(JSON.stringify(response) + '\n');
}
