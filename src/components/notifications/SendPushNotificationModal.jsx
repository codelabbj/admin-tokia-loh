import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Send, Users, User, X, Search, Loader2, BellRing, CheckCircle2, AlertTriangle, BellOff } from 'lucide-react';
import Button from '../Button';
import InputField from '../InputField';
import { notificationsAPI } from '../../api/notifications.api';
import { clientsAPI } from '../../api/client.api';
import { useToast } from '../ui/ToastProvider';
import { getBackendErrorMessage } from '../../utils/apiErrorResponse';

const ANIM_DURATION = 200;

const MAX_TITLE = 100;
const MAX_BODY = 300;

/**
 * SendPushNotificationModal
 *
 * Modal permettant à l'admin d'envoyer une notification push FCM :
 *   - à tous les clients actifs  (mode « broadcast »)
 *   - à une sélection de clients (mode « ciblé »)
 *
 * Props :
 *   isOpen         {boolean}  — affiche / masque le modal
 *   onClose        {Function} — callback de fermeture
 *   initialClients {Array}    — clients pré-sélectionnés ({ id, first_name, last_name, phone }).
 *                               Si fourni, le modal s'ouvre directement en mode « ciblé ».
 */
const SendPushNotificationModal = ({ isOpen, onClose, initialClients = [] }) => {
    const { toast } = useToast();

    // ── Animations ────────────────────────────────────────────────────────────
    const [visible, setVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            setVisible(true);
            if (initialClients.length > 0) {
                setMode('targeted');
                setSelectedClients(initialClients);
            }
        } else {
            triggerClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // ── Statut FCM (config backend + nb de clients joignables) ───────────────
    const [pushStatus, setPushStatus] = useState(null); // { configured, reachable_clients }

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        notificationsAPI.pushStatus()
            .then(({ data }) => { if (!cancelled) setPushStatus(data?.data ?? null); })
            .catch(() => { if (!cancelled) setPushStatus(null); });
        return () => { cancelled = true; };
    }, [isOpen]);

    const triggerClose = useCallback((cb) => {
        if (!visible) return;
        setIsClosing(true);
        setTimeout(() => {
            setVisible(false);
            setIsClosing(false);
            cb?.();
        }, ANIM_DURATION);
    }, [visible]);

    const handleClose = () => triggerClose(onClose);

    // ── Form state ────────────────────────────────────────────────────────────
    const [mode, setMode] = useState('all'); // 'all' | 'targeted'
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null); // résultat après envoi

    // ── Recherche clients ─────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedClients, setSelectedClients] = useState([]); // [{ id, first_name, last_name, phone }]

    // Debounce search
    useEffect(() => {
        if (mode !== 'targeted') return;
        if (!search.trim()) { setSearchResults([]); return; }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await clientsAPI.list({ search: search.trim(), page_size: 8 });
                const rows = data?.data ?? data?.results?.data ?? data?.results ?? [];
                setSearchResults(rows);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [search, mode]);

    const addClient = (client) => {
        if (!selectedClients.find(c => c.id === client.id)) {
            setSelectedClients(prev => [...prev, client]);
        }
        setSearch('');
        setSearchResults([]);
    };

    const removeClient = (id) => {
        setSelectedClients(prev => prev.filter(c => c.id !== id));
    };

    // ── Reset à la fermeture ──────────────────────────────────────────────────
    useEffect(() => {
        if (!visible) {
            // délai pour éviter le flash de contenu réinitialisé pendant l'anim de sortie
            const t = setTimeout(() => {
                setTitle('');
                setBody('');
                setErrors({});
                setMode('all');
                setSearch('');
                setSearchResults([]);
                setSelectedClients([]);
                setResult(null);
            }, ANIM_DURATION + 50);
            return () => clearTimeout(t);
        }
    }, [visible]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = 'Le titre est requis.';
        else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} caractères.`;

        if (!body.trim()) e.body = 'Le message est requis.';
        else if (body.length > MAX_BODY) e.body = `Max ${MAX_BODY} caractères.`;

        if (mode === 'targeted' && selectedClients.length === 0) {
            e.clients = 'Sélectionnez au moins un client.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Envoi ─────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!validate()) return;

        setSending(true);
        try {
            const payload = {
                title: title.trim(),
                body: body.trim(),
                ...(mode === 'all'
                    ? { send_to_all: true }
                    : { client_ids: selectedClients.map(c => c.id) }),
            };

            const { data } = await notificationsAPI.sendPush(payload);
            setResult(data);
            if (data?.success) {
                toast.success(data?.message ?? 'Notification envoyée.');
            } else {
                toast.error(data?.message ?? 'Aucune notification push envoyée.');
            }
        } catch (err) {
            const msg = getBackendErrorMessage(err, 'Erreur lors de l\'envoi de la notification.');
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    if (!visible) return null;

    return ReactDOM.createPortal(
        <>
            {/* ── Overlay ── */}
            <div
                className={`fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 backdrop-blur-sm z-40
                    ${isClosing ? 'anim-push-overlay-out' : 'anim-push-overlay-in'}`}
                onClick={handleClose}
            />

            {/* ── Modal ── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className={`
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-3 dark:border-neutral-3
                        rounded-2xl shadow-2xl
                        w-full max-w-lg
                        flex flex-col
                        max-h-[90vh] overflow-hidden
                        ${isClosing ? 'anim-push-modal-out' : 'anim-push-modal-in'}
                    `}
                    onClick={e => e.stopPropagation()}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-neutral-3 dark:border-neutral-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-5 flex items-center justify-center shrink-0">
                                <BellRing size={17} className="text-primary-1" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Envoyer une notification push
                                </h2>
                                <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                                    Les destinataires verront cette notification sur leur mobile
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            aria-label="Fermer"
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-5 hover:bg-neutral-2 hover:text-neutral-8 transition-colors shrink-0 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Corps scrollable ── */}
                    <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">

                        {/* ── Statut FCM ── */}
                        {pushStatus && !pushStatus.configured && (
                            <div className="flex items-start gap-3 p-4 bg-danger-1/10 border border-danger-1/30 rounded-xl">
                                <AlertTriangle size={18} className="text-danger-1 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold font-poppins text-danger-1">
                                        Firebase n'est pas configuré sur le serveur
                                    </p>
                                    <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">
                                        Le fichier de compte de service (firebase-credentials.json) est absent.
                                        Les notifications seront enregistrées dans l'historique in-app mais aucune push ne sera délivrée.
                                    </p>
                                </div>
                            </div>
                        )}
                        {pushStatus?.configured && mode === 'all' && (
                            <p className="text-[11px] font-poppins text-neutral-5 -mt-2">
                                {pushStatus.reachable_clients} client(s) actif(s) joignable(s) par notification push.
                            </p>
                        )}

                        {/* ── Résultat post-envoi ── */}
                        {result && (() => {
                            const ok = result.success && (result.details?.sent ?? 0) > 0;
                            const partial = !result.success && (result.details?.sent ?? 0) > 0;
                            const tone = ok ? 'success' : partial ? 'warning' : 'danger';
                            const wrap = {
                                success: 'bg-success-2/50 border-success-1/30',
                                warning: 'bg-warning-1/10 border-warning-1/30',
                                danger:  'bg-danger-1/10 border-danger-1/30',
                            }[tone];
                            const text = {
                                success: 'text-success-1',
                                warning: 'text-warning-1',
                                danger:  'text-danger-1',
                            }[tone];
                            const Icon = ok ? CheckCircle2 : AlertTriangle;
                            return (
                                <div className={`flex items-start gap-3 p-4 border rounded-xl ${wrap}`}>
                                    <Icon size={18} className={`${text} shrink-0 mt-0.5`} />
                                    <div className="min-w-0">
                                        <p className={`text-xs font-semibold font-poppins ${text}`}>
                                            {result.message}
                                        </p>
                                        <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">
                                            {result.details?.sent ?? 0} envoyée(s) · {result.details?.failed ?? 0} échouée(s) · {result.details?.total_targeted ?? 0} ciblée(s)
                                            {result.details?.invalid_tokens_removed > 0 && ` · ${result.details.invalid_tokens_removed} token(s) invalide(s) supprimé(s)`}
                                        </p>
                                        {result.details?.errors?.length > 0 && (
                                            <ul className="mt-2 flex flex-col gap-0.5">
                                                {result.details.errors.slice(0, 3).map((e, i) => (
                                                    <li key={i} className="text-[11px] font-poppins text-neutral-6 truncate">— {e}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── Mode d'envoi ── */}
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold font-poppins text-neutral-8">Destinataires</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode('all'); setSelectedClients([]); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-poppins border transition-all cursor-pointer
                                        ${mode === 'all'
                                            ? 'bg-primary-1 text-white border-primary-1'
                                            : 'bg-neutral-0 text-neutral-6 border-neutral-3 hover:border-primary-1 hover:text-primary-1'
                                        }`}
                                >
                                    <Users size={13} />
                                    Tous les clients
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('targeted')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-poppins border transition-all cursor-pointer
                                        ${mode === 'targeted'
                                            ? 'bg-primary-1 text-white border-primary-1'
                                            : 'bg-neutral-0 text-neutral-6 border-neutral-3 hover:border-primary-1 hover:text-primary-1'
                                        }`}
                                >
                                    <User size={13} />
                                    Clients ciblés
                                </button>
                            </div>
                        </div>

                        {/* ── Recherche clients (mode ciblé) ── */}
                        {mode === 'targeted' && (
                            <div className="flex flex-col gap-3">
                                {/* Sélectionnés */}
                                {selectedClients.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClients.map(c => (
                                            <span
                                                key={c.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-5 text-primary-1 text-[11px] font-semibold font-poppins"
                                            >
                                                {c.first_name} {c.last_name}
                                                <button
                                                    type="button"
                                                    onClick={() => removeClient(c.id)}
                                                    aria-label={`Retirer ${c.first_name}`}
                                                    className="hover:text-danger-1 transition-colors cursor-pointer"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {errors.clients && (
                                    <p className="text-xs text-danger-1">{errors.clients}</p>
                                )}

                                {/* Recherche */}
                                <div className="relative">
                                    <InputField
                                        label="Rechercher un client"
                                        placeholder="Nom, prénom ou téléphone…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        icon={searching
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <Search size={14} />
                                        }
                                    />

                                    {/* Dropdown résultats */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-10
                                            bg-neutral-0 dark:bg-neutral-0 border border-neutral-3 dark:border-neutral-3
                                            rounded-xl shadow-lg overflow-hidden">
                                            {searchResults.map(client => {
                                                const alreadySelected = !!selectedClients.find(c => c.id === client.id);
                                                return (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        onClick={() => !alreadySelected && addClient(client)}
                                                        disabled={alreadySelected}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                                                            ${alreadySelected
                                                                ? 'opacity-40 cursor-not-allowed'
                                                                : 'hover:bg-primary-5/50 cursor-pointer'
                                                            }`}
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-primary-5 flex items-center justify-center shrink-0">
                                                            <User size={13} className="text-primary-1" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold font-poppins text-neutral-8 truncate">
                                                                {client.first_name} {client.last_name}
                                                            </p>
                                                            <p className="text-[11px] font-poppins text-neutral-5">
                                                                {client.phone}
                                                            </p>
                                                        </div>
                                                        {client.has_fcm_token === false && !alreadySelected && (
                                                            <span
                                                                title="Ce client n'a pas encore de token push (app non ouverte / connectée)"
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-2 text-warning-1 text-[10px] font-semibold font-poppins shrink-0"
                                                            >
                                                                <BellOff size={10} />
                                                                Sans push
                                                            </span>
                                                        )}
                                                        {alreadySelected && (
                                                            <CheckCircle2 size={14} className="text-primary-1 shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Titre ── */}
                        <div className="flex flex-col gap-1">
                            <InputField
                                label="Titre"
                                placeholder="Ex : Nouvelle offre disponible !"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                error={errors.title}
                                required
                            />
                            <p className={`text-[11px] font-poppins text-right
                                ${title.length > MAX_TITLE ? 'text-danger-1' : 'text-neutral-5'}`}>
                                {title.length}/{MAX_TITLE}
                            </p>
                        </div>

                        {/* ── Message ── */}
                        <div className="flex flex-col gap-1">
                            <InputField
                                label="Message"
                                type="textarea"
                                placeholder="Rédigez votre message…"
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                error={errors.body}
                                required
                            />
                            <p className={`text-[11px] font-poppins text-right
                                ${body.length > MAX_BODY ? 'text-danger-1' : 'text-neutral-5'}`}>
                                {body.length}/{MAX_BODY}
                            </p>
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-3 dark:border-neutral-3">
                        <Button variant="ghost" size="normal" onClick={handleClose} disabled={sending}>
                            Annuler
                        </Button>
                        <Button
                            variant="primary"
                            size="normal"
                            onClick={handleSend}
                            loading={sending}
                            disabled={sending}
                        >
                            <Send size={14} />
                            {mode === 'all' ? 'Envoyer à tous' : `Envoyer${selectedClients.length > 0 ? ` (${selectedClients.length})` : ''}`}
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pushOverlayIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pushOverlayOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes pushModalIn {
                    from { opacity: 0; transform: scale(0.94) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes pushModalOut {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to   { opacity: 0; transform: scale(0.94) translateY(12px); }
                }
                .anim-push-overlay-in  { animation: pushOverlayIn  ${ANIM_DURATION}ms ease-out forwards; }
                .anim-push-overlay-out { animation: pushOverlayOut ${ANIM_DURATION}ms ease-in  forwards; }
                .anim-push-modal-in    { animation: pushModalIn    ${ANIM_DURATION}ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
                .anim-push-modal-out   { animation: pushModalOut   ${ANIM_DURATION}ms ease-in  forwards; }
            `}</style>
        </>,
        document.body
    );
};

export default SendPushNotificationModal;
