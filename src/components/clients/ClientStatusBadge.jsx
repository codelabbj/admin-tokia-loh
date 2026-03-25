import React from 'react';
import { CheckCircle, PauseCircle, Ban } from 'lucide-react';

export const CLIENT_STATUS_CONFIG = {
    'Actif': { color: 'bg-success-2 text-success-1', icon: <CheckCircle size={11} /> },
    'Désactivé': { color: 'bg-warning-2 text-warning-1', icon: <PauseCircle size={11} /> },
    'Bloqué': { color: 'bg-danger-2 text-danger-1', icon: <Ban size={11} /> },
};

const ClientStatusBadge = ({ status }) => {
    const config = CLIENT_STATUS_CONFIG[status];
    if (!config) return null;

    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
            text-[11px] font-semibold font-poppins whitespace-nowrap
            ${config.color}
        `}>
            {config.icon}
            {status}
        </span>
    );
};

export default ClientStatusBadge;