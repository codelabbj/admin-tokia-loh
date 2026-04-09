import React, { useState, useCallback, memo } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import InputField from '../InputField';
import Button from '../Button';
import { filesAPI } from '../../api/files.api';
import { useToast } from '../ui/ToastProvider';

export const VARIANT_TERM = {
    singular: "Déclinaison",
    plural: "Déclinaisons",
    sub: "Sous-déclinaison"
};

import { PRESET_COLORS } from '../../pages/ProductFormPage';

export const PRESET_SIZES = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
    '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
    'Unique'
];

const VariantNode = ({ variant, onUpdate, onRemove, level, onImageSelectRequest, onImageUrlRequest, path, parentPrice, ancestorTypes, globalUnlimitedStock }) => {
    const [expanded, setExpanded] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showImageMenu, setShowImageMenu] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [draftSubType, setDraftSubType] = useState(null);
    const { toast } = useToast();
    const fileInputRef = React.useRef(null);

    // Derived types for children
    const mySubAncestorTypes = [...(ancestorTypes || []), variant._uiType].filter(Boolean);
    const currentType = variant._uiType || (level === 0 ? (ancestorTypes?.[0] || 'Autre') : 'Autre');

    const canAddTaille = !mySubAncestorTypes.includes('Taille');
    const canAddCouleur = !mySubAncestorTypes.includes('Couleur');

    const availableOptions = [];
    if (canAddTaille) availableOptions.push({ value: 'Taille', label: 'Déclinaison de taille' });
    if (canAddCouleur) availableOptions.push({ value: 'Couleur', label: 'Déclinaison de couleur' });
    availableOptions.push({ value: 'Autre', label: 'Autre caractéristique' });

    const handlePlusClick = () => {
        if (availableOptions.length === 1 && availableOptions[0].value === 'Autre') {
            handleAddSubVariant('Autre');
        } else {
            setShowAddMenu(!showAddMenu);
        }
    };

    const handleChange = (fieldOrObj, value) => {
        if (typeof fieldOrObj === 'object') {
            onUpdate({ ...variant, ...fieldOrObj });
        } else {
            onUpdate({ ...variant, [fieldOrObj]: value });
        }
    };

    const handleAddSubVariant = (typeUI) => {
        if (typeUI === 'Autre') {
            const currentSub = variant.sub_variants || [];
            const defaultPrice = variant.price || parentPrice || '';
            onUpdate({
                ...variant,
                sub_variants: [...currentSub, { id: null, key: '', name: '', price: defaultPrice, stock: '', image: '', sub_variants: [], _uiType: typeUI }]
            });
        } else {
            setDraftSubType(typeUI);
        }
        setExpanded(true);
        setShowAddMenu(false);
    };

    const handleToggleSubVariantName = (name, typeUI) => {
        const currentSubs = variant.sub_variants || [];
        const existingIdx = currentSubs.findIndex(s => s.name === name && s._uiType === typeUI);
        
        if (existingIdx >= 0) {
            handleRemoveSubVariant(existingIdx);
            if (currentSubs.length === 1) setDraftSubType(typeUI);
        } else {
            const defaultPrice = variant.price || parentPrice || '';
            onUpdate({
                ...variant,
                sub_variants: [...currentSubs, { id: null, key: '', name, price: defaultPrice, stock: '', image: '', sub_variants: [], _uiType: typeUI }]
            });
            setExpanded(true);
        }
    };

    const handleUpdateSubVariant = (index, updatedSub) => {
        const newSubs = [...(variant.sub_variants || [])];
        newSubs[index] = updatedSub;
        onUpdate({ ...variant, sub_variants: newSubs });
    };

    const handleRemoveSubVariant = (index) => {
        const newSubs = [...(variant.sub_variants || [])];
        newSubs.splice(index, 1);
        onUpdate({ ...variant, sub_variants: newSubs });
    };

    const hasSubVariants = variant.sub_variants && variant.sub_variants.length > 0;

    // Resolve preview if it's an object with {preview, file} or just url
    let imgPreview = variant.image;
    if (typeof variant.image === 'object' && variant.image?.preview) {
        imgPreview = variant.image.preview;
    } else if (typeof variant.image === 'object' && variant.image?.file instanceof File) {
        imgPreview = URL.createObjectURL(variant.image.file);
    }

    return (
        <div className="border border-neutral-4 dark:border-neutral-5 rounded-2xl mb-3 bg-neutral-0 dark:bg-neutral-1 transition-all duration-200">
            {/* Header / Main fields */}
            <div className={`p-4 flex flex-col md:flex-row gap-4 items-start md:items-center relative ${expanded && hasSubVariants ? 'border-b border-neutral-4 dark:border-neutral-5' : ''}`}>

                {/* Image Section */}
                <div className="flex-shrink-0">
                    {imgPreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-4 dark:border-neutral-5 group">
                            <img src={imgPreview} alt="variant" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => handleChange('image', '')}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => setShowImageMenu(!showImageMenu)}
                                className={`w-16 h-16 rounded-xl border-2 border-dashed border-neutral-4 dark:border-neutral-5 flex items-center justify-center transition-colors cursor-pointer ${uploading ? 'bg-neutral-2' : 'text-neutral-6 hover:border-primary-1 hover:text-primary-1'}`}
                            >
                                {uploading ? <Loader2 size={20} className="animate-spin text-primary-1" /> : <ImageIcon size={20} />}
                            </button>
                            {showImageMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowImageMenu(false)} />
                                    <div className="absolute left-0 top-full mt-1 w-56 bg-neutral-0 dark:bg-neutral-1 border border-neutral-3 shadow-lg rounded-xl z-50 flex flex-col p-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { fileInputRef.current?.click(); setShowImageMenu(false); }}
                                            className="text-xs px-3 py-2 text-left rounded-lg text-neutral-8 hover:bg-neutral-2 transition-colors cursor-pointer"
                                        >
                                            Depuis cet ordinateur
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { onImageSelectRequest(path); setShowImageMenu(false); }}
                                            className="text-xs px-3 py-2 text-left rounded-lg text-neutral-8 hover:bg-neutral-2 transition-colors cursor-pointer"
                                        >
                                            Depuis la bibliothèque Tokia
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { onImageUrlRequest?.(path); setShowImageMenu(false); }}
                                            className="text-xs px-3 py-2 text-left rounded-lg text-neutral-8 hover:bg-neutral-2 transition-colors cursor-pointer"
                                        >
                                            Ajouter via lien (URL)
                                        </button>
                                    </div>
                                </>
                            )}
                            {/* Hidden file input must remain mounted to receive the onChange event after the menu closes */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                    if (e.target.files?.length > 0) {
                                        const f = e.target.files[0];
                                        setUploading(true);
                                        try {
                                            const { data: response } = await filesAPI.upload(f);
                                            const url = response?.data?.file ?? response?.file ?? response?.url;
                                            if (url) {
                                                handleChange('image', url);
                                            } else {
                                                toast.error("Format de réponse d'upload invalide.");
                                            }
                                        } catch (err) {
                                            toast.error("Erreur lors de l'upload de l'image.");
                                        } finally {
                                            setUploading(false);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Main Inputs */}
                <div className="flex-1 flex flex-col gap-2.5 w-full">
                    {/* Ligne 1: Nom */}
                    <div className="w-full">
                        {currentType === 'Couleur' || currentType === 'Taille' ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold font-poppins text-neutral-5 uppercase tracking-wide">
                                    {currentType}
                                </span>
                                <div className="h-9 px-3 rounded-md border border-neutral-4 dark:border-neutral-5 bg-neutral-2/50 dark:bg-neutral-2/30 flex items-center gap-2 select-none overflow-hidden">
                                    {currentType === 'Couleur' && (
                                        <div 
                                            className="w-3.5 h-3.5 rounded-full border border-neutral-4 flex-shrink-0 shadow-sm" 
                                            style={{ backgroundColor: PRESET_COLORS.find(c => c.name === variant.name)?.hex || '#ccc' }} 
                                        />
                                    )}
                                    <span className="text-[11px] font-semibold text-neutral-8 truncate block w-full">{variant.name || 'N/A'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <InputField
                                    label="Clé caractéristique"
                                    placeholder="Ex: matiere"
                                    value={variant.key || ''}
                                    onChange={(e) => handleChange('key', e.target.value)}
                                    error=""
                                />
                                <InputField
                                    label="Valeur *"
                                    placeholder="Ex: Coton..."
                                    value={variant.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    error=""
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Ligne 2: Prix, Stock et Illimité */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <InputField
                            label="Prix (Optionnel)"
                            type="number"
                            min="0"
                            placeholder="Hérité"
                            value={variant.price || ''}
                            onChange={(e) => handleChange('price', e.target.value)}
                            error=""
                        />
                        <InputField
                            label="Stock (Optionnel)"
                            type="number"
                            min="0"
                            placeholder={(globalUnlimitedStock && variant.unlimited_stock) ? "Illimité" : "Hérité / Ill."}
                            value={(globalUnlimitedStock && variant.unlimited_stock) ? '' : (variant.stock || '')}
                            onChange={(e) => {
                                if (!globalUnlimitedStock && variant.unlimited_stock) {
                                    handleChange({ stock: e.target.value, unlimited_stock: false });
                                } else {
                                    handleChange('stock', e.target.value);
                                }
                            }}
                            disabled={globalUnlimitedStock && variant.unlimited_stock}
                            error=""
                        />
                        {globalUnlimitedStock && (
                            <label className="flex items-center gap-2 cursor-pointer select-none pb-2.5">
                                <input
                                    type="checkbox"
                                    checked={!!variant.unlimited_stock}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleChange({ unlimited_stock: true, stock: '' });
                                        } else {
                                            handleChange('unlimited_stock', false);
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-neutral-5 text-primary-1 focus:ring-primary-5"
                                />
                                <span className="text-[11px] font-semibold font-poppins text-neutral-7 dark:text-neutral-7">Toujours en stock</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center mt-2 md:mt-0">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={handlePlusClick}
                            className="p-2 text-primary-1 hover:bg-primary-1/10 rounded-xl transition-colors cursor-pointer"
                            title={`Ajouter une ${VARIANT_TERM.sub.toLowerCase()}`}
                        >
                            <Plus size={18} />
                        </button>
                        {showAddMenu && availableOptions.length > 1 && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-neutral-0 dark:bg-neutral-1 border border-neutral-3 shadow-lg rounded-xl z-50 flex flex-col p-1 gap-1">
                                    {availableOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleAddSubVariant(opt.value)}
                                            className="text-xs px-3 py-2 hover:bg-neutral-2 font-poppins text-left rounded-lg text-neutral-8 transition-colors cursor-pointer"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 text-danger cursor-pointer hover:bg-danger/10 rounded-xl transition-colors"
                        title={`Supprimer cette ${VARIANT_TERM.singular.toLowerCase()}`}
                    >
                        <Trash2 size={18} />
                    </button>
                    {hasSubVariants && (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="p-2 cursor-pointer text-neutral-6 hover:bg-neutral-2 dark:hover:bg-neutral-3 rounded-xl transition-colors"
                        >
                            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Sub Variants List */}
            {expanded && (hasSubVariants || draftSubType) && (() => {
                const activeSubType = variant.sub_variants?.[0]?._uiType || draftSubType;
                const showBank = activeSubType === 'Couleur' || activeSubType === 'Taille';
                return (
                <div className="p-4 bg-neutral-2/30 dark:bg-neutral-2/10 border-l-[3px] border-l-primary-1 pl-4 md:pl-8 flex flex-col gap-4">
                    
                    {/* Chip Bank */}
                    {showBank && (
                        <div className="p-3 bg-neutral-0 dark:bg-neutral-1 rounded-xl border border-neutral-4 dark:border-neutral-5 mb-2 shadow-sm">
                            <div className="flex items-center justify-between mb-3 border-b border-neutral-2 dark:border-neutral-4 pb-2">
                                <h4 className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-0">
                                    Sélectionnez les {activeSubType.toLowerCase()}s
                                </h4>
                                <button type="button" onClick={() => {
                                    if (!hasSubVariants) setDraftSubType(null);
                                }} className="text-neutral-5 hover:text-danger-1 transition-colors cursor-pointer p-1">
                                    {!hasSubVariants && <X size={14} />}
                                </button>
                            </div>
                            
                            {activeSubType === 'Couleur' && (
                                <div className="grid grid-cols-10 gap-2">
                                    {PRESET_COLORS.map(color => {
                                        const isSelected = (variant.sub_variants || []).some(s => s.name === color.name && s._uiType === 'Couleur');
                                        return (
                                            <button
                                                key={color.hex}
                                                type="button"
                                                onClick={() => handleToggleSubVariantName(color.name, 'Couleur')}
                                                title={color.name}
                                                className={`w-full flex-shrink-0 aspect-square rounded-md border-2 transition-all cursor-pointer ${isSelected ? 'border-neutral-4 opacity-40 shadow-inner' : 'border-transparent hover:border-primary-1 hover:scale-110 opacity-90 hover:opacity-100'}`}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {activeSubType === 'Taille' && (
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_SIZES.map(size => {
                                        const isSelected = (variant.sub_variants || []).some(s => s.name === size && s._uiType === 'Taille');
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => handleToggleSubVariantName(size, 'Taille')}
                                                className={`px-4 py-2 rounded-full text-[11px] font-semibold font-poppins transition-all cursor-pointer ${isSelected ? 'bg-primary-1 text-white' : 'bg-neutral-2 text-neutral-6 hover:bg-neutral-3 border border-transparent'}`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {(variant.sub_variants || []).map((sub, i) => (
                        <VariantNode
                            key={sub.id || i}
                            variant={sub}
                            path={[...path, i]}
                            level={level + 1}
                            parentPrice={variant.price || parentPrice}
                            globalUnlimitedStock={globalUnlimitedStock}
                            ancestorTypes={mySubAncestorTypes}
                            onImageSelectRequest={onImageSelectRequest}
                            onImageUrlRequest={onImageUrlRequest}
                            onUpdate={(updatedSub) => handleUpdateSubVariant(i, updatedSub)}
                            onRemove={() => handleRemoveSubVariant(i)}
                        />
                    ))}
                </div>
                );
            })()}
        </div>
    );
};

/**
 * Mémoïsation : VariantNode ne se re-rend que si ses propres données changent.
 * Cela évite qu'une frappe dans une variante déclenche le re-render de toutes les autres.
 */
const MemoVariantNode = memo(VariantNode, (prev, next) => {
    return (
        prev.variant === next.variant &&
        prev.level === next.level &&
        prev.parentPrice === next.parentPrice &&
        prev.ancestorTypes === next.ancestorTypes &&
        prev.globalUnlimitedStock === next.globalUnlimitedStock &&
        prev.path?.join(',') === next.path?.join(',')
    );
});

const VariantsEditorTree = ({ variants, onChange, onImageSelectRequest, onImageUrlRequest, disableRootAdd, suggestedSubVariantType, onRemoveRoot, productPrice, rootType, globalUnlimitedStock }) => {
    const handleAddRoot = useCallback(() => {
        onChange([...variants, { id: null, key: '', name: '', price: String(productPrice || ''), stock: '', image: '', sub_variants: [] }]);
    }, [variants, onChange, productPrice]);

    const handleUpdateRoot = useCallback((index, updatedVariant) => {
        const newV = [...variants];
        newV[index] = updatedVariant;
        onChange(newV);
    }, [variants, onChange]);

    const handleRemoveRoot = useCallback((index) => {
        if (disableRootAdd && onRemoveRoot) {
            onRemoveRoot(variants[index]);
            return;
        }
        const newV = [...variants];
        newV.splice(index, 1);
        onChange(newV);
    }, [disableRootAdd, onRemoveRoot, variants, onChange]);

    return (
        <div className="w-full">
            {variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-4 dark:border-neutral-5 rounded-2xl bg-neutral-0 dark:bg-neutral-1">
                    <div className="w-12 h-12 rounded-full bg-neutral-2 dark:bg-neutral-2 flex items-center justify-center mx-auto mb-3">
                        <ImageIcon size={24} className="text-neutral-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-8 dark:text-neutral-0 mb-1">Aucune {VARIANT_TERM.singular.toLowerCase()}</h3>
                    {disableRootAdd ? (
                        <p className="text-xs text-neutral-6 mb-4">Sélectionnez des tailles ou couleurs au-dessus pour générer vos {VARIANT_TERM.plural.toLowerCase()} ici.</p>
                    ) : (
                        <>
                            <p className="text-xs text-neutral-6 mb-4">Créez des {VARIANT_TERM.plural.toLowerCase()} récursives (Tailles, Couleurs, etc.)</p>
                            <Button variant="outline" size="sm" onClick={handleAddRoot} type="button" icon={<Plus size={16} />}>
                                Ajouter ma première {VARIANT_TERM.singular.toLowerCase()}
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {variants.map((v, i) => (
                        <MemoVariantNode
                            key={v.id || i}
                            variant={v}
                            path={[i]}
                            level={0}
                            ancestorTypes={[rootType || 'Autre']}
                            parentPrice={productPrice}
                            globalUnlimitedStock={globalUnlimitedStock}
                            onImageSelectRequest={onImageSelectRequest}
                            onImageUrlRequest={onImageUrlRequest}
                            onUpdate={(updated) => handleUpdateRoot(i, updated)}
                            onRemove={() => handleRemoveRoot(i)}
                        />
                    ))}
                    {!disableRootAdd && (
                        <Button variant="outline" size="sm" onClick={handleAddRoot} type="button" icon={<Plus size={16} />} className="w-full justify-center border-dashed">
                            Ajouter une autre {VARIANT_TERM.singular.toLowerCase()} principale
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VariantsEditorTree;
