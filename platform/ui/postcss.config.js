const path = require('path');
const tailwindcss = require('tailwindcss');
const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');

module.exports = {
  plugins: [tailwindcss(tailwindConfigPath), require('autoprefixer')],
};
