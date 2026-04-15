import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import { getImageUrl } from '../api/tmdb';
import './Hero.css';

const Hero = ({ movie }) => {
  if (!movie) return <div className="hero-container" style={{height: '80vh', backgroundColor: '#111'}}></div>;

    const isTv = movie.media_type === 'tv' || (!movie.title && movie.name);
    const linkPath = isTv ? `/tv/${movie.id}` : `/movie/${movie.id}`;

    return (
      <div className="hero-container" style={{ 
          backgroundImage: `linear-gradient(to top, var(--bg-primary) 10%, transparent 90%), url(${getImageUrl(movie.backdrop_path || movie.poster_path)})` 
      }}>
        <div className="hero-content section-padding">
          <div className="hero-glass-panel">
            <h1 className="hero-title">{movie.title || movie.name}</h1>
            <p className="hero-overview">
                {movie.overview ? (movie.overview.length > 200 ? movie.overview.slice(0, 200) + '...' : movie.overview) : ''}
            </p>
            <div className="hero-buttons">
              <Link to={linkPath} className="btn-play">
                <FaPlay className="icon" /> Reproducir
              </Link>
              <Link to={linkPath} className="btn-info glass">
                 Más Información
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
