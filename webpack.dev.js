// webpack.dev.js
const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    open: true,
    historyApiFallback: true,
    hot: false,
    liveReload: false,
    watchFiles: false,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: false,
    },
    watchOptions: {
      ignored: /node_modules/,
      poll: false,
      aggregateTimeout: 1000,
    },
  },
  performance: {
    hints: false,
  },
});
