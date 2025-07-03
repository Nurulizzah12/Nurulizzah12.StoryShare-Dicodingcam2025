const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].bundle.js',
    clean: true,
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/templates/index.html',
      filename: 'index.html',
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist'),
          globOptions: {
            ignore: [
              '**/service-worker.js',
              '**/*.html',
            ],
          },
        },
        {
            from: path.resolve(__dirname, 'node_modules/leaflet/dist/images'),
            to: path.resolve(__dirname, 'dist/images'),
            noErrorOnMissing: true,
        },
        {
            from: path.resolve(__dirname, 'public/images/placehold.co_400x300_333_ffffff_text_No_Image.png'),
            to: path.resolve(__dirname, 'dist/images/placehold.co_400x300_333_ffffff_text_No_Image.png'),
            noErrorOnMissing: true,
        },
        {
            from: path.resolve(__dirname, 'public/images/placehold.co_600x400_333_ffffff_text_No_Image.png'),
            to: path.resolve(__dirname, 'dist/images/placehold.co_600x400_333_ffffff_text_No_Image.png'),
            noErrorOnMissing: true,
        },
        {
            from: path.resolve(__dirname, 'public/images/icons'),
            to: path.resolve(__dirname, 'dist/images/icons'),
            noErrorOnMissing: true,
        },
      ],
    }),

    new MiniCssExtractPlugin({
      filename: 'css/[name].bundle.css',
    }),

    // ✅ DIPERBAIKI: Hanya aktifkan InjectManifest untuk production
    ...(isProduction ? [
      new InjectManifest({
        swSrc: './src/service-worker.js',
        swDest: 'service-worker.js',
        exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
      })
    ] : []),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]'
        }
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
    // ✅ DIPERBAIKI: Matikan semua auto-reload features
    hot: false,
    liveReload: false,
    watchFiles: false,
    // ✅ Opsional: Tambahkan client overlay untuk error saja
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: false, // Matikan auto-reconnect
    },
  },
  // ✅ DIPERBAIKI: Tambahkan watchOptions untuk kontrol file watching
  watchOptions: {
    ignored: /node_modules/,
    poll: false, // Matikan polling yang bisa menyebabkan reload berlebihan
    aggregateTimeout: 1000, // Delay sebelum rebuild
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
  performance: {
    hints: false,
  },
};