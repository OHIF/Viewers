const base = require("../../jest.config.base.js");
const pkg = require("./package");

const esModules = ["react-dnd"];

module.exports = {
  ...base,
  name: pkg.name,
  displayName: pkg.name
};
