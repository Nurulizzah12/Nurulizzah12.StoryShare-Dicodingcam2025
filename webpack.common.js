// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/index.js'), // Sesuaikan jika entry point Anda di src/scripts/index.js
  },
  output: {
    filename: 'js/[name].bundle.js', // Output folder 'js'
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Membersihkan direktori dist sebelum build
    publicPath: '/', // Penting agar path asset dan service worker benar
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico|webp)$/i, // Pastikan semua tipe gambar dicakup
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]' // Output ke folder images
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i, // Aturan untuk font
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]' // Output ke folder fonts
        }
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/templates/index.html'), // SESUAIKAN JALUR INI
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist'),
          globOptions: {
            ignore: [
              '**/service-worker.js', // InjectManifest akan menangani ini
              '**/*.html', // HtmlWebpackPlugin akan menangani ini
            ],
          },
        },
        // SALIN SEMUA POLA COPY LAINNYA DARI WEBPACK.CONFIG.JS LAMA ANDA
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
  ],
};