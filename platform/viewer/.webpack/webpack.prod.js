const merge = require("webpack-merge");
const path = require("path");
const workboxPlugin = require("workbox-webpack-plugin");
const common = require("./webpack.common");

const SRC_DIR = path.join(__dirname, "../src");
const DIST_DIR = path.join(__dirname, "../dist");

module.exports = (env, argv) => {
  const commonConfig = common(env, argv);

  return merge(commonConfig, {
    mode: "production",
    stats: {
      colors: false,
      hash: true,
      timings: true,
      assets: true,
      chunks: true,
      chunkModules: true,
      modules: true,
      children: true,
      warnings: true
    },
    optimization: {
      minimize: true,
      sideEffects: true
    },
    output: {
      path: DIST_DIR,
      filename: "[name].bundle.[chunkhash].js"
    },
    module: {
      rules: [
        {
          test: /\.(gif|jpe?g|png|svg)$/i,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 8192
              }
            }
          ]
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/i,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 50000
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new workboxPlugin.GenerateSW({
        swDest: "sw.js",
        clientsClaim: true,
        skipWaiting: true
      })
    ]
  });
};
