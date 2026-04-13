import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { searchMovies } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import './Search.css';

const Search = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Extract query from URL ?q=...
  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    if (query) {
      const getResults = async () => {
        setLoading(true);
        const results = await searchMovies(query);
        // Filter to only show items with posters
        setMovies(results.filter(m => m.poster_path));
        setLoading(false);
      };
      getResults();
    }
  }, [query]);

  return (
    <div className="search-page-container animate-fade-in">
      <div className="search-header glass">
        <h2>Resultados para: <span className="query-text">"{query}"</span></h2>
      </div>

      {loading ? (
        <div className="search-results-grid">
          {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="search-results-grid">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="no-results">
              <p>No se encontraron películas o series para tu búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
