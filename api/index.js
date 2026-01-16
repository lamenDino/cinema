// api/index.js - Render handler per Stremio addon (FIXED)
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
      const type = parts[2];
      const catalogId = parts[3];

      const filmsAlCinema = [
        {
          id: 'tmdb:939243',
          type: 'movie',
          name: 'People We Meet on Vacation',
          year: 2026,
          rating: 7.2,
          poster: 'https://image.tmdb.org/t/p/w500/xzZaU0MN6L9oc1pl0RUXSB7hWwD.jpg',
          description: 'Una storia di amore e avventura'
        },
        {
          id: 'tmdb:1315303',
          type: 'movie',
          name: 'Primate',
          year: 2026,
          rating: 6.8,
          poster: 'https://image.tmdb.org/t/p/w500/5Q1zdYe9PYEXMGELzjfjyx8Eb7H.jpg',
          description: 'Un avventura misteriosa'
        },
        {
          id: 'tmdb:550',
          type: 'movie',
          name: 'Fight Club',
          year: 1999,
          rating: 8.8,
          poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PchJ.jpg',
          description: 'Capolavoro del cinema moderno'
        }
      ];

      const filmPopulari = [
        {
          id: 'tmdb:278',
          type: 'movie',
          name: 'The Shawshank Redemption',
          year: 1994,
          rating: 9.3,
          poster: 'https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMSnEE4XpHn9QI.jpg',
          description: 'Il miglior film di sempre'
        }
      ];

      let metas = [];
      if (type === 'movie') {
        if (catalogId === 'alcinema') {
          metas = filmsAlCinema;
        } else if (catalogId === 'populari') {
          metas = filmPopulari;
        }
      }

      return res.status(200).json({
        metas: metas,
        cacheMaxAge: 3600
      });
    }

    // ==================== META ====================
    if (pathname.startsWith('/meta/')) {
      const parts = pathname.split('/');
      const type = parts[2];
      const id = parts[3];

      return res.status(200).json({
        meta: {
          id: id,
          type: type,
          name: 'Film Example',
          year: 2026,
          poster: 'https://image.tmdb.org/t/p/w500/poster.jpg'
        },
        cacheMaxAge: 86400
      });
    }

    // ==================== STREAM ====================
    if (pathname.startsWith('/stream/')) {
      return res.status(200).json({
        streams: [
          {
            title: 'Stream 1080p',
            url: 'https://example.com/stream.m3u8',
            quality: '1080p'
          }
        ]
      });
    }

    // ==================== STATUS ====================
    if (pathname === '/status' || pathname === '/ping') {
      return res.status(200).json({
        status: 'OK',
        api: 'Cinemanello v1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }

    // ==================== 404 ====================
    res.status(404).json({
      error: 'Endpoint not found',
      path: pathname,
      available: [
        '/manifest.json',
        '/catalog/movie/alcinema',
        '/catalog/movie/populari',
        '/status'
      ]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
}
