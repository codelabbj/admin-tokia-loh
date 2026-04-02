import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MapPin, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useVilles } from '../hooks/useVilles';
import { useOrders, getOrderDeliveryCity } from '../hooks/useOrders';
import Button from '../components/Button';
import StatCard from '../components/dashboard/StatCard';
import VillesTable from '../components/villes/VillesTable';
import VilleFormModal from '../components/villes/VilleFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useToast } from '../components/ui/ToastProvider';

const VillesPage = () => {
    const { villes, loading, error, create, update, remove } = useVilles();
    const { orders: allOrders, loading: ordersLoading } = useOrders({
        loadAllPages: true,
    });
    const { toast } = useToast();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVille, setSelectedVille] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Villes';
    }, []);

    // ── Stats ────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = villes.length;
        const actives = villes.filter(v => v.is_active !== false).length;
        const inactives = total - actives;
        const withFee = villes.filter(v => Number(v.delivery_price) > 0);
        const avgFee = withFee.length
            ? Math.round(withFee.reduce((acc, v) => acc + Number(v.delivery_price), 0) / withFee.length)
            : 0;
        return { total, actives, inactives, avgFee };
    }, [villes]);

    const cityKeysWithOrders = useMemo(() => {
        const set = new Set();
        for (const o of allOrders) {
            const key = getOrderDeliveryCity(o).toLowerCase();
            if (key) set.add(key);
        }
        return set;
    }, [allOrders]);

    const villeHasOrders = (ville) =>
        cityKeysWithOrders.has(String(ville?.name ?? '').toLowerCase());

    // ── Handlers ────────────────────────────────────────────
    const handleCreate = () => { setSelectedVille(null); setModalOpen(true); };
    const handleEdit = (ville) => { setSelectedVille(ville); setModalOpen(true); };
    const handleClose = () => { setModalOpen(false); setSelectedVille(null); };

    const handleSave = async (formData) => {
        try {
            if (selectedVille) {
                await update(selectedVille.id, formData);
                toast.success("Ville mise à jour avec succès");
            } else {
                await create(formData);
                toast.success("Ville ajoutée avec succès");
            }
            handleClose();
        } catch (err) {
            const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.detail;

            if (errorMsg?.includes('already exists') || errorMsg?.includes('existe déjà')) {
                toast.error(`La ville "${formData.name}" existe déjà !`);
            } else {
                toast.error("Une erreur est survenue lors de l'enregistrement.");
            }
        }
    };

    const handleToggle = async (ville) => {
        await update(ville.id, { is_active: !ville.is_active });
    };

    const handleDelete = (ville) => {
        if (ordersLoading) {
            toast.error('Chargement des commandes… réessayez dans un instant.');
            return;
        }
        if (villeHasOrders(ville)) {
            toast.error(
                `Impossible de supprimer « ${ville.name} » : au moins une commande y est liée.`,
            );
            return;
        }
        setDeleteTarget(ville);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const targetName = deleteTarget.name;
        if (villeHasOrders(deleteTarget)) {
            setDeleteTarget(null);
            toast.error(
                `Impossible de supprimer « ${targetName} » : au moins une commande y est liée.`,
            );
            return;
        }
        setDeleteLoading(true);
        try {
            await remove(deleteTarget.id);
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Villes
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Gérez les zones de livraison et les frais associés
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="normal"
                    icon={<Plus size={15} />}
                    iconPosition="left"
                    onClick={handleCreate}
                >
                    <span className="hidden md:inline">Nouvelle ville</span>
                </Button>
            </div>

            {/* ── Erreur API ── */}
            {error && (
                <div className="bg-danger-2 border border-danger-1 rounded-2 px-4 py-3 text-xs font-poppins text-danger-1">
                    ⚠️ {error}
                </div>
            )}

            {/* ── Stats ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total villes"
                    value={loading ? '…' : String(stats.total)}
                    icon={<MapPin size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Villes actives"
                    value={loading ? '…' : String(stats.actives)}
                    icon={<CheckCircle size={18} />}
                    trend="up"
                    trendLabel={stats.total ? `${Math.round((stats.actives / stats.total) * 100)}%` : '0%'}
                    color="success"
                />
                <StatCard
                    title="Villes inactives"
                    value={loading ? '…' : String(stats.inactives)}
                    icon={<XCircle size={18} />}
                    color="warning"
                />
                <StatCard
                    title="Frais moyen"
                    value={loading ? '…' : `${stats.avgFee.toLocaleString('fr-FR')} F`}
                    icon={<Truck size={18} />}
                    color="secondary"
                />
            </div>

            {/* ── Info ── */}
            <div className="flex items-center gap-2 bg-secondary-5 dark:bg-secondary-5 border border-secondary-3 rounded-2 px-4 py-3">
                <span className="text-xs font-poppins text-secondary-7 dark:text-secondary-7">
                    💡 Désactiver une ville empêche les clients de passer des commandes vers cette destination.
                </span>
            </div>

            {/* ── Tableau ── */}
            <VillesTable
                villes={villes}
                loading={loading}
                ordersLoading={ordersLoading}
                cityKeysWithOrders={cityKeysWithOrders}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
            />

            {/* ── Modal formulaire ── */}
            <VilleFormModal
                open={modalOpen}
                onClose={handleClose}
                ville={selectedVille}
                onSave={handleSave}
            />

            {/* ── Confirmation suppression ── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteLoading}
                title="Supprimer la ville"
                message={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
            />
        </div>
    );
};

export default VillesPage;