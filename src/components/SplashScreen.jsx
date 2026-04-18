import { useState, useEffect } from 'react';
import Logo from './Logo';
import './SplashScreen.css';

let splashHasShown = false;

const SplashScreen = () => {
  const [visible, setVisible] = useState(() => !splashHasShown);

  useEffect(() => {
    if (!visible) return;

    // Mark as shown for the module lifecycle
    splashHasShown = true;

    // Unmount completely after animation ends (2.5s)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-backdrop-flash"></div>
      <div className="splash-logo-container">
        <h1 className="splash-logo-text">
          <span className="part-zen">ZEN</span>
          <span className="part-plus">PLUS</span>
        </h1>
        <div className="splash-orbit-ring"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
