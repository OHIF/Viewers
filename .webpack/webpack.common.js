const path = require("path");
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");

const SRC_DIR = path.join(__dirname, "../src");
const PUBLIC_DIR = path.join(__dirname, "../public");
const DIST_DIR = path.join(__dirname, "../dist");

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  return {
    entry: {
      app: `${SRC_DIR}/index.js`
    },
    context: SRC_DIR,
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/, /packages\\extension/],
          loader: "babel-loader",
          options: {
            // Find babel.config.js in monorepo root
            // https://babeljs.io/docs/en/options#rootmode
            rootMode: "upward",
            presets: [
              [
                "@babel/preset-env",
                {
                  // Do not transform ES6 modules to another format.
                  // Webpack will take care of that.
                  modules: false
                }
              ]
            ]
          }
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            ExtractCssChunks.loader,
            { loader: "css-loader", options: { importLoaders: 1 } },
            {
              loader: "postcss-loader",
              options: {
                config: {
                  path: "./postcss.config.js"
                }
              }
            }
          ]
        },
        /**
         * This allows us to include web workers in our bundle, and VTK.js
         * web workers in our bundle. While this increases bundle size, it
         * cuts down on the number of includes we need for `script tag` usage.
         */
        {
          test: /\.worker\.js$/,
          include: /vtk\.js[\/\\]Sources/,
          use: [
            {
              loader: "worker-loader",
              options: { inline: true, fallback: false }
            }
          ]
        },
        /**
         * This is exclusively used by `vtk.js` to bundle glsl files.
         */
        {
          test: /\.glsl$/i,
          include: /vtk\.js[\/\\]Sources/,
          loader: "shader-loader"
        }
      ]
    },
    resolve: {
      // Which directories to search when resolving modules
      modules: [
        path.resolve(__dirname, "../node_modules"),
        path.resolve(__dirname, "../../../node_modules"),
        SRC_DIR
      ],
      // Attempt to resolve these extensions in order.
      extensions: [".js", ".jsx", ".json", "*"],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true
    }
  };
};
