import React, { useState } from 'react';
import { Plus, X, Mail } from 'lucide-react';
import { NOTIF_TYPE_CONFIG } from './NotificationsBadge';
import ProductStatusToggle from '../products/ProductStatusToggle';
import InputField from '../InputField';
import Button from '../Button';

const INIT_SETTINGS = {
    emails: ['admin@tokia-loh.com'],
    types: {
        'Commande': true,
        'Client': true,
        'Stock': true,
        'Annulation': true,
    },
};

const NotificationsSettings = () => {
    const [settings, setSettings] = useState(INIT_SETTINGS);
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [saved, setSaved] = useState(false);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = () => {
        if (!newEmail.trim()) { setEmailError('Email requis'); return; }
        if (!validateEmail(newEmail)) { setEmailError('Email invalide'); return; }
        if (settings.emails.includes(newEmail)) { setEmailError('Email déjà ajouté'); return; }
        setSettings(prev => ({ ...prev, emails: [...prev.emails, newEmail.trim()] }));
        setNewEmail('');
        setEmailError('');
    };

    const removeEmail = (email) => {
        if (settings.emails.length === 1) return; // garder au moins un
        setSettings(prev => ({ ...prev, emails: prev.emails.filter(e => e !== email) }));
    };

    const toggleType = (type) => {
        setSettings(prev => ({
            ...prev,
            types: { ...prev.types, [type]: !prev.types[type] },
        }));
    };

    const handleSave = async () => {
        // TODO : appel API PATCH /settings/notifications
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── Emails de réception ── */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Emails de réception
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        Les notifications seront envoyées à ces adresses
                    </p>
                </div>

                {/* Liste des emails */}
                <div className="flex flex-col gap-2">
                    {settings.emails.map(email => (
                        <div key={email} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-neutral-2 dark:bg-neutral-2 rounded-2">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-primary-1 shrink-0" />
                                <span className="text-xs font-poppins font-medium text-neutral-8 dark:text-neutral-8">
                                    {email}
                                </span>
                            </div>
                            <button
                                onClick={() => removeEmail(email)}
                                disabled={settings.emails.length === 1}
                                title={settings.emails.length === 1 ? 'Au moins un email requis' : 'Supprimer'}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-5 hover:bg-danger-2 hover:text-danger-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Ajouter un email */}
                <div className="flex items-start gap-2">
                    <div className="flex-1">
                        <InputField
                            name="newEmail"
                            type="email"
                            value={newEmail}
                            onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                            placeholder="Ajouter une adresse email..."
                            error={emailError}
                            onKeyDown={e => e.key === 'Enter' && addEmail()}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="normal"
                        icon={<Plus size={14} />}
                        onClick={addEmail}
                        className="mt-0.5 shrink-0"
                    >
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* ── Types de notifications ── */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Types de notifications
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        Choisissez les événements pour lesquels vous souhaitez être notifié
                    </p>
                </div>

                <div className="flex flex-col divide-y divide-neutral-4 dark:divide-neutral-4">
                    {Object.entries(NOTIF_TYPE_CONFIG).map(([type, config]) => {
                        const descriptions = {
                            'Commande': 'Chaque nouvelle commande reçue sur la boutique',
                            'Client': 'Chaque nouveau client inscrit',
                            'Stock': 'Quand un produit atteint un stock faible ou une rupture',
                            'Annulation': 'Quand un client annule une commande',
                        };

                        return (
                            <div key={type} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    {/* Icône */}
                                    <div className={`w-9 h-9 rounded-2 flex items-center justify-center shrink-0 ${config.color}`}>
                                        {React.cloneElement(config.icon, { size: 16 })}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {type}
                                        </p>
                                        <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                                            {descriptions[type]}
                                        </p>
                                    </div>
                                </div>
                                <ProductStatusToggle
                                    active={settings.types[type]}
                                    onChange={() => toggleType(type)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Bouton sauvegarder ── */}
            <div className="flex items-center justify-end gap-3">
                {saved && (
                    <span className="text-xs font-poppins text-success-1 font-medium animate-pulse">
                        ✓ Paramètres sauvegardés
                    </span>
                )}
                <Button variant="primary" size="normal" onClick={handleSave}>
                    Sauvegarder les paramètres
                </Button>
            </div>
        </div>
    );
};

export default NotificationsSettings;