import { useNotifications } from '../context/NotificationContext';
import { FaCheckDouble, FaTrash, FaRegCalendarAlt, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

    const formatTime = (date) => {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-dropdown glass-panel">
            <div className="dropdown-header">
                <h3>Notificaciones</h3>
                <div className="header-actions">
                    <button onClick={markAllAsRead} title="Marcar todas como leídas">
                        <FaCheckDouble />
                    </button>
                    <button onClick={clearAll} title="Limpiar todo">
                        <FaTrash />
                    </button>
                </div>
            </div>

            <div className="dropdown-body">
                {notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <FaRegCalendarAlt className="empty-icon" />
                        <p>No tienes notificaciones por ahora</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="item-icon">
                                    {notif.type === 'success' && <FaCheckCircle />}
                                    {notif.type === 'error' && <FaTimesCircle />}
                                    {notif.type === 'warning' && <FaExclamationCircle />}
                                    {notif.type === 'info' && <FaInfoCircle />}
                                </div>
                                <div className="item-content">
                                    <p className="item-title">{notif.title}</p>
                                    <p className="item-msg">{notif.message}</p>
                                    <span className="item-time">{formatTime(notif.timestamp)}</span>
                                </div>
                                {!notif.read && <div className="unread-dot"></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="dropdown-footer">
                <button onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
