import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import Button from '../Button';

const PERIODS = [
    { key: 'day', label: "Aujourd'hui" },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
];


const ReportFilters = ({
    period,
    onPeriodChange,
    dateFrom,
    dateTo,
    onDateChange,
    onApplyDateRange,
    applyDateDisabled = false,
}) => {
    return (
        <div className="
            flex flex-wrap items-center gap-3
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 px-5 py-4
        ">
            {/* Label */}
            <div className="flex items-center gap-2 text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide shrink-0">
                <Calendar size={14} />
                Période
            </div>

            {/* Boutons période rapide */}
            <div className="flex items-center gap-1 bg-neutral-3 dark:bg-neutral-3 rounded-full p-0.5">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => onPeriodChange(p.key)}
                        className={`
                            px-4 py-1.5 rounded-full text-xs font-semibold font-poppins
                            transition-all duration-200 cursor-pointer
                            ${period === p.key
                                ? 'bg-primary-1 text-white shadow-sm'
                                : 'text-neutral-6 hover:text-neutral-8 dark:hover:text-neutral-8'
                            }
                        `}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Séparateur */}
            <div className="h-5 w-px bg-neutral-4 dark:bg-neutral-4 hidden sm:block" />

            {/* Plage de dates personnalisée */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-poppins text-neutral-6">Du</span>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => onDateChange({ from: e.target.value, to: dateTo })}
                    className="
                        px-3 py-1.5 text-xs font-poppins rounded-full
                        border border-neutral-5 dark:border-neutral-5
                        bg-neutral-0 dark:bg-neutral-0
                        text-neutral-8 dark:text-neutral-8
                        outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                        transition-all duration-200 cursor-pointer
                    "
                />
                <span className="text-xs font-poppins text-neutral-6">au</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => onDateChange({ from: dateFrom, to: e.target.value })}
                    className="
                        px-3 py-1.5 text-xs font-poppins rounded-full
                        border border-neutral-5 dark:border-neutral-5
                        bg-neutral-0 dark:bg-neutral-0
                        text-neutral-8 dark:text-neutral-8
                        outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                        transition-all duration-200 cursor-pointer
                    "
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Filter size={14} />}
                    iconPosition="left"
                    disabled={applyDateDisabled}
                    onClick={onApplyDateRange}
                    title="Appliquer la plage de dates sélectionnée"
                    className="shrink-0"
                >
                    Appliquer les dates
                </Button>
            </div>
        </div>
    );
};

export default ReportFilters;