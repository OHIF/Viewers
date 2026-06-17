class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function getHeader(headers, name) {
  if (!headers) {
    return undefined;
  }

  if (typeof headers.get === 'function') {
    return headers.get(name);
  }

  const lowerName = name.toLowerCase();
  return headers[name] || headers[lowerName];
}

function authenticateRequest(headers, { authToken, userId }) {
  const authorization = getHeader(headers, 'authorization');

  if (!authorization) {
    throw new AuthError('Missing bearer token');
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());

  if (!match) {
    throw new AuthError('Invalid authorization scheme');
  }

  if (match[1] !== authToken) {
    throw new AuthError('Invalid bearer token', 403);
  }

  return {
    userId,
  };
}

module.exports = {
  AuthError,
  authenticateRequest,
};
