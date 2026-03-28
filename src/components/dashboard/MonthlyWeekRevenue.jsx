import React from 'react';
import { CalendarRange } from 'lucide-react';

const BAR_COLORS = [
    'bg-primary-1',
    'bg-secondary-1',
    'bg-primary-3',
    'bg-secondary-3',
    'bg-primary-4',
    'bg-secondary-4',
];

const formatWeekLabel = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/*
  Props :
  - weeks : stats.monthly_revenue_by_week
    [{ week: ISO string, orders: number, revenue: number }]
*/
const MonthlyWeekRevenue = ({ weeks = [] }) => {
    const maxRevenue = weeks.length
        ? Math.max(...weeks.map((w) => w.revenue), 1)
        : 1;

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 p-5 flex flex-col gap-5
            hover:shadow-md transition-shadow duration-200
        ">
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2 flex items-center justify-center shrink-0 bg-secondary-5 text-secondary-1">
                    <CalendarRange size={18} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                        Chiffre d'affaires par semaine
                    </h2>
                    <p className="text-[11px] font-poppins text-neutral-5 dark:text-neutral-5 mt-0.5">
                        Découpage du mois en cours (semaines ISO)
                    </p>
                </div>
            </div>

            {weeks.length === 0 ? (
                <p className="text-xs font-poppins text-neutral-5 text-center py-6">
                    Aucune donnée pour les semaines du mois
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {weeks.map((item, index) => {
                        const pct = Math.round((item.revenue / maxRevenue) * 100);
                        return (
                            <div key={item.week ?? index} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                        Semaine du {formatWeekLabel(item.week)}
                                    </span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[11px] font-poppins text-neutral-6 whitespace-nowrap">
                                            {item.orders} cmd
                                        </span>
                                        <span className="text-xs font-bold font-poppins text-primary-1 whitespace-nowrap">
                                            {Number(item.revenue).toLocaleString('fr-FR')} F
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-3 dark:bg-neutral-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[index % BAR_COLORS.length]}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MonthlyWeekRevenue;
