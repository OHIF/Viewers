const { getConfig } = require('./config');
const { createServer } = require('./http');
const { DentalSQLiteStore } = require('./sqliteStore');

async function start() {
  const config = getConfig();
  const store = await DentalSQLiteStore.create({ databasePath: config.databasePath });
  const server = createServer({ store, config });

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Dental backend listening on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  start().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  start,
  getConfig,
  createServer,
  DentalSQLiteStore,
};
