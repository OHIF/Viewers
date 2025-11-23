// Import package.json to get the mode id
const packageJson = require('../package.json');

const id = packageJson.name;

export { id };
