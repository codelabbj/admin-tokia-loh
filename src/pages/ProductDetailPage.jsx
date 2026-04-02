/* eslint-disable react-hooks/set-state-in-effect */
// version 2.2.0 - Correction affichage others_details
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Pencil, Tag,
    Package, CheckCircle, XCircle, AlertTriangle, Loader2,
    ChevronLeft, ChevronRight, Play, ImageOff
} from 'lucide-react';
import { useProducts, normalizeProduct } from '../hooks/useProducts';
import { productsAPI } from '../api/products.api';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import ProductBadge from '../components/products/ProductBadge';

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

// ── PAGE ──────────────────────────────────────────────────────
const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading: productsLoading, update } = useProducts();
    const { categories } = useCategories();

    const [activeIndex, setActiveIndex] = useState(0);
    const [productFromDetail, setProductFromDetail] = useState(null);

    const productFromList = useMemo(
        () => products.find(p => String(p.id) === String(id)) ?? null,
        [products, id],
    );
    const product = productFromList ?? productFromDetail;

    const needsDetailFetch =
        !!id && !productsLoading && !productFromList;

    useEffect(() => {
        if (productFromList) setProductFromDetail(null);
    }, [productFromList]);

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

    const allDetails = (product.others_details ?? [])
        .filter(d => typeof d === 'string' && d.trim())
        .map(d => d.trim());

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