import React from 'react';
import { MessageCircle, Facebook, Instagram, MessageSquare, Mail } from 'lucide-react';

export const CHANNEL_CONFIG = {
    WhatsApp: { color: 'bg-warning-2 text-primary-1', icon: <MessageCircle size={12} />, people: 3200 },
    Facebook: { color: 'bg-primary-5 text-primary-1', icon: <Facebook size={12} />, people: 8500 },
    Instagram: { color: 'bg-neutral-3 text-neutral-6', icon: <Instagram size={12} />, people: 6100 },
    SMS: { color: 'bg-warning-2 text-warning-1', icon: <MessageSquare size={12} />, people: 4800 },
    Email: { color: 'bg-primary-5 text-primary-1', icon: <Mail size={12} />, people: 2100 },
};

const AdChannelBadge = ({ channel, size = 'normal' }) => {
    const config = CHANNEL_CONFIG[channel];
    if (!config) return null;

    return (
        <span className={`
            inline-flex items-center gap-1 rounded-full font-semibold font-poppins whitespace-nowrap
            ${config.color}
            ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'}
        `}>
            {config.icon}
            {channel}
        </span>
    );
};

export default AdChannelBadge;