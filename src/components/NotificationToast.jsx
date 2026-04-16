import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import './NotificationToast.css';

const NotificationToast = () => {
    const { notifications } = useNotifications();
    const [activeToasts, setActiveToasts] = useState([]);

    useEffect(() => {
        // When a new notification arrives, add it to the toast list
        if (notifications.length > 0) {
            const latest = notifications[0];
            
            // Check if this notification was already toasted (simple id check)
            // But since we want to show multiple if they come fast, we just add the latest one
            // unless it's too old (context might have loaded history)
            const timeDiff = Date.now() - latest.id;
            if (timeDiff < 1000) { // Only toast if it just happened
                const toastId = latest.id;
                setActiveToasts(prev => [...prev, { ...latest, toastId }]);

                // Auto remove after 5 seconds
                setTimeout(() => {
                    removeToast(toastId);
                }, 5000);
            }
        }
    }, [notifications]);

    const removeToast = (id) => {
        setActiveToasts(prev => prev.map(t => 
            t.toastId === id ? { ...t, exiting: true } : t
        ));
        
        // Wait for exit animation to finish before removing from state
        setTimeout(() => {
            setActiveToasts(prev => prev.filter(t => t.toastId !== id));
        }, 500);
    };

    if (activeToasts.length === 0) return null;

    return (
        <div className="notification-toast-container">
            {activeToasts.map((toast) => (
                <div key={toast.toastId} className={`notification-toast ${toast.type} ${toast.exiting ? 'exiting' : ''}`}>
                    <div className="toast-icon">
                        {toast.type === 'success' && <FaCheckCircle />}
                        {toast.type === 'error' && <FaTimesCircle />}
                        {toast.type === 'warning' && <FaExclamationCircle />}
                        {toast.type === 'info' && <FaInfoCircle />}
                    </div>
                    <div className="toast-content">
                        <p className="toast-title">{toast.title}</p>
                        <p className="toast-message">{toast.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => removeToast(toast.toastId)}>
                        <FaTimes />
                    </button>
                    <div className="toast-progress"></div>
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;
