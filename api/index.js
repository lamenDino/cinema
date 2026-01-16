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

// ✅ Check API Key all'avvio
if (!process.env.TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY not found in environment variables!');
  process.exit(1);
}

console.log('✅ TMDB_API_KEY configured');
console.log('✅ Starting Cinemanello API...');

// Manifest JSON
const manifest = {
  "id": "org.cinema.cinemanello",
  "version": "1.0.4",
  "name": "🎬 Cinemanello",
  "description": "Film Cinematici TMDB - Aggiornamento 24h",
  "types": ["movie"],
  "catalogs": [
    {
      "type": "movie",
      "id": "alcinema",
      "name": "🍿 Film Cinematici"
    }
  ],
  "resources": ["catalog", "meta"],
  "contactEmail": "your@email.com"
};

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ✅ Cache con TTL (24 ore)
let filmCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore in ms

// ✅ Fetch film da TMDB con parametri ottimizzati
async function fetchFilmFromTMDB() {
  try {
    console.log(`📅 Fetching films from Italy (3 months)...`);
    
    const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    
    // 🎬 Parametri di ricerca specifici
    url.searchParams.append('sort_by', 'popularity.desc');
    url.searchParams.append('region', 'IT');
    
    // 📅 Release date: ultimi 3 mesi
    const today = new Date();
    const from3MonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toToday = today.toISOString().split('T')[0];
    
    url.searchParams.append('primary_release_date.gte', from3MonthsAgo);
    url.searchParams.append('primary_release_date.lte', toToday);
    
    // 🎭 Tutti i release type (2=Theatrical, 3=Theatrical Limited, 4=Digital, 5=Physical, 6=TV)
    url.searchParams.append('with_release_type', '2|3|4|5|6');
    url.searchParams.append('language', 'en,it');
    url.searchParams.append('page', '1');
    url.searchParams.append('per_page', '50');
    
    console.log(`🌍 Query: Film italiani (${from3MonthsAgo} - ${toToday}) - Tutti i release type - 50 risultati per popolarità globale`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Trasforma risultati TMDB in formato Stremio
    const metas = data.results
      .filter(movie => movie.poster_path)
      .slice(0, 100)
      .map(movie => ({
        id: `tmdb:${movie.id}`,
        type: 'movie',
        name: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A',
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        description: movie.overview || 'Film in uscita',
        releaseInfo: movie.release_date || 'N/A'
      }));
    
    console.log(`✅ Fetched ${metas.length} films from TMDB`);
    
    // Aggiorna cache
    filmCache = metas;
    cacheTimestamp = Date.now();
    
    return metas;
  } catch (error) {
    console.error('❌ TMDB Fetch Error:', error);
    if (filmCache) {
      console.log('⚠️  Using stale cache');
      return filmCache;
    }
    return [];
  }
}

// ✅ Endpoint manifest
app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

// ✅ HANDLER CATALOGO CON CACHE
app.get('/catalog/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  
  if (type === 'movie' && id === 'alcinema') {
    try {
      const isExpired = (Date.now() - cacheTimestamp) > CACHE_DURATION;
      
      if (!filmCache || isExpired) {
        console.log('🔄 Cache expired or empty, fetching fresh data...');
        await fetchFilmFromTMDB();
      } else {
        console.log(`💾 Using cached data (${Math.round((Date.now() - cacheTimestamp) / 1000)}s old)`);
      }
      
      return res.json({
        metas: filmCache || [],
        cacheMaxAge: 86400
      });
    } catch (error) {
      console.error('Catalog handler error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  res.status(404).json({ error: 'Catalog not found' });
});

// ✅ META HANDLER - Dettagli film
app.get('/meta/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  
  const tmdbId = id.split(':')[1];
  
  if (!tmdbId) {
    return res.status(404).json({ error: 'Invalid ID format' });
  }
  
  try {
    console.log(`📽️ Fetching meta for: ${id}`);
    
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=it,en&append_to_response=credits`
    );
    
    if (!response.ok) {
      console.log(`⚠️ Meta not found for ID: ${id}`);
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const movie = await response.json();
    
    let director = [];
    let cast = [];
    
    if (movie.credits && movie.credits.crew) {
      director = movie.credits.crew
        .filter(person => person.job === 'Director')
        .map(person => person.name);
    }
    
    if (movie.credits && movie.credits.cast) {
      cast = movie.credits.cast
        .slice(0, 5)
        .map(person => person.name);
    }
    
    const meta = {
      id: id,
      type: 'movie',
      name: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      background: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : null,
      description: movie.overview,
      releaseInfo: movie.release_date,
      runtime: movie.runtime,
      imdbRating: movie.vote_average / 2,
      director: director,
      cast: cast,
      genre: movie.genres ? movie.genres.map(g => g.name) : [],
      country: movie.production_countries ? movie.production_countries.map(c => c.iso_3166_1) : [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    console.log(`✅ Meta fetched: ${movie.title}`);
    res.json({ meta });
  } catch (error) {
    console.error('Meta handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Root redirect
app.get('/', (req, res) => {
  res.redirect('/manifest.json');
});

// ✅ Status endpoint
app.get('/status', async (req, res) => {
  const isExpired = (Date.now() - cacheTimestamp) > CACHE_DURATION;
  
  res.json({
    status: "OK",
    api: "Cinemanello v1.0.4",
    tmdb: "✅ Configured",
    cache_films: filmCache ? filmCache.length : 0,
    cache_age_minutes: Math.round((Date.now() - cacheTimestamp) / 60000),
    cache_expired: isExpired,
    next_refresh: new Date(cacheTimestamp + CACHE_DURATION).toISOString()
  });
});

// ✅ Endpoint per refresh manuale
app.post('/refresh', async (req, res) => {
  console.log('🔄 Manual refresh requested');
  const films = await fetchFilmFromTMDB();
  res.json({
    status: "Refreshed",
    films_count: films.length,
    timestamp: new Date().toISOString()
  });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ✅ 🚀 Start server on port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📌 Manifest: http://localhost:${PORT}/manifest.json`);
  console.log(`🎬 Cinemanello ready!`);
});

export default app;
