import React from 'react';

const Button = ({
    variant = 'primary',   // primary, secondary, outline, ghost, danger
    size = 'normal',       // sm, normal, large
    icon,
    iconPosition = 'left',
    children,
    loading = false,
    disabled = false,
    title = '',
    className = '',
    ...props
}) => {

    const base = 'font-poppins select-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        // Bleu ciel — action principale
        primary: 'bg-primary-1 text-white hover:bg-primary-6 shadow-sm hover:shadow-md',
        // Violet — action secondaire
        secondary: 'bg-secondary-1 text-white hover:bg-secondary-6 shadow-sm hover:shadow-md',
        // Contour bleu ciel
        outline: 'bg-transparent text-primary-1 border border-primary-1 hover:bg-primary-5',
        // Contour violet
        outlineSecondary: 'bg-transparent text-secondary-1 border border-secondary-1 hover:bg-secondary-5',
        // Neutre — action tertiaire
        ghost: 'bg-neutral-3 text-neutral-8 hover:bg-neutral-4',
        // Destructive
        danger: 'bg-danger-1 text-white hover:opacity-90',
        // Danger outline
        dangerOutline: 'bg-transparent text-danger-1 border border-danger-1 hover:bg-danger-2',
    };

    const sizes = {
        sm: 'px-4 py-1.5 rounded-full text-xs',
        normal: 'px-6 py-2 rounded-full text-small',
        large: 'px-8 py-3 rounded-full text-small',
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            title={title}
            {...props}
        >
            {/* Spinner si loading */}
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            )}

            {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
            {children}
            {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
        </button>
    );
};

export default Button;