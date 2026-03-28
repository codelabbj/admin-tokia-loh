import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/*
  Props :
  - title    : string       — libellé de la stat
  - value    : string       — valeur affichée (ex: "142" ou "58 000 F")
  - icon     : ReactNode    — icône lucide
  - caption  : string       — texte d’aide sous la valeur (optionnel)
  - trend    : 'up' | 'down' | 'neutral'  (optionnel)
  - trendLabel : string     — ex: "+12% ce mois" (optionnel)
  - color    : 'primary' | 'secondary' (défaut: primary)
*/

const colorMap = {
    primary: { icon: 'bg-primary-5 text-primary-1', trend: 'text-primary-1' },
    secondary: { icon: 'bg-secondary-5 text-secondary-1', trend: 'text-secondary-1' },
    success: { icon: 'bg-success-2 text-success-1', trend: 'text-success-1' },
    warning: { icon: 'bg-warning-2 text-warning-1', trend: 'text-warning-1' },
    danger: { icon: 'bg-danger-2 text-danger-1', trend: 'text-danger-1' },
};

const trendIcon = {
    up: <TrendingUp size={13} />,
    down: <TrendingDown size={13} />,
    neutral: <Minus size={13} />,
};

const trendColor = {
    up: 'text-success-1',
    down: 'text-danger-1',
    neutral: 'text-neutral-6',
};

const StatCard = ({
    title,
    value,
    icon,
    caption,
    trend,
    trendLabel,
    color = 'primary',
}) => {
    const colors = colorMap[color] ?? colorMap.primary;

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 p-5 flex flex-col gap-4
            hover:shadow-md transition-shadow duration-200
        ">
            {/* Icône + titre */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-poppins text-neutral-6 dark:text-neutral-6 uppercase tracking-wide">
                    {title}
                </span>
                <div className={`w-9 h-9 rounded-2 flex items-center justify-center shrink-0 ${colors.icon}`}>
                    {icon}
                </div>
            </div>

            {/* Valeur */}
            <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between gap-2">
                    <span className="text-h4 font-bold font-poppins text-neutral-8 dark:text-neutral-8 leading-none">
                        {value}
                    </span>

                    {trend && trendLabel && (
                        <span className={`flex items-center gap-1 text-xs font-medium font-poppins shrink-0 ${trendColor[trend]}`}>
                            {trendIcon[trend]}
                            {trendLabel}
                        </span>
                    )}
                </div>
                {caption && (
                    <p className="text-[11px] font-poppins text-neutral-5 dark:text-neutral-5 leading-snug">
                        {caption}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;