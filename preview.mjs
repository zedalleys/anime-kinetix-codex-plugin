import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import worker from './dist/server/index.js';

const port = Number(process.env.ANIME_KINETIX_PORT ?? 4179);
createServer(async (req, res) => {
  try {
    const request = new Request(new URL(req.url, 'http://' + (req.headers.host ?? '127.0.0.1:' + port)), {
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
}).listen(port, '127.0.0.1', function () {
  console.log('Preview http://127.0.0.1:' + this.address().port);
});
