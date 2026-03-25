import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    // Redirige si déjà connecté
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

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
        <div className="min-h-screen bg-neutral-2 dark:bg-neutral-2 flex items-center justify-center p-4 relative">

            {/* ThemeToggle fixé en haut à droite */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm flex flex-col gap-8">

                {/* ── Logo ── */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-[10px] bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 flex items-center justify-center shadow-sm">
                        <span className="font-poppins font-bold text-lg leading-none">
                            <span className="text-primary-1">T</span>
                            <span className="text-secondary-1">L</span>
                        </span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            <span className="text-primary-1">Tokia</span>
                            <span className="text-secondary-1">-Loh</span>
                            {' '}Backoffice
                        </h1>
                        <p className="text-xs font-poppins text-neutral-5 mt-0.5">
                            Connectez-vous à votre espace admin
                        </p>
                    </div>
                </div>

                {/* ── Carte formulaire ── */}
                <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-xl p-6 shadow-sm">

                    {/* Erreur API */}
                    {apiError && (
                        <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger-2 border border-danger-1">
                            <p className="text-xs font-poppins text-danger-1">{apiError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <InputField
                            label="Adresse email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="admin@tokia-loh.com"
                            error={errors.email}
                            icon={<Mail size={15} className="text-neutral-5" />}
                            required
                        />

                        <InputField
                            label="Mot de passe"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            error={errors.password}
                            icon={<Lock size={15} className="text-neutral-5" />}
                            required
                        />

                        {/* Mot de passe oublié */}
                        <div className="flex justify-end -mt-1">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-[11px] font-poppins text-primary-1 hover:text-primary-2 transition-colors cursor-pointer"
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="normal"
                            loading={loading}
                            disabled={loading}
                            className="w-full mt-1"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;