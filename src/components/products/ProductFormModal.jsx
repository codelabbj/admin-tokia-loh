import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Plus } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from './ProductStatusToggle';
import { useToast } from '../ui/ToastProvider';

// ── Helpers vidéo ─────────────────────────────────────────────
const getYouTubeThumbnail = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7]?.length === 11) ? match[7] : null;
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
};

const getVimeoThumbnail = async (url) => {
    const match = url.match(/vimeo.*\/(\d+)/i);
    const videoId = match ? match[1] : null;
    if (!videoId) return null;
    try {
        const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
        const data = await res.json();
        return data[0].thumbnail_large;
    } catch { return null; }
};

const getVideoType = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'direct';
};

const VideoThumbnail = ({ url }) => {
    const [thumbnail, setThumbnail] = React.useState(null);
    const [error, setError] = React.useState(false);
    const videoType = getVideoType(url);

    React.useEffect(() => {
        const load = async () => {
            if (videoType === 'youtube') setThumbnail(getYouTubeThumbnail(url));
            else if (videoType === 'vimeo') setThumbnail(await getVimeoThumbnail(url));
        };
        load();
    }, [url, videoType]);

    if (error || !thumbnail) return (
        <div className="w-full h-full bg-neutral-2 dark:bg-neutral-3 flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#FF8800" stroke="#FF8800" strokeWidth="1" />
                <circle cx="12" cy="12" r="4" fill="white" />
                <path d="M12 8L9 14H15L12 8Z" fill="#FF8800" />
            </svg>
        </div>
    );
    return <img src={thumbnail} alt="video thumbnail" className="w-full h-full object-cover" onError={() => setError(true)} />;
};

// ── Constantes ────────────────────────────────────────────────
const PRESET_COLORS = [
    { name: 'Noir', hex: '#000000' }, { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Gris', hex: '#808080' }, { name: 'Rouge', hex: '#EF4444' },
    { name: 'Rose', hex: '#EC4899' }, { name: 'Orange', hex: '#F97316' },
    { name: 'Jaune', hex: '#EAB308' }, { name: 'Vert', hex: '#10B981' },
    { name: 'Bleu', hex: '#3B82F6' }, { name: 'Indigo', hex: '#6366F1' },
    { name: 'Violet', hex: '#8B5CF6' }, { name: 'Marron', hex: '#92400E' },
    { name: 'Beige', hex: '#D4C5B9' }, { name: 'Kaki', hex: '#8D7B68' },
    { name: 'Marine', hex: '#1E3A8A' }, { name: 'Bordeaux', hex: '#7F1D1D' },
    { name: 'Turquoise', hex: '#14B8A6' }, { name: 'Corail', hex: '#FB7185' },
    { name: 'Or', hex: '#D97706' }, { name: 'Argent', hex: '#94A3B8' },
];

const EMPTY_FORM = {
    name: '',
    description: '',
    category: '',
    price: '',
    sale_price: '',
    stock: '',
    is_active: true,
    featured: false,
    mainImage: null,
    subImages: [],

    // Helpers UI (non envoyés à l'API)
    hasSizes: false,
    sizes: [],
    hasColors: false,
    colors: [],
};

const calcDiscount = (price, salePrice) => {
    const p = parseFloat(price), s = parseFloat(salePrice);
    if (!p || !s || s >= p) return null;
    return Math.round(((p - s) / p) * 100);
};

const parseOthersDetails = (others_details = []) => {
    const sizes = [];
    const colors = [];
    const custom = [];

    others_details.forEach((detail) => {
        if (typeof detail !== 'string') return;
        const colonIndex = detail.indexOf(':');
        if (colonIndex > 0) {
            const key = detail.substring(0, colonIndex).trim();
            const value = detail.substring(colonIndex + 1).trim();

            if (key === 'Taille') {
                sizes.push(value);
            } else if (key === 'Couleur') {
                const hexMatch = value.match(/#[0-9A-Fa-f]{6}/);
                const hex = hexMatch ? hexMatch[0] : '#000000';
                const name = value.replace(/\s*\(.*?\)/, '').trim();
                colors.push({ name, hex });
            } else {
                custom.push({ key, value });
            }
        } else {
            custom.push({ key: detail.trim(), value: '' });
        }
    });

    return { sizes, colors, custom };
};

const buildOthersDetails = (sizes, colors, custom) => {
    const result = [];

    sizes.forEach((size) => {
        if (size?.trim()) result.push(`Taille: ${size.trim()}`);
    });

    colors.forEach(({ name, hex }) => {
        if (name?.trim()) result.push(`Couleur: ${name.trim()} (${hex})`);
    });

    custom.forEach(({ key, value }) => {
        if (!key?.trim()) return;
        if (value?.trim()) {
            result.push(`${key.trim()}: ${value.trim()}`);
        } else {
            result.push(key.trim());
        }
    });

    return result;
};

/*
  Props :
  - open       : boolean
  - onClose    : () => void
  - product    : object | null
  - categories : tableau issu de useCategories()
  - onSave     : (payload) => Promise
*/
const ProductFormModal = ({ open, onClose, product = null, categories = [], onSave }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showImageUrlModal, setShowImageUrlModal] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState('');
    const [tempImageType, setTempImageType] = useState('main');

    const { toast } = useToast();

    // État séparé pour les détails personnalisés (hors tailles/couleurs)
    const [customDetails, setCustomDetails] = useState([]); // [{ key, value }]
    const [newDetailKey, setNewDetailKey] = useState('');
    const [newDetailVal, setNewDetailVal] = useState('');

    const mainImageRef = useRef(null);
    const subImageRef = useRef(null);
    const isEdit = !!product;

    // ── Pré-remplissage en mode édition ──────────────────────
    useEffect(() => {
        if (open) {
            if (product) {
                const { sizes, colors, custom } = parseOthersDetails(product.others_details ?? []);
                setForm({
                    ...EMPTY_FORM,
                    name: product.name ?? '',
                    description: product.description ?? '',
                    category: product.category ?? '',
                    price: product.original_price ?? product.price ?? '',
                    sale_price: product.original_price ? product.price ?? '' : '',
                    stock: product.stock ?? '',
                    is_active: product.is_active ?? product.status ?? true,
                    featured: product.featured ?? false,
                    mainImage: product.image ?? null,
                    subImages: (product.secondary_images ?? []).map(url => url),
                    hasSizes: sizes.length > 0,
                    sizes,
                    hasColors: colors.length > 0,
                    colors,
                });
                setCustomDetails(custom);
            } else {
                setForm(EMPTY_FORM);
                setCustomDetails([]);
            }
            setErrors({});
            setNewDetailKey('');
            setNewDetailVal('');
        }
    }, [open, product]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    // ── Handlers génériques ───────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // ── Images ────────────────────────────────────────────────
    const handleMainImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm(prev => ({ ...prev, mainImage: { file, preview: URL.createObjectURL(file) } }));
    };

    const handleAddImageUrl = () => {
        if (!tempImageUrl.trim()) return;
        if (tempImageType === 'main') {
            setForm(prev => ({ ...prev, mainImage: tempImageUrl }));
        } else {
            setForm(prev => ({ ...prev, subImages: [...prev.subImages, tempImageUrl] }));
        }
        setTempImageUrl('');
        setShowImageUrlModal(false);
    };

    const handleSubMedia = (e) => {
        const files = Array.from(e.target.files);
        const toAdd = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
        }));
        setForm(prev => ({ ...prev, subImages: [...prev.subImages, ...toAdd] }));
    };

    const removeSubImage = (index) =>
        setForm(prev => ({ ...prev, subImages: prev.subImages.filter((_, i) => i !== index) }));

    // ── Tailles ───────────────────────────────────────────────
    const handleAddSize = (size) => !form.sizes.includes(size) && setForm(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
    const handleRemoveSize = (size) => setForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));

    // ── Couleurs ──────────────────────────────────────────────
    const handleAddColor = (name, hex) => setForm(prev => ({ ...prev, colors: [...prev.colors, { name, hex }] }));
    const handleRemoveColor = (index) => setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));

    // ── Détails personnalisés ─────────────────────────────────
    const handleAddCustomDetail = () => {
        if (!newDetailKey.trim()) return;
        setCustomDetails(prev => [...prev, { key: newDetailKey.trim(), value: newDetailVal.trim() }]);
        setNewDetailKey('');
        setNewDetailVal('');
    };

    const handleRemoveCustomDetail = (index) =>
        setCustomDetails(prev => prev.filter((_, i) => i !== index));

    const handleCustomDetailChange = (index, field, value) =>
        setCustomDetails(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));

    // ── Validation ────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom requis';
        if (!form.category) e.category = 'Catégorie requise';
        if (!form.price) e.price = 'Prix requis';
        if (form.stock === '' || form.stock === null) e.stock = 'Stock requis';
        if (form.sale_price && parseFloat(form.sale_price) >= parseFloat(form.price))
            e.sale_price = 'Le prix réduit doit être inférieur au prix initial';
        if (!form.mainImage) e.mainImage = 'Image principale requise';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Soumission ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {

            const payload = {
                name: form.name,
                description: form.description || null,
                category: form.category,
                price: Number(form.price),
                sale_price: form.sale_price ? Number(form.sale_price) : null,
                stock: Number(form.stock),
                is_active: form.is_active,
                featured: form.featured,

                // Images
                mainImage: form.mainImage,
                subImages: form.subImages,

                // ✅ Format actuel de l'API : tableau de strings
                others_details: buildOthersDetails(form.sizes, form.colors, customDetails),
            };

            await onSave?.(payload);
            toast.success(
                isEdit
                    ? 'Produit mis à jour avec succès'
                    : 'Produit créé avec succès',
            );
            onClose();

        }
        catch (err) {
            if (err.response?.data?.file?.[0].includes('filename has at most 100 characters')) {
                toast.error('Le nom du fichier ne doit pas contenir plus de 100 caractères. Vérifier vos nom de fichiers.');
            }
            else if (err.response?.data?.file) {
                toast.error('Une erreur est survenue lors de la sauvegarde d\'image : ' + err.response?.data?.file);
            }
            else {
                toast.error('Une erreur est survenue, veullez réessayer.');
            }
        }
        finally {
            setLoading(false);
        }
    };

    const discount = calcDiscount(form.price, form.sale_price);

    return (
        <>
            <div className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 z-40 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4 shrink-0">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
                        </h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body scrollable */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

                        {/* ── Infos générales ── */}
                        <div className="flex flex-col gap-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Informations générales</p>
                            <InputField label="Nom du produit" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Robe Ankara Wax" error={errors.name} required />
                            <InputField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Décrivez le produit..." />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Catégorie <span className="text-danger-1">*</span>
                                </label>
                                <select name="category" value={form.category} onChange={handleChange}
                                    className="w-full rounded-full border border-neutral-5 dark:border-neutral-5 bg-neutral-0 dark:bg-neutral-0 px-4 py-2.5 text-xs text-neutral-8 dark:text-neutral-8 font-poppins outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all duration-200 cursor-pointer">
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-danger-1">{errors.category}</p>}
                            </div>
                        </div>

                        {/* ── Prix & Stock ── */}
                        <div className="flex flex-col gap-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Prix & Stock</p>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Prix initial (F)" name="price" type="number" value={form.price} onChange={handleChange} placeholder="Ex: 10000" error={errors.price} required />
                                <div className="flex flex-col gap-1.5">
                                    <InputField label="Prix réduit (F)" name="sale_price" type="number" value={form.sale_price} onChange={handleChange} placeholder="Ex: 7500" error={errors.sale_price} />
                                    {discount !== null && (
                                        <span className="text-[11px] font-semibold font-poppins text-success-1">✓ Réduction de {discount}%</span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Quantité en stock" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Ex: 20" error={errors.stock} required />
                                {form.stock !== '' && parseInt(form.stock) <= 5 && parseInt(form.stock) > 0 && (
                                    <div className="flex items-end pb-2">
                                        <span className="text-[11px] font-semibold font-poppins text-warning-1">⚠️ Stock faible</span>
                                    </div>
                                )}
                                {form.stock !== '' && parseInt(form.stock) === 0 && (
                                    <div className="flex items-end pb-2">
                                        <span className="text-[11px] font-semibold font-poppins text-danger-1">⛔ Rupture de stock</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Images ── */}
                        <div className="flex flex-col gap-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Images</p>

                            {/* Image principale */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Image principale <span className="text-danger-1">*</span>
                                </label>
                                {form.mainImage ? (
                                    <div className="relative w-32 h-32 rounded-2 overflow-hidden border border-neutral-4 group">
                                        <img src={typeof form.mainImage === 'string' ? form.mainImage : form.mainImage.preview} alt="principale" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setForm(prev => ({ ...prev, mainImage: null }))}
                                            className="absolute inset-0 bg-neutral-8/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                            <Trash2 size={18} className="text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => mainImageRef.current?.click()}
                                            className="w-32 h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer">
                                            <Upload size={20} />
                                            <span className="text-[11px] font-poppins">Fichier</span>
                                        </button>
                                        <button type="button" onClick={() => { setTempImageType('main'); setShowImageUrlModal(true); }}
                                            className="w-32 h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <span className="text-[11px] font-poppins">URL</span>
                                        </button>
                                    </div>
                                )}
                                <input ref={mainImageRef} type="file" accept="image/*" className="hidden" onChange={handleMainImage} />
                                {errors.mainImage && <p className="text-xs text-danger-1">{errors.mainImage}</p>}
                            </div>

                            {/* Images secondaires */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Images secondaires
                                    <span className="text-neutral-6 font-normal ml-1">({form.subImages.length})</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {form.subImages.map((media, i) => {
                                        const isYouTubeVimeo = typeof media === 'string' && ['youtube', 'vimeo'].includes(getVideoType(media));
                                        const isVideo = isYouTubeVimeo || (typeof media !== 'string' && media.type === 'video') || (typeof media === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(media));
                                        return (
                                            <div key={i} className="relative w-20 h-20 rounded-2 overflow-hidden border border-neutral-4 group">
                                                {isVideo
                                                    ? isYouTubeVimeo
                                                        ? <VideoThumbnail url={media} />
                                                        : <video src={typeof media === 'string' ? media : media.preview} className="w-full h-full object-cover" muted />
                                                    : <img src={typeof media === 'string' ? media : media.preview} alt={`media-${i}`} className="w-full h-full object-cover" />
                                                }
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-neutral-8/70 text-[9px] font-bold text-white">
                                                    {isVideo ? '🎬' : '🖼️'}
                                                </div>
                                                <button type="button" onClick={() => removeSubImage(i)}
                                                    className="absolute inset-0 bg-neutral-8/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                    <Trash2 size={14} className="text-white" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button type="button" onClick={() => subImageRef.current?.click()}
                                        className="w-20 h-20 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-1 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer">
                                        <Upload size={16} />
                                        <span className="text-[10px] font-poppins">Fichier</span>
                                    </button>
                                    <button type="button" onClick={() => { setTempImageType('sub'); setShowImageUrlModal(true); }}
                                        className="w-20 h-20 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-1 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span className="text-[10px] font-poppins">URL</span>
                                    </button>
                                </div>
                                <input ref={subImageRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleSubMedia} />
                            </div>
                        </div>

                        {/* ── Tailles ── */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Tailles</p>
                                <ProductStatusToggle active={form.hasSizes} onChange={val => setForm(prev => ({ ...prev, hasSizes: val, sizes: val ? prev.sizes : [] }))} />
                            </div>
                            {form.hasSizes && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                                            <button key={size} type="button"
                                                onClick={() => form.sizes.includes(size) ? handleRemoveSize(size) : handleAddSize(size)}
                                                className={`px-4 py-2 rounded-full text-xs font-semibold font-poppins transition-all cursor-pointer ${form.sizes.includes(size) ? 'bg-primary-1 text-white' : 'bg-neutral-2 text-neutral-6 hover:bg-neutral-3'}`}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="text" placeholder="Autre taille (Ex: 38, 42...)"
                                        className="flex-1 rounded-full border border-neutral-5 bg-neutral-0 px-4 py-2 text-xs text-neutral-8 font-poppins outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { handleAddSize(v); e.target.value = ''; } } }} />
                                    {form.sizes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-3">
                                            <span className="text-xs font-semibold text-neutral-6 w-full">Sélectionnées :</span>
                                            {form.sizes.map((size, i) => (
                                                <div key={i} className="flex items-center gap-1 px-3 py-1 bg-primary-5 rounded-full">
                                                    <span className="text-xs font-semibold text-primary-1">{size}</span>
                                                    <button type="button" onClick={() => handleRemoveSize(size)} className="cursor-pointer"><X size={12} className="text-primary-1" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Couleurs ── */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Couleurs</p>
                                <ProductStatusToggle active={form.hasColors} onChange={val => setForm(prev => ({ ...prev, hasColors: val, colors: val ? prev.colors : [] }))} />
                            </div>
                            {form.hasColors && (
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-10 gap-2">
                                        {PRESET_COLORS.map(color => {
                                            const isSelected = form.colors.some(c => c.hex === color.hex);
                                            return (
                                                <button key={color.hex} type="button"
                                                    onClick={() => !isSelected && handleAddColor(color.name, color.hex)}
                                                    disabled={isSelected}
                                                    title={color.name}
                                                    className={`w-full aspect-square rounded-md border-2 transition-all ${isSelected ? 'border-neutral-4 opacity-40 cursor-not-allowed' : 'border-transparent hover:border-primary-1 hover:scale-110 cursor-pointer'}`}
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                            );
                                        })}
                                    </div>
                                    {form.colors.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-3">
                                            {form.colors.map((color, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-2 rounded-full">
                                                    <div className="w-5 h-5 rounded-full border-2 border-neutral-4" style={{ backgroundColor: color.hex }} />
                                                    <span className="text-xs font-semibold text-neutral-8">{color.name}</span>
                                                    <button type="button" onClick={() => handleRemoveColor(i)} className="cursor-pointer">
                                                        <X size={12} className="text-neutral-6" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Détails personnalisés ── */}
                        <div className="flex flex-col gap-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Autres caractéristiques
                            </p>
                            {/* <p className="text-[11px] font-poppins text-neutral-5 -mt-2">
                                ✅ Format accepté : "Clé: Valeur" (ex: "Matière: Coton") ou juste une valeur (ex: "Edite")
                            </p> */}

                            {/* Liste des détails existants */}
                            {customDetails.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {customDetails.map((detail, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={detail.key}
                                                onChange={e => handleCustomDetailChange(i, 'key', e.target.value)}
                                                placeholder="Attribut"
                                                className="w-32 shrink-0 rounded-full border border-neutral-4 bg-neutral-2 px-3 py-1.5 text-xs font-poppins text-neutral-8 outline-none focus:border-primary-1 focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all"
                                            />
                                            <span className="text-neutral-5 text-xs">:</span>
                                            <input
                                                type="text"
                                                value={detail.value}
                                                onChange={e => handleCustomDetailChange(i, 'value', e.target.value)}
                                                placeholder="Valeur (optionnel)"
                                                className="flex-1 rounded-full border border-neutral-4 bg-neutral-2 px-3 py-1.5 text-xs font-poppins text-neutral-8 outline-none focus:border-primary-1 focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all"
                                            />
                                            <button type="button" onClick={() => handleRemoveCustomDetail(i)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-5 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer shrink-0">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ajout d'un nouveau détail */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newDetailKey}
                                        onChange={e => setNewDetailKey(e.target.value)}
                                        placeholder="Ex: Matière"
                                        className="w-32 shrink-0 rounded-full border border-neutral-4 bg-neutral-0 px-3 py-1.5 text-xs font-poppins text-neutral-8 outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomDetail(); } }}
                                    />
                                    <span className="text-neutral-5 text-xs">:</span>
                                    <input
                                        type="text"
                                        value={newDetailVal}
                                        onChange={e => setNewDetailVal(e.target.value)}
                                        placeholder="Ex: Coton 100% (optionnel)"
                                        className="flex-1 rounded-full border border-neutral-4 bg-neutral-0 px-3 py-1.5 text-xs font-poppins text-neutral-8 outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomDetail(); } }}
                                    />
                                    <button type="button" onClick={handleAddCustomDetail}
                                        disabled={!newDetailKey.trim()}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-1 text-white hover:bg-primary-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0">
                                        <Plus size={13} />
                                    </button>
                                </div>
                                {newDetailKey.trim() && (
                                    <p className="text-[11px] font-poppins text-warning-1 pl-1">
                                        ⚠️ Cliquez sur <strong>+</strong> pour confirmer l'ajout, sinon la caractéristique ne sera pas enregistrée.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Paramètres ── */}
                        <div className="flex flex-col gap-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Paramètres</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">Produit actif</p>
                                        <p className="text-[11px] font-poppins text-neutral-6">Visible sur la boutique</p>
                                    </div>
                                    <ProductStatusToggle active={form.is_active} onChange={val => setForm(prev => ({ ...prev, is_active: val }))} />
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4 shrink-0">
                        <Button variant="ghost" size="normal" onClick={onClose} type="button">Annuler</Button>
                        <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                            {isEdit ? 'Enregistrer' : 'Créer le produit'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal URL */}
            {showImageUrlModal && (
                <>
                    <div className="fixed inset-0 bg-neutral-8/60 z-60 backdrop-blur-sm" onClick={() => setShowImageUrlModal(false)} />
                    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                        <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-md p-6">
                            <h3 className="text-sm font-bold font-poppins text-neutral-8 mb-4">Ajouter un média via URL</h3>
                            <InputField label="URL du média" value={tempImageUrl} onChange={e => setTempImageUrl(e.target.value)} placeholder="https://exemple.com/media.jpg" hint="Formats acceptés : JPG, PNG, MP4, WEBM, YouTube, Vimeo" />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" size="normal" onClick={() => setShowImageUrlModal(false)}>Annuler</Button>
                                <Button variant="primary" size="normal" onClick={handleAddImageUrl}>Ajouter</Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default ProductFormModal;