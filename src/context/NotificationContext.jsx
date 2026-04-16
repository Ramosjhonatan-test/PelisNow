import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Request permissions and create HIGH importance channel on mount
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.requestPermissions().then(res => {
                console.log('Notification permissions:', res.display);
            });

            // Create high priority channel for instant sound
            LocalNotifications.createChannel({
                id: 'zenplus-alerts',
                name: 'Alertas de ZenPlus',
                description: 'Notificaciones importantes de acceso y sistema',
                importance: 5, // High
                visibility: 1, // Public
                vibration: true,
                sound: 'default'
            }).then(() => console.log('Notification channel created'));
        }
    }, []);

    // Play a technological sound
    const playSound = useCallback(() => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Modern tech pop
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Audio play blocked:', err));
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, []);

    const addNotification = useCallback((title, message, type = 'info') => {
        const id = Date.now();
        const newNotification = {
            id,
            title,
            message,
            type, // success, error, warning, info
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
        setUnreadCount(prev => prev + 1);
        playSound();

        // Native Background Notification
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.schedule({
                notifications: [
                    {
                        title: title,
                        body: message,
                        id: Math.floor(Math.random() * 1000000),
                        channelId: 'zenplus-alerts', // Use the high importance channel
                        attachments: null,
                        actionTypeId: '',
                        extra: null
                    }
                ]
            }).catch(err => console.error('Native Notify Error:', err));
        }
    }, [playSound]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            addNotification, 
            markAsRead, 
            markAllAsRead, 
            clearAll 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
