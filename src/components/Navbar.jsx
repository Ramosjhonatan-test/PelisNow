import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaBars, FaTimes, FaStar, FaChevronLeft, FaKey, 
  FaUser, FaHistory, FaCrown, FaSignOutAlt, FaGem, 
  FaCalendarAlt, FaUserCog, FaUserShield, FaBookmark 
} from 'react-icons/fa';
import { UserAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { searchMovies, getImageUrl } from '../api/tmdb';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  
  const { user, logOut, userDoc } = UserAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const mobileInputRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Sync focus to mobile input when overlay opens
  useEffect(() => {
    if (showMobileSearch && mobileInputRef.current) {
       mobileInputRef.current.focus();
    }
  }, [showMobileSearch]);

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

  // Close dropdown or search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
        if (!searchTerm) setShowMobileSearch(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm]);

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
      setShowMobileSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logOut();
    navigate('/');
  };

  const getAvatarLetter = () => {
     if (userDoc?.displayName) return userDoc.displayName.charAt(0).toUpperCase();
     if (user?.email) return user.email.charAt(0).toUpperCase();
     return 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleChangePassword = async () => {
    setPassError('');
    if (!currentPass || !newPass) {
      setPassError('Completa ambos campos.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setPassLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      addNotification('Éxito', 'Tu contraseña ha sido actualizada correctamente.', 'success');
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassError('La contraseña actual es incorrecta.');
      } else {
        setPassError('Error al cambiar la contraseña. Inténtalo de nuevo.');
      }
    }
    setPassLoading(false);
  };

  return (
    <>
    <nav className={`navbar ${scrolled ? 'scrolled glass-nav' : ''} ${showMobileSearch ? 'search-active' : ''}`}>
      
      {/* Search Overlay (Mobile) */}
      <div className={`mobile-search-overlay ${showMobileSearch ? 'open' : ''}`}>
         <div className="mobile-search-bar">
            <button className="back-search-btn" onClick={() => setShowMobileSearch(false)}>
               <FaChevronLeft />
            </button>
            <form onSubmit={handleSearch} className="mobile-search-form">
               <input 
                  ref={mobileInputRef}
                  type="text" 
                  placeholder="Buscar títulos, géneros..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
               />
               {searchTerm && <FaTimes className="mobile-clear-icon" onClick={clearSearch} />}
            </form>
         </div>
      </div>

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
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className={`search-container desktop-only ${searchFocused || searchTerm ? 'expanded' : ''}`}>
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

          {/* Mobile Search Trigger */}
          <div className="mobile-search-trigger mobile-only" onClick={() => setShowMobileSearch(true)}>
             <FaSearch className="search-icon" />
          </div>

          {/* Live Search Results / History Dropdown */}
          {(searchFocused || (showMobileSearch && searchTerm)) && (
            <div className={`search-results-dropdown glass-dropdown ${showMobileSearch ? 'mobile-dropdown' : ''}`}>
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
                          setShowMobileSearch(false);
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

        <NotificationBell />

        {user ? (
          <div className="user-profile-menu" ref={dropdownRef}>
            <div className={`avatar-btn ${userDoc?.accountExpiry ? 'premium-border' : ''}`} onClick={() => setShowDropdown(!showDropdown)}>
              {userDoc?.photoURL ? (
                <img src={userDoc.photoURL} alt="User Avatar" />
              ) : (
                <div className="avatar-placeholder">{getAvatarLetter()}</div>
              )}
            </div>
            
            {showDropdown && (
              <div className="profile-dropdown premium-account-panel animate-slide-up">
                <div className="dropdown-header-card">
                   <div className="header-user-info">
                      <div className="large-avatar">
                        {userDoc?.photoURL ? <img src={userDoc.photoURL} alt="Profile" /> : <span>{getAvatarLetter()}</span>}
                      </div>
                      <div className="user-meta-info">
                        <h4>{userDoc?.displayName || 'Usuario'}</h4>
                        <p>{user.email}</p>
                      </div>
                   </div>
                   
                   <div className="account-status-badge">
                      {userDoc?.accountExpiry ? (
                        <div className="plan-pill vip">
                           <FaCrown /> <span>Plan VIP</span>
                        </div>
                      ) : (
                        <div className="plan-pill standard">
                           <FaUser /> <span>Plan Estándar</span>
                        </div>
                      )}
                   </div>
                </div>

                {userDoc?.accountExpiry && (
                   <div className="expiry-info-box">
                      <FaCalendarAlt className="info-icon" />
                      <div className="expiry-text">
                         <span>Vence el:</span>
                         <p>{formatDate(userDoc.accountExpiry)}</p>
                      </div>
                   </div>
                )}

                <div className="dropdown-sections">
                  <div className="section-group">
                    <p className="group-title">Navegación</p>
                    <Link to="/my-list" onClick={() => setShowDropdown(false)} className="dropdown-item">
                      <FaBookmark /> <span>Mi Lista</span>
                    </Link>
                    <Link to="/discover" onClick={() => setShowDropdown(false)} className="dropdown-item">
                      <FaHistory /> <span>Explorar</span>
                    </Link>
                  </div>

                  <div className="section-group">
                    <p className="group-title">Configuración</p>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setShowDropdown(false)} className="dropdown-item admin-link">
                        <FaUserShield /> <span>Panel Administrativo</span>
                      </Link>
                    )}
                    <button onClick={() => { setShowDropdown(false); setShowPasswordModal(true); }} className="dropdown-item">
                      <FaKey /> <span>Seguridad</span>
                    </button>
                  </div>
                </div>

                <div className="dropdown-footer">
                  <button onClick={handleLogout} className="logout-btn-premium">
                    <FaSignOutAlt /> <span>Cerrar Sesión</span>
                  </button>
                </div>
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

      <div className={`mobile-glass-menu ${showMobileMenu ? 'open' : ''}`}>
         <ul className="mobile-nav-links">
            <li><Link to="/" onClick={() => setShowMobileMenu(false)}>Inicio</Link></li>
            <li><Link to="/discover" onClick={() => setShowMobileMenu(false)}>Explorar</Link></li>
            <li><Link to="/my-list" onClick={() => setShowMobileMenu(false)}>Mi Lista</Link></li>
            {isAdmin && <li><Link to="/admin" onClick={() => setShowMobileMenu(false)}>Panel Admin</Link></li>}
         </ul>
      </div>
    </nav>

    {showPasswordModal && (
      <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
        <div className="password-modal" onClick={(e) => e.stopPropagation()}>
          <div className="pm-header">
            <FaKey />
            <h3>Cambiar Contraseña</h3>
            <button className="pm-close" onClick={() => setShowPasswordModal(false)}><FaTimes /></button>
          </div>
          {passError && <div className="pm-error">⚠️ {passError}</div>}
          <div className="pm-field">
            <label>Contraseña actual</label>
            <input 
              type="password" 
              value={currentPass} 
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Tu contraseña actual"
            />
          </div>
          <div className="pm-field">
            <label>Nueva contraseña</label>
            <input 
              type="password" 
              value={newPass} 
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button className="pm-submit" onClick={handleChangePassword} disabled={passLoading}>
            {passLoading ? 'Cambiando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
