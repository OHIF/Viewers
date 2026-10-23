#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const htmlPath = resolve(
  fileURLToPath(new URL('./screenshot-reviewer.html', import.meta.url))
);
const screenshotRoot = 'tests/screenshots';
const port = Number(process.env.SCREENSHOT_REVIEW_PORT || 4777);

function runGit(args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('git', args, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr).toString('utf8').trim();

      if (code !== 0) {
        const error = new Error(err || `git exited with status ${code}`);
        error.stdout = out;
        error.stderr = err;
        reject(error);
        return;
      }

      resolvePromise(out);
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(text);
}

function parseStatusPorcelain(buffer) {
  const entries = [];
  const parts = buffer.toString('utf8').split('\0').filter(Boolean);

  for (let index = 0; index < parts.length; index++) {
    const record = parts[index];
    const x = record[0];
    const y = record[1];
    const rawPath = record.slice(3);
    let filePath = rawPath;

    if (x === 'R' || x === 'C') {
      index += 1;
      filePath = parts[index] || rawPath;
    }

    if (!filePath.endsWith('.png') || !filePath.startsWith(`${screenshotRoot}/`)) {
      continue;
    }

    const segments = filePath.split('/');

    entries.push({
      path: filePath,
      name: segments.at(-1),
      spec: segments.slice(0, -1).join('/'),
      x,
      y,
      staged: x !== ' ' && x !== '?',
      partiallyStaged: x !== ' ' && y !== ' ',
      worktreeChanged: y !== ' ',
    });
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

function resolveScreenshotPath(rawPath) {
  if (!rawPath || rawPath.includes('\0')) {
    throw new Error('Invalid path');
  }

  const normalizedPath = normalize(rawPath).replaceAll('\\', '/');
  const absolutePath = resolve(repoRoot, normalizedPath);
  const relativePath = relative(repoRoot, absolutePath).replaceAll('\\', '/');

  if (
    relativePath.startsWith('..') ||
    relativePath === '' ||
    !relativePath.startsWith(`${screenshotRoot}/`) ||
    extname(relativePath).toLowerCase() !== '.png'
  ) {
    throw new Error('Path must be a PNG under tests/screenshots');
  }

  return {
    absolutePath,
    relativePath,
  };
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024 * 32) {
      throw new Error('Request body too large');
    }
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function handleImage(requestUrl, response) {
  const path = requestUrl.searchParams.get('path');
  const version = requestUrl.searchParams.get('version');
  const { absolutePath, relativePath } = resolveScreenshotPath(path);

  response.writeHead(200, {
    'content-type': 'image/png',
    'cache-control': 'no-store',
  });

  if (version === 'head') {
    const buffer = await runGit(['show', `HEAD:${relativePath}`]);
    response.end(buffer);
    return;
  }

  if (version !== 'worktree') {
    throw new Error('Invalid image version');
  }

  createReadStream(absolutePath).pipe(response);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (request.method === 'GET' && requestUrl.pathname === '/') {
      const html = await readFile(htmlPath, 'utf8');
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(html);
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/list') {
      const status = await runGit([
        'status',
        '--porcelain=v1',
        '-z',
        '--',
        screenshotRoot,
      ]);
      sendJson(response, 200, { entries: parseStatusPorcelain(status) });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/image') {
      await handleImage(requestUrl, response);
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/stage') {
      const body = await readRequestBody(request);
      const { relativePath } = resolveScreenshotPath(body.path);
      await runGit(['add', '--', relativePath]);
      sendJson(response, 200, { ok: true, path: relativePath });
      return;
    }

    sendText(response, 404, 'Not found');
  } catch (error) {
    if (!response.headersSent) {
      sendJson(response, 500, { error: error.message });
      return;
    }
    response.destroy(error);
  }
}

const server = createServer((request, response) => {
  handleRequest(request, response);
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Screenshot reviewer: ${url}`);
  console.log(`Repository: ${repoRoot}`);
});
