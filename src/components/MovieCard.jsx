import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaPlus } from 'react-icons/fa';
import { getImageUrl } from '../api/tmdb';
import { db } from '../firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { UserAuth } from '../context/AuthContext';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const [hover, setHover] = useState(false);
  const { user } = UserAuth();

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
      alert('Película guardada');
    } else {
      alert('Inicia sesión para guardar películas');
    }
  };

  const posterUrl = movie.isExclusive && !movie.tmdb_id ? movie.poster_path : getImageUrl(movie.poster_path);

  return (
    <div 
        className='movie-card'
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
    >
      <Link to={`/movie/${movie.id}`}>
        <img src={posterUrl} alt={movie.title || movie.name} loading="lazy" />
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
