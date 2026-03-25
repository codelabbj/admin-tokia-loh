import React, { useState, useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import NotificationsList from '../components/notifications/NotificationsList';
import NotificationsSettings from '../components/notifications/NotificationsSettings';
import { useNotifications } from '../hooks/useNotifications';

const TABS = [
    { key: 'history', label: 'Historique', icon: Bell },
    { key: 'settings', label: 'Configuration', icon: Settings },
];

const NotificationsPage = () => {
    const [activeTab, setActiveTab] = useState('history');
    const { unreadCount } = useNotifications();

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Notifications';
    }, []);

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            Notifications
                        </h1>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-primary-1 text-white text-[11px] font-bold font-poppins">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Historique et configuration de vos alertes
                    </p>
                </div>
            </div>

            {/* ── Onglets ── */}
            <div className="flex items-center gap-1 bg-neutral-3 dark:bg-neutral-3 rounded-full p-1 w-fit">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                flex items-center gap-2 px-5 py-2 rounded-full
                                text-xs font-semibold font-poppins
                                transition-all duration-200 cursor-pointer
                                ${isActive
                                    ? 'bg-neutral-0 dark:bg-neutral-2 text-neutral-8 dark:text-neutral-8 shadow-sm'
                                    : 'text-neutral-6 hover:text-neutral-8 dark:hover:text-neutral-8'
                                }
                            `}
                        >
                            <Icon size={13} />
                            {tab.label}
                            {tab.key === 'history' && unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-1 text-white text-[9px] font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Contenu ── */}
            {activeTab === 'history' && <NotificationsList />}
            {activeTab === 'settings' && <NotificationsSettings />}
        </div>
    );
};

export default NotificationsPage;