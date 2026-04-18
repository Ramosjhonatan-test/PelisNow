import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchFilteredData } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { 
  FaCompass, FaFilm, FaTv, FaChevronDown, 
  FaThLarge, FaBolt, FaLaughBeam, FaGhost, 
  FaHeart, FaRocket, FaMagic, FaTheaterMasks, 
  FaBookOpen, FaExclamationCircle 
} from 'react-icons/fa';
import './Discover.css';
import '../pages/Search.css';

const GENRES = [
  { id: '', name: 'Todos', icon: FaThLarge },
  { id: '28', name: 'Acción', icon: FaBolt },
  { id: '35', name: 'Comedia', icon: FaLaughBeam },
  { id: '27', name: 'Terror', icon: FaGhost },
  { id: '10749', name: 'Romance', icon: FaHeart },
  { id: '878', name: 'Sci-Fi', icon: FaRocket },
  { id: '16', name: 'Animación', icon: FaMagic },
  { id: '18', name: 'Drama', icon: FaTheaterMasks },
  { id: '99', name: 'Documental', icon: FaBookOpen }
];

const YEARS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2010'];

const Discover = () => {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'movie');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [year, setYear] = useState('');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);

  useEffect(() => {
    const getFiltered = async () => {
      setLoading(true);
      const data = await fetchFilteredData(type, genre, year);
      setResults(data.filter(m => m.poster_path));
      setLoading(false);
    };
    getFiltered();
    window.scrollTo(0,0);
  }, [type, genre, year]);

  // Get current genre icon and name for the active indicator
  const activeGenre = GENRES.find(g => g.id === genre) || GENRES[0];
  const activeYear = year || 'Cualquiera';

  // Determine which genres to show
  const visibleGenres = GENRES;

  return (
    <div className="discover-page animate-fade-in">
      
      {/* Compact Header */}
      <div className="discover-hero">
        <div className="discover-hero-content section-padding">
          <div className="discover-title-row">
            <FaCompass className="discover-title-icon" />
            <h1>Explorar</h1>
          </div>
          <p className="discover-subtitle">Encuentra películas y series por género, tipo y año.</p>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="discover-filters-bar">
        <div className="discover-filters-inner section-padding">

          {/* Type Toggle */}
          <div className="filter-section">
            <div className="type-toggle">
              <button 
                className={`type-btn ${type === 'movie' ? 'active' : ''}`}
                onClick={() => setType('movie')}
              >
                <FaFilm /> Películas
              </button>
              <button 
                className={`type-btn ${type === 'tv' ? 'active' : ''}`}
                onClick={() => setType('tv')}
              >
                <FaTv /> Series
              </button>
              <div className={`type-slider ${type === 'tv' ? 'right' : 'left'}`} />
            </div>
          </div>

          {/* Genre Chips */}
          <div className="filter-section">
            <div className="genre-chips-scroll">
              {visibleGenres.map(g => (
                <button
                  key={g.id || 'all'}
                  className={`genre-chip ${genre === g.id ? 'active' : ''}`}
                  onClick={() => setGenre(g.id)}
                >
                  <span className="genre-icon-wrapper">
                    <g.icon className="genre-icon" />
                  </span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Year Selector */}
          <div className="filter-section">
            <div className="year-chips-scroll">
              {YEARS.map(y => (
                <button
                  key={y || 'all'}
                  className={`year-chip ${year === y ? 'active' : ''}`}
                  onClick={() => setYear(y)}
                >
                  {y || 'Todos'}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="discover-active-summary section-padding">
        <span className="summary-label">Mostrando:</span>
        <span className="summary-tag">
          {type === 'movie' ? <FaFilm /> : <FaTv />}
          {type === 'movie' ? ' Películas' : ' Series'}
        </span>
        <span className="summary-divider">·</span>
        <span className="summary-tag">
          <activeGenre.icon /> {activeGenre.name}
        </span>
        <span className="summary-divider">·</span>
        <span className="summary-tag">{activeYear}</span>
        <span className="summary-count">{!loading && `${results.length} resultados`}</span>
      </div>

      {/* Results Grid */}
      <div className="discover-results section-padding">
        {loading ? (
          <div className="search-results-grid">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="search-results-grid">
            {results.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        ) : (
          <div className="discover-empty">
            <FaExclamationCircle className="empty-icon" />
            <p>No se encontraron resultados</p>
            <span className="empty-hint">Intenta con otra combinación de filtros</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
