import React from 'react';
import { Package, Star, XCircle } from 'lucide-react';

/**
 * STATUS_CONFIG — aligné strictement avec API v3
*/
export const STATUS_CONFIG = {
    in_progress: {
        label: 'En cours',
        color: 'bg-primary-5 text-primary-1',
    },
    delivered: {
        label: 'Livrée',
        color: 'bg-success-2 text-success-1',
    },
    canceled: {
        label: 'Annulée',
        color: 'bg-danger-2 text-danger-1',
    },
};

/**
 * STATUS_ICON — mapping des icônes
 */
export const STATUS_ICON = {
    in_progress: Package,
    delivered: Star,
    canceled: XCircle,
};

/**
 * Helper pour récupérer config + icône
 */
export const getStatusConfig = (status) => {
    return {
        config: STATUS_CONFIG[status],
        Icon: STATUS_ICON[status],
    };
};

/**
 * OrderStatusBadge — composant UI
 */
const OrderStatusBadge = ({ status }) => {
    const { config, Icon } = getStatusConfig(status);

    // Fallback si statut inconnu
    if (!config) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-poppins bg-neutral-3 text-neutral-6">
                {status ?? 'Inconnu'}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-poppins whitespace-nowrap ${config.color}`}
        >
            {Icon && <Icon size={11} />}
            {config.label}
        </span>
    );
};

export default OrderStatusBadge;