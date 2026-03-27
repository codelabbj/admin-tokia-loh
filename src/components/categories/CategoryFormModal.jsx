import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from '../products/ProductStatusToggle';
import { useToast } from '../ui/ToastProvider';

const EMPTY_FORM = {
    name: '',
    description: '',
    order: '',
    is_active: true,
    icon: null,   // Peut être : null | string (URL) | File | { file: File, preview: string }
    iconPreview: null,
};

/*
  Props :
  - open     : boolean
  - onClose  : () => void
  - category : object | null
  - onSave   : (payload) => Promise
*/
const CategoryFormModal = ({ open, onClose, category = null, onSave }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    const { toast } = useToast();

    const isEdit = !!category;

    useEffect(() => {
        if (open) {
            if (category) {
                // Mode édition : on garde l'URL existante
                setForm({
                    ...EMPTY_FORM,
                    name: category.name ?? '',
                    description: category.description ?? '',
                    order: category.order ?? '',
                    is_active: category.is_active ?? true,
                    icon: category.icon ?? null,
                    iconPreview: category.icon ?? null,
                });
            } else {
                // Mode création : formulaire vide
                setForm(EMPTY_FORM);
            }
            setErrors({});
        }
    }, [open, category]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Dans CategoryFormModal.js, modifions handleImageChange
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, icon: 'Veuillez sélectionner une image valide' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, icon: 'Image trop volumineuse (max 5MB)' }));
            return;
        }

        // Créer la preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({
                ...prev,
                icon: file,  // ← Important : on stocke le File directement, pas un objet
                iconPreview: reader.result,
            }));
        };
        reader.readAsDataURL(file);

        if (errors.icon) setErrors(prev => ({ ...prev, icon: '' }));
    };

    // Modifions aussi handleAddUrl
    const handleAddUrl = () => {
        if (!tempUrl.trim()) return;
        setForm(prev => ({
            ...prev,
            icon: tempUrl,  // ← string (URL)
            iconPreview: tempUrl,
        }));
        setTempUrl('');
        setShowUrlModal(false);
    };

    const handleRemoveImage = () => {
        setForm(prev => ({ ...prev, icon: null, iconPreview: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom de catégorie requis';
        if (form.order !== '' && (isNaN(form.order) || parseInt(form.order) < 1))
            e.order = "L'ordre doit être un nombre positif";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            // Construction du payload
            const payload = {
                name: form.name,
                description: form.description || null,
                order: form.order ? parseInt(form.order) : null,
                is_active: form.is_active,
                icon: form.icon, // On passe l'objet tel quel, useCategories s'occupe de l'upload
            };
            await onSave?.(payload);

            toast.success(
                isEdit
                    ? 'Catégorie mise à jour avec succès'
                    : 'Catégorie ajoutée avec succès'
            );

            onClose();
        } catch (error) {
            if (err.response?.data?.file?.[0].includes('filename has at most 100 characters')) {
                toast.error('Le nom du fichier ne doit pas contenir plus de 100 caractères. Vérifier vos nom de fichiers.');
            }
            else if (err.response?.data?.file) {
                toast.error('Une erreur est survenue lors de la sauvegarde d\'image : ' + err.response?.data?.file);
            }
            else {
                toast.error('Une erreur est survenue, veullez réessayer.');
            }
            setErrors(prev => ({ ...prev, form: "Erreur lors de la sauvegarde" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 z-40 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4 shrink-0">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">

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
                            placeholder="Décrivez cette catégorie..."
                        />

                        {/* Image / icône */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Image de la catégorie
                            </label>

                            {form.iconPreview ? (
                                <div className="relative w-full h-40 rounded-2 overflow-hidden border border-neutral-4 group">
                                    <img
                                        src={form.iconPreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error("Erreur chargement image:", e);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-neutral-8/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="w-10 h-10 bg-danger-1 rounded-full flex items-center justify-center hover:bg-danger-2 transition-colors"
                                            title="Supprimer l'image"
                                        >
                                            <Trash2 size={16} className="text-white" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <label className="flex-1 h-40 border-2 border-dashed border-neutral-4 rounded-2 flex flex-col items-center justify-center gap-2 hover:border-primary-1 hover:bg-neutral-2 transition-colors cursor-pointer">
                                        <Upload size={24} className="text-neutral-6" />
                                        <span className="text-xs font-poppins text-neutral-6">Uploader un fichier</span>
                                        <span className="text-[11px] font-poppins text-neutral-5">PNG, JPG jusqu'à 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setShowUrlModal(true)}
                                        className="w-20 h-40 border-2 border-dashed border-neutral-4 rounded-2 flex flex-col items-center justify-center gap-2 hover:border-primary-1 hover:bg-neutral-2 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-5 h-5 text-neutral-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span className="text-[10px] font-poppins text-neutral-6 text-center">URL</span>
                                    </button>
                                </div>
                            )}
                            {errors.icon && <p className="text-[11px] font-poppins text-danger-1">{errors.icon}</p>}
                        </div>

                        <InputField
                            label="Ordre d'affichage"
                            name="order"
                            type="number"
                            value={form.order}
                            onChange={handleChange}
                            placeholder="Ex: 1"
                            hint="Laissez vide pour placer en dernier"
                            error={errors.order}
                        />

                        {/* Statut */}
                        <div className="flex items-center justify-between py-1">
                            <div>
                                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">Catégorie active</p>
                                <p className="text-[11px] font-poppins text-neutral-6">Visible sur la boutique</p>
                            </div>
                            <ProductStatusToggle
                                active={form.is_active}
                                onChange={val => setForm(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>

                        {errors.form && (
                            <p className="text-xs text-danger-1 text-center">{errors.form}</p>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4 shrink-0">
                        <Button variant="ghost" size="normal" onClick={onClose} type="button" disabled={loading}>
                            Annuler
                        </Button>
                        <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                            {isEdit ? 'Enregistrer' : 'Créer la catégorie'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal URL */}
            {showUrlModal && (
                <>
                    <div className="fixed inset-0 bg-neutral-8/60 z-60 backdrop-blur-sm" onClick={() => setShowUrlModal(false)} />
                    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                        <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-md p-6">
                            <h3 className="text-sm font-bold font-poppins text-neutral-8 mb-4">Ajouter une image via URL</h3>
                            <InputField
                                label="URL de l'image"
                                value={tempUrl}
                                onChange={e => setTempUrl(e.target.value)}
                                placeholder="https://exemple.com/image.jpg"
                                hint="Formats acceptés : JPG, PNG, GIF"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" size="normal" onClick={() => setShowUrlModal(false)}>Annuler</Button>
                                <Button variant="primary" size="normal" onClick={handleAddUrl}>Ajouter</Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default CategoryFormModal;