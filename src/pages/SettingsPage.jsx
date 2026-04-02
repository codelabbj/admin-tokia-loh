import React, { useEffect, useMemo } from 'react';
import {
    Megaphone,
    KeyRound,
    Shield,
    Settings2,
    ChevronRight,
    Sparkles,
    Building2,
} from 'lucide-react';
import SettingsBannersManager from '../components/settings/SettingsBannersManager';
import SettingsCompanyForm from '../components/settings/SettingsCompanyForm';
import SettingsPasswordForm from '../components/settings/SettingsPasswordForm';
import SettingsAdminsManager from '../components/settings/SettingsAdminsManager';
import { useAdmin } from '../hooks/useAdmin';

// ── Zone de contenu : même vocabulaire que les sections du détail produit ──
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
                accent: 'primary',
            },
            {
                id: 'company',
                label: 'Entreprise',
                description: 'Identité, contact et liens affichés sur les factures',
                icon: Building2,
                accent: 'secondary',
            },
            {
                id: 'password',
                label: 'Mot de passe',
                description: 'Sécurité de votre compte administrateur',
                icon: KeyRound,
                accent: 'secondary',
            },
        ];
        if (currentUser?.is_superuser) {
            base.push({
                id: 'admins',
                label: 'Administrateurs',
                description: 'Comptes staff et droits super-admin',
                icon: Shield,
                accent: 'warning',
            });
        }
        return base;
    }, [currentUser?.is_superuser]);

    const validTabId = useMemo(() => {
        if (tabs.some((t) => t.id === activeTab)) return activeTab;
        return tabs[0]?.id ?? 'banners';
    }, [tabs, activeTab]);

    const active = tabs.find((t) => t.id === validTabId) ?? tabs[0];

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Paramètres';
    }, []);

    return (
        <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl xl:max-w-300">
            {/* ── En-tête ──────── */}
            <header
                className="
                rounded-3 border border-neutral-4 dark:border-neutral-4
                bg-neutral-0 dark:bg-neutral-0 shadow-sm
                p-5 sm:p-6
            "
            >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* ── Navigation ──────── */}
                <nav
                    className="
                    lg:col-span-4 xl:col-span-3
                    flex flex-col gap-2
                "
                    aria-label="Sections des paramètres"
                >
                    {/* Mobile / tablette : pilules scrollables */}
                    <div
                        className="
                        lg:hidden                         flex gap-2 overflow-x-auto pb-1 -mx-1 px-1
                    "
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = validTabId === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`
                                        shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full
                                        text-xs font-semibold font-poppins whitespace-nowrap
                                        transition-all duration-200 cursor-pointer border
                                        ${isActive
                                            ? 'bg-primary-1 text-white border-primary-1 shadow-sm'
                                            : 'bg-neutral-0 dark:bg-neutral-0 text-neutral-6 border-neutral-4 hover:border-primary-3 hover:text-neutral-8'
                                        }
                                    `}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop : liste dans une carte */}
                    <div
                        className="
                        hidden lg:flex flex-col gap-1 p-3
                        rounded-3 border border-neutral-4 dark:border-neutral-4
                        bg-neutral-0 dark:bg-neutral-0 shadow-sm
                    "
                    >
                        <p className="px-3 py-2 text-[11px] font-semibold font-poppins text-neutral-5 uppercase tracking-wider">
                            Sections
                        </p>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = validTabId === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`
                                        group w-full text-left rounded-2 transition-all duration-200 cursor-pointer
                                        border border-transparent
                                        ${isActive
                                            ? 'bg-primary-5 border-primary-3/40 shadow-sm'
                                            : 'hover:bg-neutral-2 dark:hover:bg-neutral-2 border-transparent'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 px-3 py-3">
                                        <div
                                            className={`
                                                w-10 h-10 rounded-2 flex items-center justify-center shrink-0
                                                ${isActive
                                                    ? 'bg-primary-1 text-white'
                                                    : 'bg-neutral-3 dark:bg-neutral-3 text-neutral-6 group-hover:text-primary-1'
                                                }
                                            `}
                                        >
                                            <Icon size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`
                                                    text-xs font-semibold font-poppins
                                                    ${isActive ? 'text-neutral-8 dark:text-neutral-8' : 'text-neutral-7 dark:text-neutral-7'}
                                                `}
                                            >
                                                {tab.label}
                                            </p>
                                            <p className="text-[11px] font-poppins text-neutral-5 dark:text-neutral-5 mt-0.5 line-clamp-2">
                                                {tab.description}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className={`
                                                shrink-0 transition-transform
                                                ${isActive ? 'text-primary-1 translate-x-0.5' : 'text-neutral-4 group-hover:text-neutral-6'}
                                            `}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ── Contenu ──────── */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-2 min-w-0">
                    <p className="lg:hidden text-[11px] font-medium font-poppins text-neutral-5 uppercase tracking-wide px-0.5">
                        {active?.label}
                    </p>

                    {validTabId === 'banners' && (
                        <SettingsPanel
                            title="Bannières promotionnelles"
                            description="Gérez les visuels affichés sur l’application et le site. Format et poids des fichiers selon les consignes techniques."
                        >
                            <SettingsBannersManager />
                        </SettingsPanel>
                    )}

                    {validTabId === 'company' && (
                        <SettingsPanel
                            title="Fiche entreprise"
                            description="Informations légales et de contact synchronisées avec l’API (GET/PATCH /accounts/company/). Elles sont reprises sur les factures PDF."
                        >
                            <SettingsCompanyForm />
                        </SettingsPanel>
                    )}

                    {validTabId === 'password' && (
                        <SettingsPanel
                            title="Mot de passe"
                            description="Choisissez un mot de passe robuste. Vous devrez vous reconnecter sur d’autres appareils si nécessaire."
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
        </div>
    );
};

export default SettingsPage;
