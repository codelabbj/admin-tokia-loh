import React from 'react';
import { Star, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/*
  Props :
  - type : 'featured' | 'low-stock' | 'out-of-stock' | 'active' | 'inactive'
*/

const BADGE_CONFIG = {
    featured: {
        label: 'Vedette',
        icon: <Star size={11} />,
        class: 'bg-warning-2 text-warning-1',
    },
    'low-stock': {
        label: 'Stock faible',
        icon: <AlertTriangle size={11} />,
        class: 'bg-warning-2 text-warning-1',
    },
    'out-of-stock': {
        label: 'Rupture',
        icon: <AlertTriangle size={11} />,
        class: 'bg-danger-2 text-danger-1',
    },
    active: {
        label: 'Actif',
        icon: <CheckCircle size={11} />,
        class: 'bg-success-2 text-success-1',
    },
    inactive: {
        label: 'Inactif',
        icon: <XCircle size={11} />,
        class: 'bg-neutral-3 text-neutral-6',
    },
};

const ProductBadge = ({ type }) => {
    const config = BADGE_CONFIG[type];
    if (!config) return null;

    return (
        <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            text-[11px] font-semibold font-poppins whitespace-nowrap
            ${config.class}
        `}>
            {config.icon}
            {config.label}
        </span>
    );
};

export default ProductBadge;