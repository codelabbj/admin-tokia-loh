import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Grid2X2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import Button from '../components/Button';
import StatCard from '../components/dashboard/StatCard';
import CategoriesTable from '../components/categories/CategoriesTable';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CategoriesPage = () => {
    const navigate = useNavigate();
    const { categories, loading, create, update, remove } = useCategories();
    const { products } = useProducts();

    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Catégories';
    }, []);

    // ── Stats calculées ───────────────────────────────────────
    const stats = useMemo(() => {
        const total = categories.length;
        const active = categories.filter(c => c.is_active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [categories]);

    // ── Nombre de produits par catégorie ──────────────────────
    const productCountByCat = useMemo(() => {
        const map = {};
        products.forEach(p => {
            map[p.category] = (map[p.category] ?? 0) + 1;
        });
        return map;
    }, [products]);

    // ── Handlers ──────────────────────────────────────────────
    const handleCreate = () => navigate('/categories/new');
    const handleEdit = (category) => navigate(`/categories/${category.id}/edit`);


    const handleDelete = (cat) => setDeleteTarget(cat);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        await remove(deleteTarget.id);
        setDeleteTarget(null);
    };

    // Nombre de produits liés à la catégorie cible
    const deleteTargetProductCount = deleteTarget
        ? (productCountByCat[deleteTarget.id] ?? 0)
        : 0;

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Catégories
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Gérez les catégories de votre boutique
                    </p>
                </div>
                <Button variant="primary" size="normal" onClick={handleCreate}>
                    <Plus size={15} />
                    <span className="hidden md:inline">Nouvelle catégorie</span>
                </Button>
            </div>

            {/* ── Stats ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard
                    title="Total catégories"
                    value={loading ? '…' : stats.total.toString()}
                    icon={<Grid2X2 size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Catégories actives"
                    value={loading ? '…' : stats.active.toString()}
                    icon={<Grid2X2 size={18} />}
                    trend="up"
                    trendLabel={loading ? '' : `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`}
                    color="success"
                />
                <StatCard
                    title="Catégories inactives"
                    value={loading ? '…' : stats.inactive.toString()}
                    icon={<Grid2X2 size={18} />}
                    color="warning"
                />
            </div>

            {/* ── Info ordre ── */}
            <div className="flex items-center gap-2 bg-primary-5 dark:bg-primary-5 border border-primary-4 rounded-2 px-4 py-3">
                <span className="text-xs font-poppins text-primary-7 dark:text-primary-7">
                    💡 Utilisez les flèches ▲▼ pour changer l'ordre d'affichage des catégories sur la boutique.
                </span>
            </div>

            {/* ── Tableau ── */}
            <CategoriesTable
                categories={categories}
                loading={loading}
                productCountByCat={productCountByCat}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={update}
            />

            {/* ── Confirmation suppression ── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
                mode={deleteTargetProductCount > 0 ? 'error' : 'confirm'}
                title={deleteTargetProductCount > 0 ? 'Suppression impossible' : 'Supprimer la catégorie'}
                message={
                    deleteTargetProductCount > 0
                        ? `Impossible de supprimer "${deleteTarget?.name}" : ${deleteTargetProductCount} produit(s) sont associés à cette catégorie.`
                        : `Voulez-vous vraiment supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`
                }
            />
        </div>
    );
};

export default CategoriesPage;