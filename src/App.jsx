import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MovieDetails from './pages/MovieDetails';
import MyList from './pages/MyList';
import Search from './pages/Search';
import Admin from './pages/Admin';
import Discover from './pages/Discover';
import SplashScreen from './components/SplashScreen';
import SecurityGuard from './components/SecurityGuard';
import PremiumModal from './components/PremiumModal';
import { UserAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';
import { db } from './firebase';
import { doc, onSnapshot, collection, query, orderBy, getDocs, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

function AppContent() {
  const { user } = UserAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [appConfig, setAppConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('zenplus_app_config');
      return saved ? JSON.parse(saved) : { expiryDate: '2026-12-31T23:59:59Z' };
    } catch (e) {
      return { expiryDate: '2026-12-31T23:59:59Z' };
    }
  });
  const [loadingConfig, setLoadingConfig] = useState(!localStorage.getItem('zenplus_app_config'));
  const [userDoc, setUserDoc] = useState(null);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({ model: 'N/A', manufacturer: 'N/A' });
  // Scrambled Constants (Anti-Grep)
  const _V = atob('YXBwX3ZlcnNpb25z'); // app_versions
  const _S = atob('c2V0dGluZ3M='); // settings
  const _C = atob('YXBwX2NvbmZpZw=='); // app_config
  const [isDeviceUnauthorized, setIsDeviceUnauthorized] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('...');
  const [isVersionBlocked, setIsVersionBlocked] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState(true);

  // Fetch unique Device ID on mount (Native Only)
  useEffect(() => {
    const fetchId = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const idInfo = await Device.getId();
          const moreInfo = await Device.getInfo();
          setCurrentDeviceId(idInfo.identifier);
          setDeviceInfo({
            model: moreInfo.model || 'N/A',
            manufacturer: moreInfo.manufacturer || 'N/A'
          });
        } catch (e) {
          console.error("Error fetching device ID", e);
        }
      }
    };
    fetchId();
  }, []);

  // 1. VERSION CONTROL (Read & Write)
  useEffect(() => {
    let unsubSnapshot;
    let safetyTimer;

    const startVersionSync = async () => {
      try {
        const info = await CapApp.getInfo();
        const vName = info.version || 'web-dev';
        setCurrentVersion(vName);

        const vRef = doc(db, _V, vName);

        // --- STEP A: Listado (Read) ---
        unsubSnapshot = onSnapshot(vRef, (snap) => {
          if (snap.exists()) {
            setIsVersionBlocked(snap.data().isBlocked === true);
          }
          setLoadingVersion(false);
        }, (err) => {
          setLoadingVersion(false); 
        });

        // --- STEP B: Registro (Write) ---
        if (user && vName !== '...') {
          await setDoc(vRef, {
            versionName: vName,
            lastSeen: new Date().toISOString(),
            platform: Capacitor.getPlatform(),
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        safetyTimer = setTimeout(() => setLoadingVersion(false), 6000);
      } catch (e) {
        setLoadingVersion(false);
      }
    };

    startVersionSync();

    return () => {
      unsubSnapshot && unsubSnapshot();
      safetyTimer && clearTimeout(safetyTimer);
    };
  }, [user]);

  // Listener for user document (Status & Device check)
  useEffect(() => {
    if (!user?.email) {
      setUserDoc(null);
      setIsDeviceUnauthorized(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.email), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserDoc(data);

        // DEVICE LOCK LOGIC (Native Only)
        if (Capacitor.isNativePlatform() && currentDeviceId) {
          if (!data.deviceId) {
            // First time: Bind current device
            try {
              console.log("Binding device:", currentDeviceId, deviceInfo.model);
              await setDoc(doc(db, 'users', user.email), { 
                deviceId: currentDeviceId,
                deviceModel: deviceInfo.model || 'Unknown',
                deviceManufacturer: deviceInfo.manufacturer || 'Unknown',
                deviceBindDate: new Date().toISOString()
              }, { merge: true });
              console.log("Device auto-bound successfully");
            } catch (e) {
              console.error("Auto-bind error:", e);
            }
          } else if (data.deviceId !== currentDeviceId) {
            setIsDeviceUnauthorized(true);
          } else {
            setIsDeviceUnauthorized(false);
          }
        }
      }
    });
    return () => unsub();
  }, [user, currentDeviceId, deviceInfo]);

  // Real-time notification listener from admin
  useEffect(() => {
    if (!user?.email) return;
    const notifRef = collection(db, 'users', user.email, 'notifications');
    const unsub = onSnapshot(notifRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data.read) {
            // Play notification sound
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {}
            // Show notification
            addNotification(data.title || 'Notificación', data.message || '', data.type || 'info');
            // Mark as read / delete
            try {
              await deleteDoc(doc(db, 'users', user.email, 'notifications', change.doc.id));
            } catch (e) {}
          }
        }
      });
    });
    return () => unsub();
  }, [user, addNotification]);

  // Remotely managed access control
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, _S, _C), (snap) => {
      try {
        if (snap.exists()) {
          const data = snap.data();
          setAppConfig(data);
          localStorage.setItem('zenplus_app_config', JSON.stringify(data));
          setDbError(null);
          
          const isTimeExpired = data.expiryDate && new Date() > new Date(data.expiryDate);
          const isSecurityOn = data.isLocked === true;
          const isCurrentlyExpired = isSecurityOn && isTimeExpired;
          
          const wasExpired = localStorage.getItem('zenplus_was_expired') === 'true';
          
          if (wasExpired && !isCurrentlyExpired) {
            addNotification('Servidor Activo', '¡El acceso a ZenPlus ha sido reactivado!', 'success');
          }
          
          localStorage.setItem('zenplus_was_expired', isCurrentlyExpired ? 'true' : 'false');
        } else {
          setDbError('Configuración no encontrada');
        }
      } catch (err) {
        setDbError('Error de sincronización');
      }
      setLoadingConfig(false);
    }, (err) => {
      setDbError(`Error de conexión`);
      setLoadingConfig(false);
    });
    return () => unsub();
  }, [addNotification]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    const backHandler = CapApp.addListener('backButton', () => {
      const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement;

      if (isFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        return; 
      }

      // GLOBAL MODAL INTERCEPTOR
      // If any component declared a modal is open, we close the modal instead of navigating back.
      if (window.isAppModalOpen) {
        window.dispatchEvent(new Event('closeAppModal'));
        return;
      }

      if (window.location.pathname === '/') {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backHandler.then(h => h.remove());
    };
  }, [location, navigate]);

  // Heartbeat check for expiration every 30 seconds
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // GUEST TIME LIMIT LOGIC (10 Minutes)
  const [isGuestExpired, setIsGuestExpired] = useState(false);
  useEffect(() => {
    if (user?.email) {
      setIsGuestExpired(false);
      localStorage.removeItem('zenplus_guest_start');
      return;
    }

    let startTime = localStorage.getItem('zenplus_guest_start');
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem('zenplus_guest_start', startTime);
    }

    const checkGuestTime = () => {
      const elapsed = Date.now() - parseInt(startTime, 10);
      //limite de tiempo de prueba
      const limitMs = 2 * 60 * 1000; // 10 minutes
      if (elapsed > limitMs) {
        setIsGuestExpired(true);
      }
    };

    checkGuestTime();
    const guestInterval = setInterval(checkGuestTime, 10000); // Check every 10 secs
    return () => clearInterval(guestInterval);
  }, [user]);

  // 4. ANDROID HARDWARE BACK BUTTON
  // The back button is securely handled by the full-screen listener above.


  // DEVICE UNAUTHORIZED SCREEN
  if (isDeviceUnauthorized && location.pathname !== '/login') {
    return (
      <div className="expired-screen animate-fade-in" style={{
        height: '100vh',
        backgroundColor: '#0f1014',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          backgroundColor: 'rgba(229, 9, 20, 0.1)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', marginBottom: '30px',
          border: '2px solid #e50914',
          boxShadow: '0 0 30px rgba(229, 9, 20, 0.3)'
        }}>
          <span style={{ fontSize: '50px', color: '#e50914' }}>📱</span>
        </div>
        
        <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '15px', fontWeight: 'bold' }}>
          Dispositivo No Autorizado
        </h1>
        
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '320px', marginBottom: '30px', lineHeight: '1.6' }}>
          Tu cuenta de <strong>ZenPlus</strong> está vinculada a otro equipo. Por seguridad, solo se permite un dispositivo por cuenta.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          padding: '25px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '340px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Para vincular este nuevo equipo:</p>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#25D366' }}>
            Soporte: +591 73225724
          </p>
        </div>

        <div style={{ backgroundColor: '#1c1d22', padding: '15px 25px', borderRadius: '12px', border: '1px solid #333' }}>
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Usuario:</p>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#fff' }}>{user?.email}</p>
        </div>
      </div>
    );
  }

  // UPDATE REQUIRED SCREEN
  const isGlobalUpdateForced = appConfig?.isUpdateForced === true;
  if ((isGlobalUpdateForced || isVersionBlocked) && location.pathname !== '/login') {
    return (
      <div className="expired-screen animate-fade-in" style={{
        height: '100vh',
        backgroundColor: '#050608',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '30px',
        fontFamily: 'sans-serif',
        background: 'radial-gradient(circle at center, #1a1c23 0%, #050608 100%)'
      }}>
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '40px', 
          backgroundColor: 'rgba(52, 152, 219, 0.1)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', marginBottom: '35px',
          border: '2px solid #3498db',
          boxShadow: '0 0 40px rgba(52, 152, 219, 0.2)',
          transform: 'rotate(-5deg)'
        }}>
          <span style={{ fontSize: '60px', color: '#3498db' }}>🚀</span>
        </div>
        
        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '20px', fontWeight: 'bold', letterSpacing: '-1px' }}>
          Nueva Versión Disponible
        </h1>
        
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          padding: '30px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '40px',
          width: '100%',
          maxWidth: '400px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ fontSize: '18px', color: '#e0e0e0', margin: '0 0 25px 0', lineHeight: '1.6' }}>
            {appConfig.updateForceMsg || 'Hay una actualización importante lista para ti.'}
          </p>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Solicita el APK al administrador:</p>
            <p style={{ margin: '0', fontSize: '22px', fontWeight: 'bold', color: '#25D366' }}>
              WhatsApp: +591 73225724
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#555' }}>
          ZenPlus v{currentVersion} - Sistema de Control de Versiones
        </p>
      </div>
    );
  }

  // INDIVIDUAL USER BLOCK
  if (userDoc?.status === 'blocked') {
    return (
      <div className="expired-screen animate-fade-in" style={{
        height: '100vh',
        backgroundColor: '#0f1014',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div className="expired-badge" style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: 'rgba(239, 153, 21, 0.1)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', marginBottom: '20px',
          border: '2px solid #ef9915',
          boxShadow: '0 0 20px rgba(239, 153, 21, 0.3)'
        }}>
          <span style={{ fontSize: '40px', color: '#ef9915', fontWeight: 'bold' }}>!</span>
        </div>
        
        <h1 style={{ color: '#ef9915', fontSize: '28px', marginBottom: '10px' }}>
          Cuenta Desactivada
        </h1>
        
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '300px', marginBottom: '30px' }}>
          Tu acceso a <strong>ZenPlus</strong> ha sido suspendido temporalmente por el administrador.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '40px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Para soporte o reactivación:</p>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#25D366' }}>
            Envía mensaje o solicita: +591 73225724
          </p>
        </div>

        <div style={{ backgroundColor: '#1c1d22', padding: '20px', borderRadius: '16px', border: '1px solid #333' }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>ID de Usuario:</p>
          <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold', color: '#fff', wordBreak: 'break-all' }}>
            {user?.email}
          </p>
        </div>
      </div>
    );
  }

  // ACCOUNT EXPIRY CHECK (individual subscription duration)
  const accountExpiry = userDoc?.accountExpiry ? new Date(userDoc.accountExpiry) : null;
  const isAccountExpired = accountExpiry && new Date() > accountExpiry;
  
  if (isAccountExpired && location.pathname !== '/login') {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0f1014',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div className="animate-fade-in" style={{
          background: 'rgba(20, 21, 27, 0.95)',
          border: '1px solid rgba(241, 196, 15, 0.2)',
          borderRadius: '16px',
          padding: '30px 25px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
          
          <h2 style={{ color: '#f1c40f', fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
            Suscripción Vencida
          </h2>
          
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.5' }}>
            Tu periodo de acceso a <strong style={{ color: '#fff' }}>ZenPlus</strong> ha finalizado.
            Contacta al administrador para renovar tu suscripción.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '15px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>Soporte / Renovación:</p>
            <p style={{ margin: '5px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#25D366' }}>
              +591 73225724
            </p>
          </div>

          <p style={{ fontSize: '12px', color: '#555' }}>
            {user?.email}
          </p>
        </div>
      </div>
    );
  }

  const isProductionBeta = Capacitor.isNativePlatform();
  const expiryDateObj = appConfig?.expiryDate ? new Date(appConfig.expiryDate) : null;
  const isTimeExpired = expiryDateObj && currentTime > expiryDateObj;
  
  // MODO DE SEGURIDAD: Si está en false, la app está ABIERTA siempre.
  // Si está en true, la app sigue la fecha de expiración.
  const isSecurityEnabled = appConfig?.isLocked === true;
  const isExpired = isSecurityEnabled && isTimeExpired;

  // App only blocks if it's running as a NATIVE APK (not on web/debug)
  if (isExpired && isProductionBeta) {
    return (
      <div className="expired-screen animate-fade-in" style={{
        height: '100vh',
        backgroundColor: '#0f1014',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div className="expired-badge" style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: 'rgba(229, 9, 20, 0.1)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', marginBottom: '20px',
          border: '2px solid #e50914',
          boxShadow: '0 0 20px rgba(229, 9, 20, 0.3)'
        }}>
          <span style={{ fontSize: '40px', color: '#e50914', fontWeight: 'bold' }}>!</span>
        </div>
        
        <h1 style={{ color: '#e50914', fontSize: '28px', marginBottom: '10px' }}>
          Acceso Expirado
        </h1>
        
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '300px', marginBottom: '30px' }}>
          Tu periodo de acceso temporal a <strong>ZenPlus</strong> ha finalizado.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '40px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Solicita acceso aquí:</p>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#25D366' }}>
            Envía mensaje o solicita: +591 73225724
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#1c1d22', 
          padding: '20px 30px', 
          borderRadius: '16px',
          border: '1px solid #333',
          backdropFilter: 'blur(10px)',
          width: '100%',
          maxWidth: '300px'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>Desarrollado por:</p>
          <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            Jhonatan Jr.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#a0a0a0' }}>
            Envía un mensaje para solicitar o renovar tu acceso.
          </p>
        </div>
      </div>
    );
  }

  // GUEST TRIAL EXPIRED BLOCK
  if (isGuestExpired && location.pathname !== '/login') {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0f1014',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div className="animate-fade-in" style={{
          background: 'rgba(20, 21, 27, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '30px 25px',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍿</div>
          
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
            ¿Te está gustando?
          </h2>
          
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '24px', lineHeight: '1.5' }}>
            Para disfrutar más contenido, regístrate gratis y accede a todo el catálogo de <strong style={{ color: '#fff' }}>ZenPlus</strong>.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/login')}
              style={{
                flex: 1, padding: '12px', background: 'transparent', 
                color: 'white', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => navigate('/login?mode=register')}
              style={{
                flex: 1, padding: '12px', background: '#e50914', 
                color: 'white', border: 'none',
                borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
                fontWeight: '600', boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)'
              }}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SecurityGuard />
      <SplashScreen />
      <PremiumModal />
      <Navbar />
      <NotificationToast />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv/:id" element={<MovieDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/discover" element={<Discover />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-list" 
            element={
              <ProtectedRoute>
                <MyList />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;