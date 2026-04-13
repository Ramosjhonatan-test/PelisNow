import { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { FaTrash, FaFilm, FaHeart } from 'react-icons/fa';
import MovieCard from '../components/MovieCard';
import './MyList.css';

const MyList = () => {
  const [movies, setMovies] = useState([]);
  const { user } = UserAuth();

  useEffect(() => {
    if (user?.email) {
      const unsub = onSnapshot(doc(db, 'users', user.email), (doc) => {
        setMovies(doc.data()?.savedMovies || []);
      });
      return () => unsub();
    }
  }, [user?.email]);

  const removeMovie = async (movieId) => {
    if (!user?.email) return;
    try {
      const updatedMovies = movies.filter(m => m.id !== movieId);
      await updateDoc(doc(db, 'users', user.email), {
        savedMovies: updatedMovies
      });
    } catch (error) {
      console.error("Error removing movie:", error);
    }
  };

  const clearAll = async () => {
    if (!user?.email || !window.confirm('¿Estás seguro? Esto eliminará toda tu lista.')) return;
    try {
      await updateDoc(doc(db, 'users', user.email), {
        savedMovies: []
      });
    } catch (error) {
      console.error("Error clearing list:", error);
    }
  };

  return (
    <div className="mylist-page animate-fade-in">
      <div className="mylist-hero">
        <div className="mylist-hero-content">
          <h1><FaHeart className="heart-icon" /> Mi Lista</h1>
          <p className="mylist-count">{movies.length} {movies.length === 1 ? 'título guardado' : 'títulos guardados'}</p>
          {movies.length > 0 && (
            <button className="clear-all-btn" onClick={clearAll}>
              <FaTrash /> Vaciar Lista
            </button>
          )}
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="mylist-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="mylist-card-wrapper">
              <MovieCard movie={movie} />
              <button className="remove-btn" onClick={() => removeMovie(movie.id)} title="Eliminar de mi lista">
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon-circle">
            <FaFilm />
          </div>
          <h3>Tu lista está vacía</h3>
          <p>Explora el catálogo y añade tus películas favoritas.</p>
        </div>
      )}
    </div>
  );
};

export default MyList;
