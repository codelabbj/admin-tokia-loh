import React from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import { Trash2, AlertCircle } from 'lucide-react';

/**
 * DeleteConfirmModal
 *
 * @param {boolean}  isOpen      - Affiche ou masque le modal
 * @param {Function} onConfirm   - Appelé quand l'utilisateur confirme la suppression
 * @param {Function} onCancel    - Appelé quand l'utilisateur annule
 * @param {string}   [title]     - Titre du modal (optionnel)
 * @param {string}   [message]   - Message de confirmation (optionnel)
 */
const DeleteConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Confirmer la suppression',
    message = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
    mode = 'confirm', // 'confirm' | 'error'
}) => {
    if (!isOpen) return null;

    const isError = mode === 'error';

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
                    {/* Icône — change selon le mode */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0
                        ${isError ? 'bg-warning-2' : 'bg-danger-2'}
                    `}>
                        {isError
                            ? <AlertCircle size={24} className="text-warning-1" />
                            : <Trash2 size={24} className="text-danger-1" />
                        }
                    </div>

                    {/* Texte */}
                    <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {title}
                        </h2>
                        <p className="text-xs font-poppins text-neutral-6 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Boutons — seulement "Fermer" en mode error */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                        {isError ? (
                            <Button
                                variant="ghost"
                                size="normal"
                                onClick={onCancel}
                                className="flex-1"
                            >
                                Fermer
                            </Button>
                        ) : (
                            <>
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
                                    Supprimer
                                </Button>
                            </>
                        )}
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

export default DeleteConfirmModal;