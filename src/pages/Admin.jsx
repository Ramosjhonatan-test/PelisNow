import { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from '../firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { FaPlus, FaTrash, FaImage, FaFilm, FaInfoCircle, FaEye, FaSearch, FaLink, FaEdit, FaSave, FaTimes, FaHome, FaArrowUp, FaArrowDown, FaCheckCircle, FaTimesCircle, FaTags, FaLanguage, FaCog, FaCalendarAlt, FaPowerOff, FaKey, FaClock, FaUserShield, FaLock, FaMobileAlt, FaListAlt, FaPlusCircle } from 'react-icons/fa';
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
  const [mixdropUrl, setMixdropUrl] = useState(''); // Mixdrop Field
  const [alternativeUrl3, setAlternativeUrl3] = useState(''); // New Generic Field
  const [selectedSection, setSelectedSection] = useState('exclusive');
  const [exclusiveMovies, setExclusiveMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mediaType, setMediaType] = useState('movie'); // 'movie' or 'tv'
  const { addNotification } = useNotifications();

  // User Management States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [passwordEditUser, setPasswordEditUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // App Config States
  const [expiryDate, setExpiryDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isUpdateForced, setIsUpdateForced] = useState(false);
  const [updateForceMsg, setUpdateForceMsg] = useState('Hay una nueva versión de PelisNow disponible. Contacta al administrador para obtenerla.');
  const [updateLink, setUpdateLink] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'premium', 'active', 'expired', 'blocked'
  const [customDaysInputs, setCustomDaysInputs] = useState({}); // { email: "45" }
  const [announcementText, setAnnouncementText] = useState('');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [isSavingAnnounce, setIsSavingAnnounce] = useState(false);
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  // Homepage Config States
  const [sections, setSections] = useState([]);
  const [loadingHome, setLoadingHome] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionId, setNewSectionId] = useState('');
  const [viewingDeviceUser, setViewingDeviceUser] = useState(null);
  
  // App Version States
  const [appVersions, setAppVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudieron cargar los usuarios', 'error');
    }
    setLoadingUsers(false);
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
         setIsUpdateForced(!!snap.data().isUpdateForced);
        if (snap.data().updateForceMsg) setUpdateForceMsg(snap.data().updateForceMsg);
        if (snap.data().updateLink) setUpdateLink(snap.data().updateLink);
        setIsAnnouncementActive(!!snap.data().isAnnouncementActive);
        if (snap.data().announcementText) setAnnouncementText(snap.data().announcementText);
      }
    } catch (err) { console.error(err); }
  };

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const q = collection(db, 'app_versions');
      const unsub = onSnapshot(q, (snap) => {
        setAppVersions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingVersions(false);
      }, (err) => {
        console.error("Firestore Error:", err);
        addNotification('Error', 'No se pudieron cargar las versiones.', 'error');
        setLoadingVersions(false);
      });
      return unsub;
    } catch (err) {
      console.error(err);
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    fetchExclusive();
    fetchHomeConfig();
    fetchAppConfig();
    fetchUsers();
    const unsubVersions = fetchVersions();
    return () => {
      unsubVersions?.then(u => u && u());
    };
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
        mixdrop_url: mixdropUrl,
        alternative_url_3: alternativeUrl3,
        tmdb_id: tmdbId || null,
        media_type: mediaType,
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

  const resetForm = () => { setEditingId(null); setTmdbId(''); setTitle(''); setOverview(''); setPoster(''); setBackdrop(''); setVideoUrl(''); setMixdropUrl(''); setAlternativeUrl3(''); setSelectedSection('exclusive'); setMediaType('movie'); };


  const startEdit = (movie) => {
    setEditingId(movie.id);
    setTmdbId(movie.tmdb_id || '');
    setTitle(movie.title);
    setOverview(movie.overview);
    setPoster(movie.poster_path);
    setBackdrop(movie.backdrop_path);
    setVideoUrl(movie.video_url || '');
    setMixdropUrl(movie.mixdrop_url || '');
    setAlternativeUrl3(movie.alternative_url_3 || '');
    setSelectedSection(movie.sectionId || 'exclusive');
    setMediaType(movie.media_type || 'movie');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (userEmail) => {
    if (!window.confirm(`⚠️ ELIMINACIÓN TOTAL: ¿Estás seguro de eliminar al usuario ${userEmail}?

Esta acción intentará borrarlo de Authentication y Firestore.`)) return;

    let authDeleted = false;
    let authError = null;

    try {
      // 1. Obtener datos del usuario para extraer la contraseña guardada (_pk)
      const userDoc = await getDoc(doc(db, 'users', userEmail));
      const userData = userDoc.data();
      const encodedPass = userData?._pk;

      if (encodedPass) {
        let tempApp;
        try {
          const pass = atob(encodedPass);
          // 2. Crear App temporal para borrar desde Authentication
          tempApp = initializeApp(firebaseConfig, `del-${Date.now()}`);
          const tempAuth = getAuth(tempApp);
          
          const userCred = await signInWithEmailAndPassword(tempAuth, userEmail, pass);
          if (userCred.user) {
            await deleteUser(userCred.user);
            authDeleted = true;
          }
        } catch (err) {
          console.error("Auth Deletion Error:", err);
          authError = err.message || "Error de credenciales o permisos";
        } finally {
          if (tempApp) await deleteApp(tempApp);
        }
      } else {
        authError = "No hay registro de contraseña (_pk) para este usuario.";
      }

      // 3. Borrar el registro principal en Firestore
      await deleteDoc(doc(db, 'users', userEmail));
      
      if (authDeleted) {
        addNotification('Éxito Total', `Usuario ${userEmail} eliminado de ambos sistemas.`, 'success');
      } else {
        addNotification('Eliminado Parcialmente', `DB borrada, pero no se pudo borrar de Auth: ${authError}`, 'warning');
      }
      
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo completar la acción.', 'error');
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!window.confirm('⚠️ ATENCIÓN: ¿Estás seguro de eliminar a TODOS los usuarios? Esta acción borrará sus perfiles de Firestore.')) return;
    if (!window.confirm('¿Realmente quieres continuar? Esta acción no se puede deshacer.')) return;

    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(u => deleteDoc(doc(db, 'users', u.id)));
      await Promise.all(deletePromises);
      
      addNotification('Base de Datos Limpia', 'Se eliminaron todos los perfiles de usuario.', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudieron eliminar todos los usuarios.', 'error');
    }
  };

  const handleToggleUserStatus = async (userEmail, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await setDoc(doc(db, 'users', userEmail), { status: newStatus }, { merge: true });
      // Send notification to user via Firestore
      await sendUserNotification(userEmail, 
        newStatus === 'active' ? '¡Cuenta Activada!' : 'Cuenta Suspendida',
        newStatus === 'active' ? 'Tu acceso a ZenPlus ha sido reactivado. ¡Disfruta!' : 'Tu acceso ha sido suspendido temporalmente. Contacta al administrador.',
        newStatus === 'active' ? 'success' : 'warning'
      );
      addNotification('Estado Actualizado', `Usuario ${newStatus === 'active' ? 'Activado' : 'Desactivado'}`, 'info');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo cambiar el estado.', 'error');
    }
  };

  // Send notification to a specific user via Firestore (they receive it in real-time with sound)
  const sendUserNotification = async (userEmail, title, message, type = 'info') => {
    try {
      await addDoc(collection(db, 'users', userEmail, 'notifications'), {
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  // Set account duration for a user (Additive: adds to current remaining time if any)
  const handleSetAccountDuration = async (userEmail, days) => {
    try {
      // Find current user data to see if they already have an active expiry
      const targetUser = users.find(u => u.id === userEmail);
      const currentExpiryStr = targetUser?.accountExpiry;
      const now = new Date();
      
      let baseDate = now;
      
      // If user has a future expiry, we add the new days starting from that date
      if (currentExpiryStr) {
        const currentExpiry = new Date(currentExpiryStr);
        if (currentExpiry > now) {
          baseDate = currentExpiry;
        }
      }

      const expiryDate = new Date(baseDate);
      expiryDate.setDate(expiryDate.getDate() + days);

      await setDoc(doc(db, 'users', userEmail), { accountExpiry: expiryDate.toISOString() }, { merge: true });
      
      const isSubtraction = days < 0;
      const absDays = Math.abs(days);

      await sendUserNotification(userEmail,
        isSubtraction ? '⚠️ Ajuste de suscripción' : '📅 Suscripción Actualizada',
        isSubtraction 
          ? `Se han removido ${absDays} días de tu cuenta. Nuevo vencimiento: ${expiryDate.toLocaleDateString()}.`
          : `Se han sumado ${days} días a tu cuenta. Nuevo vencimiento: ${expiryDate.toLocaleDateString()}.`,
        isSubtraction ? 'warning' : 'success'
      );
      
      addNotification(
        isSubtraction ? 'Días Restados' : 'Duración Sumada', 
        `${userEmail} → ${isSubtraction ? '-' : '+'}${absDays} días. Vence: ${expiryDate.toLocaleDateString()}`, 
        isSubtraction ? 'warning' : 'success'
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo asignar la duración.', 'error');
    }
  };

  // Remove account expiry (unlimited access)
  const handleRemoveExpiry = async (userEmail) => {
    try {
      await setDoc(doc(db, 'users', userEmail), { accountExpiry: null }, { merge: true });
      await sendUserNotification(userEmail, '♾️ Acceso Ilimitado', 'Tu cuenta ahora tiene acceso sin límite de tiempo.', 'success');
      addNotification('Sin Límite', `${userEmail} → Acceso ilimitado`, 'info');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Send password reset email to a user
  const handleResetDeviceId = async (userEmail) => {
    if (!window.confirm(`¿Liberar el equipo vinculado de ${userEmail}? El usuario podrá vincular un nuevo dispositivo al entrar.`)) return;
    try {
      await setDoc(doc(db, 'users', userEmail), { 
        deviceId: null,
        deviceModel: null,
        deviceManufacturer: null
      }, { merge: true });
      await sendUserNotification(userEmail, '📱 Equipo Liberado', 'Tu administrador ha liberado tu dispositivo vinculado. Ahora puedes entrar desde uno nuevo.', 'info');
      addNotification('Equipo Liberado', `Se ha limpiado el ID de hardware para ${userEmail}`, 'success');
      setViewingDeviceUser(null); // Close modal
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo liberar el equipo.', 'error');
    }
  };

  const handleResetPassword = async (userEmail) => {
    try {
      await sendPasswordResetEmail(auth, userEmail);
      await sendUserNotification(userEmail, '🔑 Cambio de Contraseña', 'Se ha enviado un enlace para restablecer tu contraseña a tu correo.', 'info');
      addNotification('Correo Enviado', `Se envió un enlace de restablecimiento a ${userEmail}`, 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo enviar el correo de restablecimiento.', 'error');
    }
  };

  const toggleVersionBlock = async (vId, currentStatus) => {
    try {
      await setDoc(doc(db, 'app_versions', vId), { isBlocked: !currentStatus }, { merge: true });
      addNotification('Versión Actualizada', `La versión ${vId} ha sido ${!currentStatus ? 'Bloqueada' : 'Activada'}`, 'info');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo actualizar el estado de la versión.', 'error');
    }
  };

  const deleteVersionRecord = async (vId) => {
    if (window.confirm(`¿Eliminar el registro de la versión ${vId}? Se volverá a registrar si alguien la abre.`)) {
      try {
        await deleteDoc(doc(db, 'app_versions', vId));
        addNotification('Registro Eliminado', 'Se ha removido el registro de la versión.', 'success');
      } catch (err) {
        console.error(err);
        addNotification('Error', 'No se pudo eliminar el registro.', 'error');
      }
    }
  };

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

  const saveAccessConfig = async () => {
    setIsSavingAccess(true);
    try {
      const localDate = new Date(expiryDate);
      await setDoc(doc(db, 'settings', 'app_config'), {
        expiryDate: localDate.toISOString(),
        isLocked: isLocked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      addNotification('Acceso Actualizado', 'La fecha y el bloqueo se han guardado.', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo guardar el acceso.', 'error');
    }
    setIsSavingAccess(false);
  };

  const saveAnnouncementConfig = async () => {
    setIsSavingAnnounce(true);
    try {
      await setDoc(doc(db, 'settings', 'app_config'), {
        isAnnouncementActive: isAnnouncementActive,
        announcementText: announcementText,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      addNotification('Aviso Actualizado', 'El mensaje global se ha guardado.', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo guardar el aviso.', 'error');
    }
    setIsSavingAnnounce(false);
  };

  const saveUpdateConfig = async () => {
    setIsSavingUpdate(true);
    try {
      await setDoc(doc(db, 'settings', 'app_config'), {
        isUpdateForced: isUpdateForced,
        updateForceMsg: updateForceMsg,
        updateLink: updateLink,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      addNotification('Actualización Guardada', 'La alerta de versión se ha guardado.', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Error', 'No se pudo guardar la alerta.', 'error');
    }
    setIsSavingUpdate(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Centro de Control ZenPlus</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'movies' ? 'active' : ''} onClick={() => setActiveTab('movies')}><FaFilm /> Películas</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><FaCheckCircle /> Usuarios</button>
          <button className={activeTab === 'versions' ? 'active' : ''} onClick={() => setActiveTab('versions')}><FaListAlt /> Versiones</button>
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
                  <div className="input-group"><label><FaLink /> URL Mixdrop (Alternativo 2)</label><input value={mixdropUrl} onChange={(e) => setMixdropUrl(e.target.value)} placeholder="Ej: https://m1xdrop.click/e/xxxx" /></div>
                  <div className="input-group"><label><FaLink /> URL Servidor (Alternativo 3)</label><input value={alternativeUrl3} onChange={(e) => setAlternativeUrl3(e.target.value)} placeholder="Ej: Cualquier otro enlace de video" /></div>
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
              {exclusiveMovies.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              }).map((movie, index) => (
                <div key={movie.id} className="admin-item-card">
                  <div className="img-container">
                    <span className="item-number-badge">#{index + 1}</span>
                    <img src={movie.poster_path} alt={movie.title} />
                    <div className="admin-actions-overlay">
                      <button onClick={() => startEdit(movie)} className="action-btn edit"><FaEdit /></button>
                      <button onClick={async () => { if (window.confirm('Eliminar?')) { await deleteDoc(doc(db, 'exclusive_movies', movie.id)); fetchExclusive(); } }} className="action-btn delete"><FaTrash /></button>
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

      {activeTab === 'versions' && (
        <div className="admin-versions-tab animate-fade-in">
          <div className="admin-section-card glass highlight-card">
            <div className="section-header-row">
              <h2><FaListAlt className="accent-icon" /> Control de Versiones del APK</h2>
              <span className="badge-beta">Seguridad Local</span>
            </div>

            <p className="admin-note">
              Cada vez que subas una nueva versión con un nuevo <code>versionName</code>, aparecerá aquí automáticamente.
              Puedes "Desactivar" versiones antiguas para forzar a los usuarios a descargar la más reciente.
            </p>

            <div className="admin-versions-list">
              {loadingVersions ? (
                <div className="loading-spinner">Cargando versiones...</div>
              ) : (
                appVersions.sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
                }).map((v, index) => (
                  <div key={v.id} className={`version-card ${v.isBlocked ? 'is-blocked' : 'is-active'}`}>
                    <div className="version-info-main">
                      <div className="v-icon">#{index + 1}</div>
                      <div className="v-details">
                        <h3>Versión {v.versionName}</h3>
                        <span className="v-date">Registrada: {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span className="v-date">Vistazo: {v.lastSeen ? new Date(v.lastSeen).toLocaleString() : 'Nunca'}</span>
                      </div>
                    </div>
                    
                    <div className="version-actions">
                      <div className="v-status">
                        <span className={`status-pill ${v.isBlocked ? 'blocked' : 'active'}`}>
                          {v.isBlocked ? '⛔ Bloqueada' : '✅ Activa'}
                        </span>
                      </div>
                      <button 
                        className={`toggle-v-btn ${v.isBlocked ? 'btn-unblock' : 'btn-block'}`}
                        onClick={() => toggleVersionBlock(v.id, v.isBlocked)}
                      >
                        {v.isBlocked ? 'Activar Versión' : 'Desactivar Versión'}
                      </button>
                      <button className="delete-v-btn" onClick={() => deleteVersionRecord(v.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {appVersions.length === 0 && !loadingVersions && (
                <div className="no-data">No hay versiones registradas. Instala la app para ver la primera.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-users-tab animate-fade-in">
          <div className="admin-section-card glass">
            <div className="section-header-row">
              <h2><FaUserShield className="accent-icon" /> Gestión de Usuarios ({users.length})</h2>
              <button className="import-btn" onClick={fetchUsers}><FaSearch /> Refrescar</button>
            </div>

            <p className="admin-note">
              Control total de cuentas: activa/desactiva, asigna duración, restablece contraseñas y envía notificaciones en tiempo real.
            </p>

            {/* User Filters */}
            <div className="user-filters-bar">
              <button 
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Todos
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'premium' ? 'active' : ''}`}
                onClick={() => setFilterStatus('premium')}
              >
                💎 VIP / ilimitados
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                🟢 Activos
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`}
                onClick={() => setFilterStatus('expired')}
              >
                🟡 Vencidos
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'blocked' ? 'active' : ''}`}
                onClick={() => setFilterStatus('blocked')}
              >
                🔴 Bloqueados
              </button>
            </div>

            {/* User Search */}
            <div className="user-search-wrapper">
              <div className="user-search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Buscar por correo, nombre o teléfono..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSearch && <FaTimes className="clear-search" onClick={() => setUserSearch('')} />}
              </div>
              <button className="btn-cleanup-all" onClick={handleDeleteAllUsers}>
                <FaTrash /> Limpiar BD de Usuarios
              </button>
            </div>

            <div className="admin-users-list">
              {loadingUsers ? (
                <div className="loading-spinner">Cargando usuarios...</div>
              ) : (
                users.filter(u => {
                  if (!userSearch.trim()) return true;
                  const q = userSearch.toLowerCase();
                  return u.id.toLowerCase().includes(q) ||
                    (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q));
                }).filter(u => {
                  const accountExpiry = u.accountExpiry ? new Date(u.accountExpiry) : null;
                  const isAccountExpired = accountExpiry && new Date() > accountExpiry;
                  const isBlocked = u.status === 'blocked';
                  const isPremium = !u.accountExpiry;

                  if (filterStatus === 'premium') return isPremium;
                  if (filterStatus === 'active') return !isPremium && !isAccountExpired && !isBlocked;
                  if (filterStatus === 'expired') return !isPremium && isAccountExpired;
                  if (filterStatus === 'blocked') return isBlocked;
                  return true;
                }).sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
                }).map((u, index) => {
                  const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
                  const isBlocked = u.status === 'blocked';
                  const accountExpiry = u.accountExpiry ? new Date(u.accountExpiry) : null;
                  const isAccountExpired = accountExpiry && new Date() > accountExpiry;
                  const daysLeft = accountExpiry ? Math.ceil((accountExpiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div key={u.id} className={`user-management-card ${isBlocked ? 'is-blocked' : ''} ${isAccountExpired ? 'is-expired' : ''}`}>
                      {/* Header: Avatar + Info */}
                      <div className="umc-header">
                        <div className="umc-avatar">
                          {u.photoURL ? <img src={u.photoURL} alt="" /> : <div className="avatar-placeholder">{u.id.charAt(0).toUpperCase()}</div>}
                        </div>
                        <div className="umc-info">
                          <span className="umc-email">
                            <span style={{ color: '#e50914', fontWeight: 'bold', marginRight: '8px' }}>#{index + 1}</span>
                            {u.id}
                          </span>
                          {u.displayName && <span className="umc-name">{u.displayName}</span>}
                          {u.phone && <span className="umc-phone">📱 {u.phone}</span>}
                          <span className="umc-reg">Registrado: {regDate}</span>
                        </div>
                        <div className="umc-status-badge">
                          <span className={`status-pill ${isBlocked ? 'blocked' : isAccountExpired ? 'expired' : 'active'}`}>
                            {isBlocked ? '🔴 Bloqueado' : isAccountExpired ? '🟡 Vencido' : '🟢 Activo'}
                          </span>
                          {u.deviceId && (
                            <span className="status-pill device-linked" onClick={() => setViewingDeviceUser(u)}>
                              <FaMobileAlt /> Vinculado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subscription Duration */}
                      <div className="umc-section">
                        <label><FaClock /> Duración de Cuenta</label>
                        <div className="umc-expiry-info">
                          {accountExpiry ? (
                            <span className={`expiry-text ${isAccountExpired ? 'expired' : 'valid'}`}>
                              {isAccountExpired
                                ? `❌ Venció el ${accountExpiry.toLocaleDateString()}`
                                : `✅ Vigente hasta ${accountExpiry.toLocaleDateString()} (${daysLeft} días restantes)`
                              }
                            </span>
                          ) : (
                            <span className="expiry-text unlimited">♾️ Sin límite de tiempo</span>
                          )}
                        </div>
                        <div className="umc-duration-btns">
                          <button onClick={() => handleSetAccountDuration(u.id, 7)}>7 días</button>
                          <button onClick={() => handleSetAccountDuration(u.id, 15)}>15 días</button>
                          <button onClick={() => handleSetAccountDuration(u.id, 30)}>30 días</button>
                          <button onClick={() => handleSetAccountDuration(u.id, 90)}>3 meses</button>
                          <button onClick={() => handleSetAccountDuration(u.id, 365)}>1 año</button>
                          
                          <div className="custom-days-box">
                            <input 
                              type="number" 
                              placeholder="Días"
                              value={customDaysInputs[u.id] || ''}
                              onChange={(e) => setCustomDaysInputs({ ...customDaysInputs, [u.id]: e.target.value })}
                            />
                            <button 
                              onClick={() => {
                                const days = parseInt(customDaysInputs[u.id]);
                                if (days > 0) {
                                  handleSetAccountDuration(u.id, days);
                                  setCustomDaysInputs({ ...customDaysInputs, [u.id]: '' });
                                }
                              }}
                              className="btn-apply-custom"
                            >
                              + Sumar
                            </button>
                            <button 
                              onClick={() => {
                                const days = parseInt(customDaysInputs[u.id]);
                                if (days > 0) {
                                  handleSetAccountDuration(u.id, -days);
                                  setCustomDaysInputs({ ...customDaysInputs, [u.id]: '' });
                                }
                              }}
                              className="btn-subtract-custom"
                            >
                              - Restar
                            </button>
                          </div>

                          {accountExpiry && (
                            <button className="btn-unlimited" onClick={() => handleRemoveExpiry(u.id)}>♾️ Ilimitado</button>
                          )}
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="umc-actions">
                        <button
                          className={`umc-btn ${isBlocked ? 'btn-activate' : 'btn-block'}`}
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                        >
                          {isBlocked ? <><FaCheckCircle /> Activar</> : <><FaTimesCircle /> Desactivar</>}
                        </button>
                        <button className="umc-btn btn-password" onClick={() => {
                          if (passwordEditUser === u.id) {
                            setPasswordEditUser(null);
                            setNewPasswordValue('');
                          } else {
                            setPasswordEditUser(u.id);
                            setNewPasswordValue('');
                          }
                        }}>
                          <FaKey /> {passwordEditUser === u.id ? 'Cancelar' : 'Cambiar Contraseña'}
                        </button>
                        <button className="umc-btn btn-device" onClick={() => setViewingDeviceUser(u)}>
                          <FaMobileAlt /> Ver Equipo
                        </button>
                        <button className="umc-btn btn-delete" onClick={() => handleDeleteUser(u.id)}>
                          <FaTrash /> Eliminar
                        </button>
                      </div>

                      {/* Inline Password Change */}
                      {passwordEditUser === u.id && (
                        <div className="umc-password-inline">
                          <input
                            type="password"
                            placeholder="Nueva contraseña (mín. 6 caracteres)"
                            value={newPasswordValue}
                            onChange={(e) => setNewPasswordValue(e.target.value)}
                            autoFocus
                          />
                          <button
                            className="btn-confirm-pass"
                            disabled={newPasswordValue.length < 6}
                            onClick={async () => {
                              try {
                                // 1. Check if we have the user's current password stored
                                const userDoc = await getDoc(doc(db, 'users', u.id));
                                const currentEncodedPass = userDoc.data()?._pk;

                                if (currentEncodedPass) {
                                  // INSTANT UPDATE MODE
                                  try {
                                    const currentPass = atob(currentEncodedPass);
                                    // Initialize a temp app to avoid affecting admin session
                                    const tempAppName = `temp-auth-${u.id}-${Date.now()}`;
                                    const tempApp = initializeApp(firebaseConfig, tempAppName);
                                    const tempAuth = getAuth(tempApp);

                                    // Sign in as the user in the temp app
                                    await signInWithEmailAndPassword(tempAuth, u.id, currentPass);
                                    
                                    // Update password in Auth
                                    await updatePassword(tempAuth.currentUser, newPasswordValue);
                                    
                                    // Cleanup temp app
                                    await deleteApp(tempApp);

                                    // Update _pk in Firestore
                                    await setDoc(doc(db, 'users', u.id), { 
                                      _pk: btoa(newPasswordValue),
                                      tempPassword: null // Clear any old temp password
                                    }, { merge: true });

                                    addNotification('Éxito', `Contraseña de ${u.id} actualizada instantáneamente`, 'success');
                                  } catch (authErr) {
                                    console.error("Auth Instant Update Error:", authErr);
                                    // Fallback to tempPassword if auth failed
                                    await setDoc(doc(db, 'users', u.id), { tempPassword: newPasswordValue }, { merge: true });
                                    addNotification('Info', 'Se aplicó como cambio diferido (el usuario debe entrar con la vieja una vez más)', 'info');
                                  }
                                } else {
                                  // FALLBACK MODE (Stored password not found)
                                  await setDoc(doc(db, 'users', u.id), { tempPassword: newPasswordValue }, { merge: true });
                                  addNotification('Info', 'Cambio diferido: El usuario debe entrar con su contraseña actual una vez más para aplicar el cambio.', 'info');
                                }

                                await sendUserNotification(u.id, '🔑 Contraseña Actualizada', `El administrador ha establecido una nueva contraseña para tu cuenta.`, 'info');
                                setPasswordEditUser(null);
                                setNewPasswordValue('');
                              } catch (err) {
                                console.error(err);
                                addNotification('Error', 'No se pudo procesar el cambio de contraseña', 'error');
                              }
                            }}
                          >
                            ✅ Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {!loadingUsers && users.length === 0 && (
                <div className="no-data">No hay usuarios registrados aún.</div>
              )}
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
            <div className="create-section-box premium-box">
              <h4><FaPlus /> Añadir Nueva Sección</h4>
              <p className="admin-note" style={{marginBottom: '15px'}}>Selecciona una categoría oficial del sistema TMDB o crea una "Personalizada" para tus películas subidas a mano.</p>
              <div className="create-inputs">
                <select 
                  className="admin-select"
                  value={newSectionId === '' ? '' : (['marvel', 'dc', 'anime', 'animeMovies', 'kids', 'scifi', 'asianDramas', 'top2026', 'top2025', 'top2024', 'horror', 'romance', 'documentaries', 'topRated', 'upcoming', 'trending', 'netflixOriginals'].includes(newSectionId) ? newSectionId : 'custom')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setNewSectionId('nueva_seccion');
                      setNewSectionLabel('Nueva Sección Manual');
                    } else if (val) {
                      setNewSectionId(val);
                      setNewSectionLabel(e.target.options[e.target.selectedIndex].text);
                    } else {
                      setNewSectionId('');
                      setNewSectionLabel('');
                    }
                  }}
                >
                  <option value="">-- Elige una Categoría del Sistema --</option>
                  <optgroup label="Oficiales de Catálogo TMDB">
                    <option value="marvel">Universo Marvel</option>
                    <option value="dc">Universo DC</option>
                    <option value="anime">Series de Anime</option>
                    <option value="animeMovies">Películas de Anime</option>
                    <option value="kids">Animación y Niños</option>
                    <option value="scifi">Ciencia Ficción</option>
                    <option value="asianDramas">Doramas y Asia</option>
                    <option value="top2026">Top Estrenos 2026</option>
                    <option value="top2025">Top Estrenos 2025</option>
                    <option value="top2024">Mejores del 2024</option>
                    <option value="horror">Terror</option>
                    <option value="romance">Romance</option>
                    <option value="documentaries">Documentales</option>
                    <option value="topRated">Mejor Valoradas (Global)</option>
                    <option value="upcoming">Próximos Estrenos</option>
                    <option value="trending">Tendencias Globales</option>
                    <option value="netflixOriginals">Destacados (Netflix)</option>
                  </optgroup>
                  <optgroup label="Tu Colección Propia">
                    <option value="custom">++ Categoría Personalizada (Manual) ++</option>
                  </optgroup>
                </select>

                {(!['marvel', 'dc', 'anime', 'animeMovies', 'kids', 'scifi', 'asianDramas', 'top2026', 'top2025', 'top2024', 'horror', 'romance', 'documentaries', 'topRated', 'upcoming', 'trending', 'netflixOriginals', ''].includes(newSectionId)) && (
                  <input style={{marginTop: '10px'}} placeholder="ID de la sección (ej: mis_peliculas)" value={newSectionId} onChange={(e) => setNewSectionId(e.target.value.toLowerCase().replace(/\s+/g, '_'))} />
                )}
                
                {newSectionId !== '' && (
                  <input style={{marginTop: '10px'}} placeholder="Título Visible (ej: Acción Total)" value={newSectionLabel} onChange={(e) => setNewSectionLabel(e.target.value)} />
                )}

                <button 
                  className="import-btn"
                  style={{marginTop: '10px', width: '100%'}}
                  onClick={() => {
                  if (!newSectionLabel || !newSectionId) return addNotification('Error', 'Campos vacíos', 'warning');
                  setSections([...sections, { id: newSectionId, label: newSectionLabel, visible: true, order: sections.length + 1, type: newSectionId.includes('_') ? 'custom' : 'tmdb' }]);
                  setNewSectionLabel(''); setNewSectionId('');
                  addNotification('Agregado', 'No olvides presionar Guardar Todo', 'info');
                }}>Añadir Sección</button>
              </div>
            </div>
            <div className="home-config-list">
              {sections.map((section, index) => (
                <div key={`${section.id}-${index}`} className={`config-item ${!section.visible ? 'hidden-item' : ''}`} style={{display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px', margin: '10px 0', borderRadius: '10px'}}>
                  <div className="item-order-controls" style={{display: 'flex', flexDirection: 'column', gap: '5px', marginRight: '15px'}}>
                    <FaArrowUp style={{cursor: 'pointer', color: index === 0 ? 'gray' : 'white'}} onClick={() => { if (index > 0) { const ns = [...sections];[ns[index], ns[index - 1]] = [ns[index - 1], ns[index]]; setSections(ns.map((s, i) => ({ ...s, order: i + 1 }))); } }} />
                    <FaArrowDown style={{cursor: 'pointer', color: index === sections.length - 1 ? 'gray' : 'white'}} onClick={() => { if (index < sections.length - 1) { const ns = [...sections];[ns[index], ns[index + 1]] = [ns[index + 1], ns[index]]; setSections(ns.map((s, i) => ({ ...s, order: i + 1 }))); } }} />
                  </div>
                  <div className="item-info" style={{flex: 1}}>
                    <input className="admin-input-clean" style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px', width: '90%', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold'}} value={section.label} onChange={(e) => { const v = e.target.value; setSections(prev => prev.map(s => s.id === section.id ? { ...s, label: v } : s)); }} />
                    <div style={{fontSize: '12px', color: '#888', marginTop: '5px'}}>ID Interno: <code>{section.id}</code></div>
                  </div>
                  <div className="item-actions" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <button style={{padding: '8px 15px', borderRadius: '20px', border: 'none', background: section.visible ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)', color: section.visible ? '#4ade80' : '#888', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => setSections(sections.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s))}>{section.visible ? '👁️ Visible' : '🙈 Oculto'}</button>
                    <FaTrash 
                      style={{color: '#ef4444', cursor: 'pointer', fontSize: '18px'}} 
                      onClick={() => {
                        if(window.confirm(`¿Seguro que quieres borrar la sección "${section.label}" de la portada?`)) {
                          setSections(sections.filter(s => s.id !== section.id));
                        }
                      }} 
                    />
                  </div>
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
                <label><FaPowerOff /> Modo de Seguridad (Control por Fecha)</label>
                <button
                  className={`lock-toggle-btn ${isLocked ? 'locked' : 'unlocked'} ${isUpdatingLock ? 'busy' : ''}`}
                  onClick={toggleAppLock}
                  disabled={isUpdatingLock}
                >
                  <div className="toggle-circle">
                    {isUpdatingLock && <div className="spinner-mini"></div>}
                  </div>
                  <span>{isLocked ? 'SEGURIDAD ACTIVADA' : 'ACCESO TOTAL CONCEDIDO'}</span>
                </button>
                <p className="helper-text">
                  {isLocked
                    ? 'La app se bloqueará si la fecha expira.'
                    : 'La app estará abierta ignorando la fecha (Ideal para pruebas).'}
                </p>
              </div>

              <div className="config-item-box kill-switch-box">
                <label>Acciones Rápidas</label>
                <div className="quick-actions">
                  <button className="btn-quick" onClick={() => {
                    const d = new Date();
                    d.setHours(23, 59, 0, 0);
                    setExpiryDate(d.toISOString().slice(0, 16));
                  }}>Hoy a medianoche</button>
                  <button className="btn-quick" onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(23, 59, 0, 0);
                    setExpiryDate(d.toISOString().slice(0, 16));
                  }}>Mañana medianoche</button>
                </div>
              </div>
            </div>

            <div className="save-footer" style={{marginTop: '20px', justifyContent: 'flex-end'}}>
              <button
                className="submit-btn update-btn"
                onClick={saveAccessConfig}
                disabled={isSavingAccess}
                style={{padding: '10px 25px', fontSize: '0.9rem'}}
              >
                {isSavingAccess ? 'Guardando...' : <><FaSave /> Guardar Acceso</>}
              </button>
            </div>

            <div className="admin-divider"></div>

            <div className="version-control-section">
              <div className="section-header-row">
                <h2><FaPlusCircle className="accent-icon" /> Aviso Global (Banner Home)</h2>
              </div>
              <p className="admin-note">Activa un mensaje especial que aparecerá en la parte superior de la pantalla principal para todos los usuarios.</p>
              
              <div className="config-grid">
                <div className="config-item-box">
                  <label>Estado del Aviso</label>
                  <button
                    className={`lock-toggle-btn ${isAnnouncementActive ? 'locked' : 'unlocked'}`}
                    onClick={() => setIsAnnouncementActive(!isAnnouncementActive)}
                  >
                    <div className="toggle-circle"></div>
                    <span>{isAnnouncementActive ? 'AVISO ACTIVO EN LA HOME' : 'AVISO DESACTIVADO'}</span>
                  </button>
                </div>
                
                <div className="config-item-box full-width">
                  <label>Mensaje del Banner</label>
                  <textarea
                    className="admin-textarea"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Ej: ¡Nuevo estreno disponible: Intensamente 2! Mírala ahora."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="save-footer" style={{marginTop: '20px', justifyContent: 'flex-end'}}>
              <button
                className="submit-btn update-btn"
                onClick={saveAnnouncementConfig}
                disabled={isSavingAnnounce}
                style={{padding: '10px 25px', fontSize: '0.9rem'}}
              >
                {isSavingAnnounce ? 'Guardando...' : <><FaSave /> Guardar Aviso</>}
              </button>
            </div>

            <div className="admin-divider"></div>

            <div className="version-control-section">
              <div className="section-header-row">
                <h2><FaMobileAlt className="accent-icon" /> Control de Actualizaciones</h2>
              </div>
              <p className="admin-note">Activa este mensaje si has subido una nueva APK y quieres que tus usuarios la descarguen.</p>
              
              <div className="config-grid">
                <div className="config-item-box">
                  <label>Estado de Alerta</label>
                  <button
                    className={`lock-toggle-btn ${isUpdateForced ? 'locked' : 'unlocked'}`}
                    onClick={() => setIsUpdateForced(!isUpdateForced)}
                  >
                    <div className="toggle-circle"></div>
                    <span>{isUpdateForced ? 'ALERTA DE ACTUALIZACIÓN ACTIVA' : 'SIN ALERTAS'}</span>
                  </button>
                </div>
                
                <div className="config-item-box full-width">
                  <label>Mensaje para el Usuario</label>
                  <textarea
                    className="admin-textarea"
                    value={updateForceMsg}
                    onChange={(e) => setUpdateForceMsg(e.target.value)}
                    placeholder="Escribe el mensaje que verán los usuarios..."
                  ></textarea>
                </div>

                <div className="config-item-box full-width">
                  <label><FaLink /> Enlace de Descarga (Mediafire / Directo)</label>
                  <input
                    type="text"
                    className="admin-date-input"
                    value={updateLink}
                    onChange={(e) => setUpdateLink(e.target.value)}
                    placeholder="https://www.mediafire.com/file/..."
                  />
                  <p className="helper-text">Este enlace aparecerá como un botón de descarga para los usuarios bloqueados.</p>
                </div>
              </div>

              <div className="save-footer" style={{marginTop: '20px', justifyContent: 'flex-end'}}>
                <button
                  className="submit-btn update-btn"
                  onClick={saveUpdateConfig}
                  disabled={isSavingUpdate}
                  style={{padding: '10px 25px', fontSize: '0.9rem'}}
                >
                  {isSavingUpdate ? 'Guardando...' : <><FaSave /> Guardar Actualización</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Management Modal */}
      {viewingDeviceUser && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setViewingDeviceUser(null)}>
          <div className="admin-modal-content device-modal glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaMobileAlt /> Gestión de Equipo</h3>
              <button className="close-btn" onClick={() => setViewingDeviceUser(null)}><FaTimes /></button>
            </div>
            
            <div className="device-info-body">
              <div className="device-main-icon">
                <FaUserShield />
              </div>
              
              <div className="device-details">
                <div className="detail-row">
                  <label>Marca / Fabricante:</label>
                  <span>{viewingDeviceUser.deviceManufacturer || 'No registrado'}</span>
                </div>
                <div className="detail-row">
                  <label>Modelo:</label>
                  <span>{viewingDeviceUser.deviceModel || 'Desconocido'}</span>
                </div>
                <div className="detail-row">
                  <label>ID de Hardware:</label>
                  <span className="mono-text">{viewingDeviceUser.deviceId ? `${viewingDeviceUser.deviceId.substring(0, 8)}...` : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Fecha Vinculación:</label>
                  <span>{viewingDeviceUser.deviceBindDate ? new Date(viewingDeviceUser.deviceBindDate).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              <div className="device-modal-actions">
                <button 
                  className="liberar-btn" 
                  disabled={!viewingDeviceUser.deviceId}
                  onClick={() => handleResetDeviceId(viewingDeviceUser.id)}
                >
                  <FaTrash /> Liberar Dispositivo de Cuenta
                </button>
                <p className="device-note">
                  Al liberar, el usuario podrá vincular su cuenta a un nuevo teléfono al iniciar sesión nuevamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
