import { Routes, Route, Navigate } from 'react-router-dom';
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
