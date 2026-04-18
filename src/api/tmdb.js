// src/api/tmdb.js
const API_KEY = 'c9ae557803081c8546b65026fec5a5bc';
const BASE_URL = 'https://api.themoviedb.org/3';

// Simple Cache System
const cache = new Map();
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.time > CACHE_TIME) {
    cache.delete(key);
    return null;
  }
  return cached.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, time: Date.now() });
};

export const getImageUrl = (path, size = 'w500') => `https://image.tmdb.org/t/p/${size}${path}`;

export const fetchMovies = async (endpoint) => {
  const cacheKey = `movies_${endpoint}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const divider = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${BASE_URL}${endpoint}${divider}api_key=${API_KEY}&language=es-MX`);
    if (!response.ok) throw new Error("Error fetching data");
    const data = await response.json();
    setCache(cacheKey, data.results);
    return data.results;
  } catch (error) {
    console.error("Error from TMDB:", error);
    return [];
  }
};

export const searchMovies = async (query) => {
  const cacheKey = `search_${query}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${query}`);
    if (!response.ok) throw new Error("Error searching data");
    const data = await response.json();
    setCache(cacheKey, data.results);
    return data.results;
  } catch (error) {
    console.error("Error from TMDB Search:", error);
    return [];
  }
};

export const fetchFilteredData = async (type = 'movie', genreId = '', year = '') => {
  const cacheKey = `filter_${type}_${genreId}_${year}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`;
    if (genreId) url += `&with_genres=${genreId}`;
    if (year) {
       if (type === 'movie') url += `&primary_release_year=${year}`;
       if (type === 'tv') url += `&first_air_date_year=${year}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error fetching filtered data");
    const data = await response.json();
    setCache(cacheKey, data.results);
    return data.results;
  } catch (error) {
    console.error("Error from TMDB Filter:", error);
    return [];
  }
};

export const fetchCollection = async (collectionId) => {
  const cacheKey = `collection_${collectionId}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(`${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}&language=es-MX`);
    if (!response.ok) throw new Error("Error fetching collection");
    const data = await response.json();
    const result = data.parts || [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("TMDB Collection Error:", error);
    return [];
  }
};

export const fetchMovieLogo = async (id, type = 'movie') => {
  const cacheKey = `logo_${type}_${id}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const res = await fetch(`${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`);
    const data = await res.json();
    let logoPath = null;
    if (data.logos && data.logos.length > 0) {
      const preferred = data.logos.find(l => l.iso_639_1 === 'es') || 
                        data.logos.find(l => l.iso_639_1 === 'en') || 
                        data.logos[0];
      logoPath = preferred ? preferred.file_path : null;
    }
    setCache(cacheKey, logoPath);
    return logoPath;
  } catch (error) {
    console.error("TMDB Logo Fetch Error:", error);
    return null;
  }
};


export const fetchSeasonEpisodes = async (tvId, seasonNumber) => {
  const cacheKey = `episodes_${tvId}_${seasonNumber}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=es-MX`);
    if (!res.ok) throw new Error("Error fetching episodes");
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("TMDB Season Fetch Error:", error);
    return null;
  }
};

export const requests = {
  fetchTrending: `/trending/all/week`,
  fetchNetflixOriginals: `/discover/tv?with_networks=213`,
  fetchTopRated: `/movie/top_rated`,
  fetchActionMovies: `/discover/movie?with_genres=28`,
  fetchComedyMovies: `/discover/movie?with_genres=35`,
  fetchHorrorMovies: `/discover/movie?with_genres=27`,
  fetchRomanceMovies: `/discover/movie?with_genres=10749`,
  fetchDocumentaries: `/discover/movie?with_genres=99`,
  fetchUpcoming: `/movie/upcoming`,
  fetchMarvel: `/discover/movie?with_companies=420&sort_by=popularity.desc`,
  fetchDC: `/discover/movie?with_companies=128064|429|9993&sort_by=popularity.desc`,
  fetchSciFi: `/discover/movie?with_genres=878&sort_by=popularity.desc`,
  fetchAsianDramas: `/discover/tv?with_original_language=ko&sort_by=popularity.desc`,
  fetchTop2025: `/discover/movie?primary_release_year=2025&sort_by=popularity.desc`,
  fetchTop2024: `/discover/movie?primary_release_year=2024&sort_by=popularity.desc`,
  fetchAnime: `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
  fetchKidsAnimation: `/discover/movie?with_genres=16,10751&sort_by=popularity.desc`,
  fetchRecommendations: (id, type) => `/${type}/${id}/recommendations`,
};

