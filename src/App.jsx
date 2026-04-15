import { useEffect } from 'react'; // 1. Importar useEffect
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; // 2. Añadir hooks
import { App as CapApp } from '@capacitor/app'; // 3. Importar Capacitor App
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
  const navigate = useNavigate(); // Hook para navegar
  const location = useLocation(); // Hook para saber dónde estamos

  useEffect(() => {
    // Configuramos el evento del botón atrás
    const backHandler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/') {
        // Si estamos en el Home, cerramos la app
        CapApp.exitApp();
      } else {
        // Si estamos en cualquier otra ruta, volvemos una página atrás
        navigate(-1);
      }
    });

    // Limpieza al desmontar
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
  )
}

export default App;