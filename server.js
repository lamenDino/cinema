// server.js - Render entry point
import express from 'express';
import handler from './api/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Proxy tutte le route a handler
app.all('*', handler);

app.listen(PORT, () => {
  console.log(`🚀 Cinemanello API running on http://localhost:${PORT}`);
  console.log(`📋 Manifest: http://localhost:${PORT}/manifest.json`);
  console.log(`✅ Status: http://localhost:${PORT}/status`);
});
