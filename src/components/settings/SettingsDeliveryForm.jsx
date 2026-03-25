import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import ProductStatusToggle from '../products/ProductStatusToggle';

const INIT = {
    defaultFee: '1000',
    estimatedDays: '2',
    freeDelivery: false,
    freeDeliveryMin: '20000',
};

const SettingsDeliveryForm = () => {
    const [form, setForm] = useState(INIT);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.defaultFee || isNaN(form.defaultFee) || Number(form.defaultFee) < 0) {
            e.defaultFee = 'Montant invalide';
        }
        if (!form.estimatedDays || isNaN(form.estimatedDays) || Number(form.estimatedDays) < 1) {
            e.estimatedDays = 'Délai invalide';
        }
        if (form.freeDelivery && (!form.freeDeliveryMin || isNaN(form.freeDeliveryMin))) {
            e.freeDeliveryMin = 'Montant minimum invalide';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        // TODO : appel API PATCH /settings/delivery
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-5
            ">
                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                    Paramètres de livraison
                </p>

                {/* Frais par défaut + délai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                        label="Frais de livraison par défaut (F)"
                        name="defaultFee"
                        type="number"
                        value={form.defaultFee}
                        onChange={handleChange}
                        placeholder="Ex: 1000"
                        hint="Appliqué si aucun frais n'est défini pour la ville"
                        error={errors.defaultFee}
                    />
                    <InputField
                        label="Délai de livraison estimé (jours)"
                        name="estimatedDays"
                        type="number"
                        value={form.estimatedDays}
                        onChange={handleChange}
                        placeholder="Ex: 2"
                        hint="Affiché au client lors de la commande"
                        error={errors.estimatedDays}
                    />
                </div>

                {/* Livraison gratuite */}
                <div className="flex flex-col gap-3 pt-2 border-t border-neutral-4 dark:border-neutral-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                Livraison gratuite à partir d'un montant
                            </p>
                            <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                                Le client ne paie pas les frais de livraison si son panier dépasse ce montant
                            </p>
                        </div>
                        <ProductStatusToggle
                            active={form.freeDelivery}
                            onChange={val => setForm(prev => ({ ...prev, freeDelivery: val }))}
                        />
                    </div>

                    {form.freeDelivery && (
                        <InputField
                            label="Montant minimum (F)"
                            name="freeDeliveryMin"
                            type="number"
                            value={form.freeDeliveryMin}
                            onChange={handleChange}
                            placeholder="Ex: 20000"
                            error={errors.freeDeliveryMin}
                        />
                    )}
                </div>

                {/* Aperçu récap */}
                <div className="flex items-center gap-3 bg-secondary-5 dark:bg-secondary-5 border border-secondary-3 rounded-2 px-4 py-3">
                    <Truck size={16} className="text-secondary-1 shrink-0" />
                    <p className="text-xs font-poppins text-secondary-7 dark:text-secondary-7">
                        {form.freeDelivery
                            ? `Livraison gratuite dès ${Number(form.freeDeliveryMin || 0).toLocaleString('fr-FR')} F, sinon ${Number(form.defaultFee || 0).toLocaleString('fr-FR')} F — délai estimé ${form.estimatedDays} jour(s)`
                            : `Frais de livraison : ${Number(form.defaultFee || 0).toLocaleString('fr-FR')} F — délai estimé ${form.estimatedDays} jour(s)`
                        }
                    </p>
                </div>
            </div>

            {/* Sauvegarder */}
            <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-xs font-poppins text-success-1 font-medium">✓ Sauvegardé</span>}
                <Button variant="primary" size="normal" onClick={handleSave}>
                    Sauvegarder
                </Button>
            </div>
        </div>
    );
};

export default SettingsDeliveryForm;