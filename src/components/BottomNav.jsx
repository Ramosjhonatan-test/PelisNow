import { NavLink } from 'react-router-dom';
import { FaHome, FaCompass, FaBookmark, FaSearch, FaUser } from 'react-icons/fa';
import './BottomNav.css';
import { UserAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { user } = UserAuth();

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FaHome />
        <span>Inicio</span>
      </NavLink>
      
      <NavLink to="/discover" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FaCompass />
        <span>Explorar</span>
      </NavLink>
      
      <NavLink to="/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FaSearch />
        <span>Buscar</span>
      </NavLink>

      <NavLink to="/my-list" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FaBookmark />
        <span>Mi Lista</span>
      </NavLink>

      {!user && (
        <NavLink to="/login" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <FaUser />
          <span>Ingresar</span>
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
