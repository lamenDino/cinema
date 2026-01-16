// api/index.js - Render handler per Stremio addon
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // ==================== MANIFEST ====================
    if (pathname === '/' || pathname === '/manifest.json') {
      return res.status(200).json({
        id: 'org.vitouchiha.cinemanello',
        version: '1.0.0',
        name: '🍿 Cinemanello',
        description: 'Catalogo film personalizzato - Vitouchiha',
        logo: 'https://raw.githubusercontent.com/vitouchiha/cinemanello/main/icon.png',
        background: 'https://raw.githubusercontent.com/vitouchiha/cinemanello/main/bg.jpg',
        resources: ['catalog', 'meta', 'stream'],
        types: ['movie', 'tv'],
        catalogs: [
          {
            type: 'movie',
            id: 'alcinema',
            name: '🎬 Al Cinema',
            extra: []
          },
          {
            type: 'movie',
            id: 'populari',
            name: '⭐ Film Popolari',
            extra: []
          }
        ],
        contactEmail: 'vitouchiha@email.com'
      });
    }

    // ==================== CATALOG ====================
    if (pathname.startsWith('/catalog/')) {
      const parts = pathname.split('/');
      const type = parts[2]; // movie o tv
      const catalogId = parts[3]; // alcinema, populari

      const filmsAlCinema = [
        {
          id: 'tmdb:939243',
          type: 'movie',
          name: 'People We Meet on Vacation',
          year: 2026,
          rating: 7.2,
          poster: 'https://image.tmdb.org/t/p/w500/xzZaU0MN6L9oc1pl0RUXSB7hWwD.jpg',
          description: 'Una storia d\'amore e avventura'
        },
        {
          id: 'tmdb:1315303',
          type: 'movie',
          name: 'Primate',
          year: 2026,
          rating: 6.8,
          poster: 'https://image.tmdb.org/t/p/w500/5Q1zdYe9PYEXMGELzjfjyx8Eb7H.jpg',
          description: 'Un\'avventura misterios
