import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const QUICK_FILTERS = [
    { key: 'all', label: 'Tous' },
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
];

/*
  Props :
  - activeFilter  : string
  - startDate     : string  — YYYY-MM-DD, contrôlé par le parent après application
  - endDate       : string  — YYYY-MM-DD, contrôlé par le parent après application
  - onQuickFilter : (key) => void
  - onApplyDates  : (startDate, endDate) => void  — YYYY-MM-DD, appelé au clic "Appliquer"
*/
const DateRangeFilter = ({ activeFilter, startDate = '', endDate = '', onQuickFilter, onApplyDates }) => {
    // État local pour la saisie — initialisé depuis les props (valeurs appliquées)
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    // Sync si le parent réinitialise les dates (ex: filtre rapide)
    useEffect(() => { setStart(startDate); }, [startDate]);
    useEffect(() => { setEnd(endDate); }, [endDate]);

    const canApply = start && end;

    const handleApply = () => {
        if (!canApply) return;
        onApplyDates?.(start, end);
    };

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                Filtrer par date :
            </span>

            {/* Inputs date + bouton Appliquer */}
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="
                        px-3 py-2 text-xs font-poppins
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-5 dark:border-neutral-5
                        rounded-2 text-neutral-8 dark:text-neutral-8
                        outline-none cursor-pointer
                        focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                        transition-all duration-200
                    "
                />
                <span className="text-xs text-neutral-6 dark:text-neutral-6">à</span>
                <input
                    type="date"
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="
                        px-3 py-2 text-xs font-poppins
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-5 dark:border-neutral-5
                        rounded-2 text-neutral-8 dark:text-neutral-8
                        outline-none cursor-pointer
                        focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                        transition-all duration-200
                    "
                />

                <button
                    onClick={handleApply}
                    disabled={!canApply}
                    className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-2
                        text-xs font-semibold font-poppins
                        transition-all duration-200
                        ${canApply
                            ? 'bg-primary-1 text-white hover:bg-primary-2 cursor-pointer'
                            : 'bg-neutral-3 text-neutral-5 cursor-not-allowed'
                        }
                    `}
                >
                    <Search size={12} />
                    Appliquer
                </button>
            </div>

            {/* Filtres rapides */}
            <div className="flex items-center gap-1 bg-neutral-3 dark:bg-neutral-3 rounded-full p-0.5">
                {QUICK_FILTERS.map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => onQuickFilter(filter.key)}
                        className={`
                            px-4 py-2 rounded-full text-xs font-semibold font-poppins
                            transition-all duration-200 cursor-pointer
                            ${activeFilter === filter.key
                                ? 'bg-primary-1 text-neutral-0 shadow-sm'
                                : 'text-neutral-6 dark:text-neutral-6 hover:text-neutral-8 dark:hover:text-neutral-8'
                            }
                        `}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DateRangeFilter;