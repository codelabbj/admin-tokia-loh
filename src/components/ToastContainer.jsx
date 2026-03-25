import React from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Config par type ──────────────────────────────────────────────
const TOAST_CONFIG = {
    success: {
        icon: CheckCircle,
        containerClass: 'bg-neutral-0 dark:bg-neutral-0 border-success-1',
        iconClass: 'text-success-1',
        textClass: 'text-neutral-8',
    },
    error: {
        icon: XCircle,
        containerClass: 'bg-neutral-0 dark:bg-neutral-0 border-danger-1',
        iconClass: 'text-danger-1',
        textClass: 'text-neutral-8',
    },
    warning: {
        icon: AlertTriangle,
        containerClass: 'bg-neutral-0 dark:bg-neutral-0 border-warning-1',
        iconClass: 'text-warning-1',
        textClass: 'text-neutral-8',
    },
    info: {
        icon: Info,
        containerClass: 'bg-neutral-0 dark:bg-neutral-0 border-primary-1',
        iconClass: 'text-primary-1',
        textClass: 'text-neutral-8',
    },
};

// ── Toast individuel ─────────────────────────────────────────────
const Toast = ({ id, message, type = 'success', onRemove }) => {
    const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.success;
    const Icon = config.icon;

    return (
        <div className={`
            flex items-start gap-3 px-4 py-3
            border rounded-2 shadow-lg
            w-full max-w-xs
            animate-toast-in
            font-poppins
            ${config.containerClass}
        `}>
            <Icon size={16} className={`shrink-0 mt-0.5 ${config.iconClass}`} />

            <p className={`text-xs flex-1 leading-relaxed ${config.textClass}`}>
                {message}
            </p>

            <button
                onClick={() => onRemove(id)}
                className={`shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${config.iconClass}`}
            >
                <X size={14} />
            </button>
        </div>
    );
};

// ── ToastContainer ───────────────────────────────────────────────
const ToastContainer = ({ toasts, removeToast }) => {
    if (!toasts.length) return null;

    return ReactDOM.createPortal(
        <>
            <div className="fixed bottom-5 left-5 z-9999 flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onRemove={removeToast} />
                ))}
            </div>

            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
                .animate-toast-in {
                    animation: toast-in 0.2s ease-out;
                }
            `}</style>
        </>,
        document.body
    );
};

export default ToastContainer;