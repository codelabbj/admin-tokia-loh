import React, { useState, useMemo } from 'react';
import { Search, Eye, PauseCircle, Ban, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import ClientStatusBadge, { CLIENT_STATUS_CONFIG } from './ClientStatusBadge';

// ── Helpers ───────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR');
};

// ── Sous-composants ───────────────────────────────────────────
const STATUS_TABS = ['Tous', ...Object.keys(CLIENT_STATUS_CONFIG)];

const ClientAvatar = ({ firstName, lastName }) => (
    <div className="w-8 h-8 rounded-full bg-primary-5 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold font-poppins text-primary-1">
            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
        </span>
    </div>
);

// ── Composant principal ───────────────────────────────────────
/**
 * ClientsTable
 *
 * Attend des clients dont le champ `status` a déjà été dérivé
 * via deriveStatus() dans ClientsPage (valeurs : 'Actif' | 'Désactivé' | 'Bloqué').
 *
 * Champs API utilisés :
 *   id, first_name, last_name, phone, city, joined_at, status (dérivé)
 */
const ClientsTable = ({ clients = [], onDisable, onBlock, onDelete }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('Tous');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return clients.filter(c => {
            const matchTab = activeTab === 'Tous' || c.status === activeTab;
            const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
            const matchSearch = fullName.includes(q) || (c.phone ?? '').includes(search);
            return matchTab && matchSearch;
        });
    }, [clients, search, activeTab]);

    const countByStatus = useMemo(() => {
        const map = { Tous: clients.length };
        Object.keys(CLIENT_STATUS_CONFIG).forEach(s => {
            map[s] = clients.filter(c => c.status === s).length;
        });
        return map;
    }, [clients]);

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-md overflow-hidden">

            {/* ── Recherche ── */}
            <div className="px-5 pt-4 pb-3 border-b border-neutral-4 dark:border-neutral-4">
                <div className="relative max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou téléphone…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full
                            bg-neutral-3 dark:bg-neutral-3 border border-transparent
                            text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6
                            outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0
                            focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                    />
                </div>
            </div>

            {/* ── Onglets statut ── */}
            <div className="flex items-center overflow-x-auto border-b border-neutral-4 dark:border-neutral-4">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-poppins font-medium
                            whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer
                            ${activeTab === tab
                                ? 'border-primary-1 text-primary-1'
                                : 'border-transparent text-neutral-6 hover:text-neutral-8 dark:hover:text-neutral-8'
                            }`}
                    >
                        {tab}
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                            ${activeTab === tab ? 'bg-primary-5 text-primary-1' : 'bg-neutral-3 text-neutral-6'}`}>
                            {countByStatus[tab] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Tableau ── */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['Client', 'Téléphone', 'Ville', 'Inscrit le', 'Dernière connexion', 'Statut', 'Actions'].map(col => (
                                <th key={col} className="text-left px-4 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-neutral-6 dark:text-neutral-6">
                                    Aucun client trouvé
                                </td>
                            </tr>
                        ) : filtered.map(client => (
                            <tr
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className="border-b border-neutral-4 dark:border-neutral-4 last:border-0
                                    hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                            >
                                {/* Client */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <ClientAvatar
                                            firstName={client.first_name}
                                            lastName={client.last_name}
                                        />
                                        <span className="font-semibold text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                            {client.first_name} {client.last_name}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {client.phone ?? '—'}
                                </td>

                                <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {client.city_details?.name ?? '—'}
                                </td>

                                <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {formatDate(client.joined_at)}
                                </td>

                                <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {formatDate(client.last_login)}
                                </td>

                                <td className="px-4 py-3">
                                    <ClientStatusBadge status={client.status} />
                                </td>

                                {/* Actions — stopPropagation pour ne pas déclencher la nav de ligne */}
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            title="Voir la fiche"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6
                                                hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDisable?.(client)}
                                            title={client.status === 'Désactivé' ? 'Réactiver' : 'Désactiver'}
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6
                                                hover:bg-warning-2 hover:text-warning-1 transition-colors cursor-pointer"
                                        >
                                            <PauseCircle size={14} />
                                        </button>
                                        <button
                                            onClick={() => onBlock?.(client)}
                                            title={client.status === 'Bloqué' ? 'Débloquer' : 'Bloquer'}
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6
                                                hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
                                        >
                                            <Ban size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(client)}
                                            title="Supprimer"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6
                                                hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientsTable;