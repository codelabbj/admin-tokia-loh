import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const CustomInput = React.forwardRef(({ name, required, ...inputProps }, ref) => (
    <input {...inputProps} ref={ref} name={name} required={required} />
));
CustomInput.displayName = 'CustomInput';

const PhoneInputField = ({
    label,
    name,
    value,
    onChange,
    error,
    hint,
    required = false,
    disabled = false,
    placeholder = "Entrez votre numéro",
    defaultCountry = 'CI',
    countries = ['CI', 'BJ', 'SN', 'TG', 'BF'],
    className = '',
}) => {
    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label className="text-xs font-semibold font-poppins text-neutral-8">
                    {label} {required && <span className="text-danger-1">*</span>}
                </label>
            )}

            <div className={error ? 'phone-input-error' : ''}>
                <PhoneInput
                    defaultCountry={defaultCountry}
                    countries={countries}
                    value={value}
                    onChange={onChange}
                    addInternationalOption={false}
                    placeholder={placeholder}
                    disabled={disabled}
                    inputComponent={CustomInput}
                    // Passé automatiquement à CustomInput via ...inputProps
                    name={name}
                    required={required}
                />
            </div>

            {hint && !error && <p className="text-xs text-neutral-6 font-poppins">{hint}</p>}
            {error && <p className="text-xs text-danger-1 font-poppins">{error}</p>}
        </div>
    );
};

export default PhoneInputField;