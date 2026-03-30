import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination
 *
 * Props :
 *  - page         : page courante (1-indexed)
 *  - totalPages   : nombre total de pages
 *  - totalCount   : nombre total d'éléments
 *  - hasNext      : boolean
 *  - hasPrev      : boolean
 *  - onPageChange : (page: number) => void
 *  - compact      : boolean — mode compact (pour le picker modal)
 */
const Pagination = ({ page, totalPages, totalCount, hasNext, hasPrev, onPageChange, compact = false }) => {
    if (totalPages <= 1) return null;

    // Générer les numéros de pages à afficher (avec ellipses)
    const getPageNumbers = () => {
        const delta = compact ? 1 : 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
            range.push(i);
        }

        if (page - delta > 2) range.unshift('...');
        if (page + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    const pages = getPageNumbers();

    const btnBase = `flex items-center justify-center rounded-full font-poppins font-semibold transition-all cursor-pointer
        ${compact ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'}`;

    return (
        <div className={`flex items-center justify-between gap-4 ${compact ? 'px-0 py-2' : 'px-1 py-3'}`}>
            {/* Compteur */}
            <p className={`font-poppins text-neutral-5 shrink-0 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                {totalCount} fichier{totalCount !== 1 ? 's' : ''}
            </p>

            {/* Contrôles */}
            <div className="flex items-center gap-1">
                {/* Précédent */}
                <button
                    type="button"
                    onClick={() => hasPrev && onPageChange(page - 1)}
                    disabled={!hasPrev}
                    className={`${btnBase} text-neutral-5 hover:bg-neutral-3 hover:text-neutral-8 disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronLeft size={compact ? 13 : 15} />
                </button>

                {/* Numéros */}
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span
                            key={`dots-${i}`}
                            className={`${btnBase} text-neutral-4 cursor-default`}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={`${btnBase}
                                ${page === p
                                    ? 'bg-primary-1 text-white shadow-sm'
                                    : 'text-neutral-6 hover:bg-neutral-3 hover:text-neutral-8'
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                {/* Suivant */}
                <button
                    type="button"
                    onClick={() => hasNext && onPageChange(page + 1)}
                    disabled={!hasNext}
                    className={`${btnBase} text-neutral-5 hover:bg-neutral-3 hover:text-neutral-8 disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronRight size={compact ? 13 : 15} />
                </button>
            </div>

            {/* Page X / Y */}
            <p className={`font-poppins text-neutral-5 shrink-0 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                Page {page}/{totalPages}
            </p>
        </div>
    );
};

export default Pagination;