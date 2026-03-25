import React, { useState } from 'react';
import { Plus, X, Mail } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';

const INIT = {
    appName: 'Tokia-Loh',
    emails: ['admin@tokia-loh.com'],
};

const SettingsGeneralForm = () => {
    const [form, setForm] = useState(INIT);
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [saved, setSaved] = useState(false);

    const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const addEmail = () => {
        if (!newEmail.trim()) { setEmailError('Email requis'); return; }
        if (!validateEmail(newEmail)) { setEmailError('Email invalide'); return; }
        if (form.emails.includes(newEmail)) { setEmailError('Déjà ajouté'); return; }
        setForm(prev => ({ ...prev, emails: [...prev.emails, newEmail.trim()] }));
        setNewEmail('');
        setEmailError('');
    };

    const removeEmail = (email) => {
        if (form.emails.length === 1) return;
        setForm(prev => ({ ...prev, emails: prev.emails.filter(e => e !== email) }));
    };

    const handleSave = async () => {
        // TODO : appel API PATCH /settings/general
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Nom de l'application */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Identité de l'application
                    </p>
                </div>
                <InputField
                    label="Nom de l'application"
                    name="appName"
                    value={form.appName}
                    onChange={e => setForm(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="Ex: Tokia-Loh"
                    hint="Ce nom apparaît dans l'onglet du navigateur et les emails"
                />
            </div>

            {/* Emails admins */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Emails administrateurs
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        Ces adresses reçoivent les notifications et rapports
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    {form.emails.map(email => (
                        <div key={email} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-neutral-2 dark:bg-neutral-2 rounded-2">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-primary-1 shrink-0" />
                                <span className="text-xs font-medium font-poppins text-neutral-8 dark:text-neutral-8">
                                    {email}
                                </span>
                            </div>
                            <button
                                onClick={() => removeEmail(email)}
                                disabled={form.emails.length === 1}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-5 hover:bg-danger-2 hover:text-danger-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-start gap-2">
                    <div className="flex-1">
                        <InputField
                            name="newEmail"
                            type="email"
                            value={newEmail}
                            onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                            placeholder="Ajouter un email admin..."
                            error={emailError}
                            onKeyDown={e => e.key === 'Enter' && addEmail()}
                        />
                    </div>
                    <Button variant="outline" size="normal" icon={<Plus size={14} />} onClick={addEmail} className="mt-0.5 shrink-0">
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Sauvegarder */}
            <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-xs font-poppins text-success-1 font-medium">✓ Sauvegardé</span>}
                <Button variant="primary" size="normal" onClick={handleSave}>
                    Sauvegarder
                </Button>
            </div>
        </div>
    );
};

export default SettingsGeneralForm;