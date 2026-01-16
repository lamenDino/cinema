// api/index.js
import express from 'express';

const app = express();

// ✅ CORS Middleware GLOBALE
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Manifest JSON
const manifest = {
  "id": "org.cinema.cinemanello",
  "version": "1.0.0",
  "name": "🎬 Cinemanello",
  "description": "Film in sala e streaming",
  "types": ["movie"],
  "catalogs": [
    {
      "type": "movie",
      "id": "alcinema",
      "name": "🍿 Al Cinema"
    }
  ],
  "resources": ["catalog"],
  "contactEmail": "your@email.com"
};

// ✅ I tuoi film
const miei_film = [
  {
    id: "tmdb:939243",
    type: "movie",
    name: "People We Meet on Vacation",
    year: 2026,
    poster: "https://image.tmdb.org/t/p/w500/xzZaU0MN6L9oc1pl0RUXSB7hWwD.jpg",
    description: "Poppy's a free spirit. Alex loves a plan..."
  },
  {
    id: "tmdb:1315303",
    type: "movie",
    name: "Primate",
    year: 2026,
    poster: "https://image.tmdb.org/t/p/w500/5Q1zdYe9PYEXMGELzjfjyx8Eb7H.jpg",
    description: "Lucy, a college student, along with her friends..."
  },
  {
    id: "tmdb:533528",
    type: "movie",
    name: "Greenland 2: Migration",
    year: 2026,
    poster: "https://image.tmdb.org/t/p/w500/poster.jpg",
    description: "La continuazione di Greenland..."
  }
];

// ✅ Endpoint manifest
app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

// ✅ HANDLER CATALOGO - IL PIÙ IMPORTANTE!
app.get('/catalog/:type/:id.json', (req, res) => {
  const { type, id } = req.params;
  
  console.log(`Catalogo richiesto: tipo=${type}, id=${id}`);
  
  if (type === 'movie' && id === 'alcinema') {
    return res.json({
      metas: miei_film
    });
  }
  
  // Se catalogo non trovato
  res.status(404).json({ error: 'Catalog not found' });
});

// ✅ Root redirect
app.get('/', (req, res) => {
  res.redirect('/manifest.json');
});

// ✅ Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: "OK",
    api: "Cinemanello v1.0.0",
    tmdb: "✅ Configured"
  });
});

export default app;
