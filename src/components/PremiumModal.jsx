import { useState, useEffect } from 'react';
import { FaTimes, FaWhatsapp, FaTiktok, FaFacebook, FaCrown, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './PremiumModal.css';

const PremiumModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only pop up if the specific session flag was set during registration
    const shouldShow = sessionStorage.getItem('zenplus_show_welcome_modal') === 'true';
    
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.removeItem('zenplus_show_welcome_modal'); // Clear it immediately
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="premium-modal-overlay">
      <div className="premium-modal-content animate-pop">
        <button className="premium-close-btn" onClick={() => setIsVisible(false)}>
          <FaTimes />
        </button>

        <div className="premium-header">
          <div className="premium-badge">
            <FaCrown className="crown-icon" /> EXPERIENCIA PREMIUM
          </div>
          <h1>ZENPLUS<br/><span className="gold-text">PREMIUM</span></h1>
          <hr className="gold-divider" />
          <p className="premium-subtitle">
            Obtén acceso total a la plataforma sin interrupciones y disfruta del catálogo completo de <strong>ZenPlus Premium</strong>.
          </p>
        </div>

        <div className="premium-benefits">
          <div className="benefit-item">
            <FaCheckCircle className="check-icon" /> App completamente optimizada
          </div>
          <div className="benefit-item">
            <FaCheckCircle className="check-icon" /> Soporte y actualizaciones continuas
          </div>
          <div className="benefit-item">
            <FaCheckCircle className="check-icon" /> Acceso ilimitado sin cortes
          </div>
        </div>

        <div className="premium-button">
          <FaCrown /> Contáctame para ser Premium
        </div>

        <div className="premium-warning">
          <FaExclamationCircle /> Solo aplica para la <strong>aplicación móvil</strong> directamente con el administrador.
        </div>

        <div className="premium-divider-text">¿CÓMO OBTENERLO?</div>

        {/* Contact Info (No Links) */}
        <div className="premium-contacts">
          <div className="contact-box">
            <FaWhatsapp className="contact-icon wa" />
            <div className="contact-info">
              <span className="contact-label">WhatsApp</span>
              <span className="contact-value">73225724</span>
            </div>
          </div>
          
          <div className="contact-box">
            <FaTiktok className="contact-icon tt" />
            <div className="contact-info">
              <span className="contact-label">TikTok Oficial</span>
              <span className="contact-value">@jhonjr1522</span>
            </div>
          </div>

          <div className="contact-box">
            <FaFacebook className="contact-icon fb" />
            <div className="contact-info">
              <span className="contact-label">Facebook</span>
              <span className="contact-value">Ramos Jr Jhon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
