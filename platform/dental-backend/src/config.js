const path = require('path');

function getConfig(env = process.env) {
  return {
    authToken: env.DENTAL_BACKEND_AUTH_TOKEN || 'dev-dental-token',
    userId: env.DENTAL_BACKEND_USER_ID || 'dev-user',
    port: Number(env.DENTAL_BACKEND_PORT || 4007),
    databasePath:
      env.DENTAL_BACKEND_SQLITE_PATH ||
      path.join(process.cwd(), '.scratch', 'dental-backend.sqlite'),
  };
}

module.exports = {
  getConfig,
};
