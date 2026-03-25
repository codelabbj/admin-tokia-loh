import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const FILTERS = [
    { key: 'week', label: '7 jours' },
    { key: 'month', label: '30 jours' },
];

const METRICS = [
    { key: 'orders', label: 'Commandes', color: '#0EA5E9' },
    { key: 'revenue', label: "Chiffre d'affaires", color: '#8B5CF6' },
];

const CustomTooltip = ({ active, payload, label, metric }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value;
    return (
        <div className="bg-neutral-0 border border-neutral-4 rounded-4 px-3 py-2 shadow-md">
            <p className="text-[11px] font-semibold font-poppins text-neutral-6 mb-1">{label}</p>
            <p className="text-xs font-bold font-poppins text-neutral-8">
                {metric === 'revenue'
                    ? `${Number(val).toLocaleString('fr-FR')} F`
                    : `${val} commandes`}
            </p>
        </div>
    );
};

/*
  Props :
  - data : tableau issu de stats.sales_chart
    [{ date, revenue, orders }]
*/
const SalesChart = ({ data = [] }) => {
    const [filter, setFilter] = useState('week');
    const [metric, setMetric] = useState('orders');

    const activeMetric = METRICS.find(m => m.key === metric);

    // Filtre les données selon la période sélectionnée + formate le label
    const chartData = useMemo(() => {
        const now = new Date();
        const days = filter === 'week' ? 7 : 30;
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() - days);

        return data
            .filter(d => new Date(d.date) >= cutoff)
            .map(d => ({
                ...d,
                label: new Date(d.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: filter === 'week' ? 'short' : '2-digit',
                }),
            }));
    }, [data, filter]);

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 p-5 flex flex-col gap-5
        ">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                    Évolution des ventes
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Métrique */}
                    <div className="flex items-center gap-1 bg-neutral-3 dark:bg-neutral-3 rounded-full p-0.5">
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMetric(m.key)}
                                className={`
                                    px-3 py-1 rounded-full text-[11px] font-semibold font-poppins
                                    transition-all duration-200 cursor-pointer
                                    ${metric === m.key
                                        ? 'bg-neutral-0 dark:bg-neutral-2 text-neutral-8 shadow-sm'
                                        : 'text-neutral-6 hover:text-neutral-8'
                                    }
                                `}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    {/* Période */}
                    <div className="flex items-center gap-1 bg-neutral-3 dark:bg-neutral-3 rounded-full p-0.5">
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`
                                    px-3 py-1 rounded-full text-[11px] font-semibold font-poppins
                                    transition-all duration-200 cursor-pointer
                                    ${filter === f.key
                                        ? 'bg-primary-1 text-neutral-0 shadow-sm'
                                        : 'text-neutral-6 hover:text-neutral-8'
                                    }
                                `}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-55 flex items-center justify-center">
                    <p className="text-xs font-poppins text-neutral-5">Aucune donnée disponible</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-4)" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fontFamily: 'Poppins', fill: 'var(--color-neutral-6)' }}
                            axisLine={false} tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fontFamily: 'Poppins', fill: 'var(--color-neutral-6)' }}
                            axisLine={false} tickLine={false}
                            tickFormatter={v => metric === 'revenue' ? `${(v / 1000).toFixed(0)}k` : v}
                        />
                        <Tooltip content={<CustomTooltip metric={metric} />} />
                        <Area
                            type="monotone"
                            dataKey={metric}
                            stroke={activeMetric.color}
                            strokeWidth={2.5}
                            fill="url(#colorGradient)"
                            dot={{ r: 4, fill: activeMetric.color, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: activeMetric.color, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default SalesChart;