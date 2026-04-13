import { useState, useEffect } from 'react';
import { fetchFilteredData } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { FaFilter } from 'react-icons/fa';
import './Discover.css';
import '../pages/Search.css'; // Reusa clases de la grilla

const GENRES = [
  { id: '', name: 'Todos' },
  { id: '28', name: 'Acción' },
  { id: '35', name: 'Comedia' },
  { id: '27', name: 'Terror' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Ciencia Ficción' },
  { id: '16', name: 'Animación' },
  { id: '18', name: 'Drama' },
  { id: '99', name: 'Documental' }
];

const YEARS = ['', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2010'];

const Discover = () => {
  const [type, setType] = useState('movie');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFiltered = async () => {
      setLoading(true);
      const data = await fetchFilteredData(type, genre, year);
      setResults(data.filter(m => m.poster_path)); // Solo con póster
      setLoading(false);
    };
    getFiltered();
    window.scrollTo(0,0);
  }, [type, genre, year]);

  return (
    <div className="discover-page animate-fade-in">
      <div className="discover-header glass">
        <h1><FaFilter className="filter-icon"/> Explorar Catálogo</h1>
        
        <div className="filters-container">
          <div className="filter-group">
            <span className="filter-label">Tipo:</span>
            <div className="pills-scroll">
              <button className={`pill ${type === 'movie' ? 'active' : ''}`} onClick={() => setType('movie')}>Películas</button>
              <button className={`pill ${type === 'tv' ? 'active' : ''}`} onClick={() => setType('tv')}>Series</button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Género:</span>
            <div className="pills-scroll">
              {GENRES.map(g => (
                <button 
                  key={g.id || 'all'} 
                  className={`pill ${genre === g.id ? 'active' : ''}`} 
                  onClick={() => setGenre(g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Año:</span>
            <div className="pills-scroll">
              {YEARS.map(y => (
                <button 
                  key={y || 'all'} 
                  className={`pill ${year === y ? 'active' : ''}`} 
                  onClick={() => setYear(y)}
                >
                  {y || 'Cualquiera'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="discover-results">
        {loading ? (
          <div className="search-results-grid">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="search-results-grid">
            {results.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        ) : (
          <div className="no-results glass" style={{padding: '30px', textAlign: 'center'}}>
             <p>No se encontraron resultados con esta combinación de filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
