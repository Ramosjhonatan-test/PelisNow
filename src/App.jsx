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

function App() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================================
  // >>> INICIO: BLOQUEO TEMPORAL PARA BETATESTERS (BORRAR ESTO LUEGO) <<<
  // ==========================================================================
  const fechaLimite = new Date(2026, 3, 16, 16, 0, 0); // Viernes 17 de Abril, 14:00
  const fechaActual = new Date();

  if (Capacitor.isNativePlatform() && fechaActual > fechaLimite) {
    return (
<div style={{
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
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: 'rgba(229, 9, 20, 0.1)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', marginBottom: '20px',
          border: '2px solid #e50914'
        }}>
          <span style={{ fontSize: '40px', color: '#e50914', fontWeight: 'bold' }}>!</span>
        </div>
        
        <h1 style={{ color: '#e50914', fontSize: '28px', marginBottom: '10px' }}>
          Versión de Prueba Finalizada
        </h1>
        
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '300px', marginBottom: '25px' }}>
          El acceso a esta versión de <strong>ZenPlus</strong> ha expirado.
        </p>

        <div style={{ 
          backgroundColor: '#1c1d22', 
          padding: '15px 25px', 
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>Desarrollado por:</p>
          <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            Jhonatan Jr.
          </p>
          <p style={{ margin: '0', fontSize: '16px', color: '#e50914' }}>
            Contacto: 73225724
          </p>
        </div>
      </div>
    );
  }
  // ==========================================================================
  // >>> FIN: BLOQUEO TEMPORAL <<<
  // ==========================================================================

  useEffect(() => {
    // 1. Verificamos si estamos en un celular (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    // 2. Configuramos el evento del botón atrás de Android
    const backHandler = CapApp.addListener('backButton', () => {
      
      // A. ¿Hay algún video o elemento en pantalla completa?
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

      // B. Si no hay pantalla completa, evaluamos la ruta
      if (location.pathname === '/') {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    // 3. Limpieza: eliminamos el listener al cerrar el componente
    return () => {
      backHandler.then(h => h.remove());
    };
  }, [location, navigate]);

  return (
    <div className="app-container">
      <SplashScreen />
      <Navbar />
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

export default App;