import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCompass, FaFilm, FaTv, FaFire, FaGhost, FaHeart, FaRocket, FaLaugh, FaMask, FaBook, FaArrowRight, FaSearch } from 'react-icons/fa';
import './ExploreStrip.css';

const QUICK_GENRES = [
  { id: '28', name: 'Acción', icon: FaFire, color: '#ff6b35' },
  { id: '27', name: 'Terror', icon: FaGhost, color: '#9b59b6' },
  { id: '10749', name: 'Romance', icon: FaHeart, color: '#e74c8b' },
  { id: '878', name: 'Sci-Fi', icon: FaRocket, color: '#3498db' },
  { id: '35', name: 'Comedia', icon: FaLaugh, color: '#f1c40f' },
  { id: '18', name: 'Drama', icon: FaMask, color: '#1abc9c' },
  { id: '99', name: 'Documental', icon: FaBook, color: '#e67e22' },
];

const ExploreStrip = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const inputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Blur the input first to dismiss mobile keyboard before navigating
      if (inputRef.current) inputRef.current.blur();
      navigate(`/search?q=${query.trim()}`);
    }
  };

  return (
    <div className="explore-strip-container section-padding">
      <div className="explore-strip-header">
        <div className="explore-strip-title-group">
          <FaCompass className="explore-title-icon" />
          <h2 className="explore-strip-title">Explorar Catálogo</h2>
        </div>
        <Link to="/discover" className="explore-see-all">
          Ver todo <FaArrowRight />
        </Link>
      </div>

      {/* Catalog Search Bar */}
      <div className="catalog-search-wrap">
        <form onSubmit={handleSearch} className="catalog-search-form">
          <FaSearch className="catalog-search-icon" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="¿Qué quieres ver hoy?" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="catalog-search-btn">Buscar</button>
        </form>
      </div>

      {/* Type Row */}
      <div className="explore-type-row">
        <Link to="/discover?type=movie" className="explore-type-card">
          <div className="explore-type-icon-wrap movie-gradient">
            <FaFilm />
          </div>
          <span>Películas</span>
        </Link>
        <Link to="/discover?type=tv" className="explore-type-card">
          <div className="explore-type-icon-wrap series-gradient">
            <FaTv />
          </div>
          <span>Series</span>
        </Link>
      </div>

      {/* Genre Chips */}
      <div className="explore-genres-scroll">
        {QUICK_GENRES.map(genre => {
          const Icon = genre.icon;
          return (
            <Link
              key={genre.id}
              to={`/discover?genre=${genre.id}`}
              className="explore-genre-chip"
              style={{ '--chip-color': genre.color }}
            >
              <Icon className="genre-chip-icon" />
              <span>{genre.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ExploreStrip;
