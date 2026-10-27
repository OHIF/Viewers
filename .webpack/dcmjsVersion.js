const fs = require('fs');
const path = require('path');

// dcmjs has no runtime version export, and its `exports` map hides package.json,
// so read it next to the resolved build file.
const dcmjsPackageJson = path.join(path.dirname(require.resolve('dcmjs')), '../package.json');

module.exports = JSON.parse(fs.readFileSync(dcmjsPackageJson, 'utf8')).version;
