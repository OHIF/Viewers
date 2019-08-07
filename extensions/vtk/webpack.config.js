const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
// const vtkHtmlRules = require('vtk.js/Utilities/config/dependency.js').webpack
//   .core.rules;
// Optional if you want to load *.css and *.module.css files
// var cssRules = require('vtk.js/Utilities/config/dependency.js').webpack.css.rules;
const SRC_DIR = path.join(__dirname, "./src");
const OUTPUT_DIR = path.join(__dirname, "./dist");

module.exports = {
  mode: "development",
  entry: {
    app: `${SRC_DIR}/index.js`
  },
  context: SRC_DIR,
  // ~~~ MODE
  output: {
    path: OUTPUT_DIR,
    library: "ohifVtkExtension",
    libraryTarget: "umd",
    filename: "index.umd.js",
    auxiliaryComment: "Text VTK Extension Comment"
  },
  stats: {
    colors: true,
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
    minimize: false,
    sideEffects: true
  },
  // ~~~ END MODE
  resolve: {
    modules: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(__dirname, "../../node_modules"),
      SRC_DIR
    ],
    extensions: [".js", ".jsx", ".json", "*"],
    symlinks: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: [/node_modules/],
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
      /**
       *
       */
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [autoprefixer("last 2 version", "ie >= 10")]
            }
          }
        ]
      },
      /**
       *
       */
      {
        test: /\.glsl$/i,
        include: /vtk\.js[\/\\]Sources/,
        loader: "shader-loader"
      },
      /**
       *
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
      }
    ]
  }
  // externals: [
  //   {
  //     cornerstone: {
  //       commonjs: 'cornerstone',
  //       commonjs2: 'cornerstone',
  //       amd: 'cornerstone',
  //       root: 'cornerstone',
  //     },
  //     'cornerstone-math': {
  //       commonjs: 'cornerstone-math',
  //       commonjs2: 'cornerstone-math',
  //       amd: 'cornerstone-math',
  //       root: 'cornerstoneMath',
  //     },
  //   },
  //   '@ohif/i18n',
  //   '@ohif/core',
  //   'dcmjs',
  //   'react-viewerbase',
  //   'react', //: 'React',
  //   'react-dom', //: 'ReactDOM',
  //   'react-redux', //: 'ReactRedux',
  //   'react-resize-detector', //: 'ReactResizeDetector',
  //   'react-viewerbase', //: 'reactViewerbase',
  //   'prop-types', //: 'PropTypes'
  //   /*/\b(vtk.js)/*/
  // ],
};
