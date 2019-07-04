var path = require('path');
var webpack = require('webpack');

const autoprefixer = require('autoprefixer');

const cssRules = [
  {
    test: /\.css$/,
    exclude: /\.module\.css$/,
    use: [
      'style-loader',
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => [autoprefixer('last 2 version', 'ie >= 10')]
        }
      }
    ]
  },
  {
    test: /\.glsl$/i,
    include: /vtk\.js[\/\\]Sources/,
    loader: 'shader-loader'
  },
  {
    test: /\.worker\.js$/,
    include: /vtk\.js[\/\\]Sources/,
    use: [
      {
        loader: 'worker-loader',
        options: { inline: true, fallback: false }
      }
    ]
  },
  {
    test: /\.css$/,
    include: /\.module\.css$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
          modules: true
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => [autoprefixer('last 2 version', 'ie >= 10')]
        }
      }
    ]
  }
];

var entry = path.join(__dirname, './src/index.js');
const sourcePath = path.join(__dirname, './src');
const outputPath = path.join(__dirname, './dist');

module.exports = {
  entry,
  output: {
    path: outputPath,
    filename: 'index.umd.js',
    library: '@ohif/extension-vtk',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ].concat(cssRules)
  },
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules'), sourcePath]
  },
  externals: [
    {
      'cornerstone-core': {
        commonjs: 'cornerstone-core',
        commonjs2: 'cornerstone-core',
        amd: 'cornerstone-core',
        root: 'cornerstone'
      },
      'cornerstone-math': {
        commonjs: 'cornerstone-math',
        commonjs2: 'cornerstone-math',
        amd: 'cornerstone-math',
        root: 'cornerstoneMath'
      }
    },
    '@ohif/i18n',
    'ohif-core',
    'dcmjs',
    'react-viewerbase',
    'react', //: 'React',
    'react-dom', //: 'ReactDOM',
    'react-redux', //: 'ReactRedux',
    'react-resize-detector', //: 'ReactResizeDetector',
    'react-viewerbase', //: 'reactViewerbase',
    'prop-types' //: 'PropTypes'
    /*/\b(vtk.js)/*/
  ]
};
