// src/api/tmdb.js
const API_KEY = 'c9ae557803081c8546b65026fec5a5bc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

export const getImageUrl = (path) => `${IMAGE_BASE_URL}${path}`;

export const fetchMovies = async (endpoint) => {
  try {
    const divider = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${BASE_URL}${endpoint}${divider}api_key=${API_KEY}&language=es-MX`);
    if (!response.ok) throw new Error("Error fetching data");
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error from TMDB:", error);
    return [];
  }
};

export const searchMovies = async (query) => {
  try {
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${query}`);
    if (!response.ok) throw new Error("Error searching data");
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error from TMDB Search:", error);
    return [];
  }
};

export const fetchFilteredData = async (type = 'movie', genreId = '', year = '') => {
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
    return data.results;
  } catch (error) {
    console.error("Error from TMDB Filter:", error);
    return [];
  }
};

export const fetchSeasonEpisodes = async (tvId, seasonNumber) => {
  try {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=es-MX`);
    if (!res.ok) throw new Error("Error fetching episodes");
    return await res.json();
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
};
