import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { FaPlus, FaTrash, FaImage, FaFilm, FaInfoCircle, FaEye, FaSearch, FaLink, FaEdit, FaSave, FaTimes, FaHome, FaArrowUp, FaArrowDown, FaCheckCircle, FaTimesCircle, FaTags, FaLanguage, FaCog, FaCalendarAlt, FaPowerOff } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('movies');
  
  // Movie States
  const [tmdbId, setTmdbId] = useState('');
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlSpanish, setVideoUrlSpanish] = useState(''); // New Field
  const [selectedSection, setSelectedSection] = useState('exclusive');
  const [exclusiveMovies, setExclusiveMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mediaType, setMediaType] = useState('movie'); // 'movie' or 'tv'
  const { addNotification } = useNotifications();
  
  // App Config States
  const [expiryDate, setExpiryDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Homepage Config States
  const [sections, setSections] = useState([]);
  const [loadingHome, setLoadingHome] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionId, setNewSectionId] = useState('');

  const defaultSections = [
    { id: 'history', label: 'Continuar Viendo', visible: true, order: 1, type: 'system' },
    { id: 'exclusive', label: 'Películas Seleccionadas', visible: true, order: 2, type: 'custom' },
    { id: 'netflixOriginals', label: 'Destacados', visible: true, order: 3, type: 'tmdb' },
    { id: 'trending', label: 'Tendencia Ahora', visible: true, order: 4, type: 'tmdb' },
    { id: 'horror', label: 'Terror', visible: true, order: 5, type: 'tmdb' },
    { id: 'romance', label: 'Romance', visible: true, order: 6, type: 'tmdb' },
    { id: 'documentaries', label: 'Documentales', visible: true, order: 7, type: 'tmdb' },
  ];

  const fetchExclusive = async () => {
    setLoadingMovies(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'exclusive_movies'));
      setExclusiveMovies(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
    setLoadingMovies(false);
  };

  const fetchHomeConfig = async () => {
    setLoadingHome(true);
    try {
      const configSnap = await getDoc(doc(db, 'settings', 'homepage_sections'));
      if (configSnap.exists()) {
        setSections(configSnap.data().sections.sort((a, b) => a.order - b.order));
      } else { setSections(defaultSections); }
    } catch (err) { console.error(err); setSections(defaultSections); }
    setLoadingHome(false);
  };

  const fetchAppConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'app_config'));
      if (snap.exists()) {
        const date = snap.data().expiryDate;
        // Convert ISO to datetime-local format (YYYY-MM-DDTHH:MM)
        if (date) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            setExpiryDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
        setIsLocked(!!snap.data().isLocked);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchExclusive(); 
    fetchHomeConfig(); 
    fetchAppConfig();
  }, []);

  const fetchFromTMDB = async () => {
    if (!tmdbId) return alert('Ingresa un ID de TMDB');
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=c9ae557803081c8546b65026fec5a5bc&language=es-MX`);
      const data = await res.json();
      if (data.id) {
        setTitle(data.title || data.name);
        setOverview(data.overview);
        setPoster(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
        setBackdrop(`https://image.tmdb.org/t/p/original${data.backdrop_path}`);
      } else { alert('No se encontró'); }
    } catch (error) { console.error(error); }
  };

  const handleAddOrUpdateMovie = async (e) => {
    e.preventDefault();
    try {
      const movieData = { 
        title, overview, poster_path: poster, backdrop_path: backdrop || poster, 
        video_url: videoUrl, 
        video_url_spanish: videoUrlSpanish, // Saved here
        tmdb_id: tmdbId || null, 
        media_type: mediaType, // Saved here
        sectionId: selectedSection, 
        isExclusive: true, 
        updatedAt: new Date().toISOString() 
      };
      if (editingId) {
        await setDoc(doc(db, 'exclusive_movies', editingId), movieData, { merge: true });
      } else {
        await addDoc(collection(db, 'exclusive_movies'), { ...movieData, createdAt: new Date().toISOString() });
      }
      resetForm(); fetchExclusive(); alert('¡Guardado!');
    } catch (err) { console.error(err); alert('Error'); }
  };

  const resetForm = () => { setEditingId(null); setTmdbId(''); setTitle(''); setOverview(''); setPoster(''); setBackdrop(''); setVideoUrl(''); setVideoUrlSpanish(''); setSelectedSection('exclusive'); setMediaType('movie'); };

  const startEdit = (movie) => {
    setEditingId(movie.id);
    setTmdbId(movie.tmdb_id || '');
    setTitle(movie.title);
    setOverview(movie.overview);
    setPoster(movie.poster_path);
    setBackdrop(movie.backdrop_path);
    setVideoUrl(movie.video_url || '');
    setVideoUrlSpanish(movie.video_url_spanish || '');
    setSelectedSection(movie.sectionId || 'exclusive');
    setMediaType(movie.media_type || 'movie');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Homepage Methods (Same as before but simplified)
  const toggleAppLock = async () => {
    const newState = !isLocked;
    setIsUpdatingLock(true);
    try {
      await setDoc(doc(db, 'settings', 'app_config'), { 
        isLocked: newState,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsLocked(newState);
      addNotification('Estado Actualizado', `Servidor ${newState ? 'Bloqueado' : 'Activo'}`, 'info');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo cambiar el estado.', 'error');
    }
    setIsUpdatingLock(false);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      // Tomamos el valor local del input y lo convertimos a objeto Date (interpretado localmente)
      const localDate = new Date(expiryDate);
      const isoDate = localDate.toISOString(); 
      
      await setDoc(doc(db, 'settings', 'app_config'), { 
        expiryDate: isoDate,
        isLocked: isLocked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      addNotification('Configuración Guardada', 'Se actualizó el control de acceso.', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo guardar la configuración.', 'error');
    }
    setIsSavingConfig(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Centro de Control Streaming</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'movies' ? 'active' : ''} onClick={() => setActiveTab('movies')}><FaFilm /> Películas</button>
          <button className={activeTab === 'homepage' ? 'active' : ''} onClick={() => setActiveTab('homepage')}><FaHome /> Portada</button>
          <button className={activeTab === 'config' ? 'active' : ''} onClick={() => setActiveTab('config')}><FaCog /> Configuración</button>
        </div>
      </div>

      {activeTab === 'movies' && (
        <div className="admin-movies-tab">
          <div className="admin-sections">
            <div className="admin-section-card glass">
              <div className="section-title">
                {editingId ? <FaEdit className="accent-icon" /> : <FaPlus className="accent-icon" />}
                <h2>{editingId ? 'Editar Película' : 'Nueva Película'}</h2>
              </div>
              <div className="tmdb-import-box">
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="admin-select-mini">
                  <option value="movie">Película</option>
                  <option value="tv">Serie</option>
                </select>
                <input placeholder="ID TMDB" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} />
                <button onClick={fetchFromTMDB} className="import-btn"><FaSearch /> Importar</button>
              </div>
              <form onSubmit={handleAddOrUpdateMovie} className="premium-form">
                <div className="input-group"><label><FaFilm /> Título</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="form-row">
                  <div className="input-group"><label><FaLink /> URL Video (Videasy por Defecto)</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Opcional. Si lo dejas vacío, usa Videasy." /></div>
                  <div className="input-group"><label><FaLanguage /> URL Fastream / HomeCine (Latino HD)</label><input value={videoUrlSpanish} onChange={(e) => setVideoUrlSpanish(e.target.value)} placeholder="Ej: https://fastream.to/embed-xxxxx.html" /></div>
                </div>
                <div className="input-group">
                  <label><FaTags /> Sección en Home</label>
                  <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="admin-select">
                    {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="input-group"><label><FaInfoCircle /> Sinopsis</label><textarea value={overview} onChange={(e) => setOverview(e.target.value)} /></div>
                <div className="form-row">
                  <div className="input-group"><label><FaImage /> Poster</label><input value={poster} onChange={(e) => setPoster(e.target.value)} /></div>
                  <div className="input-group"><label><FaImage /> Banner</label><input value={backdrop} onChange={(e) => setBackdrop(e.target.value)} /></div>
                </div>
                <button type="submit" className="submit-btn publish">{editingId ? 'Actualizar' : 'Publicar'}</button>
              </form>
            </div>
            <div className="admin-section-card glass preview-section">
               <h2>Vista Previa</h2>
               {poster && <img src={poster} alt="Preview" className="admin-poster-preview" />}
            </div>
          </div>
          <div className="admin-section-card glass list-section">
            <h2>Catálogo ({exclusiveMovies.length})</h2>
            <div className="admin-movies-grid">
              {exclusiveMovies.map(movie => (
                <div key={movie.id} className="admin-item-card">
                  <div className="img-container">
                    <img src={movie.poster_path} alt={movie.title} />
                    <div className="admin-actions-overlay">
                      <button onClick={() => startEdit(movie)} className="action-btn edit"><FaEdit /></button>
                      <button onClick={async () => { if(window.confirm('Eliminar?')) { await deleteDoc(doc(db, 'exclusive_movies', movie.id)); fetchExclusive(); } }} className="action-btn delete"><FaTrash /></button>
                    </div>
                  </div>
                  <div className="item-details">
                    <h4>{movie.title}</h4>
                    <span className="badge-mini">{sections.find(s => s.id === movie.sectionId)?.label || 'Sin Categoría'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'homepage' && (
        <div className="admin-homepage-tab">
           <div className="admin-section-card glass">
             <div className="section-header-row">
               <h2>Estructura de la Portada</h2>
               <button className="save-config-btn" onClick={async () => { await setDoc(doc(db, 'settings', 'homepage_sections'), { sections }); addNotification('Éxito', 'Configuración de portada guardada', 'success'); }}><FaSave /> Guardar Todo</button>
             </div>
             <div className="create-section-box">
                <h4><FaPlus /> Nueva Sección</h4>
                <div className="create-inputs">
                  <input placeholder="Nombre (ej: Acción)" value={newSectionLabel} onChange={(e) => setNewSectionLabel(e.target.value)} />
                  <input placeholder="ID (ej: accion)" value={newSectionId} onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/\s+/g, '_');
                    setNewSectionId(val);
                  }} />
                  <button onClick={() => {
                    if (!newSectionLabel || !newSectionId) return addNotification('Error', 'Campos vacíos', 'warning');
                    setSections([...sections, { id: newSectionId, label: newSectionLabel, visible: true, order: sections.length + 1, type: 'custom' }]);
                    setNewSectionLabel(''); setNewSectionId('');
                  }}>Añadir</button>
                </div>
             </div>
             <div className="home-config-list">
               {sections.map((section, index) => (
                 <div key={section.id} className={`config-item ${!section.visible ? 'hidden-item' : ''}`}>
                   <div className="item-order-controls">
                     <FaArrowUp onClick={() => { if(index > 0) { const ns = [...sections]; [ns[index], ns[index-1]] = [ns[index-1], ns[index]]; setSections(ns.map((s,i)=>({...s,order:i+1}))); } }} /> 
                     <FaArrowDown onClick={() => { if(index < sections.length-1) { const ns = [...sections]; [ns[index], ns[index+1]] = [ns[index+1], ns[index]]; setSections(ns.map((s,i)=>({...s,order:i+1}))); } }} />
                   </div>
                   <div className="item-info"><input value={section.label} onChange={(e) => { const v = e.target.value; setSections(prev => prev.map(s => s.id === section.id ? { ...s, label: v } : s)); }} /></div>
                   <div className="item-visibility"><button className={section.visible? 'v':'h'} onClick={() => setSections(sections.map(s => s.id === section.id ? {...s, visible: !s.visible} : s))}>{section.visible ? 'Visible' : 'Oculto'}</button></div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="admin-config-tab animate-fade-in">
          <div className="admin-section-card glass highlight-card">
            <div className="section-header-row">
              <h2><FaPowerOff className="accent-icon" /> Control de Acceso Remoto</h2>
              <span className="badge-beta">Beta Control</span>
            </div>
            
            <p className="admin-note">
              Desde aquí controlas hasta cuándo estará disponible la aplicación. 
              Si la fecha es anterior a "ahora", la APK se bloqueará automáticamente.
            </p>

            <div className="config-grid">
              <div className="config-item-box">
                <label><FaCalendarAlt /> Fecha y Hora de Expiración</label>
                <div className="date-input-wrapper">
                  <input 
                    type="datetime-local" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="admin-date-input"
                  />
                </div>
                <p className="helper-text">La aplicación se desactivará al llegar a este momento.</p>
              </div>

              <div className="config-item-box lock-switch-container">
                <label><FaPowerOff /> Estado del Servidor</label>
                <button 
                  className={`lock-toggle-btn ${isLocked ? 'locked' : 'unlocked'} ${isUpdatingLock ? 'busy' : ''}`}
                  onClick={toggleAppLock}
                  disabled={isUpdatingLock}
                >
                  <div className="toggle-circle">
                    {isUpdatingLock && <div className="spinner-mini"></div>}
                  </div>
                  <span>{isLocked ? 'ACCESO BLOQUEADO' : 'ACCESO ACTIVO'}</span>
                </button>
                <p className="helper-text">
                  {isUpdatingLock ? 'Sincronizando con el servidor...' : 'Esto bloquea la app de inmediato, ignorando la fecha.'}
                </p>
              </div>

              <div className="config-item-box kill-switch-box">
                <label>Acciones Rápidas</label>
                <div className="quick-actions">
                  <button className="btn-quick" onClick={() => {
                    const d = new Date();
                    d.setHours(23, 59, 0, 0);
                    setExpiryDate(d.toISOString().slice(0,16));
                  }}>Hoy a medianoche</button>
                  <button className="btn-quick" onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(23, 59, 0, 0);
                    setExpiryDate(d.toISOString().slice(0,16));
                  }}>Mañana medianoche</button>
                </div>
              </div>
            </div>

            <div className="save-footer">
              <button 
                className="submit-btn publish big-btn" 
                onClick={handleSaveConfig}
                disabled={isSavingConfig || !expiryDate}
              >
                {isSavingConfig ? 'Guardando...' : <><FaSave /> Actualizar Acceso Remoto</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
