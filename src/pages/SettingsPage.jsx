import React, { useState, useEffect } from 'react';
import {
    Megaphone,
    MessageSquare, Truck, Info, Shield
} from 'lucide-react';
import SettingsBannersManager from '../components/settings/SettingsBannersManager';
import SettingsMessagesForm from '../components/settings/SettingsMessagesForm';
import SettingsDeliveryForm from '../components/settings/SettingsDeliveryForm';
import SettingsAdminsManager from '../components/settings/SettingsAdminsManager';

const SECTIONS = [
    { key: 'banners', label: 'Bannières', icon: <Megaphone size={16} />, component: <SettingsBannersManager /> },
    { key: 'messages', label: 'Messages auto', icon: <MessageSquare size={16} />, component: <SettingsMessagesForm /> },
    { key: 'delivery', label: 'Livraison', icon: <Truck size={16} />, component: <SettingsDeliveryForm /> },
    { key: 'admins', label: 'Administrateurs', icon: <Shield size={16} />, component: <SettingsAdminsManager /> },
];

const SettingsPage = () => {
    const [activeSection, setActiveSection] = useState('messages');

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Paramètres';
    }, []);

    const current = SECTIONS.find(s => s.key === activeSection);

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                    Paramètres
                </h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                    Configuration générale de Tokia-Loh
                </p>
            </div>

            {/* ── Layout : nav latérale + contenu ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Navigation latérale */}
                <nav className="
                    w-full lg:w-52 shrink-0
                    bg-neutral-0 dark:bg-neutral-0
                    border border-neutral-4 dark:border-neutral-4
                    rounded-3 p-2 flex flex-col gap-1
                    lg:sticky lg:top-6
                ">
                    {SECTIONS.map(section => (
                        <button
                            key={section.key}
                            onClick={() => setActiveSection(section.key)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-2 w-full text-left
                                text-xs font-medium font-poppins
                                transition-all duration-200 cursor-pointer
                                ${activeSection === section.key
                                    ? 'bg-primary-5 text-primary-1'
                                    : 'text-neutral-7 dark:text-neutral-6 hover:bg-neutral-3 dark:hover:bg-neutral-3 hover:text-neutral-8 dark:hover:text-neutral-8'
                                }
                            `}
                        >
                            <span className="shrink-0">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}

                    {/* Info version */}
                    <div className="mt-3 pt-3 border-t border-neutral-4 dark:border-neutral-4 px-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-poppins text-neutral-5">
                            <Info size={11} />
                            Version 1.0.0
                        </div>
                    </div>
                </nav>

                {/* Contenu de la section active */}
                <div className="flex-1 min-w-0">
                    {/* Titre section */}
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-primary-1">{current?.icon}</span>
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {current?.label}
                        </h2>
                    </div>

                    {/* Composant actif */}
                    {current?.component}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;