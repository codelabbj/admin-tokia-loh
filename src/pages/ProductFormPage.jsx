import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Upload, Trash2, Plus, X, Loader2, Images } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ProductStatusToggle from '../components/products/ProductStatusToggle';
import {
    useProducts,
    normalizeProduct,
    normalizeOthersDetails,
} from '../hooks/useProducts';
import { productsAPI } from '../api/products.api';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../components/ui/ToastProvider';
import { parseBackendErrorResponse } from '../utils/apiErrorResponse';
import MediaPickerModal from '../components/media/MediaPickerModal';
import { variantsAPI } from '../api/variants.api';
import VariantsEditorTree, { VARIANT_TERM } from '../components/products/VariantsEditorTree';
import { PRESET_COLORS } from '../constants/productPresetColors';
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

const EMPTY_FORM = {
    name: '',
    description: '',
    category: '',
    price: '',
    sale_price: '',
    stock: '',
    unlimited_stock: false,
    is_active: true,
    featured: false,
    mainImage: null,
    subImages: [],
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
        const normalized = typeof detail === 'string'
            ? (() => {
                const colonIndex = detail.indexOf(':');
                if (colonIndex > 0) {
                    return {
                        key: detail.substring(0, colonIndex).trim(),
                        value: detail.substring(colonIndex + 1).trim(),
                    };
                }
                return { key: detail.trim(), value: '' };
            })()
            : {
                key: String(detail?.key ?? '').trim(),
                value: String(detail?.value ?? '').trim(),
            };
        const key = normalized.key;
        const value = normalized.value;
        if (!key) return;

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
    });

    return { sizes, colors, custom };
};

const buildOthersDetails = (sizes, colors, custom) => {
    const result = [];

    sizes.forEach((size) => {
        if (size?.trim()) result.push({ key: 'Taille', value: size.trim() });
    });

    colors.forEach(({ name, hex }) => {
        if (name?.trim()) result.push({ key: 'Couleur', value: `${name.trim()} (${hex})` });
    });

    custom.forEach(({ key, value }) => {
        if (!key?.trim()) return;
        result.push({ key: key.trim(), value: value?.trim() ?? '' });
    });

    return result;
};

const normalizeAttributesForForm = (attributes = []) => {
    if (!Array.isArray(attributes)) return [];
    return attributes
        .map((a) => ({
            name: String(a?.name ?? '').trim(),
            values: Array.isArray(a?.values)
                ? a.values.map(v => String(v ?? '').trim()).filter(Boolean)
                : [],
        }))
        .filter((a) => a.name);
};

const normalizeVariantsForForm = (variants = [], attributes = []) => {
    if (!Array.isArray(variants)) return [];
    const fallbackAttrMap = Object.fromEntries(
        attributes.map((a) => [a.name, a.values?.[0] ?? '']),
    );
    return variants.map((v) => {
        const attrMap = { ...fallbackAttrMap };
        (v?.attributes ?? []).forEach((av) => {
            const key = String(av?.name ?? '').trim();
            if (!key) return;
            attrMap[key] = String(av?.value ?? '').trim();
        });
        const keyStr = String(v?.key ?? '').toLowerCase().trim();
        let uiTypeVal = undefined;
        if (keyStr === 'taille') uiTypeVal = 'Taille';
        else if (keyStr === 'couleur') uiTypeVal = 'Couleur';

        return {
            id: v?.id ?? null,
            key: v?.key ?? '',
            _uiType: uiTypeVal,
            sku: String(v?.sku ?? v?.name ?? '').trim(),
            name: String(v?.name ?? '').trim(),
            price: String(v?.price ?? '').trim(),
            original_price: v?.original_price == null ? '' : String(v.original_price),
            stock: v?.stock == null ? '' : String(v.stock),
            unlimited_stock: v?.unlimited_stock === true,
            status: v?.status ?? true,
            image: v?.image ?? '',
            sub_variants: normalizeVariantsForForm(v?.sub_variants || [], attributes),
            secondary_images: Array.isArray(v?.secondary_images) ? v.secondary_images : [],
            others_details: normalizeOthersDetails(v?.others_details ?? []),
            attrMap,
        };
    });
};

const buildAllowedVariantAttributes = (form, customDetails) => {
    const map = new Map();
    if (form?.hasSizes && Array.isArray(form?.sizes) && form.sizes.length > 0) {
        map.set(
            'Taille',
            Array.from(new Set(form.sizes.map((s) => String(s ?? '').trim()).filter(Boolean))),
        );
    }
    if (form?.hasColors && Array.isArray(form?.colors) && form.colors.length > 0) {
        map.set(
            'Couleur',
            Array.from(new Set(form.colors.map((c) => String(c?.name ?? '').trim()).filter(Boolean))),
        );
    }
    (customDetails ?? []).forEach((d) => {
        const key = String(d?.key ?? '').trim();
        const value = String(d?.value ?? '').trim();
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        if (value) {
            const arr = map.get(key);
            if (!arr.includes(value)) arr.push(value);
        }
    });
    return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
};

// ── Section wrapper ───────────────────────────────────────────
const FormSection = ({ title, children, overflowVisible }) => (
    <div className={`bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 ${overflowVisible ? '' : 'overflow-hidden'}`}>
        <div className={`px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2 ${overflowVisible ? 'rounded-t-3 overflow-hidden' : ''}`}>
            <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">{title}</p>
        </div>
        <div className="px-5 py-5 flex flex-col gap-4">
            {children}
        </div>
    </div>
);

// ── PAGE ──────────────────────────────────────────────────────
const ProductFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading: productsLoading, create, update } = useProducts();
    const { categories } = useCategories();
    const { toast } = useToast();
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState({ type: 'main' });
    const [productFromDetail, setProductFromDetail] = useState(null);

    const isEdit = !!id;
    const productFromList = isEdit
        ? products.find(p => String(p.id) === String(id)) ?? null
        : null;
    const product = productFromList ?? productFromDetail;

    const needsDetailFetch =
        isEdit &&
        !!id &&
        !productsLoading &&
        !productFromList;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showImageUrlModal, setShowImageUrlModal] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState('');
    const [tempImageType, setTempImageType] = useState('main');
    const [tempImageVariantIdx, setTempImageVariantIdx] = useState(null);
    const [tempImageVariantPath, setTempImageVariantPath] = useState(null);
    const [customDetails, setCustomDetails] = useState([]);
    const [newDetailKey, setNewDetailKey] = useState('');
    const [newDetailVal, setNewDetailVal] = useState('');
    const [variantsDraft, setVariantsDraft] = useState([]);
    /** Incrémenté après chargement async des variantes (GET v2) pour ré-appliquer le filtre attributs. */
    const [variantSourceTick, setVariantSourceTick] = useState(0);
    const allowedVariantAttributes = useMemo(
        () => buildAllowedVariantAttributes(form, customDetails),
        [form, customDetails],
    );

    const mainImageRef = useRef(null);
    const subImageRef = useRef(null);
    /** Ancre sous la liste des cartes variantes (scroll après « + Variante »). */
    const variantsAnchorAfterCardsRef = useRef(null);
    const scrollToVariantsAnchorPendingRef = useRef(false);

    // ── Titre de la page ──────────────────────────────────────
    useEffect(() => {
        document.title = isEdit
            ? `Admin Tokia-Loh | Modifier ${product?.name ?? '…'}`
            : 'Admin Tokia-Loh | Nouveau produit';
    }, [isEdit, product]);

    useEffect(() => {
        if (productFromList) setProductFromDetail(null);
    }, [productFromList]);

    // ── Produit absent de la liste paginée : chargement GET /products/:id/ ──
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

    // ── Pré-remplissage en mode édition ──────────────────────
    useEffect(() => {
        let cancelled = false;
        if (isEdit && product) {
            const { sizes, colors, custom } = parseOthersDetails(product.others_details ?? []);
            const normalizedAttributes = normalizeAttributesForForm(product.attributes ?? []);
            setForm({
                ...EMPTY_FORM,
                name: product.name ?? '',
                description: product.description ?? '',
                category: product.category ?? '',
                price: product.original_price ?? product.price ?? '',
                sale_price: product.original_price ? product.price ?? '' : '',
                stock: product.stock ?? '',
                unlimited_stock: product.unlimited_stock === true,
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

            const embedded = product.variants ?? [];
            setVariantsDraft(normalizeVariantsForForm(embedded, normalizedAttributes));

            const needFetchVariants =
                product.id &&
                (!Array.isArray(embedded) || embedded.length === 0);

            if (needFetchVariants) {
                (async () => {
                    try {
                        const found = await variantsAPI.listAllForProduct(product.id);
                        if (cancelled) return;
                        if (found.length > 0) {
                            const attrs = normalizeAttributesForForm(product.attributes ?? []);
                            setVariantsDraft(normalizeVariantsForForm(found, attrs));
                            setVariantSourceTick((t) => t + 1);
                        }
                    } catch {
                        /* ignore — variante absentes ou erreur réseau */
                    }
                })();
            }
        } else if (!isEdit) {
            setForm(EMPTY_FORM);
            setCustomDetails([]);
            setVariantsDraft([]);
        }
        setErrors({});
        setNewDetailKey('');
        setNewDetailVal('');
        return () => {
            cancelled = true;
        };
    }, [isEdit, product]);

    useEffect(() => {
        const allowedByName = new Map(
            allowedVariantAttributes.map((a) => [a.name, a.values ?? []]),
        );
        setVariantsDraft((prev) =>
            prev.map((v) => {
                const nextMap = {};
                Object.entries(v.attrMap ?? {}).forEach(([k, val]) => {
                    if (!allowedByName.has(k)) return;
                    const allowedValues = allowedByName.get(k) ?? [];
                    const strVal = String(val ?? '').trim();
                    nextMap[k] = allowedValues.includes(strVal)
                        ? strVal
                        : (allowedValues[0] ?? '');
                });
                return { ...v, attrMap: nextMap };
            }),
        );
    }, [allowedVariantAttributes, variantSourceTick]);

    useEffect(() => {
        if (!scrollToVariantsAnchorPendingRef.current) return;
        scrollToVariantsAnchorPendingRef.current = false;
        const el = variantsAnchorAfterCardsRef.current;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [variantsDraft.length]);

    // ── Loader pendant la résolution du produit en édition ───
    if (isEdit && (productsLoading || (needsDetailFetch && !productFromDetail))) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="animate-spin text-primary-1" />
            </div>
        );
    }

    if (isEdit && !product) return null;

    // ── Handlers génériques ───────────────────────────────────
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const next = type === 'checkbox' ? checked : value;
        setForm(prev => {
            const nextState = { ...prev, [name]: next };
            if (name === 'unlimited_stock' && checked) {
                nextState.stock = '';
            }
            return nextState;
        });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleClose = () => navigate(-1);

    // ── Images ────────────────────────────────────────────────
    const handleMainImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm(prev => ({ ...prev, mainImage: { file, preview: URL.createObjectURL(file) } }));
    };

    /* const handleMediaSelect = (file) => {
        if (!file || !file.file) {  // ✅ Changé de file.url à file.file
            toast.error('Fichier invalide');
            return;
        }

        if (mediaPickerTarget === 'main') {
            setForm(prev => ({ ...prev, mainImage: file.file }));  // ✅ Changé de file.url à file.file
        } else {
            setForm(prev => ({ ...prev, subImages: [...prev.subImages, file.file] }));  // ✅ Changé de file.url à file.file
        }
    }; */

    const handleMediaSelect = (fileOrFiles) => {
        // Gérer le cas de la sélection multiple (tableau) ou unique (objet)
        const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

        // Vérifier que tous les fichiers sont valides
        const validFiles = files.filter(f => f && f.file);

        if (validFiles.length === 0) {
            toast.error('Fichier(s) invalide(s)');
            return;
        }

        if (mediaPickerTarget.type === 'main') {
            setForm(prev => ({ ...prev, mainImage: validFiles[0].file }));
        } else if (mediaPickerTarget.type === 'sub') {
            const urls = validFiles.map(f => f.file);
            setForm(prev => ({ ...prev, subImages: [...prev.subImages, ...urls] }));
        } else if (mediaPickerTarget.type === 'variant') {
            const idx = mediaPickerTarget.index;
            const picked = validFiles[0].file;
            setVariantsDraft((prev) =>
                prev.map((v, i) => (i === idx ? { ...v, image: picked } : v)),
            );
        } else if (mediaPickerTarget.type === 'variantTree') {
            const path = mediaPickerTarget.path;
            const picked = validFiles[0].file;
            setVariantsDraft((prev) => {
                const updateAtPath = (list, p, file) => {
                    if (p.length === 1) {
                        const newList = [...list];
                        newList[p[0]] = { ...newList[p[0]], image: file };
                        return newList;
                    }
                    if (p.length === 0) return list;
                    const newList = [...list];
                    const targetSub = newList[p[0]].sub_variants || [];
                    newList[p[0]] = { ...newList[p[0]], sub_variants: updateAtPath(targetSub, p.slice(1), file) };
                    return newList;
                };
                return updateAtPath(prev, path, picked);
            });
        }
    };

    const handleAddImageUrl = () => {
        if (!tempImageUrl.trim()) return;
        if (tempImageType === 'variantTree' && tempImageVariantPath) {
            setVariantsDraft((prev) => {
                const updateAtPath = (list, p, file) => {
                    if (p.length === 1) {
                        const newList = [...list];
                        newList[p[0]] = { ...newList[p[0]], image: file };
                        return newList;
                    }
                    if (p.length === 0) return list;
                    const newList = [...list];
                    const targetSub = newList[p[0]].sub_variants || [];
                    newList[p[0]] = { ...newList[p[0]], sub_variants: updateAtPath(targetSub, p.slice(1), file) };
                    return newList;
                };
                return updateAtPath(prev, tempImageVariantPath, tempImageUrl.trim());
            });
            setTempImageVariantPath(null);
        } else if (tempImageType === 'variant' && tempImageVariantIdx != null) {
            setVariantsDraft((prev) =>
                prev.map((v, i) =>
                    i === tempImageVariantIdx ? { ...v, image: tempImageUrl.trim() } : v,
                ),
            );
            setTempImageVariantIdx(null);
        } else if (tempImageType === 'main') {
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
    const handleAddSize = (size) => {
        if (form.sizes.includes(size)) return;
        setForm(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
        if (form.hasSizes) {
            setVariantsDraft(prev => [...prev, { ...createEmptyVariant(), key: 'taille', sku: size, name: size, price: String(form.sale_price || form.price || '') }]);
        }
    };
    const handleRemoveSize = (size) => {
        setForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
        if (form.hasSizes) {
            setVariantsDraft(prev => prev.filter(v => v.sku !== size));
        }
    };

    // ── Couleurs ──────────────────────────────────────────────
    const handleAddColor = (name, hex) => {
        setForm(prev => ({ ...prev, colors: [...prev.colors, { name, hex }] }));
        if (form.hasColors) {
            setVariantsDraft(prev => [...prev, { ...createEmptyVariant(), key: 'couleur', sku: name, name, price: String(form.sale_price || form.price || '') }]);
        }
    };
    const handleRemoveColor = (index, colorObj) => {
        const colorName = colorObj ? colorObj.name : form.colors[index]?.name;
        const actualIndex = index !== undefined ? index : form.colors.findIndex(c => c.name === colorName);
        if (actualIndex >= 0) {
            setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== actualIndex) }));
        }
        if (form.hasColors && colorName) {
            setVariantsDraft(prev => prev.filter(v => v.sku !== colorName));
        }
    };

    // ── Détails personnalisés ─────────────────────────────────
    const handleAddCustomDetail = () => {
        if (!newDetailKey.trim()) return;
        const key = newDetailKey.trim();
        const value = newDetailVal.trim();
        setCustomDetails(prev => [...prev, { key, value }]);
        setNewDetailKey('');
        setNewDetailVal('');
        if (!form.hasSizes && !form.hasColors) {
            setVariantsDraft(prev => [...prev, { ...createEmptyVariant(), key: key, sku: value || key, name: value || key, price: String(form.sale_price || form.price || '') }]);
        }
    };

    const handleRemoveCustomDetail = (index) => {
        const detail = customDetails[index];
        setCustomDetails(prev => prev.filter((_, i) => i !== index));
        if (!form.hasSizes && !form.hasColors && detail) {
            setVariantsDraft(prev => prev.filter(v => v.sku !== (detail.value || detail.key)));
        }
    };

    const handleCustomDetailChange = (index, field, value) =>
        setCustomDetails(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));

    const createEmptyVariant = () => ({
        id: null,
        key: '',
        sku: '',
        price: '',
        original_price: '',
        stock: '',
        unlimited_stock: false,
        status: true,
        image: '',
        secondary_images: [],
        others_details: [],
        attrMap: {},
    });
    // ── Validation ────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom requis';
        if (!form.category) e.category = 'Catégorie requise';
        const hasVariants = variantsDraft.length > 0;
        if (!form.price) e.price = 'Prix requis';
        else if (parseFloat(form.price) < 0) e.price = 'Le prix ne peut pas être négatif';

        if (!form.unlimited_stock && (form.stock === '' || form.stock === null)) e.stock = 'Stock requis';
        else if (!form.unlimited_stock && parseInt(form.stock, 10) < 0) e.stock = 'Le stock ne peut pas être négatif';

        if (form.sale_price) {
            const sp = parseFloat(form.sale_price);
            const p = parseFloat(form.price);
            if (sp < 0) e.sale_price = 'Le prix réduit ne peut pas être négatif';
            else if (sp >= p) e.sale_price = 'Le prix réduit doit être inférieur au prix initial';
        }
        if (!form.mainImage) e.mainImage = 'Image principale requise';

        if (hasVariants && !form.unlimited_stock && form.stock !== '' && form.stock !== null) {
            const countTotalLeafStock = (variantsList) => {
                let total = 0;
                variantsList.forEach(v => {
                    const sub = v.sub_variants || [];
                    if (sub.length > 0) {
                        total += countTotalLeafStock(sub);
                    } else if (!v.unlimited_stock) {
                        total += Number(v.stock || 0);
                    }
                });
                return total;
            };
            const sum = countTotalLeafStock(variantsDraft);
            if (sum > Number(form.stock)) {
                e.variants = `La somme des stocks des déclinaisons finales (${sum}) ne doit pas dépasser le stock global défini (${form.stock}).`;
            }
        }

        if (hasVariants) {
            // Detailed validation is delegated to API V2 for tree variants.
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Soumission ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const rootType = form.hasSizes ? 'Taille' : (form.hasColors ? 'Couleur' : 'Autre');
            const cleanVariantsPayload = (list, inheritedType) => {
                return list.map(v => {
                    const uiType = v._uiType || inheritedType;
                    let k = v.key;
                    if (uiType === 'Taille') k = 'taille';
                    if (uiType === 'Couleur') k = 'couleur';
                    return {
                        ...v,
                        key: k,
                        sub_variants: Array.isArray(v.sub_variants) ? cleanVariantsPayload(v.sub_variants, null) : []
                    };
                });
            };
            const variantsToSubmit = variantsDraft.length > 0 ? cleanVariantsPayload(variantsDraft, rootType) : undefined;

            const payload = {
                name: form.name,
                description: form.description || null,
                category: form.category,
                price: Number(form.price),
                sale_price: form.sale_price ? Number(form.sale_price) : null,
                stock: Number(form.stock === '' || form.stock === null ? 0 : form.stock),
                unlimited_stock: form.unlimited_stock,
                is_active: form.is_active,
                mainImage: form.mainImage,
                subImages: form.subImages,
                others_details: buildOthersDetails(form.sizes, form.colors, customDetails),
                variants: variantsToSubmit,
            };

            if (isEdit) {
                await update(product.id, payload);
            } else {
                await create(payload);
            }

            toast.success(isEdit ? 'Produit mis à jour avec succès' : 'Produit créé avec succès');
            navigate('/products');

        } catch (err) {
            if (err.response?.data?.file?.[0]?.includes('filename has at most 100 characters')) {
                toast.error('Le nom du fichier ne doit pas contenir plus de 100 caractères. Vérifiez vos noms de fichiers.');
            } else if (err.response?.data?.file) {
                toast.error("Une erreur est survenue lors de la sauvegarde d'image : " + err.response?.data?.file);
            } else {
                const { message, existingId } = parseBackendErrorResponse(err);
                const dup =
                    message &&
                    existingId &&
                    err.response?.status === 400;
                if (dup) {
                    toast.error(
                        `${message} — Cliquez pour ouvrir la fiche existante.`,
                        {
                            duration: 8000,
                            onClick: () => navigate(`/products/${existingId}`),
                        },
                    );
                } else if (message) {
                    toast.error(message);
                } else {
                    toast.error('Une erreur est survenue, veuillez réessayer.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const discount = calcDiscount(form.price, form.sale_price);

    const renderVariantsTree = () => (
        <FormSection title={VARIANT_TERM.plural} overflowVisible={true}>
            <VariantsEditorTree
                variants={variantsDraft}
                onChange={setVariantsDraft}
                productPrice={form.sale_price || form.price}
                globalUnlimitedStock={!!form.unlimited_stock}
                rootType={form.hasSizes ? 'Taille' : (form.hasColors ? 'Couleur' : 'Autre')}
                disableRootAdd={form.hasSizes || form.hasColors}
                onRemoveRoot={(rootVariant) => {
                    if (form.hasSizes) {
                        handleRemoveSize(rootVariant.sku);
                    } else if (form.hasColors) {
                        const cidx = form.colors.findIndex(c => c.name === rootVariant.sku);
                        if (cidx >= 0) handleRemoveColor(cidx);
                    } else {
                        const didx = customDetails.findIndex(d => (d.value || d.key) === rootVariant.sku);
                        if (didx >= 0) handleRemoveCustomDetail(didx);
                    }
                }}
                onImageSelectRequest={(path) => {
                    setMediaPickerTarget({ type: 'variantTree', path });
                    setMediaPickerOpen(true);
                }}
                onImageUrlRequest={(path) => {
                    setTempImageType('variantTree');
                    setTempImageVariantPath(path);
                    setTempImageUrl('');
                    setShowImageUrlModal(true);
                }}
            />
            {errors.variants && <p className="text-xs text-danger-1 mt-2">{errors.variants}</p>}
        </FormSection>
    );

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8 leading-tight">
                            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">
                            {isEdit ? product?.name : 'Remplissez les informations du produit'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="normal" type="button" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                        {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
                    </Button>
                </div>
            </div>

            {/* ── Grille deux colonnes sur grand écran ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* ── Colonne gauche (2/3) ── */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Infos générales */}
                    <FormSection title="Informations générales">
                        <InputField
                            label="Nom du produit"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ex: Robe Ankara Wax"
                            error={errors.name}
                            required
                        />
                        <InputField
                            label="Description"
                            name="description"
                            type="textarea"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Décrivez le produit..."
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Catégorie <span className="text-danger-1">*</span>
                            </label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="w-full rounded-md border border-neutral-5 dark:border-neutral-5 bg-neutral-0 dark:bg-neutral-0 px-4 py-2.5 text-xs text-neutral-8 dark:text-neutral-8 font-poppins outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all duration-200 cursor-pointer"
                            >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-xs text-danger-1">{errors.category}</p>}
                        </div>
                    </FormSection>

                    {/* Prix & Stock */}
                    <FormSection title="Prix & Stock">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Prix initial (F)"
                                name="price"
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="Ex: 10000"
                                error={errors.price}
                                required
                            />
                            <div className="flex flex-col gap-1.5">
                                <InputField
                                    label="Prix réduit (F)"
                                    name="sale_price"
                                    type="number"
                                    min="0"
                                    value={form.sale_price}
                                    onChange={handleChange}
                                    placeholder="Ex: 7500"
                                    error={errors.sale_price}
                                />
                                {discount !== null && (
                                    <span className="text-[11px] font-semibold font-poppins text-success-1">
                                        ✓ Réduction de {discount}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <InputField
                                label="Quantité en stock"
                                name="stock"
                                type="number"
                                min="0"
                                value={form.unlimited_stock ? '' : form.stock}
                                onChange={handleChange}
                                placeholder={form.unlimited_stock ? "Illimité" : "Ex: 20"}
                                disabled={form.unlimited_stock}
                                error={errors.stock}
                                required={!form.unlimited_stock}
                            />
                            {!form.unlimited_stock && form.stock !== '' && parseInt(form.stock, 10) <= 5 && parseInt(form.stock, 10) > 0 && (
                                <div className="pb-2">
                                    <span className="text-[11px] font-semibold font-poppins text-warning-1">⚠️ Stock faible</span>
                                </div>
                            )}
                            {!form.unlimited_stock && form.stock !== '' && parseInt(form.stock, 10) === 0 && (
                                <div className="pb-2">
                                    <span className="text-[11px] font-semibold font-poppins text-danger-1">⛔ Rupture de stock</span>
                                </div>
                            )}
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer select-none rounded-md border border-neutral-4 dark:border-neutral-4 px-4 py-3 bg-neutral-2/50 dark:bg-neutral-2/50">
                            <input
                                type="checkbox"
                                name="unlimited_stock"
                                checked={form.unlimited_stock}
                                onChange={handleChange}
                                className="mt-0.5 rounded border-neutral-5 text-primary-1 focus:ring-primary-5"
                            />
                            <div>
                                <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">Toujours en stock</span>
                                <p className="text-[11px] font-poppins text-neutral-6 mt-0.5">Disponible sans limite de quantité (stock illimité).</p>
                            </div>
                        </label>
                    </FormSection>

                    {/* Images */}
                    <FormSection title="Images">

                        {/* Image principale */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Image principale <span className="text-danger-1">*</span>
                            </label>
                            {form.mainImage ? (
                                <div className="relative w-32 h-32 rounded-2 overflow-hidden border border-neutral-4 group">
                                    <img
                                        src={typeof form.mainImage === 'string' ? form.mainImage : form.mainImage.preview}
                                        alt="principale"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, mainImage: null }))}
                                        className="absolute inset-0 bg-neutral-8/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                    >
                                        <Trash2 size={18} className="text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => mainImageRef.current?.click()}
                                        className="w-32 h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                    >
                                        <Upload size={20} />
                                        <span className="text-[11px] font-poppins">Fichier</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { setMediaPickerTarget({ type: 'main' }); setMediaPickerOpen(true); }}
                                        className="w-32 h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                    >
                                        <Images size={20} />
                                        <span className="text-[11px] font-poppins">Médiathèque</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setTempImageType('main'); setShowImageUrlModal(true); }}
                                        className="w-32 h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                    >
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
                                {/* ✅ Filtrer les valeurs undefined/null avant le map */}
                                {form.subImages.filter(Boolean).map((media, i) => {
                                    const isYouTubeVimeo = typeof media === 'string' && ['youtube', 'vimeo'].includes(getVideoType(media));
                                    // ✅ Vérifier que media existe avant d'accéder à media.type
                                    const isVideo = isYouTubeVimeo
                                        || (media && typeof media !== 'string' && media.type === 'video')
                                        || (typeof media === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(media));
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
                                            <button
                                                type="button"
                                                onClick={() => removeSubImage(i)}
                                                className="absolute inset-0 bg-neutral-8/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                            >
                                                <Trash2 size={14} className="text-white" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => subImageRef.current?.click()}
                                    className="w-20 h-20 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-1 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                >
                                    <Upload size={16} />
                                    <span className="text-[10px] font-poppins">Fichier</span>
                                </button>
                                <button type="button"
                                    onClick={() => { setMediaPickerTarget({ type: 'sub' }); setMediaPickerOpen(true); }}
                                    className="w-20 h-20 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                >
                                    <Images size={20} />
                                    <span className="text-[11px] font-poppins">Médiathèque</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTempImageType('sub'); setShowImageUrlModal(true); }}
                                    className="w-20 h-20 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-1 text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="text-[10px] font-poppins">URL</span>
                                </button>
                            </div>
                            <input ref={subImageRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleSubMedia} />
                        </div>
                    </FormSection>

                    {/* Tailles */}
                    <FormSection title="Tailles">
                        {form.hasColors ? (
                            <div className="p-4 bg-neutral-2/50 dark:bg-neutral-2/50 rounded-md shadow-inner text-sm text-neutral-6 text-center">
                                Vous avez commencé par les couleurs. Gérez les tailles dans les sous-variantes de l'arbre ci-dessous.
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between -mt-1">
                                    <p className="text-xs font-poppins text-neutral-6">Activer les tailles pour ce produit</p>
                                    <ProductStatusToggle
                                        active={form.hasSizes}
                                        onChange={val => {
                                            setForm(prev => ({ ...prev, hasSizes: val }));
                                            if (!val) setVariantsDraft([]);
                                            else if (form.sizes.length > 0) {
                                                setVariantsDraft(form.sizes.map(s => ({ ...createEmptyVariant(), sku: s, name: s, price: String(form.sale_price || form.price || '') })));
                                            }
                                        }}
                                    />
                                </div>
                                {form.hasSizes && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => form.sizes.includes(size) ? handleRemoveSize(size) : handleAddSize(size)}
                                                    className={`px-4 py-2 rounded-full text-xs font-semibold font-poppins transition-all cursor-pointer ${form.sizes.includes(size) ? 'bg-primary-1 text-white' : 'bg-neutral-2 text-neutral-6 hover:bg-neutral-3'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Autre taille (Ex: 38, 42...)"
                                            className="flex-1 rounded-full border border-neutral-5 bg-neutral-0 px-4 py-2 text-xs text-neutral-8 font-poppins outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const v = e.target.value.trim();
                                                    if (v) { handleAddSize(v); e.target.value = ''; }
                                                }
                                            }}
                                        />
                                        {form.sizes.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-3">
                                                <span className="text-xs font-semibold text-neutral-6 w-full">Sélectionnées :</span>
                                                {form.sizes.map((size, i) => (
                                                    <div key={i} className="flex items-center gap-1 px-3 py-1 bg-primary-5 rounded-full">
                                                        <span className="text-xs font-semibold text-primary-1">{size}</span>
                                                        <button type="button" onClick={() => handleRemoveSize(size)} className="cursor-pointer">
                                                            <X size={12} className="text-primary-1" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </FormSection>

                    {form.hasSizes && renderVariantsTree()}

                    {/* Couleurs */}
                    <FormSection title="Couleurs">
                        {form.hasSizes ? (
                            <div className="p-4 bg-neutral-2/50 dark:bg-neutral-2/50 rounded-md shadow-inner text-sm text-neutral-6 text-center">
                                Vous avez commencé par les tailles. Gérez les couleurs dans les sous-variantes de l'arbre ci-dessous.
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between -mt-1">
                                    <p className="text-xs font-poppins text-neutral-6">Activer les couleurs pour ce produit</p>
                                    <ProductStatusToggle
                                        active={form.hasColors}
                                        onChange={val => {
                                            setForm(prev => ({ ...prev, hasColors: val }));
                                            if (!val) setVariantsDraft([]);
                                            else if (form.colors.length > 0) {
                                                setVariantsDraft(form.colors.map(c => ({ ...createEmptyVariant(), sku: c.name, name: c.name, price: String(form.sale_price || form.price || '') })));
                                            }
                                        }}
                                    />
                                </div>
                                {form.hasColors && (
                                    <div className="flex flex-col gap-3">
                                        {(() => {
                                            const available = PRESET_COLORS.filter(
                                                (c) => !form.colors.some((x) => x.hex === c.hex),
                                            );
                                            return available.length === 0 ? (
                                                <p className="text-[11px] font-poppins text-neutral-6 dark:text-neutral-5 leading-relaxed">
                                                    Toutes les couleurs prédéfinies sont déjà sélectionnées. Retirez un nuancier ci-dessous pour en ajouter une autre.
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-10 gap-2">
                                                    {available.map((color) => (
                                                        <button
                                                            key={color.hex}
                                                            type="button"
                                                            onClick={() => handleAddColor(color.name, color.hex)}
                                                            title={color.name}
                                                            className="w-full aspect-square rounded-md border-2 border-transparent hover:border-primary-1 hover:scale-110 cursor-pointer transition-all"
                                                            style={{ backgroundColor: color.hex }}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })()}
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
                            </>
                        )}
                    </FormSection>

                    {form.hasColors && renderVariantsTree()}

                    {/* Autres caractéristiques */}
                    <FormSection title="Autres caractéristiques">
                        {form.hasSizes || form.hasColors ? (
                            <div className="p-4 bg-neutral-2/50 dark:bg-neutral-2/50 rounded-md shadow-inner text-sm text-neutral-6 text-center">
                                Seules les variantes locales (sous-variantes) sont autorisées depuis que vous avez choisi les tailles ou les couleurs comme racine.
                            </div>
                        ) : (
                            <>
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
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCustomDetail(i)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-5 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer shrink-0"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

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
                                        <button
                                            type="button"
                                            onClick={handleAddCustomDetail}
                                            disabled={!newDetailKey.trim()}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-1 text-white hover:bg-primary-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                    {newDetailKey.trim() && (
                                        <p className="text-[11px] font-poppins text-warning-1 pl-1">
                                            ⚠️ Cliquez sur <strong>+</strong> pour confirmer l'ajout, sinon la caractéristique ne sera pas enregistrée.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </FormSection>

                    {(!form.hasSizes && !form.hasColors && customDetails.length > 0) && renderVariantsTree()}
                </div>

                {/* ── Colonne droite (1/3) ── */}
                <div className="flex flex-col gap-6">

                    {/* Paramètres */}
                    <FormSection title="Paramètres">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">Produit actif</p>
                                <p className="text-[11px] font-poppins text-neutral-6">Visible sur la boutique</p>
                            </div>
                            <ProductStatusToggle
                                active={form.is_active}
                                onChange={val => setForm(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>
                    </FormSection>

                    {/* Récap sticky */}
                    <div className="sticky top-6 bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                        <div className="px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                            <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">Récapitulatif</p>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            {form.name && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Nom</span>
                                    <span className="text-xs font-semibold font-poppins text-neutral-8">{form.name}</span>
                                </div>
                            )}
                            {form.price && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Prix</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold font-poppins text-primary-1">
                                            {Number(form.sale_price || form.price).toLocaleString('fr-FR')} F
                                        </span>
                                        {discount !== null && (
                                            <span className="text-[11px] font-semibold font-poppins text-success-1 bg-success-2 px-2 py-0.5 rounded-full">
                                                -{discount}%
                                            </span>
                                        )}
                                    </div>
                                    {form.sale_price && (
                                        <span className="text-[11px] font-poppins text-neutral-5 line-through">
                                            {Number(form.price).toLocaleString('fr-FR')} F
                                        </span>
                                    )}
                                </div>
                            )}
                            {(form.unlimited_stock || form.stock !== '') && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Stock</span>
                                    <span className={`text-xs font-semibold font-poppins ${form.unlimited_stock ? 'text-primary-1' : parseInt(form.stock, 10) === 0 ? 'text-danger-1' : parseInt(form.stock, 10) <= 5 ? 'text-warning-1' : 'text-neutral-8'}`}>
                                        {form.unlimited_stock ? 'Illimité (toujours disponible)' : `${form.stock} unité${parseInt(form.stock, 10) !== 1 ? 's' : ''}`}
                                    </span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-neutral-3">
                                <Button
                                    variant="primary"
                                    size="normal"
                                    loading={loading}
                                    onClick={handleSubmit}
                                    className="w-full"
                                >
                                    {isEdit ? 'Enregistrer' : 'Créer le produit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal URL ── */}
            {showImageUrlModal && (
                <>
                    <div
                        className="fixed inset-0 bg-neutral-8/60 z-40 backdrop-blur-sm"
                        onClick={() => {
                            setShowImageUrlModal(false);
                            setTempImageVariantIdx(null);
                            setTempImageVariantPath(null);
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-md p-6">
                            <h3 className="text-sm font-bold font-poppins text-neutral-8 mb-4">
                                Ajouter un média via URL
                            </h3>
                            <InputField
                                label="URL du média"
                                value={tempImageUrl}
                                onChange={e => setTempImageUrl(e.target.value)}
                                placeholder="https://exemple.com/media.jpg"
                                hint="Formats acceptés : JPG, PNG, MP4, WEBM, YouTube, Vimeo"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button
                                    variant="ghost"
                                    size="normal"
                                    onClick={() => {
                                        setShowImageUrlModal(false);
                                        setTempImageVariantIdx(null);
                                        setTempImageVariantPath(null);
                                    }}
                                >
                                    Annuler
                                </Button>
                                <Button variant="primary" size="normal" onClick={handleAddImageUrl}>
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <MediaPickerModal
                open={mediaPickerOpen}
                onClose={() => {
                    setMediaPickerOpen(false);
                    setMediaPickerTarget({ type: 'main' });
                }}
                onSelect={handleMediaSelect}
                accept="image"
                title="Choisir une image"
                multiple={mediaPickerTarget.type === 'sub'}
            />
        </div>
    );
};

export default ProductFormPage;