import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { createGzip } from 'node:zlib';

const args = process.argv.slice(2);

function argument(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = resolve(argument('--directory', 'platform/app/dist'));
const host = argument('--host', '127.0.0.1');
const port = Number(argument('--port', '3000'));

if (!existsSync(resolve(root, 'index.html'))) {
  throw new Error(`viewer build is missing index.html: ${root}`);
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.wasm', 'application/wasm'],
  ['.woff2', 'font/woff2'],
]);

const compressibleExtensions = new Set(['.css', '.html', '.js', '.json', '.svg']);

function requestedFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const candidate = resolve(root, `.${pathname}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  return resolve(root, 'index.html');
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const file = requestedFile(request.url ?? '/');
  if (!file) {
    response.writeHead(403);
    response.end();
    return;
  }

  const stat = statSync(file);
  const extension = extname(file);
  const useGzip =
    compressibleExtensions.has(extension) &&
    /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream',
    Vary: 'Accept-Encoding',
  };

  if (useGzip) {
    headers['Content-Encoding'] = 'gzip';
  } else {
    headers['Content-Length'] = stat.size;
  }

  response.writeHead(200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(file);
  if (useGzip) {
    stream.pipe(createGzip()).pipe(response);
  } else {
    stream.pipe(response);
  }
});

server.listen(port, host);
