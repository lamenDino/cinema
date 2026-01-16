// src/api/index.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your-api-key-here';
const CACHE_FILE = path.join(process.cwd(), 'cache', 'catalog.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ore in ms

// Assicurati che la cartella cache esista
const cacheDir = path.dirname(CACHE_FILE);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Funzione helper per ottenere la data
function getDateRange() {
  const today = new Date();
  const past20 = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
  const future7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    gte: formatDate(past20),
    lte: formatDate(future7)
  };
}

// Funzione per fetchare i film da TMDB
async function fetchFromTMDB() {
  try {
    const dateRange = getDateRange();
    
    const url = new URL('https://api.themoviedb.org/3/discover/movie');
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('sort_by', 'popularity.desc');
    url.searchParams.append('primary_release_date.gte', dateRange.gte);
    url.searchParams.append('primary_release_date.lte', dateRange.lte);
    url.searchParams.append('with_release_type', '2|3'); // Theatrical | Theatrical Limited
    url.searchParams.append('page', '1');
    url.searchParams.append('language', 'it-IT');
    url.searchParams.append('region', 'IT');

    console.log(`🔄 Fetching TMDB... ${url.toString()}`);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results) {
      throw new Error('No results from TMDB');
    }

    // Trasforma i risultati nel formato Stremio
    const metas = data.results.slice(0, 50).map((movie) => ({
      id: `tmdb:${movie.id}`,
      type: 'movie',
      name: movie.title,
      year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      poster: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster',
      description: movie.overview || 'No description available',
      rating: movie.vote_average ? (movie.vote_average * 10).toFixed(0) : null,
      imdId: null
    }));

    // Salva nella cache
    const cacheData = {
      timestamp: Date.now(),
      metas
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log(`✅ Cache aggiornata: ${metas.length} film`);

    return metas;
  } catch (error) {
    console.error('❌ Errore TMDB:', error.message);
    return null;
  }
}

// Funzione per leggere dalla cache
function readFromCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    const age = Date.now() - cacheData.timestamp;

    // Se la cache è fresca (< 24h), usala
    if (age < CACHE_TTL) {
      console.log(`📦 Cache valida: ${Math.floor(age / 1000 / 60)}min fa`);
      return cacheData.metas;
    }

    console.log(`⏳ Cache scaduta: ${Math.floor(age / 1000 / 60 / 60)}h fa`);
    return null;
  } catch (error) {
    console.error('❌ Errore lettura cache:', error.message);
    return null;
  }
}

// Funzione principale per ottenere il catalogo
async function getCatalog() {
  // Prova prima con la cache
  let metas = readFromCache();

  // Se cache non valida, aggiorna da TMDB
  if (!metas) {
    metas = await fetchFromTMDB();
  }

  // Se TMDB fallisce, ritorna cache vecchia o vuoto
  if (!metas) {
    const oldCache = fs.existsSync(CACHE_FILE)
      ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')).metas
      : [];
    return oldCache;
  }

  return metas;
}

// Handler Express
export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // MANIFEST
  if (pathname === '/manifest.json') {
    return res.json({
      id: 'org.lamenDino.cinemanello',
      version: '1.0.0',
      name: 'Cinemanello 🎬',
      description: 'Cinema catalog - Updated every 24h',
      types: ['movie'],
      catalogs: [
        {
          type: 'movie',
          id: 'al-cinema',
          name: '🎬 Al Cinema (24h)',
          extra: []
        }
      ],
      resources: ['catalog'],
      contactEmail: 'your@email.com'
    });
  }

  // CATALOG HANDLER
  if (pathname === '/catalog/movie/al-cinema') {
    const metas = await getCatalog();
    return res.json({
      metas,
      cacheMaxAge: 3600 // Cache Stremio: 1 ora
    });
  }

  // STATUS
  if (pathname === '/status') {
    const cacheAge = fs.existsSync(CACHE_FILE)
      ? Math.floor((Date.now() - JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')).timestamp) / 1000 / 60)
      : null;

    return res.json({
      status: 'OK',
      api: 'Cinemanello v1.0.0',
      tmdb: TMDB_API_KEY ? '✅ Configured' : '❌ Missing API Key',
      cache_age_minutes: cacheAge,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  res.status(404).json({ error: 'Not found' });
}
