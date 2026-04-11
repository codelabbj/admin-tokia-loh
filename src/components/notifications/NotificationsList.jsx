import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCheck, Trash2, Loader2, AlertCircle, Bell, RefreshCw, BellOff } from 'lucide-react';
import NotificationsBadge, { NOTIF_TYPE_CONFIG } from './NotificationsBadge';
import Button from '../Button';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { useNotifications } from '../../hooks/useNotifications';
import { getNotificationNavigatePath } from '../../utils/notificationTargets';

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    if (hrs < 24) return `Il y a ${hrs}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const NotifAvatar = ({ type }) => {
    const config = NOTIF_TYPE_CONFIG[type];
    if (!config) return null;
    return (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
            {React.cloneElement(config.icon, { size: 15 })}
        </div>
    );
};

const FILTER_TABS = [
    { key: 'all', label: 'Toutes' },
    { key: 'unread', label: 'Non lues' },
    { key: 'Commande', label: 'Commandes' },
    { key: 'Client', label: 'Clients' },
    { key: 'Stock', label: 'Stock' },
    { key: 'Annulation', label: 'Annulations' },
    { key: 'Autre', label: 'Autres' },
];

const NotificationsList = () => {
    const navigate = useNavigate();
    const {
        notifications, loading, loadingMore, error,
        hasMore, totalCount, loadMore,
        markRead, markAllRead, deleteNotif,
        unreadCount, refetch,
    } = useNotifications();

    const [filter, setFilter] = useState('unread');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleConfirmDeleteNotif = async () => {
        if (!deleteTarget?.id) return;
        const id = deleteTarget.id;
        await deleteNotif(id);
        setDeleteTarget(null);
    };

    const filtered = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const countFor = (key) => {
        if (key === 'all') return totalCount;
        if (key === 'unread') return unreadCount;
        return notifications.filter(n => n.type === key).length;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary-1" />
                <p className="text-xs font-poppins text-neutral-5">Chargement des notifications…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center gap-3 h-48">
            <div className="w-12 h-12 rounded-full bg-danger-2 flex items-center justify-center">
                <AlertCircle size={22} className="text-danger-1" />
            </div>
            <p className="text-sm font-poppins font-medium text-danger-1">{error}</p>
            <Button variant="outline" size="normal" onClick={refetch}>
                <RefreshCw size={13} /> Réessayer
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col gap-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-semibold font-poppins text-neutral-8">
                        Notifications
                    </h2>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-1 text-white text-[10px] font-bold font-poppins leading-none">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refetch}
                        title="Actualiser"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-5 hover:bg-neutral-2 hover:text-neutral-8 transition-colors cursor-pointer"
                    >
                        <RefreshCw size={14} />
                    </button>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="normal" onClick={markAllRead}>
                            <CheckCheck size={13} />
                            Tout marquer lu
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Onglets filtre ── */}
            <div className="flex items-center overflow-x-auto border-b border-neutral-3 dark:border-neutral-3 -mb-1 scrollbar-none">
                {FILTER_TABS.map(tab => {
                    const count = countFor(tab.key);
                    const isActive = filter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`
                                flex items-center gap-1.5 px-3.5 py-3 text-xs font-poppins font-medium
                                whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer shrink-0
                                ${isActive
                                    ? 'border-primary-1 text-primary-1'
                                    : 'border-transparent text-neutral-5 hover:text-neutral-7 dark:hover:text-neutral-7'
                                }
                            `}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`
                                    inline-flex items-center justify-center min-w-4.5 h-4.5 px-1
                                    rounded-full text-[10px] font-bold leading-none
                                    ${isActive ? 'bg-primary-5 text-primary-1' : 'bg-neutral-2 text-neutral-5'}
                                `}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Liste ── */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-3 dark:border-neutral-3 rounded-2xl overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-2 flex items-center justify-center">
                            <BellOff size={22} className="text-neutral-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold font-poppins text-neutral-7">
                                {filter === 'unread' ? 'Tout est lu ✓' : 'Aucune notification'}
                            </p>
                            <p className="text-xs font-poppins text-neutral-5 mt-1">
                                {filter === 'unread' ? 'Vous êtes à jour.' : 'Rien à afficher pour ce filtre.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-2 dark:divide-neutral-2">
                        {filtered.map((notif) => (
                            <div
                                key={notif.id}
                                className={`
                                    flex items-start gap-3 px-4 py-4
                                    transition-colors duration-150
                                    ${!notif.read
                                        ? 'bg-primary-5/50 dark:bg-primary-5/20'
                                        : 'hover:bg-neutral-1 dark:hover:bg-neutral-1'
                                    }
                                `}
                            >
                                <button
                                    type="button"
                                    className="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer"
                                    onClick={() => {
                                        markRead(notif.id);
                                        navigate(getNotificationNavigatePath(notif));
                                    }}
                                >
                                    {/* Dot non lu */}
                                    <div className="pt-4.5 shrink-0 w-2">
                                        {!notif.read && (
                                            <span className="block w-1.5 h-1.5 rounded-full bg-primary-1" />
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="pt-0.5">
                                        <NotifAvatar type={notif.type} />
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <NotificationsBadge type={notif.type} />
                                            <span className="text-[10px] font-poppins text-neutral-4">
                                                {formatDate(notif.date)}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-poppins leading-snug ${!notif.read ? 'font-semibold text-neutral-8 dark:text-neutral-8' : 'font-medium text-neutral-7 dark:text-neutral-7'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs font-poppins text-neutral-5 leading-relaxed mt-0.5">
                                            {notif.message}
                                        </p>
                                    </div>
                                </button>

                                {/* ── Actions — toujours visibles ── */}
                                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                    {!notif.read && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markRead(notif.id);
                                            }}
                                            title="Marquer comme lu"
                                            aria-label={`Marquer comme lu : ${notif.title ?? 'notification'}`}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0
                                                text-primary-1 dark:text-primary-1
                                                border border-primary-5 dark:border-primary-1/45
                                                bg-primary-5/40 dark:bg-primary-1/10
                                                hover:bg-primary-5 dark:hover:bg-primary-1/20 hover:text-primary-2 dark:hover:text-primary-1
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-0
                                                active:scale-95 transition-all cursor-pointer"
                                        >
                                            <CheckCheck size={15} strokeWidth={2.25} className="opacity-95 dark:opacity-100" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget(notif);
                                        }}
                                        title="Supprimer"
                                        aria-label={`Supprimer la notification : ${notif.title ?? ''}`}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0
                                            text-danger-1 dark:text-rose-400
                                            border border-danger-2/40 dark:border-rose-400/35
                                            hover:bg-danger-2 dark:hover:bg-rose-950/50 hover:text-danger-1 dark:hover:text-rose-300
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-1 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-0
                                            active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Trash2 size={15} strokeWidth={2.25} className="opacity-95 dark:opacity-100" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Charger plus ── */}
            {hasMore && (
                <div className="flex justify-center py-1">
                    <Button variant="outline" size="normal" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore
                            ? <><Loader2 size={14} className="animate-spin" /> Chargement…</>
                            : 'Charger plus de notifications'
                        }
                    </Button>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDeleteNotif}
                title="Supprimer la notification"
                message={
                    deleteTarget
                        ? (() => {
                            const raw = String(deleteTarget.title ?? '').trim();
                            const preview = raw.length > 100 ? `${raw.slice(0, 100)}…` : raw;
                            return preview
                                ? `Voulez-vous vraiment supprimer « ${preview} » ? Elle sera définitivement retirée de votre historique.`
                                : 'Voulez-vous vraiment supprimer cette notification ? Elle sera définitivement retirée de votre historique.';
                        })()
                        : ''
                }
                successMessage="Notification supprimée."
            />
        </div>
    );
};

export default NotificationsList;