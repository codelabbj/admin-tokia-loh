import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Grid2X2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useCategoriesList } from '../hooks/useCategoriesList';
import Button from '../components/Button';
import StatCard from '../components/dashboard/StatCard';
import CategoriesTable from '../components/categories/CategoriesTable';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CategoriesPage = () => {
    const navigate = useNavigate();
    const list = useCategoriesList();
    const { update, remove } = useCategories({ skipInitialFetch: true });

    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Catégories';
    }, []);

    const handleUpdate = useCallback(
        async (id, payload) => {
            await update(id, payload);
            list.refetch();
        },
        [update, list],
    );

    // ── Stats : page courante uniquement ──────────────────────
    const stats = useMemo(() => {
        const pageCats = list.categories;
        const total = pageCats.length;
        const active = pageCats.filter(c => c.is_active).length;
        const inactive = total - active;
        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
        return { total, active, inactive, activePct };
    }, [list.categories]);

    const handleCreate = () => navigate('/categories/new');

    const handleEdit = (category) => navigate(`/categories/${category.id}/edit`);

    const handleDelete = (cat) => setDeleteTarget(cat);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await remove(deleteTarget.id);
            list.refetch();
        } finally {
            setDeleteTarget(null);
        }
    };

    const deleteTargetProductCount =
        deleteTarget?.products_count ??
        deleteTarget?.productsCount ??
        0;

    const serverFilters = {
        search: list.search,
        onSearchChange: list.setSearch,
    };

    const pagination = {
        page: list.page,
        totalPages: list.totalPages,
        totalCount: list.totalCount,
        pageSize: list.pageSize,
        onPageChange: list.setPage,
    };

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

            {/* ── Stats (page courante) ── */}
            {!list.loading && (
                <p className="text-[11px] font-poppins text-neutral-6 dark:text-neutral-6 -mb-2">
                    Statistiques pour la page {list.page} sur {list.totalPages}
                    {stats.total > 0
                        ? ` · ${stats.total} catégorie${stats.total > 1 ? 's' : ''} sur cette page`
                        : ' · Aucune catégorie sur cette page'}
                </p>
            )}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard
                    title="Total catégories"
                    value={list.loading ? '…' : stats.total.toString()}
                    icon={<Grid2X2 size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Catégories actives"
                    value={list.loading ? '…' : stats.active.toString()}
                    icon={<Grid2X2 size={18} />}
                    trend="up"
                    trendLabel={list.loading || stats.total === 0 ? '' : `${stats.activePct}% de la page`}
                    color="success"
                />
                <StatCard
                    title="Catégories inactives"
                    value={list.loading ? '…' : stats.inactive.toString()}
                    icon={<Grid2X2 size={18} />}
                    trend={stats.inactive > 0 ? 'down' : 'neutral'}
                    trendLabel={list.loading || stats.total === 0 ? '' : stats.inactive > 0 ? 'Sur cette page' : 'Aucune'}
                    color="warning"
                />
            </div>

            {/* ── Tableau ── */}
            <CategoriesTable
                categories={list.categories}
                loading={list.loading}
                productCountByCat={{}}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                serverFilters={serverFilters}
                pagination={pagination}
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
