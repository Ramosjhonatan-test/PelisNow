import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Patches',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { logIn, signUp } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Set persistence based on "Remember Me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      if (isLogin) {
        await logIn(email, password);
      } else {
        await signUp(email, password, selectedAvatar);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase:', '').replace(/auth\//, '').trim());
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-bg-overlay"></div>
      
      <div className="auth-card">
        <div className="auth-logo">PELIS<span>NOW</span></div>
        <h2 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <p className="auth-subtitle">{isLogin ? 'Bienvenido de vuelta. Ingresa tus credenciales.' : 'Únete a miles de usuarios disfrutando el mejor cine.'}</p>
        
        {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="floating-input">
            <input 
              type="email" 
              id="auth-email"
              placeholder=" "
              autoComplete="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <label htmlFor="auth-email">Correo electrónico</label>
          </div>
          
          <div className="floating-input">
            <input 
              type="password" 
              id="auth-pass"
              placeholder=" "
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <label htmlFor="auth-pass">Contraseña</label>
          </div>

          {!isLogin && (
            <div className="avatar-selector">
              <p className="avatar-label">Elige tu avatar</p>
              <div className="avatar-grid">
                {AVATARS.map((av, i) => (
                  <img 
                    key={i} 
                    src={av} 
                    alt={`Avatar ${i+1}`} 
                    className={`avatar-option ${selectedAvatar === av ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(av)}
                  />
                ))}
              </div>
            </div>
          )}

          {isLogin && (
            <div className="remember-row">
              <label className="remember-checkbox">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="checkmark"></span>
                Recuérdame
              </label>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              isLogin ? 'Entrar' : 'Crear mi cuenta'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {isLogin ? '¿Nuevo en PelisNow? ' : '¿Ya tienes cuenta? '}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); }} className="auth-toggle">
              {isLogin ? 'Regístrate ahora' : 'Inicia Sesión'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
