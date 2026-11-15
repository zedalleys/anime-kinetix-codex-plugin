import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import worker from './dist/server/index.js';

const url = 'http://127.0.0.1:4179';
createServer(async (req, res) => {
  try {
    const request = new Request(new URL(req.url, url), {
      method: req.method,
      headers: req.headers,
      ...(req.method === 'GET' || req.method === 'HEAD'
        ? {}
        : { body: Readable.toWeb(req), duplex: 'half' }),
    });
    const response = await worker.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (!response.body) return res.end();
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Preview request failed');
  }
}).listen(4179, '127.0.0.1', () => console.log('Preview ' + url));
