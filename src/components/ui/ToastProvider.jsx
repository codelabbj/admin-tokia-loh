import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const TOAST_CONFIG = {
    success: {
        icon: CheckCircle,
        containerClass: 'bg-success-1',
        progressClass: 'bg-white/40',
    },
    error: {
        icon: XCircle,
        containerClass: 'bg-danger-1',
        progressClass: 'bg-white/40',
    },
    info: {
        icon: Info,
        containerClass: 'bg-primary-1',
        progressClass: 'bg-white/40',
    },
    warning: {
        icon: AlertTriangle,
        containerClass: 'bg-warning-1',
        progressClass: 'bg-white/40',
    },
};

const DEFAULT_DURATION = 4000;

const ToastContext = createContext(null);

const parseToastArg = (arg) => {
    if (arg == null) return { duration: DEFAULT_DURATION, onClick: undefined };
    if (typeof arg === 'number') return { duration: arg, onClick: undefined };
    if (typeof arg === 'object') {
        return {
            duration: typeof arg.duration === 'number' ? arg.duration : DEFAULT_DURATION,
            onClick: typeof arg.onClick === 'function' ? arg.onClick : undefined,
        };
    }
    return { duration: DEFAULT_DURATION, onClick: undefined };
};

const ToastItem = ({ id, type, message, duration, onClick, onRemove }) => {
    const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;
    const Icon = config.icon;
    const [visible, setVisible] = React.useState(false);
    const [leaving, setLeaving] = React.useState(false);

    React.useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    React.useEffect(() => {
        const t = setTimeout(() => {
            setLeaving(true);
            setTimeout(() => onRemove(id), 350);
        }, duration);
        return () => clearTimeout(t);
    }, [id, duration, onRemove]);

    const handleClose = (e) => {
        e?.stopPropagation?.();
        setLeaving(true);
        setTimeout(() => onRemove(id), 350);
    };

    const handleBodyClick = () => {
        if (onClick) onClick();
    };

    const isVisible = visible && !leaving;

    return (
        <div
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick ? handleBodyClick : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBodyClick();
                }
            } : undefined}
            title={onClick ? 'Cliquer pour ouvrir' : undefined}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-70 max-w-95 w-full overflow-hidden ${config.containerClass} ${onClick ? 'cursor-pointer' : ''}`}
            style={{
                transition: 'opacity 350ms ease, transform 350ms ease',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
            }}
        >
            <span className="shrink-0 text-white pointer-events-none">
                <Icon size={16} />
            </span>

            <p className={`flex-1 text-xs font-semibold font-poppins leading-snug text-white ${onClick ? 'pointer-events-none' : ''}`}>
                {message}
            </p>

            <button
                type="button"
                onClick={handleClose}
                className="shrink-0 text-white opacity-70 hover:opacity-100 transition-opacity cursor-pointer z-[1]"
            >
                <X size={14} />
            </button>

            <div
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl ${config.progressClass}`}
                style={{
                    animation: `toast-progress ${duration}ms linear forwards`,
                }}
            />
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const counterRef = useRef(0);

    const addToast = useCallback((type, message, duration = DEFAULT_DURATION, options = {}) => {
        const id = ++counterRef.current;
        const { onClick } = options;
        setToasts(prev => [...prev, { id, type, message, duration, onClick }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg, arg) => {
            const { duration, onClick } = parseToastArg(arg);
            return addToast('success', msg, duration, { onClick });
        },
        error: (msg, arg) => {
            const { duration, onClick } = parseToastArg(arg);
            return addToast('error', msg, duration, { onClick });
        },
        info: (msg, arg) => {
            const { duration, onClick } = parseToastArg(arg);
            return addToast('info', msg, duration, { onClick });
        },
        warning: (msg, arg) => {
            const { duration, onClick } = parseToastArg(arg);
            return addToast('warning', msg, duration, { onClick });
        },
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2.5 items-end pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto relative overflow-hidden">
                        <ToastItem
                            id={t.id}
                            type={t.type}
                            message={t.message}
                            duration={t.duration}
                            onClick={t.onClick}
                            onRemove={removeToast}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast doit etre utilise dans un ToastProvider');
    return ctx;
};