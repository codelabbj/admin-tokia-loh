import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';

// Calcul force du mot de passe
const calcStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
        { score: 0, label: '', color: '', bg: '' },
        { score: 1, label: 'Très faible', color: 'text-danger-1', bg: 'bg-danger-1' },
        { score: 2, label: 'Faible', color: 'text-warning-1', bg: 'bg-warning-1' },
        { score: 3, label: 'Moyen', color: 'text-primary-1', bg: 'bg-primary-1' },
        { score: 4, label: 'Fort', color: 'text-success-1', bg: 'bg-success-1' },
    ];
    return { score, ...levels[score] };
};

const StrengthBar = ({ password }) => {
    const { score, label, color, bg } = calcStrength(password);
    if (!password) return null;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? bg : 'bg-neutral-3 dark:bg-neutral-3'}`}
                    />
                ))}
            </div>
            {label && (
                <p className={`text-[11px] font-poppins font-semibold ${color}`}>
                    Force du mot de passe : {label}
                </p>
            )}
        </div>
    );
};

const ProfilePasswordForm = () => {
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.current) e.current = 'Mot de passe actuel requis';
        if (!form.next) e.next = 'Nouveau mot de passe requis';
        else if (form.next.length < 8) e.next = '8 caractères minimum';
        else if (!/[A-Z]/.test(form.next)) e.next = 'Au moins une majuscule requise';
        else if (!/[0-9]/.test(form.next)) e.next = 'Au moins un chiffre requis';
        if (!form.confirm) e.confirm = 'Confirmation requise';
        else if (form.next !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO : appel API PATCH /admin/password
        await new Promise(r => setTimeout(r, 1200));
        setLoading(false);
        setForm({ current: '', next: '', confirm: '' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-md p-5 flex flex-col gap-5
        ">
            {/* En-tête section */}
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-4 dark:border-neutral-4">
                <div className="w-7 h-7 rounded-md bg-secondary-5 flex items-center justify-center">
                    <KeyRound size={14} className="text-secondary-1" />
                </div>
                <div>
                    <p className="text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Modifier le mot de passe
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5">
                        8 caractères minimum, une majuscule, un chiffre
                    </p>
                </div>
            </div>

            {/* Champs */}
            <div className="flex flex-col gap-4">
                <InputField
                    label="Mot de passe actuel"
                    name="current"
                    type="password"
                    value={form.current}
                    onChange={handleChange}
                    placeholder="Votre mot de passe actuel"
                    error={errors.current}
                    required
                />

                <div className="flex flex-col gap-2">
                    <InputField
                        label="Nouveau mot de passe"
                        name="next"
                        type="password"
                        value={form.next}
                        onChange={handleChange}
                        placeholder="Nouveau mot de passe"
                        error={errors.next}
                        required
                    />
                    <StrengthBar password={form.next} />
                </div>

                <InputField
                    label="Confirmer le nouveau mot de passe"
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Répétez le nouveau mot de passe"
                    error={errors.confirm}
                    required
                />
            </div>

            {/* Sauvegarder */}
            <div className="flex items-center justify-end gap-3 pt-1">
                {saved && (
                    <span className="text-xs font-poppins text-success-1 font-medium">
                        ✓ Mot de passe modifié
                    </span>
                )}
                <Button variant="secondary" size="normal" loading={loading} onClick={handleSubmit}>
                    Modifier le mot de passe
                </Button>
            </div>
        </div>
    );
};

export default ProfilePasswordForm;