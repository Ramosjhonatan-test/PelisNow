import React from 'react';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: { height: '30px', fontSize: '1.5rem', iconSize: '24' },
    medium: { height: '45px', fontSize: '2.2rem', iconSize: '32' },
    large: { height: '70px', fontSize: '3.5rem', iconSize: '54' },
    xl: { height: '100px', fontSize: '5rem', iconSize: '80' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className={`zenplus-logo ${className}`} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      fontFamily: "'Bebas Neue', cursive",
      lineHeight: 1
    }}>
      {/* Cinematic Geometric "Z" Icon */}
      <svg 
        width={currentSize.iconSize} 
        height={currentSize.iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 8px rgba(229, 9, 20, 0.4))' }}
      >
        <path 
          d="M20 20H80L30 80H80" 
          stroke="white" 
          strokeWidth="12" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="logo-path-white"
        />
        <path 
          d="M45 45L55 35M55 55L65 45" 
          stroke="#e50914" 
          strokeWidth="10" 
          strokeLinecap="round" 
        />
      </svg>

      <div style={{ 
        display: 'flex', 
        alignItems: 'baseline', 
        fontSize: currentSize.fontSize,
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        <span style={{ color: 'white', fontWeight: '900' }}>ZEN</span>
        <span style={{ 
          color: '#e50914', 
          fontWeight: '300', 
          fontSize: '0.75em', 
          marginLeft: '2px',
          fontFamily: "'Outfit', sans-serif"
        }}>PLUS</span>
      </div>
    </div>
  );
};

export default Logo;
