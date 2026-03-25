import React from 'react';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
            {/* Illustration 404 */}
            <div className="relative mb-8">
                {/* Cercles décoratifs */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary-6 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-secondary-6 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

                {/* Numéro 404 */}
                <div className="relative">
                    <h1 className="text-[120px] md:text-[180px] font-bold font-poppins text-neutral-3 dark:text-neutral-3 leading-none select-none">
                        404
                    </h1>
                    {/* Icône centrale */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-warning-6 rounded-full flex items-center justify-center">
                            <AlertCircle size={40} className="text-warning-1" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Message principal */}
            <div className="text-center mb-8 max-w-md">
                <h2 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8 mb-3">
                    Page introuvable
                </h2>
                <p className="text-sm font-poppins text-neutral-6 dark:text-neutral-6 leading-relaxed">
                    Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                    Vérifiez l'URL ou retournez à l'accueil.
                </p>
            </div>

            {/* Suggestions */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-6 mb-8 max-w-lg w-full">
                <div className="flex items-start gap-3 mb-4">
                    <Search size={20} className="text-primary-1 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8 mb-2">
                            Suggestions :
                        </h3>
                        <ul className="space-y-2 text-xs font-poppins text-neutral-6 dark:text-neutral-6">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-1 rounded-full"></span>
                                Vérifiez l'orthographe de l'URL
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-1 rounded-full"></span>
                                Retournez à la page précédente
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-1 rounded-full"></span>
                                Accédez au tableau de bord
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button
                    onClick={handleGoBack}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-md cursor-pointer border border-neutral-4 text-neutral-8 font-medium text-sm font-poppins hover:bg-neutral-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Retour
                </button>
                <button
                    onClick={handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 cursor-pointer rounded-md bg-primary-1 text-neutral-0 font-medium text-sm font-poppins hover:bg-primary-2 transition-colors"
                >
                    <Home size={18} />
                    Tableau de bord
                </button>
            </div>

            {/* Liens rapides */}
            <div className="mt-12 text-center">
                <p className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7 mb-3 uppercase tracking-wide">
                    Liens rapides
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => navigate('/orders')}
                        className="text-xs font-medium font-poppins text-primary-1 hover:text-primary-2 transition-colors"
                    >
                        Commandes
                    </button>
                    <span className="text-neutral-4">•</span>
                    <button
                        onClick={() => navigate('/products')}
                        className="text-xs font-medium font-poppins text-primary-1 hover:text-primary-2 transition-colors"
                    >
                        Produits
                    </button>
                    <span className="text-neutral-4">•</span>
                    <button
                        onClick={() => navigate('/customers')}
                        className="text-xs font-medium font-poppins text-primary-1 hover:text-primary-2 transition-colors"
                    >
                        Clients
                    </button>
                    <span className="text-neutral-4">•</span>
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-xs font-medium font-poppins text-primary-1 hover:text-primary-2 transition-colors"
                    >
                        Paramètres
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;