import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core'; // Importante para detectar plataforma
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
import { UserAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useState } from 'react';

function AppContent() {
  const { user } = UserAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [appConfig, setAppConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Remotely managed access control
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app_config'), (snap) => {
      try {
        if (snap.exists()) {
          const data = snap.data();
          setAppConfig(data);
          setDbError(null);
          
          const isTimeExpired = data.expiryDate && new Date() > new Date(data.expiryDate);
          const isSecurityOn = data.isLocked === true;
          const isCurrentlyExpired = isSecurityOn && isTimeExpired;
          
          const wasExpired = localStorage.getItem('zenplus_was_expired') === 'true';
          
          // Sound when REACTIVATED (Transition from Locked to Unlocked)
          if (wasExpired && !isCurrentlyExpired) {
            addNotification('Servidor Activo', '¡El acceso a ZenPlus ha sido reactivado!', 'success');
          }
          
          // Update last state
          localStorage.setItem('zenplus_was_expired', isCurrentlyExpired ? 'true' : 'false');
        } else {
          setAppConfig({ expiryDate: '2026-12-31T23:59:59Z' });
          setDbError('Documento NO encontrado');
        }
      } catch (err) {
        console.error("Config Parse Error:", err);
        setDbError('Error de parseo');
      }
      setLoadingConfig(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setDbError(`Error DB: ${err.code}`);
      setAppConfig({ expiryDate: '2026-12-31T23:59:59Z' });
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

      if (location.pathname === '/') {
        CapApp.exitApp();
      } else {
        navigate(-1);
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

  const isProductionBeta = Capacitor.isNativePlatform();
  const expiryDateObj = appConfig?.expiryDate ? new Date(appConfig.expiryDate) : null;
  const isTimeExpired = expiryDateObj && currentTime > expiryDateObj;
  
  // MODO DE SEGURIDAD: Si está en false, la app está ABIERTA siempre.
  // Si está en true, la app sigue la fecha de expiración.
  const isSecurityEnabled = appConfig?.isLocked === true;
  const isExpired = isSecurityEnabled && isTimeExpired;

  // Debugging info for Logcat removed for production

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
        
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '300px', marginBottom: '25px' }}>
          Tu periodo de acceso temporal a <strong>ZenPlus</strong> ha finalizado.
        </p>

        <div style={{ 
          backgroundColor: '#1c1d22', 
          padding: '20px 30px', 
          borderRadius: '16px',
          border: '1px solid #333',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>Desarrollado por:</p>
          <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            Jhonatan Jr.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '16px', color: '#e50914', fontWeight: 'bold' }}>
            Contacto: +591 73225724
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="app-container">
      <SplashScreen />
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
              <ProtectedRoute>
                {user?.email === 'danielacopana@gmail.com' ? <Admin /> : <Navigate to="/" />}
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