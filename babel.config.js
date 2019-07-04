module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          ie: "11"
        }
      }
    ],
    "@babel/preset-react"
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-transform-regenerator",
    "@babel/plugin-transform-runtime"
  ]
};
