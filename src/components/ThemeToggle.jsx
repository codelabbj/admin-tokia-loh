import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useTheme from '../hooks/useTheme';
const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={`
                flex items-center justify-center w-9 h-9 rounded-full
                bg-neutral-3 dark:bg-neutral-8
                text-neutral-7 dark:text-neutral-3
                hover:bg-primary-5 dark:hover:bg-primary-5
                hover:text-primary-1
                transition-all duration-200 cursor-pointer
                ${className}
            `}
        >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
};

export default ThemeToggle;