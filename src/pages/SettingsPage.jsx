import React, { useEffect, useMemo } from 'react';
import {
    Megaphone,
    KeyRound,
    Shield,
    Settings2,
    Sparkles,
    Building2,
} from 'lucide-react';
import SettingsBannersManager from '../components/settings/SettingsBannersManager';
import SettingsCompanyForm from '../components/settings/SettingsCompanyForm';
import SettingsPasswordForm from '../components/settings/SettingsPasswordForm';
import SettingsAdminsManager from '../components/settings/SettingsAdminsManager';
import { useAdmin } from '../hooks/useAdmin';

const SettingsPanel = ({ title, description, children }) => (
    <div
        className="
        bg-neutral-0 dark:bg-neutral-0
        border border-neutral-4 dark:border-neutral-4
        rounded-3 overflow-hidden
        shadow-sm hover:shadow-md transition-shadow duration-200
    "
    >
        <div
            className="
            px-5 py-4 border-b border-neutral-4 dark:border-neutral-4
            bg-linear-to-r from-primary-5/50 via-neutral-2 to-neutral-2
            dark:from-primary-5/20 dark:via-neutral-2 dark:to-neutral-2
        "
        >
            <div className="flex items-start gap-3">
                <span
                    className="w-1 h-9 rounded-full bg-primary-1 shrink-0 mt-0.5"
                    aria-hidden
                />
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-[11px] font-poppins text-neutral-6 dark:text-neutral-6 mt-1 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
    </div>
);

const SettingsPage = () => {
    const { currentUser } = useAdmin();
    const [activeTab, setActiveTab] = React.useState('banners');

    const tabs = useMemo(() => {
        const base = [
            {
                id: 'banners',
                label: 'Bannières',
                description: "Visuels promotionnels sur la vitrine",
                icon: Megaphone,
            },
            {
                id: 'company',
                label: 'Entreprise',
                description: 'Identité, contact et liens affichés sur les factures',
                icon: Building2,
            },
            {
                id: 'password',
                label: 'Mot de passe',
                description: 'Sécurité de votre compte administrateur',
                icon: KeyRound,
            },
        ];
        if (currentUser?.is_full_admin || currentUser?.is_superuser || (currentUser?.is_admin && currentUser?.role !== 'staff')) {
            base.push({
                id: 'admins',
                label: 'Équipe',
                description: 'Nommer des membres staff (accès admin limité)',
                icon: Shield,
            });
        }
        return base;
    }, [currentUser?.is_full_admin, currentUser?.is_superuser, currentUser?.is_admin, currentUser?.role]);

    const validTabId = useMemo(() => {
        if (tabs.some((t) => t.id === activeTab)) return activeTab;
        return tabs[0]?.id ?? 'banners';
    }, [tabs, activeTab]);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Paramètres';
    }, []);

    return (
        <div
            data-settings-root
            className="flex flex-col w-full max-w-6xl xl:max-w-300 -mx-6 min-h-full"
        >
            {/* ── En-tête (défile avec le contenu) ── */}
            <header
                className="
                mx-6 pt-6 mb-4
                rounded-3 border border-neutral-4 dark:border-neutral-4
                bg-neutral-0 dark:bg-neutral-0 shadow-sm
                p-5 sm:p-6
            "
            >
                <div className="flex items-start gap-4 min-w-0">
                    <div
                        className="
                        w-12 h-12 rounded-2 shrink-0
                        flex items-center justify-center
                        bg-secondary-5 text-secondary-1
                    "
                    >
                        <Settings2 size={22} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1
                                className="
                                text-h4 font-bold font-poppins
                                text-neutral-8 dark:text-neutral-8 tracking-tight
                            "
                            >
                                Paramètres
                            </h1>
                            <span
                                className="
                                hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                bg-primary-5 text-primary-1 text-[10px] font-semibold font-poppins uppercase tracking-wide
                            "
                            >
                                <Sparkles size={10} />
                                Administration
                            </span>
                        </div>
                        <p className="text-small font-poppins text-neutral-6 dark:text-neutral-6 mt-1.5 max-w-xl">
                            Personnalisez la boutique, la sécurité du compte et les accès
                            équipe. Les changements sensibles peuvent impacter les clients.
                        </p>
                        {currentUser?.email && (
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-[11px] font-poppins text-neutral-5 dark:text-neutral-5">
                                    Connecté en tant que
                                </span>
                                <span
                                    className="
                                    text-xs font-semibold font-poppins
                                    px-2.5 py-1 rounded-full
                                    bg-neutral-3 dark:bg-neutral-3
                                    text-neutral-8 dark:text-neutral-8 border border-neutral-4 dark:border-neutral-4
                                "
                                >
                                    {currentUser.email}
                                </span>
                                {currentUser.is_superuser && (
                                    <span
                                        className="
                                        text-[11px] font-semibold font-poppins
                                        px-2 py-0.5 rounded-full bg-warning-2 text-warning-1
                                    "
                                    >
                                        Super-admin
                                    </span>
                                )}
                                {!currentUser.is_superuser && currentUser.role === 'staff' && (
                                    <span
                                        className="
                                        text-[11px] font-semibold font-poppins
                                        px-2 py-0.5 rounded-full bg-neutral-3 text-neutral-6
                                    "
                                    >
                                        Staff
                                    </span>
                                )}
                                {!currentUser.is_superuser && currentUser.role !== 'staff' && currentUser.is_admin && (
                                    <span
                                        className="
                                        text-[11px] font-semibold font-poppins
                                        px-2 py-0.5 rounded-full bg-primary-5 text-primary-1
                                    "
                                    >
                                        Admin
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Onglets — flush sous la TopBar au scroll ── */}
            <nav
                className="
                    sticky top-0 z-40 w-full
                    bg-neutral-0 dark:bg-neutral-0
                    border-b border-neutral-4 dark:border-neutral-4
                    shadow-[0_1px_0_0_rgba(0,0,0,0.04)]
                "
                aria-label="Sections des paramètres"
            >
                <div
                    className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide px-6 max-w-6xl xl:max-w-300 mx-auto"
                    role="tablist"
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = validTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.description}
                                className={`
                                    relative shrink-0 flex items-center gap-2 px-4 sm:px-5 py-3.5
                                    text-xs sm:text-sm font-semibold font-poppins whitespace-nowrap
                                    transition-colors duration-200 cursor-pointer
                                    border-b-2 -mb-px
                                    ${isActive
                                        ? 'border-primary-1 text-primary-1 bg-primary-5/40 dark:bg-primary-5/25'
                                        : 'border-transparent text-neutral-6 hover:text-neutral-8 hover:bg-neutral-3/60 dark:hover:bg-neutral-3/40'
                                    }
                                `}
                            >
                                <Icon
                                    size={16}
                                    className={isActive ? 'text-primary-1' : 'text-neutral-5'}
                                />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ── Contenu de l'onglet actif ── */}
            <div className="flex flex-col gap-6 px-6 pt-6 pb-6 min-w-0" role="tabpanel">
                {validTabId === 'banners' && (
                    <SettingsPanel
                        title="Bannières promotionnelles"
                        description="Gérez les visuels affichés sur l'application et le site. Format et poids des fichiers selon les consignes techniques."
                    >
                        <SettingsBannersManager />
                    </SettingsPanel>
                )}

                {validTabId === 'company' && (
                    <SettingsPanel
                        title="Fiche entreprise"
                        description="Informations légales et de contact synchronisées avec l'API. Elles sont reprises sur les factures PDF."
                    >
                        <SettingsCompanyForm />
                    </SettingsPanel>
                )}

                {validTabId === 'password' && (
                    <SettingsPanel
                        title="Mot de passe"
                        description="Choisissez un mot de passe robuste. Vous devrez vous reconnecter sur d'autres appareils si nécessaire."
                    >
                        <SettingsPasswordForm />
                    </SettingsPanel>
                )}

                {validTabId === 'admins' && currentUser?.is_superuser && (
                    <SettingsPanel
                        title="Gestion des administrateurs"
                        description="Création et suppression de comptes staff. Réservé aux super-admins."
                    >
                        <SettingsAdminsManager />
                    </SettingsPanel>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
