import React, { useEffect } from 'react';
import { Megaphone, KeyRound, Shield } from 'lucide-react';
import SettingsBannersManager from '../components/settings/SettingsBannersManager';
import SettingsPasswordForm from '../components/settings/SettingsPasswordForm';
import SettingsAdminsManager from '../components/settings/SettingsAdminsManager';
import { useAdmin } from '../hooks/useAdmin';

const Section = ({ icon, title, children }) => (
    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
            <span className="text-primary-1">{icon}</span>
            <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const SettingsPage = () => {
    const { currentUser } = useAdmin();
    const [activeTab, setActiveTab] = React.useState('banners');

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Paramètres';
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">Paramètres</h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">Configuration générale de Tokia-Loh</p>
            </div>

            <div className="flex gap-2 border-b border-neutral-4 dark:border-neutral-4">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`px-4 py-2 text-xs font-poppins rounded-t-2 transition-colors ${activeTab === 'banners'
                        ? 'bg-neutral-0 border border-neutral-4 border-b-transparent text-primary-1'
                        : 'text-neutral-6 hover:text-neutral-8'
                        }`}
                >
                    Bannières
                </button>

                <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 text-xs font-poppins rounded-t-2 transition-colors ${activeTab === 'password'
                        ? 'bg-neutral-0 border border-neutral-4 border-b-transparent text-primary-1'
                        : 'text-neutral-6 hover:text-neutral-8'
                        }`}
                >
                    Mot de passe
                </button>

                {currentUser?.is_superuser && (
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`px-4 py-2 text-xs font-poppins rounded-t-2 transition-colors ${activeTab === 'admins'
                            ? 'bg-neutral-0 border border-neutral-4 border-b-transparent text-primary-1'
                            : 'text-neutral-6 hover:text-neutral-8'
                            }`}
                    >
                        Administrateurs
                    </button>
                )}
            </div>

            {activeTab === 'banners' && (
                <Section icon={<Megaphone size={16} />} title="Bannières">
                    <SettingsBannersManager />
                </Section>
            )}

            {activeTab === 'password' && (
                <Section icon={<KeyRound size={16} />} title="Mot de passe">
                    <SettingsPasswordForm />
                </Section>
            )}

            {activeTab === 'admins' && currentUser?.is_superuser && (
                <Section icon={<Shield size={16} />} title="Gérer les administrateurs">
                    <SettingsAdminsManager />
                </Section>
            )}
        </div>
    );
};

export default SettingsPage;