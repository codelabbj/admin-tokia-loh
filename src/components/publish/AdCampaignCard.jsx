import React, { useState } from 'react';
import {
    Pencil, Trash2, Copy, Pause, Play,
    Calendar, Wallet, Users, Eye, X
} from 'lucide-react';
import AdChannelBadge from './AdChannelBadge';
import { STATUS_LABEL, STATUS_CONFIG } from '../../constants/pubStatus';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

// Aperçu message stylisé WhatsApp
const WhatsAppPreview = ({ message, title, onClose }) => (
    <>
        <div className="fixed inset-0 bg-neutral-8/40 z-40 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-0 rounded-3 shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#075E54]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                            <span className="text-white text-xs font-bold font-poppins">TL</span>
                        </div>
                        <div>
                            <p className="text-white text-xs font-semibold font-poppins">Tokia-Loh</p>
                            <p className="text-[10px] text-[#8edbcf]">en ligne</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white opacity-70 hover:opacity-100 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
                <div className="bg-[#ECE5DD] dark:bg-[#0d1418] px-4 py-5 min-h-45">
                    <div className="bg-white dark:bg-[#1f2c34] rounded-2 rounded-tl-none px-3 py-2 max-w-[85%] shadow-sm">
                        {title && (
                            <p className="text-[11px] font-semibold font-poppins text-[#075E54] mb-1">
                                🛍️ {title}
                            </p>
                        )}
                        <p className="text-xs font-poppins text-neutral-8 whitespace-pre-wrap leading-relaxed">
                            {message || 'Votre message apparaîtra ici...'}
                        </p>
                        <p className="text-[10px] text-neutral-5 text-right mt-1">
                            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </p>
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-neutral-4">
                    <p className="text-[11px] font-poppins text-neutral-5 text-center">Aperçu du message WhatsApp</p>
                </div>
            </div>
        </div>
    </>
);

const AdCampaignCard = ({ campaign, onEdit, onDelete, onDuplicate, onTogglePause }) => {
    const [showPreview, setShowPreview] = useState(false);

    // Normalisation : status API → label UI
    const statusLabel = STATUS_LABEL[campaign.status] ?? 'Brouillon';
    const statusConf = STATUS_CONFIG[statusLabel] ?? STATUS_CONFIG['Brouillon'];
    const isActive = campaign.status === 'ongoing';
    const isEnded = campaign.status === 'ended';

    const channels = campaign.social_media ?? [];
    const hasWhatsApp = channels.includes('WhatsApp');

    return (
        <>
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 flex flex-col overflow-hidden
                hover:shadow-md transition-shadow duration-200
            ">
                {/* Image ou bande couleur */}
                {campaign.image ? (
                    <div className="h-28 overflow-hidden">
                        <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                ) : (
                    <div className="h-2 w-full bg-primary-1" />
                )}

                {/* Corps */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Titre + statut */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8 leading-tight">
                            {campaign.title}
                        </h3>
                        <span className={`
                            inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                            text-[11px] font-semibold font-poppins whitespace-nowrap shrink-0
                            ${statusConf.color}
                        `}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                            {statusLabel}
                        </span>
                    </div>

                    {/* Contenu tronqué */}
                    <p className="text-[11px] font-poppins text-neutral-6 leading-relaxed line-clamp-2">
                        {campaign.content}
                    </p>

                    {/* Canaux */}
                    {channels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {channels.map(ch => (
                                <AdChannelBadge key={ch} channel={ch} size="sm" />
                            ))}
                        </div>
                    )}

                    {/* Métriques */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-neutral-5">
                                <Wallet size={11} />
                                <span className="text-[10px] font-poppins">Budget</span>
                            </div>
                            <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                {campaign.budget && Number(campaign.budget) > 0
                                    ? formatPrice(campaign.budget)
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-neutral-5">
                                <Users size={11} />
                                <span className="text-[10px] font-poppins">Personnes</span>
                            </div>
                            <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                {campaign.people ? campaign.people.toLocaleString('fr-FR') : '—'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-neutral-5">
                                <Calendar size={11} />
                                <span className="text-[10px] font-poppins">Fin</span>
                            </div>
                            <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                {campaign.end_date
                                    ? new Date(campaign.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                    {hasWhatsApp ? (
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-1 text-[11px] font-poppins font-medium text-[#16a34a] hover:underline cursor-pointer"
                        >
                            <Eye size={12} />
                            Aperçu
                        </button>
                    ) : <span />}

                    <div className="flex items-center gap-1">
                        {!isEnded && (
                            <button
                                onClick={() => onTogglePause?.(campaign)}
                                title={isActive ? 'Mettre en pause' : 'Activer'}
                                className={`w-7 h-7 flex items-center justify-center rounded-2 transition-colors cursor-pointer
                                    ${isActive
                                        ? 'text-neutral-6 hover:bg-warning-2 hover:text-warning-1'
                                        : 'text-neutral-6 hover:bg-success-2 hover:text-success-1'
                                    }`}
                            >
                                {isActive ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                        )}
                        <button
                            onClick={() => onEdit?.(campaign)}
                            title="Modifier"
                            className="w-7 h-7 flex items-center justify-center rounded-2 text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors cursor-pointer"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => onDuplicate?.(campaign)}
                            title="Dupliquer"
                            className="w-7 h-7 flex items-center justify-center rounded-2 text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                        >
                            <Copy size={13} />
                        </button>
                        <button
                            onClick={() => onDelete?.(campaign)}
                            title="Supprimer"
                            className="w-7 h-7 flex items-center justify-center rounded-2 text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {showPreview && (
                <WhatsAppPreview
                    message={campaign.content}
                    title={campaign.title}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
};

export default AdCampaignCard;