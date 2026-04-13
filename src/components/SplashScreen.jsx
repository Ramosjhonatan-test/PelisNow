import { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Unmount completely after animation ends (2s)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-logo-container">
        <h1 className="splash-logo-text">PELIS<span>NOW</span></h1>
        <div className="splash-spinner"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
