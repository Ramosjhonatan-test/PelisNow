import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from '../components/Logo';
import './Login.css';

const AVATARS = [
  'https://github.com/minions.png',
  'https://github.com/stuart-minion.png',
  'https://github.com/sonic.png',
  'https://github.com/tails.png',
  'https://github.com/knuckles.png',
  'https://github.com/shadow.png',
  'https://github.com/amyrose.png',
  'https://github.com/pikachu.png',
];
/* Nota: Se usan IDs de ejemplo para asegurar carga, en producción se obtendrían via API */

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

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('zenplus_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Set persistence based on "Remember Me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      // Save or clear email from localStorage
      if (rememberMe) {
        localStorage.setItem('zenplus_remembered_email', email);
      } else {
        localStorage.removeItem('zenplus_remembered_email');
      }

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
        <div className="auth-header-centered">
          <div className="auth-logo">ZEN<span>PLUS</span></div>
          <h2 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Bienvenido de vuelta. Prepárate para la acción.' : 'Únete a la legión de fans más grande.'}
          </p>
        </div>
        
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
              <p className="avatar-label">Elige tu personaje</p>
              <div className="avatar-grid">
                {AVATARS.map((av, i) => (
                  <div key={i} className={`avatar-wrapper ${selectedAvatar === av ? 'selected' : ''}`} onClick={() => setSelectedAvatar(av)}>
                    <img 
                      src={av} 
                      alt={`Character ${i+1}`} 
                      className="avatar-option"
                    />
                  </div>
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
              isLogin ? 'ENTRAR' : 'REGISTRARSE'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {isLogin ? '¿Nuevo en Zenplus? ' : '¿Ya eres miembro? '}
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
