import MovieCard from './MovieCard';
import './MovieRow.css';

const MovieRow = ({ title, movies = [] }) => {
  const safeMovies = Array.isArray(movies) ? movies : [];

  return (
    <div className='movie-row'>
      <h2 className='row-title'>{title}</h2>
      <div className='row-cards-container'>
        {safeMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};
export default MovieRow;
