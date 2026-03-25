import React, { useState } from 'react';
import { User, Phone, Lock, Pencil, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';

/*
  Props :
  - profile  : { firstName, lastName, phone, city }
  - onSave   : (updatedProfile) => void
*/

// ── Étapes du flux de modification du numéro ──────────────────
// 'idle'        → numéro affiché en lecture seule
// 'verify-old'  → saisie OTP envoyé sur l'ANCIEN numéro
// 'enter-new'   → saisie du NOUVEAU numéro
// 'verify-new'  → saisie OTP envoyé sur le NOUVEAU numéro
// 'done'        → numéro mis à jour avec succès

const PHONE_STEPS = { IDLE: 'idle', VERIFY_OLD: 'verify-old', ENTER_NEW: 'enter-new', VERIFY_NEW: 'verify-new', DONE: 'done' };

const maskPhone = (phone) => {
    if (!phone || phone.length < 6) return phone;
    return phone.slice(0, 4) + '****' + phone.slice(-2);
};

const validateOTPFormat = (code) => /^\d{6}$/.test(code);

// ── Composant OTP input ───────────────────────────────────────
const OTPInput = ({ value, onChange, label, hint }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
            {label}
        </label>
        {hint && <p className="text-[11px] font-poppins text-neutral-5">{hint}</p>}
        <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={value}
            onChange={e => {
                const v = e.target.value;
                if (/^\d{0,6}$/.test(v)) onChange(v);
            }}
            placeholder="000000"
            className="
                w-40 px-4 py-2.5 text-center text-lg font-bold font-poppins tracking-[0.5em]
                rounded-full border border-neutral-4 dark:border-neutral-4
                bg-neutral-2 dark:bg-neutral-2
                text-neutral-8 dark:text-neutral-8
                outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0
                focus:ring-2 focus:ring-primary-5 transition-all duration-200
            "
        />
    </div>
);

// ── Bloc modification du numéro de téléphone ─────────────────
const PhoneChangeFlow = ({ currentPhone, onPhoneChanged, onCancel }) => {
    const [step, setStep] = useState(PHONE_STEPS.VERIFY_OLD);
    const [otpOld, setOtpOld] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [otpNew, setOtpNew] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    // Envoie OTP sur l'ancien numéro
    const sendOldOTP = async () => {
        setLoading(true);
        setError('');
        // TODO : appel API POST /auth/send-otp { phone: currentPhone }
        await new Promise(r => setTimeout(r, 1200));
        setCodeSent(true);
        setLoading(false);
    };

    // Vérifie OTP de l'ancien numéro → passe à la saisie du nouveau
    const verifyOldOTP = async () => {
        if (!validateOTPFormat(otpOld)) { setError('Le code doit contenir 6 chiffres'); return; }
        setLoading(true);
        setError('');
        // TODO : appel API POST /auth/verify-otp { phone: currentPhone, code: otpOld }
        await new Promise(r => setTimeout(r, 1200));
        // Simulation : tout code à 6 chiffres est accepté
        setStep(PHONE_STEPS.ENTER_NEW);
        setOtpOld('');
        setLoading(false);
    };

    // Envoie OTP sur le nouveau numéro
    const sendNewOTP = async () => {
        if (!newPhone.trim()) { setError('Entrez votre nouveau numéro'); return; }
        if (newPhone === currentPhone) { setError('Le nouveau numéro est identique à l\'ancien'); return; }
        setLoading(true);
        setError('');
        // TODO : appel API POST /auth/send-otp { phone: newPhone }
        await new Promise(r => setTimeout(r, 1200));
        setStep(PHONE_STEPS.VERIFY_NEW);
        setCodeSent(false);
        setLoading(false);
    };

    // Vérifie OTP du nouveau numéro → finalise le changement
    const verifyNewOTP = async () => {
        if (!validateOTPFormat(otpNew)) { setError('Le code doit contenir 6 chiffres'); return; }
        setLoading(true);
        setError('');
        // TODO : appel API POST /auth/verify-otp { phone: newPhone, code: otpNew }
        await new Promise(r => setTimeout(r, 1200));
        onPhoneChanged(newPhone);
        setStep(PHONE_STEPS.DONE);
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-4 bg-primary-5 dark:bg-primary-5 border border-primary-3 rounded-[10px] px-4 py-4">

            {/* Indicateur d'étapes */}
            <div className="flex items-center gap-2">
                {[
                    { key: PHONE_STEPS.VERIFY_OLD, label: 'Vérification' },
                    { key: PHONE_STEPS.ENTER_NEW, label: 'Nouveau N°' },
                    { key: PHONE_STEPS.VERIFY_NEW, label: 'Confirmation' },
                ].map((s, i) => {
                    const steps = [PHONE_STEPS.VERIFY_OLD, PHONE_STEPS.ENTER_NEW, PHONE_STEPS.VERIFY_NEW];
                    const current = steps.indexOf(step);
                    const sIndex = steps.indexOf(s.key);
                    const isDone = sIndex < current;
                    const isActive = sIndex === current;
                    return (
                        <React.Fragment key={s.key}>
                            <div className="flex items-center gap-1.5">
                                <div className={`
                                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-poppins shrink-0
                                    ${isDone ? 'bg-success-1 text-white' : ''}
                                    ${isActive ? 'bg-primary-1 text-white' : ''}
                                    ${!isDone && !isActive ? 'bg-neutral-4 text-neutral-6' : ''}
                                `}>
                                    {isDone ? <CheckCircle size={12} /> : i + 1}
                                </div>
                                <span className={`text-[11px] font-poppins whitespace-nowrap ${isActive ? 'font-semibold text-primary-1' : 'text-neutral-6'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < 2 && <div className="flex-1 h-px bg-neutral-4 mx-1" />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Erreur */}
            {error && (
                <div className="flex items-center gap-2 bg-danger-2 border border-danger-1 rounded-md px-3 py-2">
                    <AlertCircle size={13} className="text-danger-1 shrink-0" />
                    <p className="text-[11px] font-poppins text-danger-1">{error}</p>
                </div>
            )}

            {/* ── Étape 1 : Vérifier l'ancien numéro ── */}
            {step === PHONE_STEPS.VERIFY_OLD && (
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                            Confirmez votre identité
                        </p>
                        <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">
                            Un code sera envoyé sur votre numéro actuel : <strong>{maskPhone(currentPhone)}</strong>
                        </p>
                    </div>

                    {!codeSent ? (
                        <Button variant="primary" size="normal" loading={loading} onClick={sendOldOTP}>
                            Envoyer le code
                        </Button>
                    ) : (
                        <>
                            <OTPInput
                                value={otpOld}
                                onChange={setOtpOld}
                                label="Code reçu"
                                hint={`Code envoyé au ${maskPhone(currentPhone)}`}
                            />
                            <div className="flex items-center gap-2">
                                <Button variant="primary" size="normal" loading={loading} onClick={verifyOldOTP}>
                                    Vérifier
                                </Button>
                                <button
                                    onClick={() => { setCodeSent(false); setOtpOld(''); }}
                                    className="text-[11px] font-poppins text-primary-1 underline cursor-pointer"
                                >
                                    Renvoyer le code
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Étape 2 : Saisir le nouveau numéro ── */}
            {step === PHONE_STEPS.ENTER_NEW && (
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                            Nouveau numéro de téléphone
                        </p>
                        <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">
                            Identité vérifiée ✓ — Entrez votre nouveau numéro
                        </p>
                    </div>
                    <InputField
                        label="Nouveau numéro"
                        name="newPhone"
                        value={newPhone}
                        onChange={e => { setNewPhone(e.target.value); setError(''); }}
                        placeholder="Ex: +225 07 00 11 22"
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="primary" size="normal" loading={loading} onClick={sendNewOTP}>
                            Envoyer le code de confirmation
                        </Button>
                        <button
                            onClick={() => setStep(PHONE_STEPS.VERIFY_OLD)}
                            className="text-[11px] font-poppins text-neutral-5 underline cursor-pointer flex items-center gap-1"
                        >
                            <ArrowLeft size={11} /> Retour
                        </button>
                    </div>
                </div>
            )}

            {/* ── Étape 3 : Vérifier le nouveau numéro ── */}
            {step === PHONE_STEPS.VERIFY_NEW && (
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                            Confirmez le nouveau numéro
                        </p>
                        <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">
                            Code envoyé au : <strong>{maskPhone(newPhone)}</strong>
                        </p>
                    </div>
                    <OTPInput
                        value={otpNew}
                        onChange={setOtpNew}
                        label="Code reçu"
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="primary" size="normal" loading={loading} onClick={verifyNewOTP}>
                            Valider le changement
                        </Button>
                        <button
                            onClick={() => { setStep(PHONE_STEPS.ENTER_NEW); setOtpNew(''); setError(''); }}
                            className="text-[11px] font-poppins text-neutral-5 underline cursor-pointer flex items-center gap-1"
                        >
                            <ArrowLeft size={11} /> Retour
                        </button>
                    </div>
                    <button
                        onClick={() => sendNewOTP()}
                        className="text-[11px] font-poppins text-primary-1 underline cursor-pointer self-start"
                    >
                        Renvoyer le code
                    </button>
                </div>
            )}

            {/* Annuler le flux */}
            {step !== PHONE_STEPS.DONE && (
                <button
                    onClick={onCancel}
                    className="text-[11px] font-poppins text-neutral-5 hover:text-neutral-7 underline cursor-pointer self-start"
                >
                    Annuler la modification
                </button>
            )}
        </div>
    );
};

// ── Composant principal ───────────────────────────────────────
const ProfileInfoForm = ({ profile, onSave }) => {
    const [form, setForm] = useState({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        city: profile.city ?? '',
        phone: profile.phone ?? '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [phoneFlowOpen, setPhoneFlowOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = 'Prénom requis';
        if (!form.lastName.trim()) e.lastName = 'Nom requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // Sauvegarde infos simples (nom + ville)
    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO : appel API PATCH /admin/profile
        await new Promise(r => setTimeout(r, 1200));
        setLoading(false);
        onSave?.(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // Callback quand le numéro est changé avec succès
    const handlePhoneChanged = (newPhone) => {
        setForm(prev => ({ ...prev, phone: newPhone }));
        onSave?.({ ...form, phone: newPhone });
        setPhoneFlowOpen(false);
    };

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-md p-5 flex flex-col gap-5
        ">
            {/* ── En-tête section ── */}
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-4 dark:border-neutral-4">
                <div className="w-7 h-7 rounded-md bg-primary-5 flex items-center justify-center">
                    <User size={14} className="text-primary-1" />
                </div>
                <div>
                    <p className="text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Informations personnelles
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5">
                        Nom et ville modifiables directement — le téléphone requiert une vérification
                    </p>
                </div>
            </div>

            {/* ── Infos simples : nom + ville ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Prénom"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Ex: Aminata"
                    error={errors.firstName}
                    required
                />
                <InputField
                    label="Nom"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Ex: Koné"
                    error={errors.lastName}
                    required
                />
                <div className="sm:col-span-2">
                    <InputField
                        label="Ville"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Ex: Abidjan"
                    />
                </div>
            </div>

            {/* ── Bouton sauvegarder infos simples ── */}
            <div className="flex items-center justify-end gap-3">
                {saved && (
                    <span className="text-xs font-poppins text-success-1 font-medium">
                        ✓ Informations mises à jour
                    </span>
                )}
                <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                    Sauvegarder
                </Button>
            </div>

            {/* ── Séparateur ── */}
            <div className="border-t border-neutral-4 dark:border-neutral-4" />

            {/* ── Bloc téléphone sécurisé ── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-secondary-5 flex items-center justify-center shrink-0">
                            <Phone size={14} className="text-secondary-1" />
                        </div>
                        <div>
                            <p className="text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                Numéro de téléphone
                            </p>
                            <p className="text-[11px] font-poppins text-neutral-5">
                                Vérification par OTP requise pour modifier
                            </p>
                        </div>
                    </div>

                    {/* Numéro actuel + bouton modifier */}
                    {!phoneFlowOpen && (
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4">
                                <Lock size={11} className="text-neutral-5" />
                                <span className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                                    {form.phone || '—'}
                                </span>
                            </div>
                            <button
                                onClick={() => setPhoneFlowOpen(true)}
                                className="flex items-center gap-1 text-[11px] font-poppins font-semibold text-primary-1 hover:text-primary-2 transition-colors cursor-pointer"
                            >
                                <Pencil size={11} />
                                Modifier
                            </button>
                        </div>
                    )}
                </div>

                {/* Flux OTP inline */}
                {phoneFlowOpen && (
                    <PhoneChangeFlow
                        currentPhone={form.phone}
                        onPhoneChanged={handlePhoneChanged}
                        onCancel={() => setPhoneFlowOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ProfileInfoForm;