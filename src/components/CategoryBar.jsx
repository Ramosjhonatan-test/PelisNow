import { Link } from 'react-router-dom';
import { FaThList, FaFilm, FaTv } from 'react-icons/fa';
import './CategoryBar.css';

const CategoryBar = () => {
  return (
    <div className="category-bar-container">
      <div className="category-bar section-padding">
        <Link to="/discover?type=movie" className="category-item glass">
          <FaFilm /> <span>Películas</span>
        </Link>
        <Link to="/discover?type=tv" className="category-item glass">
          <FaTv /> <span>Series</span>
        </Link>
        <Link to="/discover" className="category-item glass accent">
          <FaThList /> <span>Explorar</span>
        </Link>
      </div>
    </div>
  );
};

export default CategoryBar;
