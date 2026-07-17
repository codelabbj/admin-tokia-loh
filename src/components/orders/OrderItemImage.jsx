import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Package, X } from 'lucide-react';

/**
 * Modale plein écran pour voir l'image produit en grand.
 */
const ImagePreviewModal = ({ src, alt, onClose }) => {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-8/70 dark:bg-neutral-8/80 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt ? `Aperçu : ${alt}` : 'Aperçu image'}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-0/95 text-neutral-7 hover:text-neutral-8 shadow cursor-pointer transition-colors z-10"
                title="Fermer"
                aria-label="Fermer"
            >
                <X size={18} />
            </button>

            <div
                className="relative max-w-[min(92vw,720px)] max-h-[85vh] w-full flex flex-col items-center gap-3"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2 bg-neutral-0 shadow-xl"
                />
                {alt && (
                    <p className="text-xs font-semibold font-poppins text-white text-center px-3 py-1.5 rounded-full bg-neutral-8/60 max-w-full truncate">
                        {alt}
                    </p>
                )}
            </div>
        </div>,
        document.body,
    );
};

/**
 * Miniature produit pour une ligne de commande.
 * Clic → aperçu en grand (si une image est disponible).
 */
const OrderItemImage = ({
    src,
    alt = 'Produit',
    size = 'md',
    previewable = true,
    stopPropagation = false,
}) => {
    const [failed, setFailed] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const sizeClass = size === 'sm'
        ? 'w-8 h-8 rounded-md'
        : 'w-11 h-11 rounded-md';
    const iconSize = size === 'sm' ? 14 : 18;
    const canPreview = previewable && !!src && !failed;

    if (!src || failed) {
        return (
            <div className={`${sizeClass} shrink-0 bg-neutral-3 dark:bg-neutral-3 flex items-center justify-center`}>
                <Package size={iconSize} className="text-neutral-5" />
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                title="Voir l'image en grand"
                onClick={(e) => {
                    if (stopPropagation) e.stopPropagation();
                    if (canPreview) setPreviewOpen(true);
                }}
                className={`
                    ${sizeClass} shrink-0 overflow-hidden p-0 border-0 bg-transparent
                    ${canPreview ? 'cursor-zoom-in hover:ring-2 hover:ring-primary-1 hover:ring-offset-1 transition-shadow' : 'cursor-default'}
                `}
            >
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="w-full h-full object-cover bg-neutral-3 dark:bg-neutral-3"
                />
            </button>

            {previewOpen && (
                <ImagePreviewModal
                    src={src}
                    alt={alt}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </>
    );
};

/**
 * Empilement de miniatures pour la liste des commandes.
 */
export const OrderItemsThumbStack = ({ items = [], max = 3 }) => {
    const withImages = items.slice(0, max);
    const extra = Math.max(0, items.length - max);

    if (!items.length) {
        return <span className="text-neutral-6">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2">
                {withImages.map((item, i) => (
                    <div
                        key={i}
                        className="ring-2 ring-neutral-0 dark:ring-neutral-0 rounded-md"
                        title={item.name}
                    >
                        <OrderItemImage
                            src={item.image}
                            alt={item.name}
                            size="sm"
                            stopPropagation
                        />
                    </div>
                ))}
            </div>
            <span className="text-neutral-6 whitespace-nowrap">
                {items.length} article{items.length > 1 ? 's' : ''}
                {extra > 0 ? ` (+${extra})` : ''}
            </span>
        </div>
    );
};

export default OrderItemImage;
