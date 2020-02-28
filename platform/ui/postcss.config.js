const path = require('path');
const tailwindcss = require('tailwindcss');
// const commonConfigs = require('../../postcss.config.js');

const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');

module.exports = {
  // ...commonConfigs,
  plugins: [tailwindcss(tailwindConfigPath), require('autoprefixer')],
};
