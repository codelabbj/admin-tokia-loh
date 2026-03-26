import React from 'react';
import { Package, Star, XCircle, ChevronRight } from 'lucide-react';

/**
 * Étapes backend
 */
const STEPS = [
    { status: 'in_progress', label: 'En cours', icon: Package },
    { status: 'delivered', label: 'Livrée', icon: Star },
];

/**
 * Calcul du progrès (%)
 */
const getProgress = (status) => {
    if (status === 'delivered') return 100;
    if (status === 'in_progress') return 50;
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

    return (
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
                            onClick={() => onStatusChange?.(nextStep.status)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-1 text-white text-xs font-semibold font-poppins hover:bg-primary-6 transition-all duration-200 hover:scale-105"
                        >
                            Passer à : {nextStep.label}
                            <ChevronRight size={14} />
                        </button>
                    )}

                    <button
                        onClick={() => onStatusChange?.('canceled')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-danger-1 text-danger-1 text-xs font-semibold font-poppins hover:bg-danger-2 transition-all duration-200 hover:scale-105"
                    >
                        <XCircle size={14} />
                        Annuler
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderStatusStepper;