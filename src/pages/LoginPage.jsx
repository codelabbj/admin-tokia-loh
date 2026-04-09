import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    AUTH_LOGIN_NOTICE_KEY,
    AUTH_NOTICE_SESSION_EXPIRED,
    AUTH_SESSION_EXPIRED_MESSAGE,
} from '../constants/authLoginNotice';
import ThemeToggle from '../components/ThemeToggle';

/* ── Sous-composant : champ de saisie ──────────────────────── */
const Field = ({ label, name, type, value, onChange, placeholder, error, icon, autoComplete }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-6 tracking-wide">
            {label}
        </label>
        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all duration-200
            bg-neutral-0 dark:bg-neutral-2
            ${error
                ? 'border-danger-1 ring-2 ring-danger-1/20'
                : 'border-neutral-4 dark:border-neutral-5 focus-within:border-primary-1 focus-within:ring-2 focus-within:ring-primary-1/20'
            }`}
        >
            <span className={`shrink-0 transition-colors ${error ? 'text-danger-1' : 'text-neutral-5 dark:text-neutral-6'}`}>
                {icon}
            </span>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="flex-1 bg-transparent text-sm font-poppins text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-5/60 dark:placeholder:text-neutral-6/60 outline-none"
            />
        </div>
        {error && (
            <p className="text-[11px] font-poppins text-danger-1 flex items-center gap-1">
                <AlertCircle size={11} /> {error}
            </p>
        )}
    </div>
);

/* ── Page principale ───────────────────────────────────────── */
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [sessionNotice, setSessionNotice] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        try {
            const notice = sessionStorage.getItem(AUTH_LOGIN_NOTICE_KEY);
            if (notice === AUTH_NOTICE_SESSION_EXPIRED) {
                setSessionNotice(AUTH_SESSION_EXPIRED_MESSAGE);
                sessionStorage.removeItem(AUTH_LOGIN_NOTICE_KEY);
            }
        } catch { /* ignore */ }
    }, []);

    const validate = () => {
        const e = {};
        if (!form.email.trim()) e.email = 'Email requis';
        if (!form.password.trim()) e.password = 'Mot de passe requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
        if (sessionNotice) setSessionNotice('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const result = await login(form.email, form.password);
        if (result.success) {
            navigate('/dashboard', { replace: true });
        } else {
            setApiError(result.error ?? 'Identifiants incorrects');
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-neutral-2 dark:bg-neutral-2">

            {/* ── Orbes décoratifs (fond) ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-1/10 dark:bg-primary-1/5 blur-[80px]" />
                <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-secondary-1/10 dark:bg-secondary-1/5 blur-[80px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary-1/5 blur-[60px]" />
            </div>

            {/* ── Panneau gauche — branding ── */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 xl:w-[55%] relative p-12 overflow-hidden">

                {/* Dégradé de fond */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-1 via-primary-6 to-secondary-1 opacity-95" />

                {/* Grille de points décoratifs */}
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Cercles décoratifs flottants */}
                <div className="absolute top-20 right-16 w-32 h-32 rounded-full border border-white/20" />
                <div className="absolute top-24 right-20 w-20 h-20 rounded-full border border-white/10" />
                <div className="absolute bottom-32 left-12 w-48 h-48 rounded-full border border-white/10" />
                <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full border border-white/15" />

                {/* Contenu */}
                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                            <span className="font-poppins font-bold text-base leading-none">
                                <span className="text-white">T</span>
                                <span className="text-white/70">L</span>
                            </span>
                        </div>
                        <span className="text-white font-poppins font-bold text-lg tracking-tight">
                            Tokia<span className="text-white/60">-Loh</span>
                        </span>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col gap-6">
                    {/* Titre principal */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-4xl xl:text-5xl font-poppins font-bold text-white leading-tight">
                            Gérez votre<br />
                            <span className="text-white/70">boutique</span><br />
                            en toute<br />simplicité.
                        </h2>
                        <p className="text-sm font-poppins text-white/60 leading-relaxed max-w-xs">
                            La plateforme d'administration qui vous offre une vue complète sur vos produits, commandes et clients.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                        {[
                            { value: '100%', label: 'Sécurisé' },
                            { value: '24/7', label: 'Disponible' },
                            { value: '∞', label: 'Produits' },
                        ].map(({ value, label }) => (
                            <div key={label} className="flex flex-col gap-0.5">
                                <span className="text-2xl font-poppins font-bold text-white">{value}</span>
                                <span className="text-xs font-poppins text-white/50">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer branding */}
                <div className="relative z-10">
                    <p className="text-xs font-poppins text-white/40">
                        © {new Date().getFullYear()} Tokia-Loh · Tous droits réservés
                    </p>
                </div>
            </div>

            {/* ── Panneau droit — formulaire ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative z-10">

                {/* Theme toggle */}
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>

                {/* Logo mobile uniquement */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-primary-1 flex items-center justify-center shadow-md">
                        <span className="font-poppins font-bold text-sm text-white">TL</span>
                    </div>
                    <span className="font-poppins font-bold text-neutral-8 dark:text-neutral-8 text-lg">
                        Tokia<span className="text-secondary-1">-Loh</span>
                    </span>
                </div>

                {/* Carte formulaire */}
                <div
                    className={`w-full max-w-md transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    {/* En-tête */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-poppins font-bold text-neutral-9 dark:text-neutral-9 mb-1.5">
                            Bon retour ! 👋
                        </h1>
                        <p className="text-sm font-poppins text-neutral-6 dark:text-neutral-6">
                            Connectez-vous à votre espace d'administration.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 rounded-2xl border border-neutral-4 dark:border-neutral-5 shadow-xl shadow-neutral-8/5 dark:shadow-black/20 p-8 flex flex-col gap-5">

                        {/* Alerte session expirée */}
                        {sessionNotice && (
                            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-warning-2 border border-warning-1/40">
                                <Clock size={14} className="text-warning-1 shrink-0 mt-0.5" />
                                <p className="text-xs font-poppins text-warning-1 font-medium leading-relaxed">
                                    {sessionNotice}
                                </p>
                            </div>
                        )}

                        {/* Erreur API */}
                        {apiError && (
                            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-danger-2 border border-danger-1/40">
                                <AlertCircle size={14} className="text-danger-1 shrink-0 mt-0.5" />
                                <p className="text-xs font-poppins text-danger-1 font-medium leading-relaxed">
                                    {apiError}
                                </p>
                            </div>
                        )}

                        {/* Formulaire */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Field
                                label="Adresse email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@tokia-loh.com"
                                error={errors.email}
                                icon={<Mail size={15} />}
                                autoComplete="username"
                            />

                            <Field
                                label="Mot de passe"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                error={errors.password}
                                icon={<Lock size={15} />}
                                autoComplete="current-password"
                            />

                            {/* Bouton */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    mt-2 w-full flex items-center justify-center gap-2.5
                                    px-5 py-3.5 rounded-xl font-poppins font-semibold text-sm text-white
                                    bg-gradient-to-r from-primary-1 to-primary-6
                                    hover:from-primary-6 hover:to-primary-7
                                    shadow-md shadow-primary-1/30
                                    transition-all duration-200
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                    active:scale-[0.98]
                                `}
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Connexion en cours…
                                    </>
                                ) : (
                                    <>
                                        Se connecter
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[11px] font-poppins text-neutral-5 dark:text-neutral-6 mt-6">
                        Accès réservé aux administrateurs autorisés
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;