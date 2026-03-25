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

const ToastItem = ({ id, type, message, duration, onRemove }) => {
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

    const handleClose = () => {
        setLeaving(true);
        setTimeout(() => onRemove(id), 350);
    };

    const isVisible = visible && !leaving;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-70 max-w-95 w-full ${config.containerClass}`}
            style={{
                transition: 'opacity 350ms ease, transform 350ms ease',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
            }}
        >
            <span className="shrink-0 text-white">
                <Icon size={16} />
            </span>

            <p className="flex-1 text-xs font-semibold font-poppins leading-snug text-white">
                {message}
            </p>

            <button
                onClick={handleClose}
                className="shrink-0 text-white opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            >
                <X size={14} />
            </button>

            <div
                className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${config.progressClass}`}
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

    const addToast = useCallback((type, message, duration = DEFAULT_DURATION) => {
        const id = ++counterRef.current;
        setToasts(prev => [...prev, { id, type, message, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg, duration) => addToast('success', msg, duration),
        error: (msg, duration) => addToast('error', msg, duration),
        info: (msg, duration) => addToast('info', msg, duration),
        warning: (msg, duration) => addToast('warning', msg, duration),
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