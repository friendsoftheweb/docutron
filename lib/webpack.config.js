const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const devServerPort = process.env.WEBPACK_PORT || 8080;

const testBuild = process.env.NODE_ENV === 'test';
const productionBuild = process.env.NODE_ENV === 'production';
const developmentBuild = !(productionBuild || testBuild);

const extractSCSS = new ExtractTextPlugin('[name].css');

const context = process.cwd();

module.exports = {
  context: __dirname,

  devtool: 'inline-source-map',

  entry: {
    assets: generateEntry('./assets/styles/index.scss')
  },

  output: generateOutput(),
  plugins: generatePlugins(),

  resolve: {
    modules: [path.join(context, 'assets'), 'node_modules'],
    extensions: ['.scss']
  },

  module: {
    rules: generateRules()
  }
};

function generateEntry(entryPath) {
  const entry = [];

  entry.push(path.resolve(context, entryPath));

  return entry;
}

function generateOutput() {
  const output = {};

  output.path = path.join(context, 'tmp/output');
  output.filename = '[name].js';

  return output;
}

function generatePlugins() {
  const plugins = [extractSCSS];

  return plugins;
}

function generateRules() {
  return [
    {
      test: /\.scss$/,
      use: extractSCSS.extract([
        {
          loader: 'css-loader',
          options: {
            root: path.join(context, 'assets')
          }
        },
        {
          loader: 'sass-loader'
        }
      ])
    },
    {
      test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
      use: [
        {
          loader: 'url-loader'
        }
      ]
    }
  ];
}
