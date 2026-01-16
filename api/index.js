// src/api/index.js
export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Manifest
  if (pathname === '/manifest.json') {
    return res.json({
      id: 'org.lamenDino.cinemanello',
      version: '1.0.0',
      name: 'Cinemanello 🎬',
      description: 'Your personal cinema catalog',
      types: ['movie'],
      catalogs: [
        {
          type: 'movie',
          id: 'top-movies',
          name: 'Top Cinema Films'
        }
      ],
      resources: ['catalog']
    });
  }

  // Catalog Handler
  if (pathname === '/catalog/movie/top-movies') {
    const metas = [
      {
        id: 'tmdb:939243',
        type: 'movie',
        name: 'People We Meet on Vacation',
        year: 2026,
        poster: 'https://image.tmdb.org/t/p/w500/xzZaU0MN6L9oc1pl0RUXSB7hWwD.jpg',
        description: 'Poppy\'s a free spirit. Alex loves a plan.'
      },
      {
        id: 'tmdb:1315303',
        type: 'movie',
        name: 'Primate',
        year: 2026,
        poster: 'https://image.tmdb.org/t/p/w500/5Q1zdYe9PYEXMGELzjfjyx8Eb7H.jpg',
        description: 'Lucy and friends discover something extraordinary.'
      },
      {
        id: 'tmdb:1067805',
        type: 'movie',
        name: 'Greenland 2: Migration',
        year: 2026,
        poster: 'https://image.tmdb.org/t/p/w500/...',
        description: 'Survival continues...'
      }
    ];

    return res.json({
      metas,
      cacheMaxAge: 3600
    });
  }

  // Status
  if (pathname === '/status') {
    return res.json({
      status: 'OK',
      api: 'Cinemanello v1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  res.status(404).json({ error: 'Not found' });
}
