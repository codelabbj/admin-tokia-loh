import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from '../products/ProductStatusToggle';

const MOCK_BANNERS = [
    { id: 1, title: 'Soldes d\'été', description: 'Jusqu\'à -50% sur toute la boutique', dateFrom: '2025-06-01', dateTo: '2025-06-30', active: true },
    { id: 2, title: 'Livraison gratuite', description: 'Livraison offerte dès 20 000 F', dateFrom: '2025-06-15', dateTo: '2025-07-15', active: false },
];

const EMPTY_FORM = { title: '', description: '', dateFrom: '', dateTo: '', active: true };

const BannerForm = ({ banner, onSave, onCancel }) => {
    const [form, setForm] = useState(banner ?? EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Titre requis';
        if (!form.dateFrom) e.dateFrom = 'Date de début requise';
        if (!form.dateTo) e.dateTo = 'Date de fin requise';
        if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) {
            e.dateTo = 'La date de fin doit être après la date de début';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave(form);
    };

    return (
        <div className="bg-neutral-2 dark:bg-neutral-2 rounded-2 p-4 flex flex-col gap-3 border border-neutral-4 dark:border-neutral-4">
            <InputField
                label="Titre de la bannière"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Soldes d'été"
                error={errors.title}
                required
            />
            <InputField
                label="Description"
                name="description"
                type="textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Ex: Jusqu'à -50% sur toute la boutique"
            />
            <div className="grid grid-cols-2 gap-3">
                <InputField
                    label="Date de début"
                    name="dateFrom"
                    type="date"
                    value={form.dateFrom}
                    onChange={handleChange}
                    error={errors.dateFrom}
                    required
                />
                <InputField
                    label="Date de fin"
                    name="dateTo"
                    type="date"
                    value={form.dateTo}
                    onChange={handleChange}
                    error={errors.dateTo}
                    required
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ProductStatusToggle
                        active={form.active}
                        onChange={val => setForm(prev => ({ ...prev, active: val }))}
                    />
                    <span className="text-xs font-poppins text-neutral-7 dark:text-neutral-7">
                        {form.active ? 'Bannière active' : 'Bannière inactive'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit}>Sauvegarder</Button>
                </div>
            </div>
        </div>
    );
};

const SettingsBannersManager = () => {
    const [banners, setBanners] = useState(MOCK_BANNERS);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const handleToggle = (id) => {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    };

    const handleSave = (formData) => {
        if (editTarget) {
            setBanners(prev => prev.map(b => b.id === editTarget.id ? { ...b, ...formData } : b));
            setEditTarget(null);
        } else {
            setBanners(prev => [...prev, { ...formData, id: Date.now() }]);
            setShowForm(false);
        }
        // TODO : appel API
    };

    const handleDelete = (id) => {
        if (!window.confirm('Supprimer cette bannière ?')) return;
        setBanners(prev => prev.filter(b => b.id !== id));
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
                            Affiché en haut de la boutique pendant la période définie
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={() => { setShowForm(true); setEditTarget(null); }}
                    >
                        Ajouter
                    </Button>
                </div>

                {/* Formulaire ajout */}
                {showForm && !editTarget && (
                    <BannerForm
                        onSave={handleSave}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {/* Liste des bannières */}
                <div className="flex flex-col gap-3">
                    {banners.map(banner => (
                        <div key={banner.id}>
                            {editTarget?.id === banner.id ? (
                                <BannerForm
                                    banner={editTarget}
                                    onSave={handleSave}
                                    onCancel={() => setEditTarget(null)}
                                />
                            ) : (
                                <div className="flex items-start justify-between gap-3 px-4 py-3 bg-neutral-2 dark:bg-neutral-2 rounded-2">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                                {banner.title}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-poppins ${banner.active ? 'bg-success-2 text-success-1' : 'bg-neutral-3 text-neutral-6'}`}>
                                                {banner.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {banner.description && (
                                            <p className="text-[11px] font-poppins text-neutral-6 truncate">{banner.description}</p>
                                        )}
                                        <p className="text-[11px] font-poppins text-neutral-5">
                                            Du {banner.dateFrom} au {banner.dateTo}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <ProductStatusToggle active={banner.active} onChange={() => handleToggle(banner.id)} />
                                        <button onClick={() => setEditTarget(banner)} className="w-7 h-7 flex items-center justify-center rounded-1.5 text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors cursor-pointer">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(banner.id)} className="w-7 h-7 flex items-center justify-center rounded-1.5 text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {banners.length === 0 && (
                        <p className="text-xs font-poppins text-neutral-5 text-center py-4">
                            Aucune bannière configurée
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsBannersManager;