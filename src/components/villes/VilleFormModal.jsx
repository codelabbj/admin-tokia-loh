import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from '../products/ProductStatusToggle';

const EMPTY_FORM = {
    name: '',
    delivery_price: '',
    is_active: true,
};

/*
  Props :
  - open    : boolean
  - onClose : () => void
  - ville   : object | null  — { id, name, delivery_price, is_active, ... }
  - onSave  : (payload) => Promise
*/
const VilleFormModal = ({ open, onClose, ville = null, onSave }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEdit = !!ville;

    useEffect(() => {
        if (open) {
            setForm(ville ? {
                name: ville.name ?? '',
                delivery_price: ville.delivery_price ?? '',
                is_active: ville.is_active !== false,
            } : EMPTY_FORM);
            setErrors({});
        }
    }, [open, ville]);

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

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nom de la ville requis';
        if (form.delivery_price === '') e.delivery_price = 'Frais de livraison requis';
        if (isNaN(form.delivery_price) || Number(form.delivery_price) < 0)
            e.delivery_price = 'Montant invalide';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            // Payload aligné sur l'API : { name, delivery_price, is_active }
            await onSave?.({
                name: form.name.trim(),
                delivery_price: Number(form.delivery_price),
                is_active: form.is_active,
            });
            onClose();
        } catch (err) {
            // L'erreur remonte au parent (useVilles la gère)
            console.error('Erreur sauvegarde ville:', err);
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
                <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-sm flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4">
                        <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {isEdit ? 'Modifier la ville' : 'Nouvelle ville'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

                        <InputField
                            label="Nom de la ville"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ex: Cotonou"
                            error={errors.name}
                            required
                        />

                        <InputField
                            label="Frais de livraison (F)"
                            name="delivery_price"
                            type="number"
                            value={form.delivery_price}
                            onChange={handleChange}
                            placeholder="Ex: 1000"
                            hint="Saisir 0 pour une livraison gratuite"
                            error={errors.delivery_price}
                            required
                        />

                        {/* Aperçu frais */}
                        {form.delivery_price !== '' && !errors.delivery_price && (
                            <div className={`
                                flex items-center gap-2 px-3 py-2 rounded-2 text-xs font-poppins font-medium
                                ${Number(form.delivery_price) === 0
                                    ? 'bg-success-2 text-success-1'
                                    : 'bg-primary-5 text-primary-7'
                                }
                            `}>
                                {Number(form.delivery_price) === 0
                                    ? '✓ Livraison gratuite pour cette ville'
                                    : `✓ Frais de livraison : ${Number(form.delivery_price).toLocaleString('fr-FR')} F`
                                }
                            </div>
                        )}

                        {/* Statut */}
                        <div className="flex items-center justify-between py-1">
                            <div>
                                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                    Livraison active
                                </p>
                                <p className="text-[11px] font-poppins text-neutral-6">
                                    Disponible pour les commandes
                                </p>
                            </div>
                            <ProductStatusToggle
                                active={form.is_active}
                                onChange={val => setForm(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4">
                        <Button variant="ghost" size="normal" onClick={onClose} type="button">
                            Annuler
                        </Button>
                        <Button variant="primary" size="normal" loading={loading} onClick={handleSubmit}>
                            {isEdit ? 'Enregistrer' : 'Ajouter la ville'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VilleFormModal;