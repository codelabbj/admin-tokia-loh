import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Search, Check, Loader2, ImageIcon, Film, FileIcon } from 'lucide-react';
import { useFiles } from '../../hooks/useFiles';
import { useToast } from '../ui/ToastProvider';
import Pagination from '../ui/Pagination';

// ── Helpers ───────────────────────────────────────────────────
const getFileType = (url = '') => {
    if (!url) return 'file';
    const lower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif)/.test(lower)) return 'image';
    if (/\.(mp4|webm|ogg|mov|avi|mkv)/.test(lower)) return 'video';
    return 'file';
};

/**
 * MediaPickerModal
 *
 * Props :
 *  - open         : boolean
 *  - onClose      : () => void
 *  - onSelect     : (file: { id, url, ... }) => void
 *  - multiple     : boolean (défaut false)
 *  - accept       : 'all' | 'image' | 'video' (défaut 'all')
 *  - title        : string (défaut 'Choisir un fichier')
 */
const MediaPickerModal = ({
    open,
    onClose,
    onSelect,
    multiple = false,
    accept = 'all',
    title = 'Choisir un fichier',
}) => {
    const {
        files, loading, uploading, upload,
        page, totalPages, totalCount, hasNext, hasPrev, goToPage,
    } = useFiles(50); // 50 fichiers par page

    const { toast } = useToast();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState(accept === 'all' ? 'all' : accept);
    const [selected, setSelected] = useState([]);
    const uploadRef = useRef(null);
    const scrollRef = useRef(null);

    // ── Upload depuis le picker ───────────────────────────────
    const handleUpload = useCallback(async (fileList) => {
        const arr = Array.from(fileList);
        let last = null;
        for (const file of arr) {
            try {
                const created = await upload(file);
                last = created;
            } catch {
                toast.error(`Erreur upload : ${file.name}`);
            }
        }
        if (last) {
            if (multiple) {
                setSelected(prev => [...prev, last]);
            } else {
                setSelected([last]);
            }
            toast.success('Fichier Téléversé');
        }
    }, [upload, toast, multiple]);

    // ── Changement de page (avec scroll en haut de la grille) ─
    const handlePageChange = useCallback((newPage) => {
        goToPage(newPage);
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [goToPage]);

    // ── Bloquer scroll body ───────────────────────────────────
    React.useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open) {
            setSelected([]);
            setSearch('');
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    // ── Filtrage côté client (sur la page courante) ───────────
    const filtered = files.filter(f => {
        const matchSearch = !search
            || (f.file ?? '').toLowerCase().includes(search.toLowerCase())
            || (f.name ?? '').toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'all' || getFileType(f.file) === filterType;
        const matchAccept = accept === 'all' || getFileType(f.file) === accept;
        return matchSearch && matchType && matchAccept;
    });

    // ── Sélection ─────────────────────────────────────────────
    const toggleSelect = (file) => {
        if (multiple) {
            setSelected(prev =>
                prev.some(f => f.id === file.id)
                    ? prev.filter(f => f.id !== file.id)
                    : [...prev, file]
            );
        } else {
            setSelected([file]);
        }
    };

    const isSelected = (file) => selected.some(f => f.id === file.id);

    // Double-clic : en sélection unique (une seule image), on valide directement.
    const handleTileDoubleClick = (file, fileType) => {
        if (multiple) return;
        if (fileType !== 'image') return;
        setSelected([file]);
        onSelect?.(file);
        onClose();
    };

    const handleConfirm = () => {
        if (!selected.length) return;
        onSelect(multiple ? selected : selected[0]);
        onClose();
    };

    const showTabs = accept === 'all';

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 z-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                <div className="bg-neutral-0 dark:bg-neutral-0 rounded-3 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4 shrink-0">
                        <div>
                            <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                {title}
                            </h2>
                            {selected.length > 0 && (
                                <p className="text-[11px] font-poppins text-primary-1 mt-0.5">
                                    {selected.length} fichier{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 text-neutral-5 hover:text-neutral-8 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Barre outils */}
                    <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-4 dark:border-neutral-4 shrink-0 flex-wrap">

                        {/* Upload rapide */}
                        <button
                            type="button"
                            onClick={() => uploadRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-1 text-white text-xs font-semibold font-poppins hover:bg-primary-2 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                        >
                            {uploading
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Upload size={13} />
                            }
                            {uploading ? 'Upload…' : 'Uploader'}
                        </button>
                        <input
                            ref={uploadRef}
                            type="file"
                            multiple
                            accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*'}
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.length) handleUpload(e.target.files);
                                e.target.value = '';
                            }}
                        />

                        {/* Tabs filtres */}
                        {showTabs && (
                            <div className="flex items-center gap-1 bg-neutral-2 dark:bg-neutral-2 rounded-full p-1">
                                {[
                                    { key: 'all', label: 'Tous' },
                                    { key: 'image', label: 'Images' },
                                    { key: 'video', label: 'Vidéos' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFilterType(key)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold font-poppins transition-all cursor-pointer
                                            ${filterType === key
                                                ? 'bg-neutral-0 dark:bg-neutral-0 text-neutral-8 shadow-sm'
                                                : 'text-neutral-5 hover:text-neutral-7'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Recherche */}
                        <div className="flex-1 min-w-32 relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher…"
                                className="w-full pl-7 pr-3 py-1.5 rounded-full border border-neutral-4 dark:border-neutral-4 bg-neutral-0 dark:bg-neutral-0 text-xs font-poppins text-neutral-8 outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all"
                            />
                        </div>
                    </div>

                    {/* Grille fichiers */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 size={24} className="animate-spin text-primary-1" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <div className="w-12 h-12 rounded-2 bg-neutral-2 flex items-center justify-center">
                                    <ImageIcon size={22} className="text-neutral-4" />
                                </div>
                                <p className="text-xs font-poppins text-neutral-5">
                                    {search ? 'Aucun fichier ne correspond' : 'Aucun fichier disponible — uploadez-en un !'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                    {filtered.map(file => {
                                        const type = getFileType(file.file);
                                        const sel = isSelected(file);
                                        return (
                                            <button
                                                key={file.id}
                                                type="button"
                                                onClick={() => toggleSelect(file)}
                                                onDoubleClick={() => handleTileDoubleClick(file, type)}
                                                title={!multiple && type === 'image' ? 'Double-clic pour sélectionner' : undefined}
                                                className={`
                                                    relative aspect-square rounded-2 overflow-hidden border-2
                                                    transition-all duration-150 cursor-pointer group
                                                    ${sel
                                                        ? 'border-primary-1 ring-2 ring-primary-5'
                                                        : 'border-neutral-4 hover:border-primary-3'
                                                    }
                                                `}
                                            >
                                                {/* Aperçu */}
                                                <div className="w-full h-full bg-neutral-2">
                                                    {type === 'image' ? (
                                                        <img
                                                            src={file.file}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-neutral-3">
                                                            {type === 'video'
                                                                ? <Film size={20} className="text-neutral-5" />
                                                                : <FileIcon size={20} className="text-neutral-5" />
                                                            }
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Check sélection */}
                                                {sel && (
                                                    <div className="absolute inset-0 bg-primary-1/20 flex items-center justify-center">
                                                        <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center shadow">
                                                            <Check size={12} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Nom au survol */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-neutral-8/70 py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[9px] font-poppins text-white truncate">
                                                        {file.name ?? file.file?.split('/').pop()}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Pagination dans la grille */}
                                {totalPages > 1 && (
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        totalCount={totalCount}
                                        hasNext={hasNext}
                                        hasPrev={hasPrev}
                                        onPageChange={handlePageChange}
                                        compact
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4 shrink-0">
                        <p className="text-[11px] font-poppins text-neutral-5">
                            {totalCount} fichier{totalCount !== 1 ? 's' : ''} au total
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-full text-xs font-semibold font-poppins text-neutral-6 hover:bg-neutral-3 transition-colors cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!selected.length}
                                className="px-4 py-2 rounded-full text-xs font-semibold font-poppins bg-primary-1 text-white hover:bg-primary-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Utiliser {selected.length > 0 ? `(${selected.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MediaPickerModal;