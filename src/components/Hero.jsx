import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import { getImageUrl, fetchMovieLogo } from '../api/tmdb';
import './Hero.css';

const Hero = ({ movies = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logoUrl, setLogoUrl] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef(null);

  // Auto-play the carousel
  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    
    timerRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % Math.min(movies.length, 5)); // Max 5 items
        setIsFading(false);
      }, 500); // 500ms fade transition
    }, 8000); // Change every 8s

    return () => clearInterval(timerRef.current);
  }, [movies, currentIndex]);

  // Fetch Logo when movie changes
  useEffect(() => {
    const getLogo = async () => {
      const currentMovie = movies[currentIndex];
      if (!currentMovie) return;
      const type = currentMovie.media_type === 'tv' || (!currentMovie.title && currentMovie.name) ? 'tv' : 'movie';
      const logo = await fetchMovieLogo(currentMovie.id, type);
      setLogoUrl(logo ? getImageUrl(logo) : null);
    };
    getLogo();
  }, [currentIndex, movies]);

  if (!movies || movies.length === 0) return <div className="hero-container" style={{height: '80vh', backgroundColor: '#111'}}></div>;

  const activeMovies = movies.slice(0, 5); // Use top 5
  if (!activeMovies[currentIndex]) return null;

  const movie = activeMovies[currentIndex];
  const isTv = movie.media_type === 'tv' || (!movie.title && movie.name);
  const linkPath = isTv ? `/tv/${movie.id}` : `/movie/${movie.id}`;
  const backdropUrl = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');

  // Manual Jump
  const goToSlide = (idx) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsFading(false);
    }, 500);
    clearInterval(timerRef.current); // Pause timer if user acts
  };

  return (
    <div className={`hero-carousel-wrapper ${isFading ? 'fading' : 'active'}`}>
      <div className="hero-container" style={{ 
          backgroundImage: `linear-gradient(to top, var(--bg-primary) 5%, transparent 60%), 
                            linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 60%),
                            url(${backdropUrl})` 
      }}>
        
        <div className="hero-content section-padding">
          <div className="hero-glass-panel cinehax-panel">
            <div className="hero-meta-pills">
              <span className="pill pill-blue">{isTv ? 'SERIE' : 'PELÍCULA'}</span>
              {movie.vote_average > 0 && (
                <span className="pill pill-dark">★ {movie.vote_average.toFixed(1)}</span>
              )}
              <span className="pill pill-dark">
                {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0] || ''}
              </span>
            </div>

            {logoUrl ? (
              <img src={logoUrl} alt={movie.title || movie.name} className="hero-logo-img" />
            ) : (
              <h1 className="hero-title title-glow">{movie.title || movie.name}</h1>
            )}

            <p className="hero-overview">
                {movie.overview ? (movie.overview.length > 200 ? movie.overview.slice(0, 180) + '...' : movie.overview) : ''}
            </p>
            <div className="hero-buttons">
              <Link to={linkPath} className="btn-play cinehax-btn">
                <FaPlay className="icon" /> Ver ahora
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        {activeMovies.length > 1 && (
          <div className="hero-indicators">
            {activeMovies.map((_, idx) => (
              <button 
                key={idx} 
                className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
