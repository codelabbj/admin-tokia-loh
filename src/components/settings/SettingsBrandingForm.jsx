import React, { useState, useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import Button from '../Button';

const INIT = {
    logo: null,   // { preview } ou null
    primaryColor: '#0EA5E9',
    secondaryColor: '#8B5CF6',
};

const ColorSwatch = ({ label, name, value, onChange }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
            {label}
        </label>
        <div className="flex items-center gap-3">
            {/* Aperçu couleur cliquable */}
            <label className="cursor-pointer">
                <div
                    className="w-10 h-10 rounded-2 border-2 border-neutral-4 shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: value }}
                />
                <input
                    type="color"
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="sr-only"
                />
            </label>
            {/* Valeur hex */}
            <input
                type="text"
                value={value}
                onChange={e => onChange({ target: { name, value: e.target.value } })}
                maxLength={7}
                className="
                    w-28 px-3 py-2 text-xs font-mono rounded-full
                    border border-neutral-5 dark:border-neutral-5
                    bg-neutral-0 dark:bg-neutral-0
                    text-neutral-8 dark:text-neutral-8
                    outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5
                    transition-all duration-200 uppercase
                "
            />
            {/* Prévisualisation sur bouton */}
            <button
                type="button"
                className="px-4 py-2 rounded-full text-white text-xs font-semibold font-poppins transition-all"
                style={{ backgroundColor: value }}
            >
                Aperçu
            </button>
        </div>
    </div>
);

const SettingsBrandingForm = () => {
    const [form, setForm] = useState(INIT);
    const [saved, setSaved] = useState(false);
    const logoRef = useRef(null);

    const handleColor = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLogo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, logo: { file, preview } }));
    };

    const handleSave = async () => {
        // TODO : appel API PATCH /settings/branding
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Logo */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-4
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Logo
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        Format recommandé : PNG transparent, 512×512px minimum
                    </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* Aperçu logo actuel ou placeholder TL */}
                    <div className="w-20 h-20 rounded-3 bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 flex items-center justify-center overflow-hidden shrink-0">
                        {form.logo ? (
                            <img src={form.logo.preview} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="font-poppins font-bold text-2xl">
                                <span className="text-primary-1">T</span>
                                <span className="text-secondary-1">L</span>
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="normal"
                            icon={<Upload size={14} />}
                            onClick={() => logoRef.current?.click()}
                        >
                            Changer le logo
                        </Button>
                        {form.logo && (
                            <Button
                                variant="dangerOutline"
                                size="sm"
                                icon={<Trash2 size={13} />}
                                onClick={() => setForm(prev => ({ ...prev, logo: null }))}
                            >
                                Supprimer
                            </Button>
                        )}
                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                    </div>
                </div>
            </div>

            {/* Couleurs */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-3 p-5 flex flex-col gap-5
            ">
                <div>
                    <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                        Couleurs de l'interface
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        Ces couleurs s'appliquent sur le backoffice et la boutique
                    </p>
                </div>

                <ColorSwatch
                    label="Couleur primaire (Bleu ciel)"
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={handleColor}
                />
                <ColorSwatch
                    label="Couleur secondaire (Violet)"
                    name="secondaryColor"
                    value={form.secondaryColor}
                    onChange={handleColor}
                />

                {/* Prévisualisation combinée */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-poppins text-neutral-6">Prévisualisation :</span>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-24 rounded-full" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }} />
                        <span className="text-xs font-bold font-poppins">
                            <span style={{ color: form.primaryColor }}>Tokia</span>
                            <span style={{ color: form.secondaryColor }}>-Loh</span>
                        </span>
                    </div>
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

export default SettingsBrandingForm;