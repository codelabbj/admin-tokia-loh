import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Pencil, Star, Tag,
    Package, CheckCircle, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import ProductBadge from '../components/products/ProductBadge';
import ProductFormModal from '../components/products/ProductFormModal';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const calcDiscount = (price, salePrice) => {
    if (!salePrice) return null;
    return Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100);
};

const ProductAvatarLarge = ({ name }) => (
    <div className="w-full h-full bg-secondary-5 flex items-center justify-center">
        <span className="text-5xl font-bold font-poppins text-secondary-1 uppercase">
            {name?.slice(0, 2) ?? '??'}
        </span>
    </div>
);

const InfoRow = ({ label, children }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-4 dark:border-neutral-4 last:border-0">
        <span className="text-xs font-poppins text-neutral-6 shrink-0 min-w-30">{label}</span>
        <div className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8 text-right">
            {children}
        </div>
    </div>
);

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading, update } = useProducts();
    const { categories } = useCategories();

    const [modalOpen, setModalOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    // Cherche le produit dans la liste déjà chargée
    const product = useMemo(() =>
        products.find(p => String(p.id) === String(id)) ?? null,
        [products, id]);

    useEffect(() => {
        if (product) {
            document.title = `Admin Tokia-Loh | ${product.name}`;
        }
    }, [product]);

    // Redirige si produit introuvable et chargement terminé
    useEffect(() => {
        if (!loading && products.length > 0 && !product) {
            navigate('/products', { replace: true });
        }
    }, [loading, products, product, navigate]);

    // ── Chargement ────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-1" />
        </div>
    );

    if (!product) return null;

    const catName = categories.find(c => c.id === product.category)?.name ?? product.category ?? '—';
    const discount = calcDiscount(product.price, product.sale_price);
    const allImages = [product.image].filter(Boolean);
    const hasImages = allImages.length > 0;
    const stockBadge = product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : null;

    const handleSave = async (formData) => {
        await update(product.id, formData);
        setModalOpen(false);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {product.name}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">Détail du produit</p>
                    </div>
                </div>
                <Button variant="primary" size="normal" onClick={() => setModalOpen(true)}>
                    <Pencil size={14} /> Modifier le produit
                </Button>
            </div>

            {/* ── Contenu ── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

                {/* Colonne gauche : image */}
                <div className="xl:col-span-2 flex flex-col gap-3">
                    <div className="aspect-square rounded-3 overflow-hidden bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4">
                        {hasImages
                            ? <img src={allImages[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                            : <ProductAvatarLarge name={product.name} />
                        }
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {allImages.map((img, i) => (
                                <button key={i} onClick={() => setActiveImage(i)}
                                    className={`w-14 h-14 rounded-2 overflow-hidden border-2 transition-all cursor-pointer ${activeImage === i ? 'border-primary-1' : 'border-neutral-4 hover:border-primary-3'}`}>
                                    <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Colonne droite : infos */}
                <div className="xl:col-span-3 flex flex-col gap-4">

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <ProductBadge type={product.is_active ? 'active' : 'inactive'} />
                        {product.featured && <ProductBadge type="featured" />}
                        {stockBadge && <ProductBadge type={stockBadge} />}
                    </div>

                    {/* Prix */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 px-5 py-4 flex items-center gap-4 flex-wrap">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold font-poppins text-primary-1">
                                {formatPrice(product.sale_price ?? product.price)}
                            </span>
                            {product.sale_price && (
                                <span className="line-through text-sm font-poppins text-neutral-5">
                                    {formatPrice(product.price)}
                                </span>
                            )}
                        </div>
                        {discount && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-2 text-success-1 text-sm font-bold font-poppins">
                                <Tag size={13} /> -{discount}%
                            </span>
                        )}
                    </div>

                    {/* Tableau infos */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 px-5 py-2">
                        <InfoRow label="Catégorie">
                            <span className="inline-flex items-center gap-1.5">
                                <Package size={12} className="text-primary-1" /> {catName}
                            </span>
                        </InfoRow>
                        <InfoRow label="Stock disponible">
                            <span className={product.stock === 0 ? 'text-danger-1' : product.stock <= 5 ? 'text-warning-1' : 'text-success-1'}>
                                {product.stock} unité{product.stock > 1 ? 's' : ''}
                                {product.stock === 0 && ' — Rupture'}
                                {product.stock > 0 && product.stock <= 5 && ' — Stock faible'}
                            </span>
                        </InfoRow>
                        <InfoRow label="Statut">
                            <span className={`inline-flex items-center gap-1 ${product.is_active ? 'text-success-1' : 'text-neutral-6'}`}>
                                {product.is_active
                                    ? <><CheckCircle size={12} /> Actif — visible sur la boutique</>
                                    : <><XCircle size={12} /> Inactif — masqué</>
                                }
                            </span>
                        </InfoRow>
                        <InfoRow label="Produit vedette">
                            <span className={`inline-flex items-center gap-1 ${product.featured ? 'text-warning-1' : 'text-neutral-5'}`}>
                                <Star size={12} className={product.featured ? 'fill-warning-1' : ''} />
                                {product.featured ? 'Oui — mis en avant' : 'Non'}
                            </span>
                        </InfoRow>
                        {product.sale_price && (
                            <InfoRow label="Prix original">
                                <span className="line-through text-neutral-5">{formatPrice(product.price)}</span>
                            </InfoRow>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 px-5 py-4 flex flex-col gap-2">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Description</p>
                            <p className="text-xs font-poppins text-neutral-7 dark:text-neutral-7 leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    {/* Alertes stock */}
                    {product.stock > 0 && product.stock <= 5 && (
                        <div className="flex items-center gap-2 bg-warning-2 border border-warning-1 rounded-3 px-4 py-3">
                            <AlertTriangle size={14} className="text-warning-1 shrink-0" />
                            <p className="text-xs font-poppins font-medium text-warning-1">
                                Stock faible — seulement {product.stock} unité{product.stock > 1 ? 's' : ''} restante{product.stock > 1 ? 's' : ''}. Pensez à réapprovisionner.
                            </p>
                        </div>
                    )}
                    {product.stock === 0 && (
                        <div className="flex items-center gap-2 bg-danger-2 border border-danger-1 rounded-3 px-4 py-3">
                            <AlertTriangle size={14} className="text-danger-1 shrink-0" />
                            <p className="text-xs font-poppins font-medium text-danger-1">
                                Rupture de stock — ce produit n'est plus disponible à la commande.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal modification */}
            <ProductFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                product={product}
                categories={categories}
                onSave={handleSave}
            />
        </div>
    );
};

export default ProductDetailPage;