import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
    Package,
    Truck,
    Star,
    XCircle,
    ChevronRight,
    CheckCircle,
    Loader2,
} from 'lucide-react';

/**
 * Étapes backend
 */
const STEPS = [
    { status: 'in_progress', label: 'En cours', icon: Package },
    { status: 'shipping', label: 'En livraison', icon: Truck },
    { status: 'delivered', label: 'Livrée', icon: Star },
];

/**
 * Calcul du progrès (%)
 */
const getProgress = (status) => {
    if (status === 'delivered') return 100;
    if (status === 'shipping') return 66;
    if (status === 'in_progress') return 33;
    return 0;
};

const getCurrentIndex = (status) => {
    return STEPS.findIndex(step => step.status === status);
};

const OrderStatusStepper = ({ status, onStatusChange, disabled = false }) => {
    const isCanceled = status === 'canceled';
    const isDelivered = status === 'delivered';

    const activeIndex = getCurrentIndex(status);
    const nextStep = STEPS[activeIndex + 1] ?? null;
    const progress = getProgress(status);

    const [confirm, setConfirm] = useState(null);
    // confirm = { targetStatus: 'canceled' | 'shipping' | 'delivered', title, message, confirmLabel }
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    const deliverConfig = useMemo(() => {
        if (!nextStep || nextStep.status !== 'delivered') return null;
        return {
            label: 'Marquer comme livrée',
        };
    }, [nextStep]);

    const openConfirm = (targetStatus) => {
        if (disabled) return;
        if (!targetStatus) return;

        if (targetStatus === 'canceled') {
            setConfirm({
                targetStatus,
                title: 'Confirmer l’annulation',
                message:
                    'Êtes-vous sûr de vouloir annuler cette commande ? Cette action peut être irréversible.',
                confirmLabel: 'Confirmer',
            });
            setCancellationReason('');
            return;
        }

        if (targetStatus === 'shipping') {
            setConfirm({
                targetStatus,
                title: 'Passer en livraison',
                message:
                    'Êtes-vous sûr de vouloir marquer cette commande comme en cours de livraison ?',
                confirmLabel: 'Passer en livraison',
            });
            return;
        }

        if (targetStatus === 'delivered') {
            setConfirm({
                targetStatus,
                title: 'Confirmer la livraison',
                message:
                    'Êtes-vous sûr de vouloir marquer cette commande comme livrée ?',
                confirmLabel: 'Passer à livrée',
            });
        }
    };

    const closeConfirm = () => {
        if (confirmLoading) return;
        setConfirm(null);
    };

    const handleConfirm = async () => {
        if (!confirm?.targetStatus) return;
        setConfirmLoading(true);
        try {
            await onStatusChange?.(confirm.targetStatus, confirm.targetStatus === 'canceled' ? cancellationReason : undefined);
            setConfirm(null);
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <>
            {confirm &&
                ReactDOM.createPortal(
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 backdrop-blur-sm z-40"
                            onClick={closeConfirm}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                className={`
                                    bg-neutral-0 dark:bg-neutral-0
                                    border border-neutral-4 dark:border-neutral-4
                                    rounded-md shadow-xl
                                    w-full max-w-sm
                                    flex flex-col items-center gap-5 p-6
                                `}
                                onClick={(e) => e.stopPropagation()}
                                role="dialog"
                                aria-modal="true"
                                aria-label={confirm.title}
                            >
                                <div
                                    className={`
                                        w-14 h-14 rounded-full flex items-center justify-center shrink-0
                                        ${confirm.targetStatus === 'canceled' ? 'bg-danger-2' : confirm.targetStatus === 'shipping' ? 'bg-secondary-5' : 'bg-success-2'}
                                    `}
                                >
                                    {confirm.targetStatus === 'canceled' ? (
                                        <XCircle size={24} className="text-danger-1" />
                                    ) : confirm.targetStatus === 'shipping' ? (
                                        <Truck size={24} className="text-secondary-1" />
                                    ) : (
                                        <CheckCircle size={24} className="text-success-1" />
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5 text-center">
                                    <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                        {confirm.title}
                                    </h2>
                                    <p className="text-xs font-poppins text-neutral-6 leading-relaxed">
                                        {confirm.message}
                                    </p>
                                </div>

                                {/* Champ raison — uniquement pour l'annulation */}
                                {confirm.targetStatus === 'canceled' && (
                                    <div className="w-full flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                                            Raison d'annulation <span className="text-danger-1">*</span>
                                        </label>
                                        <textarea
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder="Ex : rupture de stock, erreur de commande..."
                                            rows={3}
                                            disabled={confirmLoading}
                                            className={`w-full resize-none rounded-xl border bg-neutral-2 dark:bg-neutral-2 px-3 py-2.5 text-xs font-poppins text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-5 focus:outline-none transition-colors disabled:opacity-50 ${cancellationReason.trim() ? 'border-neutral-4 dark:border-neutral-4 focus:border-danger-1' : 'border-danger-1'}`}
                                        />
                                        {!cancellationReason.trim() && (
                                            <p className="text-[11px] font-poppins text-danger-1">Ce champ est requis pour annuler la commande.</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                                    <button
                                        type="button"
                                        onClick={closeConfirm}
                                        disabled={confirmLoading}
                                        className="flex-1 px-4 py-2 rounded-full text-xs font-semibold font-poppins border border-neutral-4 dark:border-neutral-5 bg-neutral-1 dark:bg-neutral-4 hover:bg-neutral-2 dark:hover:bg-neutral-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-neutral-8 dark:text-white"
                                    >
                                        Retour
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={confirmLoading || (confirm.targetStatus === 'canceled' && !cancellationReason.trim())}
                                        className={`
                                            flex-1 px-4 py-2 rounded-full text-xs font-semibold font-poppins
                                            ${confirm.targetStatus === 'canceled'
                                                ? 'bg-danger-2 text-danger-1 hover:bg-danger-1 hover:text-white'
                                                : confirm.targetStatus === 'shipping'
                                                    ? 'bg-secondary-5 text-secondary-1 hover:bg-secondary-3 hover:text-white'
                                                    : 'bg-success-2 text-success-1 hover:bg-success-1 hover:text-white'
                                            }
                                            disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer
                                            flex items-center justify-center gap-2
                                        `}
                                    >
                                        {confirmLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : null}
                                        {confirm.confirmLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body,
                )}

            <div className="flex flex-col gap-5">

                {/* ── Cas annulé ── */}
                {isCanceled ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2 bg-danger-2">
                        <XCircle size={16} className="text-danger-1" />
                        <span className="text-xs font-semibold font-poppins text-danger-1">
                            Commande annulée
                        </span>
                    </div>
                ) : (
                    <>
                        {/* 🔥 Progress bar animée */}
                        <div className="w-full h-2 bg-neutral-3 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-1 transition-all duration-500 ease-in-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* ── Stepper ── */}
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                const isDone = index < activeIndex;
                                const isActive = index === activeIndex;

                                return (
                                    <div key={step.status} className="flex flex-col items-center gap-1">
                                        <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isDone ? 'bg-success-1 text-white scale-95' : ''}
                                        ${isActive ? 'bg-primary-1 text-white scale-110 shadow-md' : ''}
                                        ${!isDone && !isActive ? 'bg-neutral-3 text-neutral-5' : ''}
                                    `}>
                                            <Icon size={16} />
                                        </div>

                                        <span className={`
                                        text-[11px] font-poppins text-center
                                        ${isDone ? 'text-success-1 font-semibold' : ''}
                                        ${isActive ? 'text-primary-1 font-semibold' : ''}
                                        ${!isDone && !isActive ? 'text-neutral-5' : ''}
                                    `}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Actions ── */}
                {!isCanceled && !isDelivered && !disabled && (
                    <div className="flex items-center gap-3 flex-wrap">

                        {nextStep && (
                            <button
                                onClick={() => openConfirm(nextStep.status)}
                                className={`
                                flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-poppins
                                transition-all duration-200 hover:scale-105 cursor-pointer
                                ${nextStep.status === 'delivered'
                                        ? 'bg-success-2 text-success-1 hover:bg-success-1 hover:text-white cursor-pointer'
                                        : nextStep.status === 'shipping'
                                            ? 'bg-secondary-5 text-secondary-1 hover:bg-secondary-3 cursor-pointer'
                                            : 'bg-primary-1 text-white hover:bg-primary-6 hover:text-white cursor-pointer'}
                            `}
                            >
                                {nextStep.status === 'delivered' ? (
                                    <>
                                        {deliverConfig?.label ?? 'Livrer'}
                                        <Star size={14} />
                                    </>
                                ) : nextStep.status === 'shipping' ? (
                                    <>
                                        Passer en livraison
                                        <Truck size={14} />
                                    </>
                                ) : (
                                    <>
                                        Passer à : {nextStep.label}
                                        <ChevronRight size={14} />
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => openConfirm('canceled')}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-danger-1 text-danger-1 cursor-pointer text-xs font-semibold font-poppins hover:bg-danger-2 transition-all duration-200 hover:scale-105"
                        >
                            <XCircle size={14} />
                            Annuler
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default OrderStatusStepper;