import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { UserAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logOut } = UserAuth();
  const navigate = useNavigate();

  const isAdmin = user?.email === 'danielacopana@gmail.com';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logOut();
    navigate('/');
  };

  const getAvatarLetter = () => {
     if(user?.email && typeof user.email === 'string') return user.email.charAt(0).toUpperCase();
     return 'U';
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled glass-nav' : ''}`}>
      <div className="nav-left">
        <Link to="/" className='logo-premium'>PELIS<span>NOW</span></Link>
        <ul className='nav-links desktop-only'>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/discover">Explorar</Link></li>
          <li><Link to="/my-list">Mi Lista</Link></li>
        </ul>
      </div>
      
      <div className='nav-right'>
        <form onSubmit={handleSearch} className={`search-container ${searchFocused || searchTerm ? 'expanded' : ''}`}>
          <FaSearch className='search-icon' onClick={() => setSearchFocused(true)} />
          <input 
            type="text" 
            placeholder="Títulos, personas, géneros..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </form>

        {user ? (
          <div className="user-profile-menu">
            <div className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User Avatar" />
              ) : (
                <div className="avatar-placeholder">{getAvatarLetter()}</div>
              )}
            </div>
            
            {showDropdown && (
              <div className="profile-dropdown glass-dropdown">
                <div className="dropdown-header">
                  <p className="user-email">{user.email || 'Invitado'}</p>
                </div>
                <ul className="dropdown-options">
                  {isAdmin && (
                    <li><Link to="/admin" onClick={() => setShowDropdown(false)}>⚙️ Panel Admin</Link></li>
                  )}
                  <li><Link to="/my-list" onClick={() => setShowDropdown(false)}>🔖 Mi Lista</Link></li>
                  <li className="divider"></li>
                  <li><button onClick={handleLogout} className="logout-action">Cerrar sesión</button></li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className='login-btn-premium'>Iniciar Sesión</Link>
          </div>
        )}
        
        <div className="mobile-menu-icon" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          {showMobileMenu ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      {/* Floating Glass Mobile Menu */}
      <div className={`mobile-glass-menu ${showMobileMenu ? 'open' : ''}`}>
         <ul className="mobile-nav-links">
            <li><Link to="/" onClick={() => setShowMobileMenu(false)}>Inicio</Link></li>
            <li><Link to="/discover" onClick={() => setShowMobileMenu(false)}>Explorar</Link></li>
            <li><Link to="/my-list" onClick={() => setShowMobileMenu(false)}>Mi Lista</Link></li>
            {isAdmin && <li><Link to="/admin" onClick={() => setShowMobileMenu(false)}>Panel Admin</Link></li>}
         </ul>
      </div>
    </nav>
  );
};

export default Navbar;
