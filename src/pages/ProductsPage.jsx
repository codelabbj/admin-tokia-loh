import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Package } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useProductsList } from '../hooks/useProductsList';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import ProductsTable from '../components/products/ProductsTable';
import StatCard from '../components/dashboard/StatCard';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const ProductsPage = () => {
    const list = useProductsList();
    const { update, remove } = useProducts({ skipInitialFetch: true });
    const { categories } = useCategories();
    const navigate = useNavigate();

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Produits';
    }, []);

    const handleUpdate = useCallback(
        async (id, payload) => {
            await update(id, payload);
            list.refetch();
        },
        [update, list],
    );

    // ── Stats : uniquement les produits de la page courante (réponse API, avant filtres locaux du tableau) ──
    const stats = useMemo(() => {
        const pageProducts = list.products;
        const total = pageProducts.length;
        const active = pageProducts.filter(p => p.status).length;
        const lowStock = pageProducts.filter(p => !p.unlimited_stock && p.stock > 0 && p.stock <= 5).length;
        const outStock = pageProducts.filter(p => !p.unlimited_stock && p.stock === 0).length;
        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
        return {
            total,
            active,
            lowStock,
            outStock,
            activePct,
        };
    }, [list.products]);

    const handleCreate = () => navigate('/products/new');

    const handleEdit = (product) => navigate(`/products/${product.id}/edit`);

    const handleDelete = (product) => {
        setDeleteTarget(product);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await remove(deleteTarget.id);
            list.refetch();
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    const serverFilters = {
        search: list.search,
        onSearchChange: list.setSearch,
        categoryId: list.categoryId,
        onCategoryIdChange: list.setCategoryId,
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
                        Produits
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Gérez votre catalogue de produits
                    </p>
                </div>
                <Button variant="primary" size="normal" onClick={handleCreate}>
                    <Plus size={15} />
                    <span className="hidden md:inline">Nouveau produit</span>
                </Button>
            </div>

            {/* ── Stats (page courante uniquement) ── */}
            {!list.loading && (
                <p className="text-[11px] font-poppins text-neutral-6 dark:text-neutral-6 -mb-2">
                    Statistiques pour la page {list.page} sur {list.totalPages}
                    {stats.total > 0 ? ` · ${stats.total} produit${stats.total > 1 ? 's' : ''} sur cette page` : ' · Aucun produit sur cette page'}
                </p>
            )}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total produits"
                    value={list.loading ? '…' : stats.total.toString()}
                    icon={<Package size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Produits actifs"
                    value={list.loading ? '…' : stats.active.toString()}
                    icon={<Package size={18} />}
                    trend="up"
                    trendLabel={list.loading || stats.total === 0 ? '' : `${stats.activePct}% de la page`}
                    color="success"
                />
                <StatCard
                    title="Stock faible"
                    value={list.loading ? '…' : stats.lowStock.toString()}
                    icon={<Package size={18} />}
                    trend={stats.lowStock > 0 ? 'down' : 'neutral'}
                    trendLabel={list.loading || stats.total === 0 ? '' : stats.lowStock > 0 ? 'Sur cette page' : 'Aucun'}
                    color="warning"
                />
                <StatCard
                    title="Ruptures"
                    value={list.loading ? '…' : stats.outStock.toString()}
                    icon={<Package size={18} />}
                    trend={stats.outStock > 0 ? 'down' : 'neutral'}
                    trendLabel={list.loading || stats.total === 0 ? '' : stats.outStock > 0 ? 'Sur cette page' : 'Aucune'}
                    color="danger"
                />
            </div>

            {/* ── Tableau ── */}
            <ProductsTable
                products={list.products}
                loading={list.loading}
                categories={categories}
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
                loading={deleteLoading}
                title="Supprimer le produit"
                message={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
            />
        </div>
    );
};

export default ProductsPage;
