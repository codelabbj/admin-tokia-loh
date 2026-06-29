import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
    Mail,
    Lock,
    ArrowRight,
    AlertCircle,
    Clock,
    Eye,
    EyeOff,
    Package,
    ShoppingCart,
    BarChart2,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    AUTH_LOGIN_NOTICE_KEY,
    AUTH_NOTICE_SESSION_EXPIRED,
    AUTH_SESSION_EXPIRED_MESSAGE,
} from '../constants/authLoginNotice';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
    {
        icon: Package,
        title: 'Catalogue',
        desc: 'Produits, catégories et stocks en un coup d\'œil.',
    },
    {
        icon: ShoppingCart,
        title: 'Commandes',
        desc: 'Suivi des livraisons et statuts en temps réel.',
    },
    {
        icon: BarChart2,
        title: 'Analytiques',
        desc: 'Chiffre d\'affaires et rapports détaillés.',
    },
];

const Field = ({
    label,
    name,
    type,
    value,
    onChange,
    placeholder,
    error,
    icon,
    autoComplete,
    trailing,
}) => (
    <div className="flex flex-col gap-1.5">
        <label
            htmlFor={name}
            className="text-[11px] font-semibold font-poppins text-neutral-6 dark:text-neutral-5 uppercase tracking-wider"
        >
            {label}
        </label>
        <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2 border transition-all duration-200
            bg-neutral-2/80 dark:bg-neutral-2/60 backdrop-blur-sm
            ${error
                ? 'border-danger-1 ring-2 ring-danger-1/15'
                : 'border-neutral-4/80 dark:border-neutral-5/80 focus-within:border-primary-1 focus-within:ring-2 focus-within:ring-primary-1/15'
            }`}
        >
            <span className={`shrink-0 ${error ? 'text-danger-1' : 'text-neutral-5'}`}>
                {icon}
            </span>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="flex-1 min-w-0 bg-transparent text-sm font-poppins text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-5/70 outline-none"
            />
            {trailing}
        </div>
        {error && (
            <p className="text-[11px] font-poppins text-danger-1 flex items-center gap-1">
                <AlertCircle size={11} /> {error}
            </p>
        )}
    </div>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [sessionNotice, setSessionNotice] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(t);
    }, []);

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
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
        <div className="relative min-h-screen overflow-hidden bg-neutral-1 dark:bg-neutral-1">
            {/* ── Fond atmosphérique ── */}
            <div className="pointer-events-none fixed inset-0" aria-hidden>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.12),transparent)]" />
                <div className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary-1/15 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-primary-1/12 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* ── Barre supérieure ── */}
            <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-1 to-secondary-1 shadow-md shadow-primary-1/25">
                        <span className="font-poppins text-xs font-black text-white">TL</span>
                    </div>
                    <span className="font-poppins text-sm font-bold text-neutral-8 dark:text-neutral-8">
                        Tokia<span className="text-secondary-1">-Loh</span>
                    </span>
                </div>
                <ThemeToggle />
            </header>

            {/* ── Contenu principal ── */}
            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col items-center justify-center px-5 pb-10 pt-4 sm:px-8 lg:flex-row lg:items-stretch lg:gap-12 lg:py-12">
                {/* Panneau gauche — storytelling (desktop) */}
                <section
                    className={`hidden lg:flex lg:w-[48%] flex-col justify-center gap-8 transition-all duration-700 ease-out
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
                >
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-3/40 bg-primary-5/60 px-3 py-1 text-[10px] font-semibold font-poppins uppercase tracking-widest text-primary-1">
                            <ShieldCheck size={12} />
                            Espace sécurisé
                        </span>
                        <h1 className="text-4xl xl:text-[2.75rem] font-poppins font-bold leading-[1.15] text-neutral-8 dark:text-neutral-8 tracking-tight">
                            Pilotez votre boutique
                            <span className="block bg-linear-to-r from-primary-1 to-secondary-1 bg-clip-text text-transparent">
                                depuis un seul endroit.
                            </span>
                        </h1>
                        <p className="max-w-md text-sm font-poppins leading-relaxed text-neutral-6 dark:text-neutral-6">
                            Tableau de bord, commandes, catalogue et rapports — tout ce dont vous avez besoin pour faire grandir Tokia-Loh.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                            <div
                                key={title}
                                className={`group flex items-start gap-4 rounded-2xl border border-neutral-4/60 dark:border-neutral-5/50
                                bg-neutral-0/70 dark:bg-neutral-0/40 backdrop-blur-md px-4 py-3.5
                                shadow-sm transition-all duration-500 hover:border-primary-3/50 hover:shadow-md
                                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                style={{ transitionDelay: `${120 + i * 80}ms` }}
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-5 text-primary-1 transition-colors group-hover:bg-primary-1 group-hover:text-white">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                        {title}
                                    </p>
                                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Panneau formulaire */}
                <section
                    className={`flex w-full max-w-md flex-col justify-center lg:w-[52%] lg:max-w-lg
                    transition-all duration-700 ease-out delay-100
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    <div className="relative overflow-hidden rounded-3xl border border-neutral-4/70 dark:border-neutral-5/60 bg-neutral-0/90 dark:bg-neutral-0/80 backdrop-blur-xl shadow-2xl shadow-neutral-8/5 dark:shadow-black/30">
                        {/* Bandeau dégradé */}
                        <div className="h-1.5 w-full bg-linear-to-r from-primary-1 via-secondary-1 to-primary-1" />

                        <div className="p-7 sm:p-9">
                            <div className="mb-7">
                                <p className="text-[11px] font-semibold font-poppins uppercase tracking-widest text-primary-1 mb-2">
                                    Administration
                                </p>
                                <h2 className="text-2xl font-poppins font-bold text-neutral-8 dark:text-neutral-8 tracking-tight">
                                    Connexion
                                </h2>
                                <p className="mt-1.5 text-sm font-poppins text-neutral-6 dark:text-neutral-6">
                                    Identifiez-vous pour accéder au backoffice.
                                </p>
                            </div>

                            {sessionNotice && (
                                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-warning-1/30 bg-warning-2/80 px-4 py-3">
                                    <Clock size={15} className="text-warning-1 shrink-0 mt-0.5" />
                                    <p className="text-xs font-poppins font-medium text-warning-1 leading-relaxed">
                                        {sessionNotice}
                                    </p>
                                </div>
                            )}

                            {apiError && (
                                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-danger-1/30 bg-danger-2/80 px-4 py-3">
                                    <AlertCircle size={15} className="text-danger-1 shrink-0 mt-0.5" />
                                    <p className="text-xs font-poppins font-medium text-danger-1 leading-relaxed">
                                        {apiError}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <Field
                                    label="Adresse email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="admin@tokia-loh.com"
                                    error={errors.email}
                                    icon={<Mail size={16} />}
                                    autoComplete="username"
                                />

                                <Field
                                    label="Mot de passe"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    error={errors.password}
                                    icon={<Lock size={16} />}
                                    autoComplete="current-password"
                                    trailing={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="shrink-0 text-neutral-5 hover:text-neutral-8 transition-colors cursor-pointer"
                                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    }
                                />

                                <div className="flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-poppins font-medium text-primary-1 hover:text-primary-6 transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group mt-1 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5
                                        font-poppins text-sm font-semibold text-white
                                        bg-linear-to-r from-primary-1 to-primary-6
                                        shadow-lg shadow-primary-1/25
                                        hover:shadow-xl hover:shadow-primary-1/30 hover:brightness-105
                                        transition-all duration-200
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        active:scale-[0.99]"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Connexion en cours…
                                        </>
                                    ) : (
                                        <>
                                            Accéder au tableau de bord
                                            <ArrowRight
                                                size={16}
                                                className="transition-transform group-hover:translate-x-0.5"
                                            />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[11px] font-poppins text-neutral-5 dark:text-neutral-6">
                        Accès réservé aux administrateurs autorisés · © {new Date().getFullYear()} Tokia-Loh
                    </p>
                </section>
            </main>
        </div>
    );
};

export default LoginPage;
