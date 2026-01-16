// server.js - con CORS headers
import express from 'express';
import handler from './api/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ✅ CORS Headers per Stremio
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Proxy tutte le route
app.all('*', handler);

app.listen(PORT, () => {
  console.log(`🚀 Cinemanello API running on http://localhost:${PORT}`);
});
