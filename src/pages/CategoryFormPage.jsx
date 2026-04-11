import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Upload, Trash2, Images, Loader2, X } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ProductStatusToggle from '../components/products/ProductStatusToggle';
import MediaPickerModal from '../components/media/MediaPickerModal';
import {
    useCategories,
    normalizeCategory,
    normalizeCategoryNameKey,
} from '../hooks/useCategories';
import { categoriesAPI } from '../api/categories.api';
import { useToast } from '../components/ui/ToastProvider';
import { parseBackendErrorResponse } from '../utils/apiErrorResponse';

// ── Formulaire vide ───────────────────────────────────────────
const EMPTY_FORM = {
    name: '',
    description: '',
    order: '',
    is_active: true,
    icon: null,       // null | string (URL) | File
    iconPreview: null,
};

// ── Section wrapper (cohérent avec ProductFormPage) ───────────
const FormSection = ({ title, children }) => (
    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
            <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">{title}</p>
        </div>
        <div className="px-5 py-5 flex flex-col gap-4">
            {children}
        </div>
    </div>
);

// ── PAGE ──────────────────────────────────────────────────────
const CategoryFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { categories, loading: categoriesLoading, create, update, refetch } = useCategories();
    const { toast } = useToast();
    const [categoryFromDetail, setCategoryFromDetail] = useState(null);

    const isEdit = !!id;
    const categoryFromList = isEdit
        ? categories.find(c => String(c.id) === String(id)) ?? null
        : null;
    const category = categoryFromList ?? categoryFromDetail;

    const needsDetailFetch =
        isEdit &&
        !!id &&
        !categoriesLoading &&
        !categoryFromList;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    // Ref pour l'input file caché
    const fileInputRef = useRef(null);

    // ── Titre de page ─────────────────────────────────────────
    useEffect(() => {
        document.title = isEdit
            ? `Admin Tokia-Loh | Modifier ${category?.name ?? '…'}`
            : 'Admin Tokia-Loh | Nouvelle catégorie';
    }, [isEdit, category]);

    useEffect(() => {
        if (categoryFromList) setCategoryFromDetail(null);
    }, [categoryFromList]);

    useEffect(() => {
        if (!needsDetailFetch) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await categoriesAPI.detail(id);
                if (!cancelled) setCategoryFromDetail(normalizeCategory(data));
            } catch {
                if (!cancelled) navigate('/categories', { replace: true });
            }
        })();
        return () => { cancelled = true; };
    }, [needsDetailFetch, id, navigate]);

    // ── Pré-remplissage en mode édition ──────────────────────
    useEffect(() => {
        if (isEdit && category) {
            setForm({
                ...EMPTY_FORM,
                name: category.name ?? '',
                description: category.description ?? '',
                order: category.order ?? '',
                is_active: category.is_active ?? true,
                icon: category.icon ?? null,
                iconPreview: category.icon ?? null,
            });
        } else if (!isEdit) {
            setForm(EMPTY_FORM);
        }
        setErrors({});
    }, [isEdit, category]);

    // ── Loader pendant résolution en mode édition ─────────────
    if (isEdit && (categoriesLoading || (needsDetailFetch && !categoryFromDetail))) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="animate-spin text-primary-1" />
            </div>
        );
    }

    if (isEdit && !category) return null;

    // ── Handlers ──────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleClose = () => navigate(-1);

    // ── Gestion image : upload fichier ────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, icon: 'Veuillez sélectionner une image valide' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, icon: 'Image trop volumineuse (max 5 Mo)' }));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({
                ...prev,
                icon: file,
                iconPreview: reader.result,
            }));
        };
        reader.readAsDataURL(file);
        if (errors.icon) setErrors(prev => ({ ...prev, icon: '' }));
        e.target.value = '';
    };

    const handleAddUrl = () => {
        if (!tempUrl.trim()) return;
        setForm(prev => ({
            ...prev,
            icon: tempUrl,
            iconPreview: tempUrl,
        }));
        setTempUrl('');
        setShowUrlModal(false);
        if (errors.icon) setErrors(prev => ({ ...prev, icon: '' }));
    };

    // ── Gestion image : sélection depuis médiathèque ──────────
    const handleMediaSelect = (file) => {
        // file = { id, file (URL), created_at }
        setForm(prev => ({
            ...prev,
            icon: file.file,        // URL string
            iconPreview: file.file,
        }));
        if (errors.icon) setErrors(prev => ({ ...prev, icon: '' }));
    };

    const handleRemoveImage = () => {
        setForm(prev => ({ ...prev, icon: null, iconPreview: null }));
    };

    // ── Validation ────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom de catégorie requis';
        if (form.order !== '' && (isNaN(form.order) || parseInt(form.order) < 1))
            e.order = "L'ordre doit être un nombre positif";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Soumission ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const freshList = await refetch({ silent: true });
            const nameKey = normalizeCategoryNameKey(form.name);
            const excludeId = isEdit ? category.id : null;
            const nameTaken = freshList.some(
                (c) =>
                    normalizeCategoryNameKey(c.name) === nameKey &&
                    String(c.id) !== String(excludeId),
            );
            if (nameTaken) {
                toast.error('Cette catégorie existe déjà');
                return;
            }

            const payload = {
                name: form.name,
                description: form.description || null,
                order: form.order ? parseInt(form.order) : null,
                is_active: form.is_active,
                icon: form.icon, // null | File | string URL
            };

            if (isEdit) {
                await update(category.id, payload);
            } else {
                await create(payload);
            }

            toast.success(
                isEdit
                    ? 'Catégorie mise à jour avec succès'
                    : 'Catégorie créée avec succès'
            );
            navigate('/categories');

        } catch (err) {
            if (err.response?.data?.file?.[0]?.includes('filename has at most 100 characters')) {
                toast.error('Le nom du fichier ne doit pas contenir plus de 100 caractères.');
            } else if (err.response?.data?.file) {
                toast.error("Erreur lors de la sauvegarde de l'image : " + err.response?.data?.file);
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
                            onClick: () => navigate(`/categories/${existingId}`),
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
                            {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">
                            {isEdit ? category?.name : 'Remplissez les informations de la catégorie'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="normal" type="button" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                        {isEdit ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                    </Button>
                </div>
            </div>

            {/* ── Grille deux colonnes ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* ── Colonne gauche (2/3) ── */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Informations générales */}
                    <FormSection title="Informations générales">
                        <InputField
                            label="Nom de la catégorie"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ex: Robes"
                            error={errors.name}
                            required
                        />
                        <InputField
                            label="Description"
                            name="description"
                            type="textarea"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Décrivez cette catégorie…"
                        />
                        {/* <InputField
                            label="Ordre d'affichage"
                            name="order"
                            type="number"
                            value={form.order}
                            onChange={handleChange}
                            placeholder="Ex: 1"
                            hint="Laissez vide pour placer en dernier"
                            error={errors.order}
                        /> */}
                    </FormSection>

                    {/* Image */}
                    <FormSection title="Image de la catégorie">

                        {form.iconPreview ? (
                            /* ── Aperçu image sélectionnée ── */
                            <div className="flex flex-col gap-3">
                                <div className="relative w-full h-52 rounded-2 overflow-hidden border border-neutral-4 dark:border-neutral-4 group">
                                    <img
                                        src={form.iconPreview}
                                        alt="Aperçu"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-neutral-8/0 group-hover:bg-neutral-8/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="w-10 h-10 rounded-full bg-danger-1 flex items-center justify-center hover:bg-danger-2 transition-colors cursor-pointer shadow"
                                        >
                                            <Trash2 size={16} className="text-white" />
                                        </button>
                                    </div>
                                </div>
                                {/* Option changer l'image */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-4 text-xs font-semibold font-poppins text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                    >
                                        <Upload size={12} />
                                        Changer de fichier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaPickerOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-4 text-xs font-semibold font-poppins text-neutral-6 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                                    >
                                        <Images size={12} />
                                        Choisir depuis la médiathèque
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Zone de sélection ── */
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-4 gap-3">

                                    {/* Upload fichier */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 hover:bg-primary-5 dark:hover:bg-primary-5 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-neutral-2 dark:bg-neutral-3 flex items-center justify-center group-hover:bg-primary-5">
                                            <Upload size={17} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-semibold font-poppins">Fichier local</p>
                                            <p className="text-[10px] font-poppins text-neutral-5 mt-0.5">PNG, JPG, max 5 Mo</p>
                                        </div>
                                    </button>

                                    {/* Médiathèque */}
                                    <button
                                        type="button"
                                        onClick={() => setMediaPickerOpen(true)}
                                        className="h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 hover:bg-primary-5 dark:hover:bg-primary-5 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-neutral-2 dark:bg-neutral-3 flex items-center justify-center">
                                            <Images size={17} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-semibold font-poppins">Médiathèque</p>
                                            <p className="text-[10px] font-poppins text-neutral-5 mt-0.5">Fichiers existants</p>
                                        </div>
                                    </button>

                                    {/* ✅ NOUVEAU : Ajout via URL */}
                                    <button
                                        type="button"
                                        onClick={() => setShowUrlModal(true)}
                                        className="h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-primary-1 hover:text-primary-1 hover:bg-primary-5 dark:hover:bg-primary-5 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-neutral-2 dark:bg-neutral-3 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-semibold font-poppins">URL</p>
                                            <p className="text-[10px] font-poppins text-neutral-5 mt-0.5">Lien externe</p>
                                        </div>
                                    </button>

                                    {/* Pas d'image */}
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, icon: '', iconPreview: '' }))}
                                        className="h-32 rounded-2 border-2 border-dashed border-neutral-4 flex flex-col items-center justify-center gap-2 text-neutral-6 hover:border-neutral-5 hover:bg-neutral-2 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-neutral-2 dark:bg-neutral-3 flex items-center justify-center">
                                            <X size={17} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-semibold font-poppins">Sans image</p>
                                            <p className="text-[10px] font-poppins text-neutral-5 mt-0.5">Aucune icône</p>
                                        </div>
                                    </button>
                                </div>

                                {errors.icon && (
                                    <p className="text-xs font-poppins text-danger-1">{errors.icon}</p>
                                )}
                            </div>
                        )}

                        {/* Input file caché */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </FormSection>
                </div>

                {/* ── Colonne droite (1/3) ── */}
                <div className="flex flex-col gap-6">

                    {/* Paramètres */}
                    <FormSection title="Paramètres">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Catégorie active
                                </p>
                                <p className="text-[11px] font-poppins text-neutral-6">
                                    Visible sur la boutique
                                </p>
                            </div>
                            <ProductStatusToggle
                                active={form.is_active}
                                onChange={val => setForm(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>
                    </FormSection>

                    {/* Récapitulatif sticky */}
                    <div className="sticky top-6 bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                        <div className="px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                            <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">
                                Récapitulatif
                            </p>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-4">

                            {/* Aperçu miniature */}
                            <div className="w-full aspect-video rounded-2 overflow-hidden bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 flex items-center justify-center">
                                {form.iconPreview ? (
                                    <img
                                        src={form.iconPreview}
                                        alt="Aperçu"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <p className="text-[11px] font-poppins text-neutral-4">Aucune image</p>
                                )}
                            </div>

                            {/* Infos */}
                            <div className="flex flex-col gap-2">
                                {form.name && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Nom</span>
                                        <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {form.name}
                                        </span>
                                    </div>
                                )}
                                {form.order && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Ordre</span>
                                        <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            #{form.order}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-poppins text-neutral-5 uppercase tracking-wide">Statut</span>
                                    <span className={`text-xs font-semibold font-poppins ${form.is_active ? 'text-success-1' : 'text-neutral-5'}`}>
                                        {form.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-neutral-3">
                                <Button
                                    variant="primary"
                                    size="normal"
                                    loading={loading}
                                    onClick={handleSubmit}
                                    className="w-full"
                                >
                                    {isEdit ? 'Enregistrer' : 'Créer la catégorie'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MediaPickerModal ── */}
            <MediaPickerModal
                open={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                accept="image"
                title="Choisir une image pour la catégorie"
            />

            {/* ── Modal URL ── */}
            {showUrlModal && (
                <>
                    <div
                        className="fixed inset-0 bg-neutral-8/60 z-60 backdrop-blur-sm"
                        onClick={() => setShowUrlModal(false)}
                    />
                    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                        <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-md p-6">
                            <h3 className="text-sm font-bold font-poppins text-neutral-8 mb-4">
                                Ajouter une image via URL
                            </h3>
                            <InputField
                                label="URL de l'image"
                                value={tempUrl}
                                onChange={e => setTempUrl(e.target.value)}
                                placeholder="https://exemple.com/image.jpg"
                                hint="Formats acceptés : JPG, PNG, GIF"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" size="normal" onClick={() => setShowUrlModal(false)}>
                                    Annuler
                                </Button>
                                <Button variant="primary" size="normal" onClick={handleAddUrl}>
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CategoryFormPage;