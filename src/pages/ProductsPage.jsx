import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Package } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import ProductsTable from '../components/products/ProductsTable';
import StatCard from '../components/dashboard/StatCard';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const ProductsPage = () => {
    const { products, loading, create, update, remove } = useProducts();
    const { categories } = useCategories();
    const navigate = useNavigate();

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Produits';
    }, []);

    // ── Stats calculées depuis les vraies données ─────────────
    const stats = useMemo(() => {
        const total = products.length;
        const active = products.filter(p => p.status).length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
        const outStock = products.filter(p => p.stock === 0).length;
        return { total, active, lowStock, outStock };
    }, [products]);

    const handleCreate = () => navigate('/products/new');

    const handleEdit = (product) => navigate(`/products/${product.id}/edit`);

    const handleDelete = (product) => {
        setDeleteTarget(product);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        await remove(deleteTarget.id);
        setDeleteLoading(false);
        setDeleteTarget(null);
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

            {/* ── Stats ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total produits"
                    value={loading ? '…' : stats.total.toString()}
                    icon={<Package size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Produits actifs"
                    value={loading ? '…' : stats.active.toString()}
                    icon={<Package size={18} />}
                    trend="up"
                    trendLabel={loading ? '' : `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`}
                    color="success"
                />
                <StatCard
                    title="Stock faible"
                    value={loading ? '…' : stats.lowStock.toString()}
                    icon={<Package size={18} />}
                    trend="down"
                    trendLabel="À réapprovisionner"
                    color="warning"
                />
                <StatCard
                    title="Ruptures"
                    value={loading ? '…' : stats.outStock.toString()}
                    icon={<Package size={18} />}
                    trend="down"
                    trendLabel="Urgent"
                    color="danger"
                />
            </div>

            {/* ── Tableau ── */}
            <ProductsTable
                products={products}
                loading={loading}
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={update}
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
