import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MovieCard from './MovieCard';
import './MovieRow.css';

const MovieRow = ({ title, movies = [], isTop10 = false }) => {
  const rowRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);
  const safeMovies = Array.isArray(movies) ? movies : [];

  const slide = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className='movie-row' 
      onMouseEnter={() => setShowArrows(true)} 
      onMouseLeave={() => setShowArrows(false)}
    >
      <div className="row-header cinehax-row-header">
        <h2 className='row-title'>{title}</h2>
        <div className="row-divider"></div>
        <Link to="/discover" className="see-all-btn cinehax-see-all">Ver todo</Link>
      </div>

      <div className="row-container-wrapper">
        <button 
          className={`scroll-btn left ${showArrows ? 'visible' : ''}`} 
          onClick={() => slide('left')}
          aria-label="Scroll Left"
        >
          <FaChevronLeft />
        </button>

        <div className='row-cards-container' ref={rowRef}>
          {safeMovies.map((movie, index) => {
            if (isTop10 && index < 10) {
              return (
                <div key={movie.id} className="top10-item">
                  <span className="top10-number">{index + 1}</span>
                  <div className="top10-card-wrapper">
                    <MovieCard movie={movie} />
                  </div>
                </div>
              );
            }
            return <MovieCard key={movie.id} movie={movie} />;
          })}
        </div>

        <button 
          className={`scroll-btn right ${showArrows ? 'visible' : ''}`} 
          onClick={() => slide('right')}
          aria-label="Scroll Right"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default MovieRow;
