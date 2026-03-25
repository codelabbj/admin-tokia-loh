import React from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            {/* ── Overlay ── */}
            <div
                className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 backdrop-blur-sm z-40"
                onClick={onCancel}
            />

            {/* ── Modal ── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-4 dark:border-neutral-4
                        rounded-md shadow-xl
                        w-full max-w-sm
                        flex flex-col items-center gap-5 p-6
                        animate-scale-in
                    "
                    onClick={e => e.stopPropagation()}
                >
                    {/* Icône warning */}
                    <div className="w-14 h-14 rounded-full bg-danger-2 flex items-center justify-center shrink-0">
                        <LogOut size={24} className="text-danger-1" />
                    </div>

                    {/* Texte */}
                    <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            Confirmer la déconnexion
                        </h2>
                        <p className="text-xs font-poppins text-neutral-6 leading-relaxed">
                            Êtes-vous sûr de vouloir vous déconnecter ?
                            Vous devrez vous reconnecter pour accéder à votre compte.
                        </p>
                    </div>

                    {/* Boutons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                        <Button
                            variant="ghost"
                            size="normal"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="danger"
                            size="normal"
                            onClick={onConfirm}
                            className="flex-1"
                        >
                            Se déconnecter
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1);    }
                }
                .animate-scale-in {
                    animation: scale-in 0.15s ease-out;
                }
            `}</style>
        </>,
        document.body
    );
};

export default LogoutConfirmModal;