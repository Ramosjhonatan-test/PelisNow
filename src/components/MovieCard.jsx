import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaPlus } from 'react-icons/fa';
import { getImageUrl } from '../api/tmdb';
import { db } from '../firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { UserAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ScoreCircle from './ScoreCircle';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const [hover, setHover] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = UserAuth();
  const { addNotification } = useNotifications();

  const saveMovie = async (e) => {
    e.preventDefault();
    if (user?.email) {
      const userRef = doc(db, 'users', user.email);
      await setDoc(userRef, {
        savedMovies: arrayUnion({
          id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
        })
      }, { merge: true });
      addNotification('¡Guardado!', `"${movie.title || movie.name}" se añadió a tu lista`, 'success');
    } else {
      addNotification('Acción necesaria', 'Inicia sesión para guardar películas en tu lista', 'warning');
    }
  };

  const posterUrl = movie.isExclusive && !movie.tmdb_id ? movie.poster_path : getImageUrl(movie.poster_path, 'w342');

  // Precision type detection
  const isTv = movie.media_type === 'tv' || (!movie.title && movie.name) || movie.seasons;
  const linkPath = isTv ? `/tv/${movie.id}` : `/movie/${movie.id}`;
  const contentType = isTv ? 'Serie' : 'Película';

  return (
    <div 
        className='movie-card'
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
    >
      <Link to={linkPath} className="card-link-wrapper">
        <div className="card-badge">{contentType}</div>
        {movie.vote_average > 0 && (
          <div className="card-floating-score">
            <ScoreCircle vote={movie.vote_average} />
          </div>
        )}
        <img 
          src={posterUrl} 
          alt={movie.title || movie.name} 
          loading="lazy" 
          onLoad={() => setLoaded(true)}
          className={loaded ? 'img-loaded' : 'img-loading'}
        />
        {hover && (
          <div className='card-overlay'>
            <div className='overlay-icons'>
              <FaPlay className='icon' />
              <FaPlus className='icon' onClick={saveMovie} />
            </div>
            <h3 className="card-title">{movie.title || movie.name}</h3>
          </div>
        )}
      </Link>
    </div>
  );
};

export default MovieCard;
