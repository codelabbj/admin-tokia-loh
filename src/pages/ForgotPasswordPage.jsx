import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

// Étapes : 'email' → 'reset'
const STEPS = { EMAIL: 'email', RESET: 'reset' };

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { forgotPassword, resetPassword } = useAuth();

    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // ── Étape 1 : envoyer OTP ─────────────────────────────────
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setErrors({ email: 'Email requis' }); return; }
        setLoading(true);
        setApiError('');
        try {
            await forgotPassword(email);
            setStep(STEPS.RESET);
        } catch (err) {
            setApiError(err.message ?? 'Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    // ── Étape 2 : réinitialiser le mot de passe ───────────────
    const handleReset = async (e) => {
        e.preventDefault();
        const e2 = {};
        if (!form.otp.trim()) e2.otp = 'Code requis';
        if (!form.newPassword.trim()) e2.newPassword = 'Nouveau mot de passe requis';
        if (form.newPassword !== form.confirmPassword)
            e2.confirmPassword = 'Les mots de passe ne correspondent pas';
        if (Object.keys(e2).length) { setErrors(e2); return; }

        setLoading(true);
        setApiError('');
        try {
            await resetPassword(email, form.otp, form.newPassword, form.confirmPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch (err) {
            setApiError(err.message ?? 'Code invalide ou expiré');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    return (
        <div className="min-h-screen bg-neutral-2 dark:bg-neutral-2 flex items-center justify-center p-4 relative">

            {/* ThemeToggle fixé en haut à droite */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm flex flex-col gap-8">

                {/* Logo */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-[10px] bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 flex items-center justify-center shadow-sm">
                        <span className="font-poppins font-bold text-lg leading-none">
                            <span className="text-primary-1">T</span>
                            <span className="text-secondary-1">L</span>
                        </span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            Mot de passe oublié
                        </h1>
                        <p className="text-xs font-poppins text-neutral-5 mt-0.5">
                            {step === STEPS.EMAIL
                                ? 'Entrez votre email pour recevoir un code'
                                : `Code envoyé à ${email}`}
                        </p>
                    </div>
                </div>

                {/* Carte */}
                <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-xl p-6 shadow-sm flex flex-col gap-4">

                    {/* Succès */}
                    {success && (
                        <div className="px-3 py-2.5 rounded-lg bg-success-2 border border-success-1">
                            <p className="text-xs font-poppins text-success-1 font-semibold">
                                Mot de passe réinitialisé ! Redirection...
                            </p>
                        </div>
                    )}

                    {/* Erreur API */}
                    {apiError && (
                        <div className="px-3 py-2.5 rounded-lg bg-danger-2 border border-danger-1">
                            <p className="text-xs font-poppins text-danger-1">{apiError}</p>
                        </div>
                    )}

                    {/* ── Étape 1 : Email ── */}
                    {step === STEPS.EMAIL && (
                        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                            <InputField
                                label="Adresse email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErrors({}); }}
                                placeholder="admin@tokia-loh.com"
                                error={errors.email}
                                icon={<Mail size={15} className="text-neutral-5" />}
                                required
                            />
                            <Button type="submit" variant="primary" size="normal" loading={loading} className="w-full">
                                Envoyer le code
                            </Button>
                        </form>
                    )}

                    {/* ── Étape 2 : OTP + nouveau mot de passe ── */}
                    {step === STEPS.RESET && !success && (
                        <form onSubmit={handleReset} className="flex flex-col gap-4">
                            <InputField
                                label="Code reçu par email"
                                name="otp"
                                type="text"
                                value={form.otp}
                                onChange={handleChange}
                                placeholder="Ex: GXO27"
                                error={errors.otp}
                                required
                            />
                            <InputField
                                label="Nouveau mot de passe"
                                name="newPassword"
                                type="password"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                error={errors.newPassword}
                                required
                            />
                            <InputField
                                label="Confirmer le mot de passe"
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                error={errors.confirmPassword}
                                required
                            />
                            <Button type="submit" variant="primary" size="normal" loading={loading} className="w-full">
                                Réinitialiser
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep(STEPS.EMAIL); setErrors({}); setApiError(''); }}
                                className="text-[11px] font-poppins text-neutral-5 underline cursor-pointer self-center"
                            >
                                Renvoyer le code
                            </button>
                        </form>
                    )}

                    {/* Retour login */}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-1.5 text-[11px] font-poppins text-neutral-5 hover:text-neutral-7 transition-colors cursor-pointer mt-1"
                    >
                        <ArrowLeft size={11} /> Retour à la connexion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;