// server.js - Render entry point (ES Module version)
import handler from './api/index.js';
import http from 'http';

const PORT = process.env.PORT || 3000;

// Crea un semplice server HTTP
const server = http.createServer(async (req, res) => {
  // Passa a Next.js-style handler
  await handler(
    { 
      url: req.url, 
      method: req.method,
      headers: req.headers
    },
    res
  );
});

server.listen(PORT, () => {
  console.log(`🚀 Cinemanello API running on http://localhost:${PORT}`);
  console.log(`📋 Manifest: http://localhost:${PORT}/manifest.json`);
  console.log(`✅ Status: http://localhost:${PORT}/status`);
});
