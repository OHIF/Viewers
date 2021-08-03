const stylusToJavaScript = {
  test: /\.styl$/,
  use: [
    { loader: 'style-loader' }, // 3. Style nodes from JS Strings
    { loader: 'css-loader' }, // 2. CSS to CommonJS
    { loader: 'stylus-loader' }, // 1. Stylus to CSS
  ],
};

module.exports = stylusToJavaScript;
