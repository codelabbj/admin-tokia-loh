import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const InputField = ({
    label,
    name,
    type = 'text',
    value,
    className = '',
    onChange,
    placeholder,
    title = '',
    error,
    hint,
    required = false,
    disabled = false,
    icon,          // icône à gauche
    autoComplete,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const { onWheel: onWheelProp, ...restProps } = props;

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const baseInput = `
        w-full rounded-lg border border-neutral-5 bg-neutral-1
        px-4 py-2.5 text-small text-neutral-8
        placeholder:text-neutral-6 font-poppins
        outline-none
        transition-all duration-200
        focus:border-primary-1 focus:ring-2 focus:ring-primary-5
        disabled:bg-neutral-3 disabled:cursor-not-allowed disabled:text-neutral-6
        dark:bg-neutral-1 dark:border-neutral-5 dark:text-neutral-8
        ${error ? 'border-danger-1 focus:border-danger-1 focus:ring-danger-2' : ''}
        ${icon ? 'pl-10' : ''}
        ${isPassword ? 'pr-10' : ''}
    `;


    if (type === 'checkbox') {
        return (
            <div className={`w-full my-2 select-none ${className}`}>
                <div className="flex items-center gap-2 cursor-pointer">
                    <input
                        id={name}
                        name={name}
                        type="checkbox"
                        checked={value}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        autoComplete='off'
                        className="w-4 h-4 rounded accent-primary-1 cursor-pointer"
                    />
                    <label
                        htmlFor={name}
                        className="text-xs font-medium font-poppins text-neutral-7 cursor-pointer"
                        title={title}
                    >
                        {label}
                    </label>
                </div>
                {error && <p className="text-xs text-danger-1 mt-1">{error}</p>}
            </div>
        );
    }

    /* ── TEXTAREA ─────────────────────────────────────────── */
    if (type === 'textarea') {
        return (
            <div className={`flex flex-col gap-1.5 w-full ${className}`}>
                {label && (
                    <label className="text-xs font-semibold font-poppins text-neutral-8">
                        {label} {required && <span className="text-danger-1">*</span>}
                    </label>
                )}
                <textarea
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    rows={4}
                    className={`${baseInput} resize-none`}
                    {...props}
                />
                {hint && !error && <p className="text-xs text-neutral-6">{hint}</p>}
                {error && <p className="text-xs text-danger-1">{error}</p>}
            </div>
        );
    }

    /* ── INPUT STANDARD (text, email, password, number…) ─── */
    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label className="text-xs font-semibold font-poppins text-neutral-8">
                    {label} {required && <span className="text-danger-1">*</span>}
                </label>
            )}

            <div className="relative z-0 isolate w-full">
                {/* Icône gauche — au-dessus du calque autofill Chrome */}
                {icon && (
                    <span
                        className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 text-neutral-6 dark:text-neutral-6 [&_svg]:text-neutral-6 dark:[&_svg]:text-neutral-6"
                        aria-hidden
                    >
                        {icon}
                    </span>
                )}

                <input
                    name={name}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onWheel={(e) => {
                        if (type === 'number') {
                            // Empêche le changement de valeur involontaire à la molette.
                            e.currentTarget.blur();
                        }
                        onWheelProp?.(e);
                    }}
                    required={required}
                    disabled={disabled}
                    className={`${baseInput} relative z-0`}
                    autoComplete={autoComplete ?? 'off'}
                    {...restProps}
                />

                {/* Toggle mot de passe */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-neutral-6 hover:text-neutral-8 dark:text-neutral-6 dark:hover:text-neutral-8 transition-colors cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>

            {hint && !error && <p className="text-xs text-neutral-6">{hint}</p>}
            {error && <p className="text-xs text-danger-1">{error}</p>}
        </div>
    );
};

export default InputField;