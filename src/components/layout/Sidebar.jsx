/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router';
import {
    LayoutDashboard, Package, Grid2X2, ShoppingCart,
    Users, MapPin, Bell, BarChart2, Settings,
    LogOut, ChevronLeft, ChevronRight, Rss, Images, FolderOpen
} from 'lucide-react';
import LogoutConfirmModal from '../LogoutConfirmModal';

// ── Navigation ────────────────────────────────────────────────
const navMain = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/categories', icon: Grid2X2, label: 'Catégories' },
    { to: '/orders', icon: ShoppingCart, label: 'Commandes' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/cities', icon: MapPin, label: 'Villes' },
];

const navSecondary = [
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/publish', icon: Rss, label: 'Publicité' },
    { to: '/reports', icon: BarChart2, label: 'Rapports' },
    { to: '/media', icon: Images, label: 'Médiathèque' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
];

// ── NavItem ───────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, collapsed, onNavigate }) => (
    <NavLink
        to={to}
        title={collapsed ? label : ''}
        onClick={onNavigate}
        className={({ isActive }) => `
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-xs font-medium font-poppins
            transition-all duration-200 group
            ${isActive
                ? 'bg-primary-5 dark:bg-primary-5 text-primary-1'
                : 'text-neutral-6 dark:text-neutral-6 hover:bg-neutral-3 dark:hover:bg-neutral-3 hover:text-neutral-8 dark:hover:text-neutral-8'
            }
            ${collapsed ? 'justify-center' : ''}
        `}
    >
        {({ isActive }) => (
            <>
                {/* Indicateur actif */}
                {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary-1" />
                )}

                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Tooltip collapsed */}
                {collapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 text-[11px] font-poppins font-medium
                        bg-neutral-9 dark:bg-neutral-3 text-white dark:text-neutral-8
                        rounded-lg whitespace-nowrap shadow-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-opacity duration-200 z-50">
                        {label}
                    </span>
                )}
            </>
        )}
    </NavLink>
);

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, onNavigate }) => {
    const { logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutClick = () => { setIsLogoutModalOpen(true); onToggle?.(); };
    const handleConfirmLogout = () => { logout(); setIsLogoutModalOpen(false); };
    const handleCancelLogout = () => setIsLogoutModalOpen(false);

    return (
        <div className="w-full">
            <aside className={`
                relative flex flex-col h-screen shrink-0
                bg-neutral-0 dark:bg-neutral-0
                border-r border-neutral-4 dark:border-neutral-4
                transition-all duration-300 ease-in-out
                ${collapsed ? 'w-15' : 'w-55'}
            `}>

                {/* ── Logo ── */}
                <div className={`flex items-center h-16 px-4 shrink-0
                    border-b border-neutral-4 dark:border-neutral-4
                    ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl
                        bg-linear-to-br from-primary-5 to-secondary-5 shrink-0">
                        <span className="font-poppins font-black text-sm leading-none">
                            <span className="text-primary-1">T</span>
                            <span className="text-secondary-1">L</span>
                        </span>
                    </div>
                    {!collapsed && (
                        <span className="font-poppins font-bold text-sm text-neutral-8 dark:text-neutral-8">
                            <span className="text-primary-1">Tokia</span>
                            <span className="text-secondary-1">-Loh</span>
                        </span>
                    )}
                </div>

                {/* ── Nav principale ── */}
                <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="my-3 flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-neutral-4 dark:bg-neutral-4" />
                        {!collapsed && (
                            <span className="text-[10px] font-poppins font-semibold text-neutral-5 uppercase tracking-wider whitespace-nowrap">
                                Navigation principale
                            </span>
                        )}
                        <div className="flex-1 h-px bg-neutral-4 dark:bg-neutral-4" />
                    </div>
                    {navMain.map(item => (
                        <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
                    ))}

                    {/* Séparateur avec label */}
                    <div className="my-3 flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-neutral-4 dark:bg-neutral-4" />
                        {!collapsed && (
                            <span className="text-[10px] font-poppins font-semibold text-neutral-5 uppercase tracking-wider whitespace-nowrap">
                                Outils secondaire
                            </span>
                        )}
                        <div className="flex-1 h-px bg-neutral-4 dark:bg-neutral-4" />
                    </div>

                    {navSecondary.map(item => (
                        <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
                    ))}
                </nav>

                {/* ── Bas sidebar : Déconnexion ── */}
                <div className="px-2 pb-4 pt-3 border-t border-neutral-4 dark:border-neutral-4">
                    <button
                        onClick={handleLogoutClick}
                        title={collapsed ? 'Déconnexion' : ''}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full
                            text-xs font-medium font-poppins text-danger-1
                            hover:bg-danger-2 transition-all duration-200
                            cursor-pointer group relative
                            ${collapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={17} className="shrink-0" />
                        {!collapsed && <span>Déconnexion</span>}

                        {collapsed && (
                            <span className="absolute left-full ml-3 px-2.5 py-1.5 text-[11px] font-poppins font-medium
                                bg-neutral-9 dark:bg-neutral-3 text-white dark:text-neutral-8
                                rounded-lg whitespace-nowrap shadow-lg
                                opacity-0 group-hover:opacity-100 pointer-events-none
                                transition-opacity duration-200 z-50">
                                Déconnexion
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Bouton collapse ── */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-18
                        w-6 h-6 rounded-full
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-4 dark:border-neutral-4
                        flex items-center justify-center
                        text-neutral-5 hover:text-primary-1 hover:border-primary-1
                        transition-all duration-200 cursor-pointer z-10 shadow-sm"
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
        </div>
    );
};

export default Sidebar;