import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import { Trash2, AlertCircle, UserCheck } from 'lucide-react';
import { useToast } from './ui/ToastProvider';
import { toFrenchUserMessage } from '../utils/apiMessagesFr';

/**
 * DeleteConfirmModal
 *
 * @param {boolean}  isOpen      - Affiche ou masque le modal
 * @param {Function} onConfirm   - Appelé quand l'utilisateur confirme la suppression
 * @param {Function} onCancel    - Appelé quand l'utilisateur annule
 * @param {string}   [title]         - Titre du modal (optionnel)
 * @param {string}   [message]       - Message de confirmation (optionnel)
 * @param {string}   [confirmLabel]  - Libellé du bouton de confirmation (défaut : Supprimer)
 * @param {string}   [successMessage] - Toast après succès de onConfirm (défaut : message suppression)
 * @param {boolean}  [suppressSuccessToast] - Si true, pas de toast après onConfirm (ex. suppression locale UI)
 * @param {'danger'|'primary'} [confirmVariant] - Style du bouton / icône (défaut : danger)
 * @param {string}   [mode]          - 'confirm' | 'error'
 *
 * onConfirm peut être async : en cas d'échec, levez throw new Error("message")
 * pour afficher ce texte dans le toast d'erreur (sinon message générique).
 * Après une erreur, onCancel() est appelé pour réinitialiser isOpen côté parent
 * (sinon le modal ne peut plus se rouvrir tant que isOpen reste true).
 */
const DeleteConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Confirmer la suppression',
    message = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
    confirmLabel = 'Supprimer',
    successMessage = 'Élément supprimé avec succès.',
    suppressSuccessToast = false,
    confirmVariant = 'danger',
    mode = 'confirm',
}) => {
    const [visible, setVisible] = useState(false);      // contrôle le mount
    const [isClosing, setIsClosing] = useState(false);  // déclenche l'anim de sortie
    const [isLoading, setIsLoading] = useState(false);  // spinner post-confirm
    const { toast } = useToast();

    const ANIM_DURATION = 200; // ms — doit correspondre à la CSS

    // Ouverture
    useEffect(() => {
        if (isOpen) {
            setIsLoading(false);
            setIsClosing(false);
            setVisible(true);
        } else {
            // Réinitialisation quand le parent ferme sans confirmation
            if (visible && !isLoading) triggerClose();
        }
    }, [isOpen]);

    // Anime la sortie puis démonte
    const triggerClose = useCallback((callback) => {
        setIsClosing(true);
        setTimeout(() => {
            setVisible(false);
            setIsClosing(false);
            callback?.();
        }, ANIM_DURATION);
    }, []);

    const handleCancel = () => {
        triggerClose(onCancel);
    };

    const handleConfirm = () => {
        setIsClosing(true);
        setTimeout(async () => {
            setIsClosing(false);
            setVisible(false);
            setIsLoading(true);
            const fallbackError =
                'Une erreur est survenue. Veuillez réessayer.';
            try {
                await onConfirm();
                if (!suppressSuccessToast) {
                    toast.success(successMessage);
                }
            } catch (err) {
                const raw =
                    err instanceof Error && err.message?.trim()
                        ? err.message.trim()
                        : '';
                toast.error(
                    raw
                        ? toFrenchUserMessage(raw, fallbackError)
                        : fallbackError,
                );
                onCancel?.();
            } finally {
                setIsLoading(false);
            }
        }, ANIM_DURATION);
    };

    const isError = mode === 'error';
    const isPrimary = !isError && confirmVariant === 'primary';

    return ReactDOM.createPortal(
        <>
            {/* ── Modal ── */}
            {visible && (
                <>
                    <div
                        className={`fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 backdrop-blur-sm z-40
                            ${isClosing ? 'anim-overlay-out' : 'anim-overlay-in'}`}
                        onClick={handleCancel}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className={`
                                bg-neutral-0 dark:bg-neutral-0
                                border border-neutral-4 dark:border-neutral-4
                                rounded-md shadow-xl
                                w-full max-w-sm
                                flex flex-col items-center gap-5 p-6
                                ${isClosing ? 'anim-modal-out' : 'anim-modal-in'}
                            `}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0
                                ${isError ? 'bg-warning-2' : isPrimary ? 'bg-success-2' : 'bg-danger-2'}
                            `}>
                                {isError ? (
                                    <AlertCircle size={24} className="text-warning-1" />
                                ) : isPrimary ? (
                                    <UserCheck size={24} className="text-success-1" />
                                ) : (
                                    <Trash2 size={24} className="text-danger-1" />
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5 text-center">
                                <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                    {title}
                                </h2>
                                <p className="text-xs font-poppins text-neutral-6 leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                                {isError ? (
                                    <Button variant="ghost" size="normal" onClick={handleCancel} className="flex-1">
                                        Fermer
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="ghost" size="normal" onClick={handleCancel} className="flex-1">
                                            Annuler
                                        </Button>
                                        <Button
                                            variant={isPrimary ? 'primary' : 'danger'}
                                            size="normal"
                                            onClick={handleConfirm}
                                            className="flex-1"
                                        >
                                            {confirmLabel}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Loading overlay (post-confirmation) ── */}
            {isLoading && (
                <div className="fixed inset-0 bg-neutral-8/30 dark:bg-neutral-2/50 backdrop-blur-sm z-50
                    flex items-center justify-center anim-overlay-in">
                    <div
                        className={`w-12 h-12 rounded-full border-4 border-neutral-4 spinner ${
                            isPrimary ? 'border-t-primary-1' : 'border-t-danger-1'
                        }`}
                    />
                </div>
            )}

            <style>{`
                /* ── Entrée ── */
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.94) translateY(10px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }

                /* ── Sortie ── */
                @keyframes overlayOut {
                    from { opacity: 1; }
                    to   { opacity: 0; }
                }
                @keyframes modalOut {
                    from { opacity: 1; transform: scale(1)    translateY(0);    }
                    to   { opacity: 0; transform: scale(0.94) translateY(10px); }
                }

                /* ── Spinner ── */
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .anim-overlay-in  { animation: overlayIn  ${ANIM_DURATION}ms ease-out forwards; }
                .anim-overlay-out { animation: overlayOut ${ANIM_DURATION}ms ease-in  forwards; }
                .anim-modal-in    { animation: modalIn    ${ANIM_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .anim-modal-out   { animation: modalOut   ${ANIM_DURATION}ms ease-in  forwards; }
                .spinner          { animation: spin 0.7s linear infinite; }
            `}</style>
        </>,
        document.body
    );
};

export default DeleteConfirmModal;