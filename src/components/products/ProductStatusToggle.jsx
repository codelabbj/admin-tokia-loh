import React from 'react';

const ProductStatusToggle = ({ active, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!active)}
            disabled={disabled}
            title={active ? 'Désactiver' : 'Activer'}
            className={`
                relative inline-flex items-center w-10 h-5 rounded-full
                transition-colors duration-200 cursor-pointer
                focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed
                ${active ? 'bg-primary-1' : 'bg-neutral-4'}
            `}
        >
            <span className={`
                inline-block w-3.5 h-3.5 bg-white rounded-full shadow-sm
                transition-transform duration-200
                ${active ? 'translate-x-5' : 'translate-x-1'}
            `} />
        </button>
    );
};

export default ProductStatusToggle;