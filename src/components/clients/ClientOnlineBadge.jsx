import React from 'react';

/**
 * Badge de présence client (en ligne / hors ligne).
 * Aligné sur le style de ClientStatusBadge.
 */
const ClientOnlineBadge = ({ isOnline }) => (
    <span className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-[11px] font-semibold font-poppins whitespace-nowrap
        ${isOnline ? 'bg-success-2 text-success-1' : 'bg-neutral-3 text-neutral-6'}
    `}>
        <span className={`
            w-1.5 h-1.5 rounded-full shrink-0
            ${isOnline ? 'bg-success-1 animate-pulse' : 'bg-neutral-5'}
        `} />
        {isOnline ? 'En ligne' : 'Hors ligne'}
    </span>
);

export default ClientOnlineBadge;
