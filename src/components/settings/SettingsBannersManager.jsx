import React, { useState } from 'react';
import { filesAPI } from '../../api/files.api';
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from '../products/ProductStatusToggle';
import { useAdmin } from '../../hooks/useAdmin';

const EMPTY_FORM = {
    imageMobile: null,
    imageTablet: null,
    is_active: true,
    imageMobilePreview: null,
    imageTabletPreview: null
};


const ImageUploadZone = ({ label, recommended, currentImage, onSelect, onRemove, error }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onSelect(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                    {label}
                </label>
                <span className="text-[10px] font-poppins text-neutral-5">
                    {recommended}
                </span>
            </div>

            {currentImage ? (
                <div className="relative group">
                    <img
                        src={currentImage}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-2 border border-neutral-4 dark:border-neutral-4"
                    />
                    <button
                        onClick={onRemove}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-0/90 dark:bg-neutral-0/90 text-neutral-7 hover:bg-danger-2 hover:text-danger-1 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    className={`
                        relative border-2 border-dashed rounded-2 p-6
                        flex flex-col items-center justify-center gap-2
                        transition-colors cursor-pointer
                        ${dragActive
                            ? 'border-primary-1 bg-primary-5 dark:bg-primary-5'
                            : 'border-neutral-4 dark:border-neutral-4 hover:border-neutral-5'
                        }
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={24} className="text-neutral-5" />
                    <p className="text-xs font-poppins text-neutral-6 text-center">
                        Glissez une image ou cliquez pour parcourir
                    </p>
                    <p className="text-[10px] font-poppins text-neutral-5 text-center">
                        JPG, PNG, WebP (max 500 Ko)
                    </p>
                </div>
            )}

            {error && (
                <p className="text-[11px] font-poppins text-danger-1">{error}</p>
            )}
        </div>
    );
};

const uploadImage = async (file) => {
    const res = await filesAPI.upload(file);
    return res.data.data.file;
};

const BannerForm = ({ banner, onSave, onCancel, isLoading }) => {
    const [form, setForm] = useState(() => {
        if (banner) {
            return {
                imageMobile: null,
                imageTablet: null,
                is_active: banner.is_active,
                imageMobilePreview: banner.image,
                imageTabletPreview: banner.image_tablette_more
            };
        }
        return EMPTY_FORM;
    });

    const [errors, setErrors] = useState({});

    const handleImageSelect = (field, file) => {
        // Validation de la taille du fichier (500 Ko max)
        if (file.size > 500 * 1024) {
            setErrors(prev => ({ ...prev, [field]: 'Le fichier ne doit pas dépasser 500 Ko' }));
            return;
        }

        // Créer une preview URL
        const previewUrl = URL.createObjectURL(file);

        if (field === 'imageMobile') {
            setForm(prev => ({
                ...prev,
                imageMobile: file,
                imageMobilePreview: previewUrl
            }));
        } else {
            setForm(prev => ({
                ...prev,
                imageTablet: file,
                imageTabletPreview: previewUrl
            }));
        }

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleImageRemove = (field) => {
        if (field === 'imageMobile') {
            if (form.imageMobilePreview && form.imageMobilePreview.startsWith('blob:')) {
                URL.revokeObjectURL(form.imageMobilePreview);
            }
            setForm(prev => ({ ...prev, imageMobile: null, imageMobilePreview: null }));
        } else {
            if (form.imageTabletPreview && form.imageTabletPreview.startsWith('blob:')) {
                URL.revokeObjectURL(form.imageTabletPreview);
            }
            setForm(prev => ({ ...prev, imageTablet: null, imageTabletPreview: null }));
        }
    };

    const validate = () => {
        const e = {};

        // Pour une nouvelle bannière, au moins une image est requise
        if (!banner && !form.imageMobile && !form.imageTablet) {
            e.imageMobile = 'Au moins une image est requise';
            e.imageTablet = 'Au moins une image est requise';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            const formData = new FormData();

            // ✅ Upload des images (si nouvelles)
            const [imageUrl, imageTabletUrl] = await Promise.all([
                form.imageMobile ? uploadImage(form.imageMobile) : null,
                form.imageTablet ? uploadImage(form.imageTablet) : null
            ]);

            // ✅ Cas ajout ou modification
            if (imageUrl) {
                formData.append('image', imageUrl);
            } else if (banner?.image) {
                formData.append('image', banner.image);
            }

            if (imageTabletUrl) {
                formData.append('image_tablette_more', imageTabletUrl);
            } else if (banner?.image_tablette_more) {
                formData.append('image_tablette_more', banner.image_tablette_more);
            }

            formData.append('is_active', form.is_active);

            onSave(formData);

        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'upload des images");
        }
    };

    return (
        <div className="bg-neutral-2 dark:bg-neutral-2 rounded-2 p-4 flex flex-col gap-4 border border-neutral-4 dark:border-neutral-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploadZone
                    label="Image Mobile"
                    recommended="1080 x 400 px (16:9)"
                    currentImage={form.imageMobilePreview}
                    onSelect={(file) => handleImageSelect('imageMobile', file)}
                    onRemove={() => handleImageRemove('imageMobile')}
                    error={errors.imageMobile}
                />

                <ImageUploadZone
                    label="Image Tablette/PC"
                    recommended="1920 x 450 px (Large)"
                    currentImage={form.imageTabletPreview}
                    onSelect={(file) => handleImageSelect('imageTablet', file)}
                    onRemove={() => handleImageRemove('imageTablet')}
                    error={errors.imageTablet}
                />
            </div>

            <div className="bg-primary-5 dark:bg-primary-5 border border-primary-4 dark:border-primary-4 rounded-1.5 px-3 py-2">
                <p className="text-[10px] font-poppins text-primary-1 leading-relaxed">
                    💡 <strong>Astuce :</strong> L'image Mobile s'affiche sur téléphone (format 16:9),
                    l'image Tablette/PC sur écrans larges (format panoramique).
                    Optimisez vos visuels en WebP ou JPEG à 75-80% pour un chargement rapide.
                </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-3 dark:border-neutral-3">
                <div className="flex items-center gap-3">
                    <ProductStatusToggle
                        active={form.is_active}
                        onChange={val => setForm(prev => ({ ...prev, is_active: val }))}
                    />
                    <span className="text-xs font-poppins text-neutral-7 dark:text-neutral-7">
                        {form.is_active ? 'Bannière active' : 'Bannière inactive'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enregistrement...' : 'Sauvegarder'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const SettingsBannersManager = () => {
    const {
        banners,
        bannersLoading,
        bannersError,
        addBanner,
        updateBanner,
        deleteBanner
    } = useAdmin();

    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [operationLoading, setOperationLoading] = useState(false);

    const handleToggle = async (banner) => {
        setOperationLoading(true);
        const formData = new FormData();
        formData.append('is_active', !banner.is_active);

        const result = await updateBanner(banner.id, formData);
        setOperationLoading(false);

        if (!result.ok) {
            alert(result.data?.message || 'Erreur lors de la mise à jour du statut');
        }
    };

    const handleSave = async (formData) => {
        setOperationLoading(true);

        let result;
        if (editTarget) {
            result = await updateBanner(editTarget.id, formData);
        } else {
            result = await addBanner(formData);
        }

        setOperationLoading(false);

        if (result.ok) {
            setShowForm(false);
            setEditTarget(null);
        } else {
            alert(result.data?.message || 'Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) return;

        setOperationLoading(true);
        const result = await deleteBanner(id);
        setOperationLoading(false);

        if (!result.ok) {
            alert(result.data?.message || 'Erreur lors de la suppression');
        }
    };

    const handleEdit = (banner) => {
        setEditTarget(banner);
        setShowForm(false);
    };

    const handleCancelEdit = () => {
        setEditTarget(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                            Bannières promotionnelles
                        </p>
                        <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                            Affichées en haut de la boutique. Optimisez vos images pour mobile et tablette/PC.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={() => { setShowForm(true); setEditTarget(null); }}
                        disabled={bannersLoading || operationLoading}
                    >
                        Ajouter
                    </Button>
                </div>

                {/* Erreur de chargement */}
                {bannersError && (
                    <div className="bg-danger-2 border border-danger-1 rounded-2 px-4 py-3">
                        <p className="text-xs font-poppins text-danger-1">{bannersError}</p>
                    </div>
                )}

                {/* Formulaire ajout */}
                {showForm && !editTarget && (
                    <BannerForm
                        onSave={handleSave}
                        onCancel={() => setShowForm(false)}
                        isLoading={operationLoading}
                    />
                )}

                {/* Liste des bannières */}
                {bannersLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-xs font-poppins text-neutral-5">Chargement des bannières...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {banners.map(banner => (
                            <div key={banner.id}>
                                {editTarget?.id === banner.id ? (
                                    <BannerForm
                                        banner={editTarget}
                                        onSave={handleSave}
                                        onCancel={handleCancelEdit}
                                        isLoading={operationLoading}
                                    />
                                ) : (
                                    <div className="flex items-start gap-3 px-4 py-3 bg-neutral-2 dark:bg-neutral-2 rounded-2 border border-neutral-3 dark:border-neutral-3">
                                        {/* Preview des images */}
                                        <div className="flex gap-2 shrink-0">
                                            {banner.image ? (
                                                <div className="relative group">
                                                    <img
                                                        src={banner.image}
                                                        alt="Mobile"
                                                        className="w-24 h-14 object-cover rounded-1.5 border border-neutral-4 dark:border-neutral-4"
                                                    />
                                                    <div className="absolute inset-0 bg-neutral-8/0 group-hover:bg-neutral-8/60 transition-colors rounded-1.5 flex items-center justify-center">
                                                        <span className="text-[9px] font-semibold font-poppins text-neutral-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Mobile
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-24 h-14 flex items-center justify-center bg-neutral-3 dark:bg-neutral-3 rounded-1.5 border border-neutral-4 dark:border-neutral-4">
                                                    <ImageIcon size={16} className="text-neutral-5" />
                                                </div>
                                            )}

                                            {banner.image_tablette_more ? (
                                                <div className="relative group">
                                                    <img
                                                        src={banner.image_tablette_more}
                                                        alt="Tablette/PC"
                                                        className="w-24 h-14 object-cover rounded-1.5 border border-neutral-4 dark:border-neutral-4"
                                                    />
                                                    <div className="absolute inset-0 bg-neutral-8/0 group-hover:bg-neutral-8/60 transition-colors rounded-1.5 flex items-center justify-center">
                                                        <span className="text-[9px] font-semibold font-poppins text-neutral-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Tablette/PC
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-24 h-14 flex items-center justify-center bg-neutral-3 dark:bg-neutral-3 rounded-1.5 border border-neutral-4 dark:border-neutral-4">
                                                    <ImageIcon size={16} className="text-neutral-5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-poppins ${banner.is_active ? 'bg-success-2 text-success-1' : 'bg-neutral-3 text-neutral-6'}`}>
                                                    {banner.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-poppins text-neutral-5">
                                                Créée le {new Date(banner.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <ProductStatusToggle
                                                active={banner.is_active}
                                                onChange={() => handleToggle(banner)}
                                                disabled={operationLoading}
                                            />
                                            <button
                                                onClick={() => handleEdit(banner)}
                                                className="w-7 h-7 flex items-center justify-center rounded-1.5 text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={operationLoading}
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner.id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-1.5 text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={operationLoading}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {banners.length === 0 && !bannersLoading && (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <ImageIcon size={32} className="text-neutral-4" />
                                <p className="text-xs font-poppins text-neutral-5 text-center">
                                    Aucune bannière configurée
                                </p>
                                <p className="text-[11px] font-poppins text-neutral-4 text-center max-w-xs">
                                    Ajoutez votre première bannière promotionnelle pour attirer l'attention de vos clients
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsBannersManager;