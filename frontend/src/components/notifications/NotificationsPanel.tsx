import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

export function NotificationsPanel() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    // Close panel on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(notif => {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.update(notifRef, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.read) {
            markAsRead(notif.id);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                            >
                                <Check size={14} />
                                Marcar todas leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
                                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                                <p>No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400 font-medium">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                            </span>

                                            <div className="flex gap-2">
                                                {notif.link && (
                                                    <Link
                                                        href={notif.link}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline"
                                                    >
                                                        Ver detalles
                                                    </Link>
                                                )}
                                                {!notif.read && !notif.link && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="text-xs text-gray-500 hover:text-gray-700"
                                                    >
                                                        Marcar leída
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
