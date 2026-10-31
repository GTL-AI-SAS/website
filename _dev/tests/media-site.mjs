// Real HTTP ranges exercise Safari's native media loader, which can bypass page.route().
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const clips = /ezgif-gtl-ai-sticker-1-yume(?:-reverse)?\.mp4$/;
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mp4':'video/mp4', '.png':'image/png', '.jpg':'image/jpeg' };
export async function mediaSite() {
  const state = { hold:false, released:new Set(), requested:new Set(), pending:[], failReturn:false, returnFailures:0 };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404).end(); return; }
    const send = () => {
      if (res.destroyed) return;
      if (clips.test(path) && !path.includes('-reverse.mp4') && state.failReturn) {
        state.failReturn = false; state.returnFailures++;
        res.writeHead(503).end(); return;
      }
      const bytes = readFileSync(file);
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      const start = range ? Number(range[1]) : 0;
      const end = range && range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
      res.writeHead(range ? 206 : 200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes',
        'Content-Length': end - start + 1,
        ...(range ? {'Content-Range':`bytes ${start}-${end}/${bytes.length}`} : {}),
      });
      res.end(bytes.subarray(start, end + 1));
    };
    if (clips.test(path)) {
      state.requested.add(path);
      if (state.hold && !state.released.has(path)) { state.pending.push({path, send}); return; }
    }
    send();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { state, url:`http://127.0.0.1:${server.address().port}/`,
    release(path) {
      state.released.add(path);
      state.pending.filter(item => item.path === path).forEach(item => item.send());
    },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}
