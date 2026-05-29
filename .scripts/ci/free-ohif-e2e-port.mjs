/**
 * Frees the OHIF Playwright e2e dev-server port before CI runs.
 * Self-hosted runners (macOS and Linux) often leave `yarn start` / nyc processes
 * bound to 3335 after cancelled or failed jobs, which makes Playwright fail with
 * "http://localhost:3335 is already used".
 */
import { execSync } from 'node:child_process';

const DEFAULT_E2E_PORT = 3335;

export function getOhifE2ePort() {
  const port = Number(process.env.OHIF_PORT || DEFAULT_E2E_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid OHIF_PORT: ${process.env.OHIF_PORT}`);
  }
  return port;
}

function runQuiet(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function parsePidList(output) {
  return [...new Set(output.split(/\s+/).filter(Boolean))];
}

function parseSsListeningPids(output) {
  const pids = [];
  for (const match of output.matchAll(/pid=(\d+)/g)) {
    pids.push(match[1]);
  }
  return [...new Set(pids)];
}

function killPids(pids, port, method) {
  const killed = [];

  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGKILL');
      killed.push(pid);
    } catch {
      // Process may have already exited.
    }
  }

  if (killed.length > 0) {
    console.log(
      `[free-ohif-e2e-port] Freed port ${port} via ${method}: killed PID(s) ${killed.join(', ')}`
    );
  }
}

function getListeningPidsDarwin(port) {
  // macOS: -sTCP:LISTEN is supported and avoids matching outbound connections.
  const output = runQuiet(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`);
  if (output) {
    return { pids: parsePidList(output), method: 'lsof (darwin)' };
  }

  const fallback = runQuiet(`lsof -nP -i :${port} -t`);
  return { pids: parsePidList(fallback), method: 'lsof (darwin, fallback)' };
}

function getListeningPidsLinux(port) {
  // Prefer LISTEN filter when supported (util-linux / recent lsof).
  let output = runQuiet(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`);
  if (output) {
    return { pids: parsePidList(output), method: 'lsof (linux)' };
  }

  // Broader match — some Linux images lack -sTCP:LISTEN.
  output = runQuiet(`lsof -nP -i :${port} -t`);
  if (output) {
    return { pids: parsePidList(output), method: 'lsof (linux, fallback)' };
  }

  // iproute2 ss — common on minimal Linux runners without lsof.
  output = runQuiet(`ss -H -lptn 'sport = :${port}'`);
  const ssPids = parseSsListeningPids(output);
  if (ssPids.length > 0) {
    return { pids: ssPids, method: 'ss' };
  }

  return { pids: [], method: null };
}

function freePortLinuxWithFuser(port) {
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    console.log(`[free-ohif-e2e-port] Freed port ${port} via fuser`);
    return true;
  } catch {
    return false;
  }
}

function freeOhifE2ePortUnix(port) {
  const { pids, method } =
    process.platform === 'darwin'
      ? getListeningPidsDarwin(port)
      : getListeningPidsLinux(port);

  if (pids.length > 0) {
    killPids(pids, port, method);
    return;
  }

  if (process.platform === 'linux') {
    freePortLinuxWithFuser(port);
  }
}

function freeOhifE2ePortWindows(port) {
  const output = runQuiet(
    `netstat -ano | findstr :${port} | findstr LISTENING`
  );

  if (!output) {
    return;
  }

  const pids = [
    ...new Set(
      output
        .split(/\r?\n/)
        .map(line => line.trim().split(/\s+/).pop())
        .filter(Boolean)
    ),
  ];

  killPids(pids, port, 'netstat');
}

export function freeOhifE2ePort(port = getOhifE2ePort()) {
  const { platform } = process;

  if (platform === 'darwin' || platform === 'linux') {
    freeOhifE2ePortUnix(port);
    return;
  }

  if (platform === 'win32') {
    freeOhifE2ePortWindows(port);
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('free-ohif-e2e-port.mjs') ?? false;

if (isDirectRun) {
  freeOhifE2ePort();
}
