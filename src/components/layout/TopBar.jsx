import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Menu, Search, Bell, ChevronDown, User, LogOut,
    Settings, CheckCheck, Loader2, Sun, Moon, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router';
import LogoutConfirmModal from '../LogoutConfirmModal';
import { useNotifications } from '../../hooks/useNotifications';
import useTheme from '../../hooks/useTheme';
import NotificationsBadge from '../notifications/NotificationsBadge';

// ── Helpers ───────────────────────────────────────────────────
const formatTimeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
};

// ── Bouton icône générique ────────────────────────────────────
const IconButton = ({ onClick, title, active = false, children, badge }) => (
    <button
        onClick={onClick}
        title={title}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl
            transition-all duration-200 cursor-pointer
            ${active
                ? 'bg-primary-5 text-primary-1'
                : 'text-neutral-6 hover:bg-neutral-3 dark:hover:bg-neutral-3 hover:text-neutral-8 dark:hover:text-neutral-8'
            }`}
    >
        {children}
        {badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full
                bg-danger-1 text-white text-[9px] font-bold font-poppins
                flex items-center justify-center leading-none shadow-sm">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

const TopBar = ({ onMenuToggle, showSearch = true }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const [search, setSearch] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const notifRef = useRef(null);
    const userRef = useRef(null);

    const { notifications, loading: notifLoading, unreadCount, markRead, markAllRead } = useNotifications();
    const previewNotifs = notifications.slice(0, 5);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoutClick = () => { setIsLogoutModalOpen(true); setUserMenuOpen(false); };
    const handleConfirmLogout = () => { logout(); setIsLogoutModalOpen(false); };
    const handleCancelLogout = () => setIsLogoutModalOpen(false);

    return (
        <>
            <header className="
                h-16 px-5 flex items-center justify-between gap-4 shrink-0
                bg-neutral-0/90 dark:bg-neutral-0/90 backdrop-blur-sm
                border-b border-neutral-4 dark:border-neutral-4
                sticky top-0 z-10
            ">
                {/* ── Burger mobile ── */}
                <button
                    onClick={onMenuToggle}
                    className="flex items-center justify-center w-9 h-9 rounded-xl
                        text-neutral-6 hover:bg-neutral-3 dark:hover:bg-neutral-3
                        hover:text-neutral-8 transition-all duration-200 cursor-pointer md:hidden"
                >
                    <Menu size={20} />
                </button>

                {!showSearch && <div className="flex-1 max-w-sm" />}

                {/* ── Recherche ── */}
                {showSearch && (
                    <div className="flex-1 max-w-sm relative group">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-5
                                group-focus-within:text-primary-1 transition-colors duration-200 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-xl
                                bg-neutral-3 dark:bg-neutral-3 border border-transparent
                                text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-5
                                outline-none focus:border-primary-3 focus:bg-neutral-0 dark:focus:bg-neutral-0
                                focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                        />
                    </div>
                )}

                {/* ── Actions droite ── */}
                <div className="flex items-center gap-0.5">

                    {/* Thème */}
                    <IconButton
                        onClick={toggleTheme}
                        title={isDark ? 'Mode clair' : 'Mode sombre'}
                    >
                        {isDark
                            ? <Sun size={17} className="text-warning-1" />
                            : <Moon size={17} />
                        }
                    </IconButton>

                    {/* Séparateur */}
                    <div className="w-px h-5 bg-neutral-4 dark:bg-neutral-4 mx-1.5" />

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <IconButton
                            onClick={() => { setNotifOpen(p => !p); setUserMenuOpen(false); }}
                            title="Notifications"
                            active={notifOpen}
                            badge={unreadCount}
                        >
                            <Bell size={17} />
                        </IconButton>

                        {notifOpen && (
                            <div className="absolute right-0 top-11 w-80 sm:w-88 z-50
                                bg-neutral-0 dark:bg-neutral-0
                                border border-neutral-4 dark:border-neutral-4
                                rounded-2xl shadow-xl overflow-hidden">

                                {/* Header notif */}
                                <div className="flex items-center justify-between px-4 py-3
                                    border-b border-neutral-4 dark:border-neutral-4
                                    bg-neutral-2 dark:bg-neutral-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-primary-1" />
                                        <span className="text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                            Notifications
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="inline-flex items-center justify-center
                                                min-w-4.5 h-4.5 px-1 rounded-full
                                                bg-primary-5 text-primary-1 text-[10px] font-bold font-poppins">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="flex items-center gap-1 text-[11px] font-poppins
                                                text-primary-1 hover:text-primary-6 transition-colors cursor-pointer"
                                        >
                                            <CheckCheck size={11} /> Tout lire
                                        </button>
                                    )}
                                </div>

                                {/* Liste */}
                                <div className="max-h-85 overflow-y-auto">
                                    {notifLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 size={18} className="animate-spin text-primary-1" />
                                        </div>
                                    ) : previewNotifs.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-10 text-neutral-5">
                                            <Bell size={28} />
                                            <p className="text-xs font-poppins">Aucune notification</p>
                                        </div>
                                    ) : previewNotifs.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markRead(notif.id)}
                                            className={`flex items-start gap-3 px-4 py-3
                                                border-b border-neutral-4 dark:border-neutral-4 last:border-0
                                                cursor-pointer transition-all duration-150
                                                ${!notif.read
                                                    ? 'bg-primary-5 dark:bg-primary-5'
                                                    : 'hover:bg-neutral-2 dark:hover:bg-neutral-2'
                                                }`}
                                        >
                                            <div className="mt-1.5 shrink-0">
                                                <span className={`block w-1.5 h-1.5 rounded-full
                                                    ${!notif.read ? 'bg-primary-1' : 'bg-neutral-4'}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <NotificationsBadge type={notif.type} />
                                                <p className={`text-[11px] font-poppins mt-1 line-clamp-2
                                                    ${!notif.read
                                                        ? 'font-semibold text-neutral-8 dark:text-neutral-8'
                                                        : 'text-neutral-6 dark:text-neutral-6'
                                                    }`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] font-poppins text-neutral-5 mt-0.5">
                                                    {formatTimeAgo(notif.date)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2.5 border-t border-neutral-4 dark:border-neutral-4
                                    bg-neutral-2 dark:bg-neutral-2">
                                    <button
                                        onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                                        className="w-full text-center text-[11px] font-semibold font-poppins
                                            text-primary-1 hover:text-primary-6 transition-colors cursor-pointer"
                                    >
                                        Voir toutes les notifications →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Séparateur */}
                    <div className="w-px h-5 bg-neutral-4 dark:bg-neutral-4 mx-1.5" />

                    {/* ── User ── */}
                    <div className="relative" ref={userRef}>
                        <button
                            onClick={() => { setUserMenuOpen(p => !p); setNotifOpen(false); }}
                            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl
                                hover:bg-neutral-3 dark:hover:bg-neutral-3
                                transition-all duration-200 cursor-pointer"
                        >
                            <div className="w-7 h-7 rounded-lg shrink-0
                                bg-linear-to-br from-primary-1 to-secondary-1
                                flex items-center justify-center shadow-sm">
                                <span className="text-[10px] font-bold font-poppins text-white">AD</span>
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                                <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Admin
                                </span>
                                <span className="text-[10px] font-poppins text-neutral-5">
                                    Super Admin
                                </span>
                            </div>
                            <ChevronDown size={12} className={`text-neutral-5 hidden sm:block
                                transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 top-11 w-52 z-50
                                bg-neutral-0 dark:bg-neutral-0
                                border border-neutral-4 dark:border-neutral-4
                                rounded-2xl shadow-xl overflow-hidden">

                                {/* Info user */}
                                <div className="px-4 py-3 border-b border-neutral-4 dark:border-neutral-4
                                    bg-neutral-2 dark:bg-neutral-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl shrink-0
                                            bg-linear-to-br from-primary-1 to-secondary-1
                                            flex items-center justify-center">
                                            <span className="text-[11px] font-bold font-poppins text-white">AD</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">Admin</p>
                                            <p className="text-[10px] font-poppins text-neutral-5">Super Admin</p>
                                        </div>
                                    </div>
                                </div>

                                {/*<div className="p-1.5 flex flex-col gap-0.5">
                                    <button
                                        onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg
                                            text-xs font-poppins text-neutral-7 dark:text-neutral-7
                                            hover:bg-neutral-3 dark:hover:bg-neutral-3
                                            hover:text-neutral-8 transition-all duration-150 cursor-pointer"
                                    >
                                        <User size={13} className="text-neutral-5" /> Mon profil
                                    </button>
                                    <button
                                        onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg
                                            text-xs font-poppins text-neutral-7 dark:text-neutral-7
                                            hover:bg-neutral-3 dark:hover:bg-neutral-3
                                            hover:text-neutral-8 transition-all duration-150 cursor-pointer"
                                    >
                                        <Settings size={13} className="text-neutral-5" /> Paramètres
                                    </button>
                                </div> */}

                                <div className="border-t border-neutral-4 dark:border-neutral-4 p-1.5">
                                    <button
                                        onClick={handleLogoutClick}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg
                                            text-xs font-poppins text-danger-1
                                            hover:bg-danger-2 transition-all duration-150 cursor-pointer"
                                    >
                                        <LogOut size={13} /> Déconnexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
        </>
    );
};

export default TopBar;