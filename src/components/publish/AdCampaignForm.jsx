import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, ImageIcon } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import AdChannelBadge, { CHANNEL_CONFIG } from './AdChannelBadge';
import { filesAPI } from '../../api/files.api';
import { STATUS_API } from '../../constants/pubStatus';

const CHANNELS = Object.keys(CHANNEL_CONFIG);

const EMPTY_FORM = {
    title: '',
    content: '',
    image: null,        // URL string après upload
    budget: '',
    end_date: '',
    social_media: [],
    people: 0,
    status: 'draft',    // valeur API
};

const AdCampaignForm = ({ open, onClose, campaign = null, onSave }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageRef = useRef(null);
    const [manualTarget, setManualTarget] = useState(false);

    const isEdit = !!campaign;

    useEffect(() => {
        if (open) {
            if (campaign) {
                setForm({
                    title: campaign.title ?? '',
                    content: campaign.content ?? '',
                    image: campaign.image ?? null,
                    budget: campaign.budget ? String(Number(campaign.budget)) : '',
                    end_date: campaign.end_date ?? '',
                    social_media: campaign.social_media ?? [],
                    status: campaign.status ?? 'draft',
                });
                setPreview(campaign.image ?? null);
            } else {
                setForm(EMPTY_FORM);
                setPreview(null);
            }
            setErrors({});
            setApiError('');
        }
    }, [open, campaign]);

    useEffect(() => {
        if (manualTarget) return;

        const total = form.social_media.reduce((sum, channel) => {
            return sum + (CHANNEL_CONFIG[channel]?.people || 0);
        }, 0);

        setForm(prev => ({
            ...prev,
            people: total
        }));
    }, [form.social_media, manualTarget]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (name === "people") {
            setManualTarget(true);
        }
    };

    const toggleChannel = (ch) => {
        setForm(prev => ({
            ...prev,
            social_media: prev.social_media.includes(ch)
                ? prev.social_media.filter(c => c !== ch)
                : [...prev.social_media, ch],
        }));
    };

    // Sélection image → aperçu local + upload immédiat
    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setUploadingImage(true);
        setApiError('');
        try {
            const { data } = await filesAPI.upload(file);
            // Réponse : { success, data: { id, file, created_at } }
            const url = data?.data?.file ?? data?.file ?? data?.url;
            setForm(prev => ({ ...prev, image: url }));
        } catch {
            setApiError("Échec de l'upload. Réessayez.");
            setPreview(form.image);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = () => {
        setPreview(null);
        setForm(prev => ({ ...prev, image: null }));
        if (imageRef.current) imageRef.current.value = '';
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Titre requis';
        if (!form.content.trim()) e.content = 'Contenu requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || uploadingImage) return;
        setLoading(true);
        setApiError('');
        try {
            const payload = {
                title: form.title.trim(),
                content: form.content.trim(),
                image: form.image ?? null,
                budget: form.budget ? form.budget : '0.00',
                end_date: form.end_date || null,
                social_media: form.social_media,
                people: form.people,
                status: form.status,
            };
            await onSave?.(payload);
            onClose();
        } catch (err) {
            const detail =
                err?.response?.data?.detail ??
                err?.response?.data?.image?.[0] ??
                err.message ??
                'Une erreur est survenue';
            setApiError(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="
                    bg-neutral-0 dark:bg-neutral-0
                    rounded-3 shadow-xl
                    w-full max-w-lg max-h-[92vh]
                    flex flex-col overflow-hidden
                ">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4 shrink-0">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {isEdit ? 'Modifier la publicité' : 'Nouvelle publicité'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

                        {apiError && (
                            <div className="rounded-2 bg-danger-2 border border-danger-1 px-4 py-3">
                                <p className="text-xs font-poppins text-danger-1">{apiError}</p>
                            </div>
                        )}

                        {/* Titre */}
                        <InputField
                            label="Titre"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Ex: Soldes été — Robes Ankara"
                            error={errors.title}
                            required
                        />

                        {/* Contenu */}
                        <InputField
                            label="Contenu"
                            name="content"
                            type="textarea"
                            value={form.content}
                            onChange={handleChange}
                            placeholder="Rédigez le message de votre publicité..."
                            error={errors.content}
                            required
                        />

                        {/* Canaux */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Canaux de diffusion
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {CHANNELS.map(ch => {
                                    const selected = form.social_media.includes(ch);
                                    return (
                                        <button
                                            key={ch}
                                            type="button"
                                            onClick={() => toggleChannel(ch)}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                                text-xs font-semibold font-poppins border-2
                                                transition-all duration-200 cursor-pointer
                                                ${selected
                                                    ? 'border-primary-1 bg-primary-5 text-primary-1'
                                                    : 'border-neutral-4 text-neutral-6 hover:border-primary-3'
                                                }
                                            `}
                                        >
                                            <AdChannelBadge channel={ch} size="sm" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Budget + Date fin */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Budget (F)"
                                name="budget"
                                type="number"
                                value={form.budget}
                                onChange={handleChange}
                                placeholder="Ex: 50000"
                            />
                            <InputField
                                label="Date de fin"
                                name="end_date"
                                type="date"
                                value={form.end_date}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Nombre de Personnes ciblées avec valeur par défaut égale à la somme des valeurs des attributs "people" de tout les canaux choisis */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Nombre de personnes ciblées
                            </label>
                            <input
                                type="number"
                                name="people"
                                value={form.people}
                                onChange={handleChange}
                                className="
                                    w-full rounded-full border border-neutral-5
                                    bg-neutral-0 dark:bg-neutral-0
                                    px-4 py-2.5 text-xs font-poppins text-neutral-8
                                    outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                                    transition-all
                                "
                            />
                        </div>


                        {/* Statut */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Statut
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="
                                    w-full rounded-full border border-neutral-5
                                    bg-neutral-0 dark:bg-neutral-0
                                    px-4 py-2.5 text-xs font-poppins text-neutral-8
                                    outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                                    transition-all cursor-pointer
                                "
                            >
                                <option value="draft">Brouillon</option>
                                <option value="ongoing">Active</option>
                                <option value="paused">En pause</option>
                                <option value="ended">Terminée</option>
                            </select>
                        </div>

                        {/* Image */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Image{' '}
                                <span className="text-neutral-5 font-normal">(optionnel)</span>
                            </label>

                            {preview ? (
                                <div className="relative rounded-2 overflow-hidden border border-neutral-4">
                                    <img
                                        src={preview}
                                        alt="aperçu"
                                        className={`w-full h-40 object-cover transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100'}`}
                                    />
                                    {uploadingImage && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-8/20">
                                            <div className="flex items-center gap-2 bg-neutral-0 rounded-full px-3 py-1.5 shadow">
                                                <div className="w-3 h-3 border-2 border-primary-1 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-[11px] font-poppins text-neutral-8">Upload en cours…</span>
                                            </div>
                                        </div>
                                    )}
                                    {!uploadingImage && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-neutral-8/60 hover:bg-danger-1 rounded-full text-white transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => imageRef.current?.click()}
                                    className="
                                        w-full h-32 rounded-2 border-2 border-dashed border-neutral-4
                                        flex flex-col items-center justify-center gap-2
                                        text-neutral-5 hover:border-primary-1 hover:text-primary-1
                                        hover:bg-primary-5 transition-all duration-200 cursor-pointer
                                    "
                                >
                                    <ImageIcon size={22} />
                                    <span className="text-xs font-poppins">Cliquer pour ajouter une image</span>
                                </button>
                            )}
                            <input
                                ref={imageRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-4 shrink-0">
                        <Button variant="ghost" size="normal" onClick={onClose}>Annuler</Button>
                        <Button
                            variant="primary"
                            size="normal"
                            loading={loading || uploadingImage}
                            onClick={handleSubmit}
                        >
                            {isEdit ? 'Enregistrer' : 'Créer la publicité'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdCampaignForm;