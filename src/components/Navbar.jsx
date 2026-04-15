import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes, FaStar } from 'react-icons/fa';
import { UserAuth } from '../context/AuthContext';
import { searchMovies, getImageUrl } from '../api/tmdb';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logOut } = UserAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const isAdmin = user?.email === 'danielacopana@gmail.com';

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('zenplus_search_history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live Search Logic (Debounce)
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delayDebounceFn = setTimeout(async () => {
        setIsLoading(true);
        const results = await searchMovies(searchTerm);
        setSearchResults(results.slice(0, 8)); // Limit to 8 for dropdown
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToHistory = (term) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem('zenplus_search_history', JSON.stringify(newHistory));
  };

  const removeHistoryItem = (e, term) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item !== term);
    setSearchHistory(newHistory);
    localStorage.setItem('zenplus_search_history', JSON.stringify(newHistory));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addToHistory(searchTerm.trim());
      navigate(`/search?q=${searchTerm}`);
      setSearchResults([]);
      setSearchFocused(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchFocused(false);
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
        <Link to="/" className='logo-premium'>ZEN<span>PLUS</span></Link>
        <ul className='nav-links desktop-only'>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/discover">Explorar</Link></li>
          <li><Link to="/my-list">Mi Lista</Link></li>
        </ul>
      </div>
      
      <div className='nav-right'>
        <div className="search-wrapper" ref={searchRef}>
          <form onSubmit={handleSearch} className={`search-container ${searchFocused || searchTerm ? 'expanded' : ''}`}>
            <FaSearch className='search-icon' onClick={() => setSearchFocused(true)} />
            <input 
              type="text" 
              placeholder="Títulos, personas, géneros..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            {searchTerm && <FaTimes className="clear-search-icon" onClick={clearSearch} />}
          </form>

          {/* Live Search Results / History Dropdown */}
          {searchFocused && (
            <div className="search-results-dropdown glass-dropdown">
              {searchTerm.trim().length > 1 ? (
                isLoading ? (
                  <div className="search-loading">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  <div className="dropdown-results-list">
                    {searchResults.map((result) => (
                      <Link 
                        key={result.id} 
                        to={`/movie/${result.id}`} 
                        className="dropdown-item"
                        onClick={() => {
                          addToHistory(result.title || result.name);
                          setSearchFocused(false);
                          setSearchTerm('');
                        }}
                      >
                        <img 
                          src={result.poster_path ? getImageUrl(result.poster_path) : 'https://via.placeholder.com/40x60?text=N/A'} 
                          alt={result.title || result.name} 
                        />
                        <div className="item-info">
                          <p className="item-title">{result.title || result.name}</p>
                          <div className="item-meta">
                            <span>{result.release_date?.split('-')[0] || result.first_air_date?.split('-')[0] || 'N/A'}</span>
                            {result.vote_average > 0 && <span>⭐ {result.vote_average.toFixed(1)}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <button className="see-all-search" onClick={handleSearch}>
                      Ver todos los resultados
                    </button>
                  </div>
                ) : (
                  <div className="no-results-dropdown">No se encontraron resultados</div>
                )
              ) : (searchTerm.trim().length === 0 && searchHistory.length > 0) ? (
                 <div className="search-history-container">
                    <div className="history-header">
                       <span>Búsquedas recientes</span>
                       <button onClick={() => {setSearchHistory([]); localStorage.removeItem('zenplus_search_history');}}>Limpiar</button>
                    </div>
                    <div className="history-list">
                       {searchHistory.map((item, idx) => (
                         <div key={idx} className="history-item" onClick={() => {setSearchTerm(item); setSearchFocused(true);}}>
                            <div className="history-content">
                               <FaSearch className="history-icon" />
                               <span>{item}</span>
                            </div>
                            <FaTimes className="remove-history" onClick={(e) => removeHistoryItem(e, item)} />
                         </div>
                       ))}
                    </div>
                 </div>
              ) : null}
            </div>
          )}
        </div>

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
