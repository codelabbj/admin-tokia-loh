import React, { useEffect, useRef, useState } from 'react';
import { Send, Users, UserRound, X, Search, Loader2, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { notificationsAPI } from '../api/notifications.api';
import { clientsAPI } from '../api/client.api';
import { extractClientsRows } from '../hooks/useClients';
import { useToast } from '../components/ui/ToastProvider';

const MAX_SELECTED = 50;

const PushNotificationPage = () => {
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [target, setTarget] = useState('all'); // 'all' | 'specific'
    const [selected, setSelected] = useState([]);
    const [sending, setSending] = useState(false);

    // Recherche clients
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Envoyer une notification';
    }, []);

    // Ferme le dropdown au clic extérieur
    useEffect(() => {
        const onClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const isSelected = (id) => selected.some((c) => c.id === id);

    const toggleClient = (client) => {
        if (isSelected(client.id)) {
            setSelected((prev) => prev.filter((c) => c.id !== client.id));
        } else if (selected.length < MAX_SELECTED) {
            setSelected((prev) => [...prev, client]);
        } else {
            toast.error(`Sélection limitée à ${MAX_SELECTED} clients.`);
        }
    };

    // Recherche serveur (nom/prénom/téléphone)
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const { data } = await clientsAPI.list({
                    search: q,
                    page: 1,
                    page_size: 20,
                });
                const rows = extractClientsRows(data);
                setResults(rows.filter((r) => r.id && !isSelected(r.id)));
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const handleSend = async () => {
        if (!title.trim()) {
            toast.error('Le titre est obligatoire.');
            return;
        }
        if (target === 'specific' && selected.length === 0) {
            toast.error('Sélectionnez au moins un client (ou choisissez « Tous les clients »).');
            return;
        }

        setSending(true);
        try {
            const payload = {
                title: title.trim(),
                content: content.trim(),
                client_ids: target === 'specific' ? selected.map((c) => c.id) : undefined,
            };
            const { data } = await notificationsAPI.sendPush(payload);
            if (data?.success) {
                toast.success(data.message || 'Notification envoyée avec succès.');
                setTitle('');
                setContent('');
                setSelected([]);
                setQuery('');
                setTarget('all');
            } else {
                toast.error(data?.message || "Erreur lors de l'envoi.");
            }
        } catch (err) {
            toast.error(err?.message || "Erreur lors de l'envoi de la notification.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-3xl">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Envoyer une notification
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Envoyez une notification push à tous vos clients ou à une sélection
                    </p>
                </div>
            </div>

            {/* ── Formulaire ── */}
            <div className="flex flex-col gap-5 bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-2xl p-5 sm:p-6">

                {/* Titre */}
                <InputField
                    label="Titre"
                    name="title"
                    placeholder="Ex : Nouveauté en stock !"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                {/* Message */}
                <div>
                    <label className="block text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-8 mb-1.5">
                        Message
                    </label>
                    <textarea
                        name="content"
                        rows={4}
                        placeholder="Le contenu de votre notification…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full rounded-lg border border-neutral-5 bg-neutral-1 px-4 py-2.5 text-small text-neutral-8 placeholder:text-neutral-6 font-poppins outline-none transition-all duration-200 focus:border-primary-1 focus:ring-2 focus:ring-primary-5 dark:bg-neutral-1 dark:border-neutral-5 dark:text-neutral-8"
                    />
                </div>

                {/* ── Cible ── */}
                <div>
                    <label className="block text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-8 mb-2">
                        Envoyer à
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={() => setTarget('all')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold font-poppins transition-all duration-200 cursor-pointer ${
                                target === 'all'
                                    ? 'border-primary-1 bg-primary-5 text-primary-1'
                                    : 'border-neutral-5 bg-neutral-1 text-neutral-6 hover:border-primary-1'
                            }`}
                        >
                            <Users size={15} />
                            Tous les clients
                        </button>
                        <button
                            type="button"
                            onClick={() => setTarget('specific')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold font-poppins transition-all duration-200 cursor-pointer ${
                                target === 'specific'
                                    ? 'border-primary-1 bg-primary-5 text-primary-1'
                                    : 'border-neutral-5 bg-neutral-1 text-neutral-6 hover:border-primary-1'
                            }`}
                        >
                            <UserRound size={15} />
                            Clients spécifiques
                            {selected.length > 0 && (
                                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary-1 text-white text-[10px] font-bold">
                                    {selected.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Recherche + sélection clients */}
                {target === 'specific' && (
                    <div className="flex flex-col gap-3">
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                                    onFocus={() => setDropdownOpen(true)}
                                    placeholder="Rechercher un client par nom, prénom ou téléphone…"
                                    className="w-full rounded-lg border border-neutral-5 bg-neutral-1 pl-9 pr-10 py-2.5 text-small text-neutral-8 placeholder:text-neutral-6 font-poppins outline-none transition-all duration-200 focus:border-primary-1 focus:ring-2 focus:ring-primary-5 dark:bg-neutral-1 dark:border-neutral-5 dark:text-neutral-8"
                                />
                                {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-1 animate-spin pointer-events-none" />}
                            </div>

                            {dropdownOpen && query.trim() && (
                                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-4 dark:border-neutral-4 bg-neutral-0 dark:bg-neutral-0 shadow-lg z-30">
                                    {results.length === 0 && !searching && (
                                        <p className="px-4 py-3 text-xs font-poppins text-neutral-6">
                                            Aucun client trouvé.
                                        </p>
                                    )}
                                    {results.map((client) => {
                                        const active = isSelected(client.id);
                                        return (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => toggleClient(client)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-xs font-poppins transition-colors cursor-pointer ${
                                                    active
                                                        ? 'bg-primary-5 text-primary-1'
                                                        : 'text-neutral-8 hover:bg-neutral-3 dark:hover:bg-neutral-3'
                                                }`}
                                            >
                                                <span className="truncate">
                                                    {client.first_name} {client.last_name || ''}
                                                    <span className="text-neutral-5 ml-1">{client.phone}</span>
                                                </span>
                                                {active && <CheckCircle2 size={15} className="shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Chips sélection */}
                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selected.map((client) => (
                                    <span
                                        key={client.id}
                                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-primary-5 text-primary-1 text-[11px] font-medium font-poppins"
                                    >
                                        {client.first_name} {client.last_name || ''}
                                        <button
                                            type="button"
                                            onClick={() => toggleClient(client)}
                                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-1 hover:text-white transition-colors cursor-pointer"
                                            title="Retirer"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end">
                <Button
                    variant="primary"
                    size="normal"
                    loading={sending}
                    disabled={sending}
                    onClick={handleSend}
                >
                    <Send size={15} />
                    Envoyer la notification
                </Button>
            </div>
        </div>
    );
};

export default PushNotificationPage;