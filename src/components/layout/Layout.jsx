import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children, showSearch = true }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Ferme le menu mobile au redimensionnement vers desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-neutral-2 dark:bg-neutral-2 overflow-hidden">

            {/* Overlay mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-8/60 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar desktop */}
            <div className="hidden md:flex">
                <Sidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(p => !p)}
                />
            </div>

            {/* Sidebar mobile (drawer) */}
            <div className={`
                fixed inset-y-0 left-0 z-30 md:hidden
                transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar
                    collapsed={false}
                    onToggle={() => setMobileOpen(false)}
                    onNavigate={() => setMobileOpen(false)}
                />
            </div>

            {/* Contenu principal */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <TopBar
                    onMenuToggle={() => setMobileOpen(p => !p)}
                    showSearch={showSearch}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;