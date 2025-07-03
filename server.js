// server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8082; // Gunakan port yang berbeda dari webpack-dev-server

// Enable CORS untuk semua request
app.use(cors());

// Serve static files (jika perlu)
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests ke story-api.dicoding.dev
app.use('/api', createProxyMiddleware({
  target: 'https://story-api.dicoding.dev',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1': '/v1', // rewrite path
    '^/api': '/v1' // default ke v1 endpoint
  },
  onProxyRes: function(proxyRes, req, res) {
    // Log response
    console.log(`Proxied ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
  },
  onError: function(err, req, res) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`API requests will be proxied to https://story-api.dicoding.dev`);
  console.log(`Use http://localhost:${PORT}/api/ as your API base URL`);
});