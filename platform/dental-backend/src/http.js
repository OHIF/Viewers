const http = require('http');
const { randomUUID } = require('crypto');
const { URL } = require('url');

const { AuthError, authenticateRequest } = require('./auth');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type',
    },
    body: JSON.stringify(body),
  };
}

function notFound() {
  return json(404, { error: 'Not found' });
}

function parseJsonBody(body) {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    return undefined;
  }
}

async function handleDentalRequest({ method, url, headers, body }, { store, config }) {
  const parsedUrl = new URL(url, 'http://localhost');
  const parts = parsedUrl.pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (method === 'OPTIONS') {
    return json(204, {});
  }

  if (parts.length === 1 && parts[0] === 'health') {
    return json(200, { ok: true });
  }

  if (parts[0] !== 'api' || parts[1] !== 'dental') {
    return notFound();
  }

  let session;

  try {
    session = authenticateRequest(headers, config);
  } catch (error) {
    if (error instanceof AuthError) {
      return json(error.statusCode, { error: error.message });
    }

    throw error;
  }

  if (parts[2] === 'state' && parts.length === 4) {
    const studyInstanceUID = parts[3];

    if (method === 'GET') {
      const state = await store.getViewerState(session.userId, studyInstanceUID);
      return json(200, { studyInstanceUID, state: state?.state || null, updatedAt: state?.updatedAt || null });
    }

    if (method === 'PUT') {
      const payload = parseJsonBody(body);

      if (!payload || typeof payload.state !== 'object' || payload.state === null) {
        return json(400, { error: 'Expected JSON body with object field "state"' });
      }

      const state = await store.putViewerState(session.userId, studyInstanceUID, payload.state);
      return json(200, { studyInstanceUID, state: state.state, updatedAt: state.updatedAt });
    }
  }

  if (parts[2] === 'measurements' && parts.length === 4) {
    const studyInstanceUID = parts[3];

    if (method === 'GET') {
      const measurements = await store.listMeasurements(session.userId, studyInstanceUID);
      return json(200, { studyInstanceUID, measurements });
    }

    if (method === 'POST') {
      const payload = parseJsonBody(body);

      if (!payload || typeof payload.label !== 'string' || typeof payload.unit !== 'string') {
        return json(400, { error: 'Expected measurement label and unit' });
      }

      const measurement = await store.createMeasurement(session.userId, studyInstanceUID, {
        id: payload.id || randomUUID(),
        label: payload.label,
        value: Number.isFinite(Number(payload.value)) ? Number(payload.value) : null,
        unit: payload.unit,
        toolName: payload.toolName || null,
        annotationUID: payload.annotationUID || null,
        toothId: payload.toothId || null,
        notes: payload.notes || null,
        metadata: payload.metadata || {},
      });

      return json(201, { studyInstanceUID, measurement });
    }
  }

  if (parts[2] === 'measurements' && parts.length === 5 && method === 'DELETE') {
    const studyInstanceUID = parts[3];
    const measurementId = parts[4];
    const deleted = await store.deleteMeasurement(session.userId, studyInstanceUID, measurementId);

    if (!deleted) {
      return json(404, { error: 'Measurement not found' });
    }

    return json(200, { studyInstanceUID, deleted: true, id: measurementId });
  }

  return notFound();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function createServer({ store, config }) {
  return http.createServer(async (req, res) => {
    try {
      const response = await handleDentalRequest(
        {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: await readBody(req),
        },
        { store, config }
      );

      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

module.exports = {
  createServer,
  handleDentalRequest,
};
