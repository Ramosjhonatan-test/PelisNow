import { useState, useRef, useEffect } from 'react';
import { FaBell, FaRegBell } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = () => {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);

    // Toggle dropdown
    const handleToggle = () => setIsOpen(!isOpen);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-container" ref={bellRef}>
            <button 
                className={`bell-button ${unreadCount > 0 ? 'has-unread' : ''}`} 
                onClick={handleToggle}
                aria-label="Notificaciones"
            >
                {unreadCount > 0 ? <FaBell /> : <FaRegBell />}
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
        </div>
    );
};

export default NotificationBell;
