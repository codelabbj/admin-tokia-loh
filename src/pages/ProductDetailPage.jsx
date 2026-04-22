/* eslint-disable react-hooks/set-state-in-effect */
// version 2.2.0 - Correction affichage others_details
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Pencil, Tag,
    Package, CheckCircle, XCircle, AlertTriangle, Loader2,
    ChevronLeft, ChevronRight, Play, ImageOff, Layers, ChevronDown,
    Copy, Check, X,
} from 'lucide-react';
import { useProducts, normalizeProduct, normalizeOthersDetails } from '../hooks/useProducts';
import { productsAPI } from '../api/products.api';
import { variantsAPI } from '../api/variants.api';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import ProductBadge from '../components/products/ProductBadge';
import { useToast } from '../components/ui/ToastProvider';

// ── Helpers ───────────────────────────────────────────────────
const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const calcDiscount = (price, originalPrice) => {
    if (!originalPrice) return null;
    const p = Number(price), o = Number(originalPrice);
    if (!p || !o || p >= o) return null;
    return Math.round(((o - p) / o) * 100);
};

const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
    return match?.[1] ?? null;
};

const isVideoUrl = (url) =>
    typeof url === 'string' && (
        url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('vimeo.com') ||
        /\.(mp4|webm|ogg|mov)$/i.test(url)
    );

// ── Miniature ─────────────────────────────────────────────────
const MediaThumb = ({ url, active, onClick, index }) => {
    const ytId = getYouTubeId(url);
    const isVideo = isVideoUrl(url);
    const thumbSrc = ytId
        ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
        : isVideo ? null : url;

    return (
        <button
            onClick={onClick}
            className={`relative w-14 h-14 rounded-2 overflow-hidden shrink-0 transition-all duration-200 cursor-pointer border-2
                ${active
                    ? 'border-primary-1 scale-105 shadow-md'
                    : 'border-neutral-4 dark:border-neutral-4 hover:border-primary-3 opacity-70 hover:opacity-100'
                }`}
        >
            {thumbSrc
                ? <img src={thumbSrc} alt={`media-${index}`} className="w-full h-full object-cover" />
                : (
                    <div className="w-full h-full bg-neutral-3 dark:bg-neutral-3 flex items-center justify-center">
                        <Play size={14} className="text-neutral-6" />
                    </div>
                )
            }
            {isVideo && (
                <div className="absolute inset-0 bg-neutral-8/25 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                        <Play size={8} className="text-neutral-8 fill-neutral-8 ml-0.5" />
                    </div>
                </div>
            )}
        </button>
    );
};

// ── Visionneur principal ──────────────────────────────────────
const MediaViewer = ({ url }) => {
    if (!url) return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-2 dark:bg-neutral-2">
            <ImageOff size={32} className="text-neutral-5" />
            <span className="text-xs font-poppins text-neutral-5">Aucune image</span>
        </div>
    );

    const ytId = getYouTubeId(url);
    if (ytId) return (
        <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allowFullScreen
            title="YouTube video"
        />
    );

    if (url.includes('vimeo.com')) {
        const vimeoId = url.match(/vimeo.*\/(\d+)/i)?.[1];
        if (vimeoId) return (
            <iframe
                src={`https://player.vimeo.com/video/${vimeoId}`}
                className="w-full h-full"
                allowFullScreen
                title="Vimeo video"
            />
        );
    }

    if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return (
        <video src={url} controls className="w-full h-full object-contain bg-neutral-8" />
    );

    return <img src={url} alt="media" className="w-full h-full object-cover" />;
};

// ── Ligne info ────────────────────────────────────────────────
const InfoRow = ({ label, children }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-4 dark:border-neutral-4 last:border-0">
        <span className="text-xs font-poppins text-neutral-6 shrink-0">{label}</span>
        <div className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8 text-right flex items-center gap-1.5 flex-wrap justify-end">
            {children}
        </div>
    </div>
);

// ── Section wrapper ───────────────────────────────────────────
const formatDetailLine = (d) => {
    if (typeof d === 'string') return d.trim();
    const key = String(d?.key ?? '').trim();
    const value = String(d?.value ?? '').trim();
    if (!key) return '';
    return value ? `${key}: ${value}` : key;
};

const updateVariantInTreeById = (variants, variantId, patchData) => {
    if (!Array.isArray(variants)) return [];
    const idStr = String(variantId);
    return variants.map((item) => {
        const currentId = item?.id == null ? null : String(item.id);
        if (currentId === idStr) {
            return {
                ...item,
                ...patchData,
            };
        }
        if (Array.isArray(item?.sub_variants) && item.sub_variants.length > 0) {
            return {
                ...item,
                sub_variants: updateVariantInTreeById(item.sub_variants, variantId, patchData),
            };
        }
        return item;
    });
};

const variantStockBadgeType = (v) => {
    if (v.unlimited_stock === true) return 'unlimited-stock';
    const s = v.stock;
    const n = s == null ? null : Number(s);
    if (n === 0) return 'out-of-stock';
    if (n != null && n <= 5) return 'low-stock';
    return null;
};

const Section = ({ title, children }) => (
    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
        {title && (
            <div className="px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">{title}</p>
            </div>
        )}
        <div className="px-5 py-2">
            {children}
        </div>
    </div>
);

// ── Noeud d'arbre récursif pour les déclinaisons ────────────────────
const VariantTreeNode = ({ variant: v, level, onUpdateVariant, isVariantSaving }) => {
    const [open, setOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [editForm, setEditForm] = useState({
        key: '',
        name: '',
        price: '',
        stock: '',
        unlimited_stock: false,
        status: true,
    });
    const hasSubVariants = Array.isArray(v.sub_variants) && v.sub_variants.length > 0;
    const vStockBadge = variantStockBadgeType(v);
    const vOthers = (normalizeOthersDetails(v.others_details ?? []))
        .map(formatDetailLine)
        .filter(Boolean);
    const vActive = v.status !== false;
    const vDiscount = calcDiscount(v.price, v.original_price);
    const vSecondaryImages = Array.isArray(v.secondary_images)
        ? v.secondary_images.filter(Boolean)
        : [];
    const variantMedia = [v.image, ...vSecondaryImages].filter(Boolean);
    const canEdit = !!v?.id;
    const savingThisVariant = isVariantSaving?.(v?.id) === true;

    useEffect(() => {
        setEditForm({
            key: String(v?.key ?? ''),
            name: String(v?.name ?? ''),
            price: v?.price == null ? '' : String(v.price),
            stock: v?.stock == null ? '' : String(v.stock),
            unlimited_stock: v?.unlimited_stock === true,
            status: v?.status !== false,
        });
    }, [v?.id, v?.key, v?.name, v?.price, v?.stock, v?.unlimited_stock, v?.status]);

    const handleVariantSave = async (e) => {
        e.stopPropagation();
        if (!canEdit || !onUpdateVariant) return;
        const payload = {
            key: String(editForm.key ?? '').trim(),
            name: String(editForm.name ?? '').trim(),
            status: editForm.status !== false,
            unlimited_stock: editForm.unlimited_stock === true,
        };
        if (payload.name === '') return;
        if (editForm.price !== '') payload.price = Number(editForm.price);
        if (payload.unlimited_stock) {
            payload.stock = null;
        } else if (editForm.stock !== '') {
            payload.stock = Number(editForm.stock);
        }
        await onUpdateVariant(v.id, payload);
        setIsEditing(false);
    };
    const openViewerAt = (index, e) => {
        e?.stopPropagation?.();
        if (!variantMedia.length) return;
        setViewerIndex(index);
        setViewerOpen(true);
    };
    const prevViewer = (e) => {
        e?.stopPropagation?.();
        if (!variantMedia.length) return;
        setViewerIndex((i) => (i - 1 + variantMedia.length) % variantMedia.length);
    };
    const nextViewer = (e) => {
        e?.stopPropagation?.();
        if (!variantMedia.length) return;
        setViewerIndex((i) => (i + 1) % variantMedia.length);
    };

    const depthBorderColors = [
        'border-l-primary-1',
        'border-l-success-1',
        'border-l-warning-1',
        'border-l-danger-1',
    ];
    const borderColor = level > 0 ? (depthBorderColors[level % depthBorderColors.length]) : '';
    const bgColor = level === 0
        ? 'bg-neutral-2/40 dark:bg-neutral-2/20'
        : level === 1
            ? 'bg-neutral-0 dark:bg-neutral-1'
            : 'bg-neutral-2/60 dark:bg-neutral-2/40';

    return (
        <div className={`rounded-2 border border-neutral-4 dark:border-neutral-4 overflow-hidden ${level > 0 ? `border-l-4 ${borderColor}` : ''}`}>
            {/* Header de la déclinaison */}
            <div className={`flex flex-col gap-2 px-4 py-3 ${bgColor} ${hasSubVariants ? 'cursor-pointer select-none' : ''}`}
                onClick={hasSubVariants ? () => setOpen(o => !o) : undefined}
            >
                {/* Ligne 1 : Médias */}
                <div className="flex items-start justify-between gap-3">
                    <div className="shrink-0 flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => openViewerAt(0, e)}
                            className="w-10 h-10 rounded-lg border border-neutral-4 overflow-hidden bg-neutral-3 flex items-center justify-center cursor-pointer"
                            title="Voir l'image principale"
                        >
                            {v.image
                                ? <img src={v.image} alt="" className="w-full h-full object-cover" />
                                : <Layers size={16} className="text-neutral-5" />}
                        </button>
                        {vSecondaryImages.length > 0 && (
                            <div className="flex items-center gap-1">
                                {vSecondaryImages.slice(0, 3).map((img, i) => (
                                    <button
                                        type="button"
                                        onClick={(e) => openViewerAt(i + 1, e)}
                                        key={`${img}-${i}`}
                                        className="w-7 h-7 rounded-md border border-neutral-4 overflow-hidden bg-neutral-3 cursor-pointer"
                                        title={`Voir image secondaire ${i + 1}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                                {vSecondaryImages.length > 3 && (
                                    <span className="text-[10px] font-semibold font-poppins text-neutral-6">
                                        +{vSecondaryImages.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {hasSubVariants && (
                        <div className="flex items-center gap-1.5 text-neutral-5 shrink-0">
                            <span className="text-[11px] font-poppins">
                                {v.sub_variants.length} sous-déclinaison{v.sub_variants.length > 1 ? 's' : ''}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
                            />
                        </div>
                    )}
                </div>

                {/* Ligne 2 : Caractéristiques */}
                <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {v.key && (
                        <span className="text-[10px] font-bold font-poppins px-2 py-0.5 rounded border border-neutral-4 text-neutral-6 uppercase tracking-wider bg-neutral-0 dark:bg-neutral-2 shadow-sm">
                            {v.key}
                        </span>
                    )}
                    <span className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8 truncate">
                        {v.name ?? '—'}
                    </span>
                    {v.price != null && v.price !== '' && (
                        <span className="text-xs font-semibold font-poppins text-primary-1">
                            {formatPrice(v.price)}
                            {vDiscount != null && vDiscount > 0 && (
                                <span className="ml-1.5 text-[10px] text-success-1">-{vDiscount}%</span>
                            )}
                        </span>
                    )}
                    <span className="text-xs font-poppins text-neutral-6">
                        Stock : 
                        <span className={`font-semibold ${
                            v.unlimited_stock === true ? 'text-primary-1'
                            : (v.stock ?? 0) === 0 ? 'text-danger-1'
                            : (v.stock ?? 0) <= 5 ? 'text-warning-1'
                            : 'text-success-1'
                        }`}>
                            {v.unlimited_stock === true ? 'Illimité' : `${v.stock ?? 0} u.`}
                        </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <ProductBadge type={vActive ? 'active' : 'inactive'} />
                        {vStockBadge && <ProductBadge type={vStockBadge} />}
                    </div>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing((prev) => !prev);
                            }}
                            className="px-2 py-1 rounded-lg border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-[11px] font-poppins text-neutral-7 dark:text-white/90 hover:text-primary-1 hover:border-primary-3 transition-colors cursor-pointer"
                        >
                            {isEditing ? 'Fermer' : 'Modifier'}
                        </button>
                    )}
                </div>
            </div>

            {isEditing && canEdit && (
                <div
                    className="px-4 pb-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <input
                            value={editForm.key}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, key: e.target.value }))}
                            placeholder="Clé"
                            className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white placeholder:text-neutral-5 dark:placeholder:text-white/45"
                        />
                        <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Valeur / nom"
                            className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white placeholder:text-neutral-5 dark:placeholder:text-white/45"
                        />
                        <input
                            type="number"
                            min="0"
                            value={editForm.price}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                            placeholder="Prix"
                            className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white placeholder:text-neutral-5 dark:placeholder:text-white/45"
                        />
                        <input
                            type="number"
                            min="0"
                            value={editForm.stock}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, stock: e.target.value, unlimited_stock: false }))}
                            placeholder="Stock"
                            disabled={editForm.unlimited_stock}
                            className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white placeholder:text-neutral-5 dark:placeholder:text-white/45 disabled:bg-neutral-2 dark:disabled:bg-neutral-3"
                        />
                        <label className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.unlimited_stock}
                                onChange={(e) => setEditForm((prev) => ({
                                    ...prev,
                                    unlimited_stock: e.target.checked,
                                    stock: e.target.checked ? '' : prev.stock,
                                }))}
                            />
                            <span className="text-neutral-8 dark:text-white">Toujours en stock</span>
                        </label>
                        <label className="h-9 px-3 rounded-xl border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-8 dark:text-white flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.status}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.checked }))}
                            />
                            <span className="text-neutral-8 dark:text-white">Active</span>
                        </label>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleVariantSave}
                            disabled={savingThisVariant || String(editForm.name ?? '').trim() === ''}
                            className="px-3 h-8 rounded-lg bg-primary-1 text-white text-xs font-semibold font-poppins disabled:opacity-60 cursor-pointer"
                        >
                            {savingThisVariant ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(false);
                            }}
                            className="px-3 h-8 rounded-lg border border-neutral-4 dark:border-neutral-6 bg-neutral-0 dark:bg-neutral-2 text-xs font-poppins text-neutral-7 dark:text-white/90 cursor-pointer"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
            {viewerOpen && variantMedia.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center"
                    onClick={() => setViewerOpen(false)}
                >
                    <div
                        className="w-full max-w-3xl rounded-2xl border border-neutral-4 dark:border-neutral-5 bg-neutral-0 dark:bg-neutral-1 p-3 flex flex-col gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewerOpen(false)}
                                className="w-8 h-8 rounded-lg border border-neutral-4 dark:border-neutral-5 bg-neutral-0 dark:bg-neutral-2 text-neutral-8 dark:text-white hover:text-danger-1 dark:hover:text-danger-2 hover:border-danger-1 dark:hover:border-danger-2 transition-colors cursor-pointer flex items-center justify-center"
                                title="Fermer"
                                aria-label="Fermer la modale"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-4 dark:border-neutral-5 bg-neutral-2">
                            <MediaViewer url={variantMedia[viewerIndex]} />
                            {variantMedia.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={prevViewer}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-0/90 border border-neutral-4 flex items-center justify-center text-neutral-7 hover:text-neutral-8 cursor-pointer"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextViewer}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-0/90 border border-neutral-4 flex items-center justify-center text-neutral-7 hover:text-neutral-8 cursor-pointer"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-2 flex-wrap">
                                {variantMedia.map((url, i) => (
                                    <MediaThumb
                                        key={`${url}-${i}`}
                                        url={url}
                                        index={i}
                                        active={i === viewerIndex}
                                        onClick={() => setViewerIndex(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Détails extras (others_details) */}
            {vOthers.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 px-4 pb-3 ${bgColor}`}>
                    {vOthers.map((line, k) => (
                        <span key={k} className="px-2.5 py-1 rounded-full bg-neutral-0 border border-neutral-4 text-[11px] font-poppins text-neutral-7">
                            {line}
                        </span>
                    ))}
                </div>
            )}

            {/* Sous-déclinaisons récursives */}
            {hasSubVariants && open && (
                <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 bg-neutral-2/20 dark:bg-neutral-2/10">
                    {v.sub_variants.map((sub, i) => (
                        <VariantTreeNode
                            key={sub.id ?? i}
                            variant={sub}
                            level={level + 1}
                            onUpdateVariant={onUpdateVariant}
                            isVariantSaving={isVariantSaving}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── PAGE ──────────────────────────────────────────────────────
const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading: productsLoading } = useProducts();
    const { categories } = useCategories();
    const { toast } = useToast();

    const [activeIndex, setActiveIndex] = useState(0);
    const [idCopied, setIdCopied] = useState(false);
    const [productFromDetail, setProductFromDetail] = useState(null);
    const [resolvedVariants, setResolvedVariants] = useState([]);
    const [savingVariantIds, setSavingVariantIds] = useState([]);

    const productFromList = useMemo(
        () => products.find(p => String(p.id) === String(id)) ?? null,
        [products, id],
    );
    // Priorise la source la plus fraîche (detail fetch / patch variante)
    const product = productFromDetail ?? productFromList;

    const needsDetailFetch =
        !!id && !productsLoading && !productFromList;

    useEffect(() => {
        if (product) document.title = `Admin Tokia-Loh | ${product.name}`;
    }, [product]);

    useEffect(() => {
        if (!needsDetailFetch) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await productsAPI.detail(id);
                if (!cancelled) setProductFromDetail(normalizeProduct(data));
            } catch {
                if (!cancelled) navigate('/products', { replace: true });
            }
        })();
        return () => { cancelled = true; };
    }, [needsDetailFetch, id, navigate]);

    useEffect(() => { setActiveIndex(0); }, [id]);
    useEffect(() => { setIdCopied(false); }, [id]);

    useEffect(() => {
        if (!product?.id) {
            setResolvedVariants([]);
            return;
        }
        const embedded = Array.isArray(product.variants) ? product.variants : [];
        setResolvedVariants(embedded);
    }, [product]);

    if (productsLoading || (needsDetailFetch && !productFromDetail)) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="animate-spin text-primary-1" />
            </div>
        );
    }
    if (!product) return null;

    // ── Données ───────────────────────────────────────────────
    const catName = categories.find(c => c.id === product.category)?.name ?? '—';

    // API : status (bool), original_price (prix barré)
    const isActive = product.status ?? product.is_active ?? true;
    const discount = calcDiscount(product.price, product.original_price);
    const unlimitedStock = product.unlimited_stock === true;
    const stockBadge = unlimitedStock
        ? 'unlimited-stock'
        : product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : null;


    const secondaryImages = (product.secondary_images ?? []).filter(Boolean);

    const videoUrls = (product.videos ?? [])
        .map(v => typeof v === 'string' ? v : v?.video_url)
        .filter(Boolean);

    const allMedia = [
        product.image,
        ...secondaryImages,
        ...videoUrls
    ].filter(Boolean);

    const activeUrl = allMedia[activeIndex] ?? null;

    const prev = () => setActiveIndex(i => (i - 1 + allMedia.length) % allMedia.length);
    const next = () => setActiveIndex(i => (i + 1) % allMedia.length);

    const allDetails = (normalizeOthersDetails(product.others_details ?? []))
        .map(formatDetailLine)
        .filter(Boolean);

    const productAttributes = Array.isArray(product.attributes) ? product.attributes : [];

    const detailSizes = allDetails
        .filter(d => d.startsWith('Taille:'))
        .map(d => d.replace('Taille:', '').trim());

    const detailColors = allDetails
        .filter(d => d.startsWith('Couleur:'))
        .map(d => {
            const raw = d.replace('Couleur:', '').trim();
            const hexMatch = raw.match(/#[0-9A-Fa-f]{6}/);
            const hex = hexMatch ? hexMatch[0] : null;
            const name = raw.replace(/\s*\(.*?\)/, '').trim();
            return { name, hex };
        });

    const detailCustom = allDetails
        .filter(d => !d.startsWith('Taille:') && !d.startsWith('Couleur:'));

    // Comptage des médias pour l'affichage
    const imageCount = 1 + secondaryImages.length; // principale + secondaires
    const videoCount = videoUrls.length;

    const handleEdit = () => navigate(`/products/${product.id}/edit`);
    const isVariantSaving = (variantId) =>
        variantId != null && savingVariantIds.includes(String(variantId));

    const handleUpdateVariant = async (variantId, payload) => {
        const key = String(variantId);
        setSavingVariantIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
        try {
            const { data } = await variantsAPI.update(variantId, payload);
            const patchedVariant = (data && typeof data === 'object') ? data : payload;
            setResolvedVariants((prev) =>
                updateVariantInTreeById(prev, variantId, patchedVariant),
            );
            setProductFromDetail((prev) => {
                if (!prev || !Array.isArray(prev.variants)) return prev;
                return {
                    ...prev,
                    variants: updateVariantInTreeById(prev.variants, variantId, patchedVariant),
                };
            });
            toast.success('Déclinaison mise à jour.');
        } catch (err) {
            toast.error(err?.message ?? 'Impossible de mettre à jour cette déclinaison.');
            throw err;
        } finally {
            setSavingVariantIds((prev) => prev.filter((idItem) => idItem !== key));
        }
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
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">Détail du produit</p>
                    </div>
                </div>
                <Button variant="primary" size="normal" onClick={handleEdit}>
                    <Pencil size={14} /> Modifier le produit
                </Button>
            </div>

            {/* ── Grille principale ── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

                {/* ── Galerie (col gauche) ── */}
                <div className="xl:col-span-2 flex flex-col gap-3">

                    {/* Visionneur */}
                    <div className="relative aspect-square rounded-3 overflow-hidden border border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                        <MediaViewer url={activeUrl} />

                        {allMedia.length > 1 && (
                            <>
                                <button onClick={prev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-0/85 dark:bg-neutral-0/85 border border-neutral-4 flex items-center justify-center text-neutral-7 hover:bg-neutral-0 hover:text-neutral-8 transition-colors cursor-pointer shadow-sm">
                                    <ChevronLeft size={15} />
                                </button>
                                <button onClick={next}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-0/85 dark:bg-neutral-0/85 border border-neutral-4 flex items-center justify-center text-neutral-7 hover:bg-neutral-0 hover:text-neutral-8 transition-colors cursor-pointer shadow-sm">
                                    <ChevronRight size={15} />
                                </button>
                                {/* Dots */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                    {allMedia.map((_, i) => (
                                        <button key={i} onClick={() => setActiveIndex(i)}
                                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer
                                                ${i === activeIndex ? 'w-4 bg-primary-1' : 'w-1.5 bg-neutral-0/60 hover:bg-neutral-0'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Miniatures */}
                    {allMedia.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {allMedia.map((url, i) => (
                                <MediaThumb
                                    key={i}
                                    url={url}
                                    index={i}
                                    active={i === activeIndex}
                                    onClick={() => setActiveIndex(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Infos (col droite) ── */}
                <div className="xl:col-span-3 flex flex-col gap-4">

                    {/* Badges statut */}
                    <div className="flex flex-wrap gap-2">
                        <ProductBadge type={isActive ? 'active' : 'inactive'} />
                        {stockBadge && <ProductBadge type={stockBadge} />}
                    </div>

                    {/* Bloc prix */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 px-5 py-4">
                        <div className="flex items-end gap-4 flex-wrap">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-poppins text-neutral-6 uppercase tracking-wide">Prix de vente</span>
                                <span className="text-3xl font-bold font-poppins text-primary-1 leading-none">
                                    {formatPrice(product.price)}
                                </span>
                            </div>

                            {product.original_price && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-poppins text-neutral-6 uppercase tracking-wide">Prix original</span>
                                    <span className="text-base font-semibold font-poppins text-neutral-5 line-through leading-none">
                                        {formatPrice(product.original_price)}
                                    </span>
                                </div>
                            )}

                            {discount && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-2 text-success-1 text-xs font-bold font-poppins ml-auto">
                                    <Tag size={11} /> -{discount}% de réduction
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Infos générales */}
                    <Section title="Informations">
                        <InfoRow label="Identifiant">
                            <span className="font-mono text-[11px] text-neutral-7 dark:text-neutral-7 break-all text-right max-w-[min(100%,14rem)] sm:max-w-none">
                                {String(product.id)}
                            </span>
                            <button
                                type="button"
                                onClick={async () => {
                                    const idStr = String(product.id);
                                    try {
                                        await navigator.clipboard.writeText(idStr);
                                        toast.success('Identifiant copié dans le presse-papiers.');
                                        setIdCopied(true);
                                        window.setTimeout(() => setIdCopied(false), 2000);
                                    } catch {
                                        toast.error('Impossible de copier. Sélectionnez l’identifiant manuellement.');
                                    }
                                }}
                                title="Copier l’identifiant"
                                aria-label="Copier l’identifiant produit"
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-4 dark:border-neutral-4
                                    text-primary-1 hover:bg-primary-5 dark:hover:bg-primary-1/15
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-0
                                    transition-colors cursor-pointer"
                            >
                                {idCopied ? <Check size={15} strokeWidth={2.25} className="text-success-1" /> : <Copy size={15} strokeWidth={2.25} />}
                            </button>
                        </InfoRow>
                        <InfoRow label="Catégorie">
                            <Package size={11} className="text-primary-1" />
                            {catName}
                        </InfoRow>
                        <InfoRow label="Stock disponible">
                            <span className={
                                unlimitedStock ? 'text-primary-1 font-semibold' :
                                    product.stock === 0 ? 'text-danger-1' :
                                        product.stock <= 5 ? 'text-warning-1' :
                                            'text-success-1'
                            }>
                                {unlimitedStock
                                    ? 'Illimité — toujours disponible'
                                    : `${product.stock} unité${product.stock !== 1 ? 's' : ''}`}
                            </span>
                        </InfoRow>
                        <InfoRow label="Statut">
                            <span className={`inline-flex items-center gap-1 ${isActive ? 'text-success-1' : 'text-neutral-6'}`}>
                                {isActive
                                    ? <><CheckCircle size={11} /> Actif — visible sur la boutique</>
                                    : <><XCircle size={11} /> Inactif — masqué</>
                                }
                            </span>
                        </InfoRow>
                        {allMedia.length > 0 && (
                            <InfoRow label="Médias">
                                {allMedia.length} fichier{allMedia.length > 1 ? 's' : ''}
                                <span className="text-neutral-5 font-normal">
                                    ({imageCount} image{imageCount > 1 ? 's' : ''}
                                    {videoCount > 0 && `, ${videoCount} vidéo${videoCount > 1 ? 's' : ''}`})
                                </span>
                            </InfoRow>
                        )}
                    </Section>

                    {/* Description */}
                    {product.description && (
                        <Section title="Description">
                            <p className="text-xs font-poppins text-neutral-7 dark:text-neutral-7 leading-relaxed py-3 whitespace-pre-line">
                                {product.description}
                            </p>
                        </Section>
                    )}

                    {(detailSizes.length > 0 || detailColors.length > 0 || detailCustom.length > 0) && (
                        <Section title="Caractéristiques">

                            {/* Tailles */}
                            {detailSizes.length > 0 && (
                                <div className="py-3 border-b border-neutral-4 dark:border-neutral-4">
                                    <p className="text-[11px] font-semibold font-poppins text-neutral-5 uppercase tracking-wide mb-2">Tailles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {detailSizes.map((size, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4 text-xs font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Couleurs */}
                            {detailColors.length > 0 && (
                                <div className="py-3 border-b border-neutral-4 dark:border-neutral-4">
                                    <p className="text-[11px] font-semibold font-poppins text-neutral-5 uppercase tracking-wide mb-2">Couleurs</p>
                                    <div className="flex flex-wrap gap-2">
                                        {detailColors.map((color, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4">
                                                {color.hex && (
                                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-4 shrink-0"
                                                        style={{ backgroundColor: color.hex }} />
                                                )}
                                                <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                                    {color.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Autres caractéristiques */}
                            {detailCustom.length > 0 && (
                                <div className="py-3">
                                    <p className="text-[11px] font-semibold font-poppins text-neutral-5 uppercase tracking-wide mb-2">Autres</p>
                                    <div className="flex flex-wrap gap-2">
                                        {detailCustom.map((detail, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4 text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                                                {detail}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </Section>
                    )}

                    {productAttributes.length > 0 && (
                        <Section title="Attributs (déclinaisons)">
                            <div className="py-2 flex flex-col gap-3">
                                {productAttributes.map((attr, i) => (
                                    <div key={i} className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 pb-3 last:pb-0">
                                        <p className="text-[11px] font-semibold font-poppins text-neutral-5 uppercase tracking-wide mb-2">
                                            {String(attr?.name ?? '—')}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(attr?.values) ? attr.values : []).map((val, j) => (
                                                <span
                                                    key={j}
                                                    className="px-3 py-1.5 rounded-full bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 text-xs font-poppins text-neutral-8"
                                                >
                                                    {String(val ?? '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    <Section title={resolvedVariants.length > 0 ? `Déclinaisons (${resolvedVariants.length})` : 'Déclinaisons'}>
                        {resolvedVariants.length === 0 ? (
                            <p className="text-xs font-poppins text-neutral-6 py-3">
                                Aucune déclinaison enregistrée pour ce produit.
                            </p>
                        ) : (
                            <div className="py-2 flex flex-col gap-2">
                                {resolvedVariants.map((v, idx) => (
                                    <VariantTreeNode
                                        key={v.id ?? idx}
                                        variant={v}
                                        level={0}
                                        onUpdateVariant={handleUpdateVariant}
                                        isVariantSaving={isVariantSaving}
                                    />
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Alertes stock */}
                    {!unlimitedStock && product.stock > 0 && product.stock <= 5 && (
                        <div className="flex items-start gap-3 bg-warning-2 border border-warning-1 rounded-3 px-4 py-3">
                            <AlertTriangle size={14} className="text-warning-1 shrink-0 mt-0.5" />
                            <p className="text-xs font-poppins font-medium text-warning-1 leading-relaxed">
                                Stock faible — il ne reste que <strong>{product.stock} unité{product.stock > 1 ? 's' : ''}</strong>. Pensez à réapprovisionner bientôt.
                            </p>
                        </div>
                    )}
                    {!unlimitedStock && product.stock === 0 && (
                        <div className="flex items-start gap-3 bg-danger-2 border border-danger-1 rounded-3 px-4 py-3">
                            <AlertTriangle size={14} className="text-danger-1 shrink-0 mt-0.5" />
                            <p className="text-xs font-poppins font-medium text-danger-1 leading-relaxed">
                                Rupture de stock — ce produit n'est plus disponible à la commande.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;