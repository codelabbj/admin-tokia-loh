import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, Trash2, Copy, Check, Search,
    ImageIcon, Film, FileIcon, Loader2,
    LayoutGrid, List, X, ExternalLink
} from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { useToast } from '../components/ui/ToastProvider';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/ui/Pagination';

// ── Helpers ───────────────────────────────────────────────────
const getFileType = (url = '') => {
    if (!url) return 'file';
    const lower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif)/.test(lower)) return 'image';
    if (/\.(mp4|webm|ogg|mov|avi|mkv)/.test(lower)) return 'video';
    return 'file';
};

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const FileTypeIcon = ({ url, size = 16 }) => {
    const type = getFileType(url);
    if (type === 'image') return <ImageIcon size={size} />;
    if (type === 'video') return <Film size={size} />;
    return <FileIcon size={size} />;
};

// ── Miniature fichier (grille) ────────────────────────────────
const FileCard = ({ file, selected, onSelect, onDelete, onCopy, copied, showDeleteFile = false }) => {
    const type = getFileType(file.file);
    const isImage = type === 'image';
    const isVideo = type === 'video';

    return (
        <div
            onClick={() => onSelect(file)}
            className={`
                group relative rounded-2 overflow-hidden border-2 cursor-pointer
                transition-all duration-200 bg-neutral-2 dark:bg-neutral-2
                ${selected
                    ? 'border-primary-1 ring-2 ring-primary-5'
                    : 'border-neutral-4 dark:border-neutral-4 hover:border-primary-3'
                }
            `}
        >
            {/* Aperçu */}
            <div className="aspect-square w-full overflow-hidden bg-neutral-3 dark:bg-neutral-3">
                {isImage ? (
                    <img
                        src={file.file}
                        alt={file.name ?? 'media'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-3 dark:bg-neutral-3">
                        <Film size={28} className="text-neutral-5" />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileIcon size={28} className="text-neutral-5" />
                    </div>
                )}
            </div>

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-neutral-8/0 group-hover:bg-neutral-8/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCopy(file.file); }}
                    title="Copier l'URL"
                    className="w-8 h-8 rounded-full bg-neutral-0/90 flex items-center justify-center text-neutral-7 hover:text-primary-1 transition-colors cursor-pointer shadow"
                >
                    {copied === file.file ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a
                    href={file.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Ouvrir dans un nouvel onglet"
                    className="w-8 h-8 rounded-full bg-neutral-0/90 flex items-center justify-center text-neutral-7 hover:text-primary-1 transition-colors shadow"
                >
                    <ExternalLink size={14} />
                </a>
                {showDeleteFile && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                        title="Supprimer"
                        className="w-8 h-8 rounded-full bg-neutral-0/90 flex items-center justify-center text-neutral-7 hover:text-danger-1 transition-colors cursor-pointer shadow"
                    >
                        <Trash2 size={14} />
                    </button>)}
            </div>

            {/* Sélection checkmark */}
            {selected && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary-1 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                </div>
            )}

            {/* Badge type */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-neutral-8/60 text-white text-[9px] font-bold uppercase">
                {type}
            </div>
        </div>
    );
};

// ── Ligne fichier (liste) ─────────────────────────────────────
const FileRow = ({ file, onDelete, onCopy, copied, showDeleteFile = false }) => {
    const type = getFileType(file.file);

    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors group">

            {/* Miniature */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-3 shrink-0 border border-neutral-4">
                {type === 'image'
                    ? <img src={file.file} alt="" className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center"><FileTypeIcon url={file.file} size={18} /></div>
                }
            </div>

            {/* Nom + URL */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8 truncate">
                    {file.name ?? file.file?.split('/').pop() ?? 'fichier'}
                </p>
                <p className="text-[11px] font-poppins text-neutral-5 truncate">{file.file}</p>
            </div>

            {/* Meta */}
            <div className="hidden md:flex items-center gap-6 shrink-0">
                <span className="text-[11px] font-poppins text-neutral-5 uppercase">{type}</span>
                <span className="text-[11px] font-poppins text-neutral-5">{formatBytes(file.size)}</span>
                <span className="text-[11px] font-poppins text-neutral-5">{formatDate(file.created_at)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => onCopy(file.file)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-5 hover:bg-neutral-3 hover:text-primary-1 transition-colors cursor-pointer"
                >
                    {copied === file.file ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <a
                    href={file.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-5 hover:bg-neutral-3 hover:text-primary-1 transition-colors"
                >
                    <ExternalLink size={13} />
                </a>
                {showDeleteFile && (<button
                    type="button"
                    onClick={() => onDelete(file)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-5 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
                >
                    <Trash2 size={13} />
                </button>)}
            </div>
        </div>
    );
};

// ── Zone de drop ──────────────────────────────────────────────
const DropZone = ({ onFiles, uploading }) => {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) onFiles(dropped);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`
                relative flex flex-col items-center justify-center gap-3
                rounded-3 border-2 border-dashed px-6 py-10
                transition-all duration-200 cursor-pointer
                ${dragging
                    ? 'border-primary-1 bg-primary-5 dark:bg-primary-5'
                    : 'border-neutral-4 dark:border-neutral-4 hover:border-primary-3 hover:bg-neutral-2 dark:hover:bg-neutral-2'
                }
                ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
        >
            {uploading ? (
                <Loader2 size={28} className="animate-spin text-primary-1" />
            ) : (
                <div className={`w-12 h-12 rounded-2 flex items-center justify-center transition-colors
                    ${dragging ? 'bg-primary-1 text-white' : 'bg-neutral-3 dark:bg-neutral-3 text-neutral-5'}`}>
                    <Upload size={22} />
                </div>
            )}
            <div className="text-center">
                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                    {uploading ? 'Upload en cours…' : 'Glissez vos fichiers ici'}
                </p>
                <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                    {uploading ? 'Merci de patienter' : 'ou cliquez pour parcourir — Images, vidéos'}
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) onFiles(picked);
                    e.target.value = '';
                }}
            />
        </div>
    );
};

// ── PAGE ──────────────────────────────────────────────────────
const MediaLibraryPage = ({ showDeleteFile = false }) => {
    const {
        files, loading, uploading, upload, remove,
        page, totalPages, totalCount, hasNext, hasPrev, goToPage,
    } = useFiles(50); // 50 fichiers par page

    const { toast } = useToast();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [copied, setCopied] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Remonter en haut lors d'un changement de page
    const handlePageChange = useCallback((newPage) => {
        goToPage(newPage);
        setSelectedFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [goToPage]);

    // ── Upload multiple ───────────────────────────────────────
    const handleFiles = useCallback(async (fileList) => {
        let successCount = 0;
        for (const file of fileList) {
            try {
                await upload(file);
                successCount++;
            } catch {
                toast.error(`Erreur lors de l'upload de ${file.name}`);
            }
        }
        if (successCount > 0) {
            toast.success(
                successCount === 1
                    ? 'Fichier uploadé avec succès'
                    : `${successCount} fichiers uploadés avec succès`
            );
        }
    }, [upload, toast]);

    // ── Copier URL ────────────────────────────────────────────
    const handleCopy = useCallback((url) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(url);
            toast.success('URL copiée dans le presse-papiers');
            setTimeout(() => setCopied(null), 2000);
        });
    }, [toast]);

    // ── Suppression ───────────────────────────────────────────
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await remove(deleteTarget.id);
            //toast.success('Fichier supprimé');
            if (selectedFile?.id === deleteTarget.id) setSelectedFile(null);
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    // ── Filtrage côté client (sur la page courante) ───────────
    // Note : le filtrage par type et recherche s'applique sur les fichiers
    const filtered = files.filter(f => {
        const matchSearch = !search || (f.file ?? '').toLowerCase().includes(search.toLowerCase())
            || (f.name ?? '').toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'all' || getFileType(f.file) === filterType;
        return matchSearch && matchType;
    });

    const counts = {
        all: files.length,
        image: files.filter(f => getFileType(f.file) === 'image').length,
        video: files.filter(f => getFileType(f.file) === 'video').length,
        file: files.filter(f => getFileType(f.file) === 'file').length,
    };

    React.useEffect(() => {
        document.title = 'Admin Tokia-Loh | Médiathèque';
    }, []);

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Médiathèque
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 mt-0.5">
                        {loading ? '…' : `${totalCount} fichier${totalCount !== 1 ? 's' : ''}`}
                    </p>
                </div>
            </div>

            {/* ── Zone upload ── */}
            <DropZone onFiles={handleFiles} uploading={uploading} />

            {/* ── Barre filtres + recherche ── */}
            <div className="flex items-center gap-3 flex-wrap">

                {/* Filtres type */}
                <div className="flex items-center gap-1 bg-neutral-2 dark:bg-neutral-2 rounded-full p-1">
                    {[
                        { key: 'all', label: 'Tous' },
                        { key: 'image', label: 'Images' },
                        { key: 'video', label: 'Vidéos' },
                        { key: 'file', label: 'Autres' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilterType(key)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold font-poppins transition-all cursor-pointer
                                ${filterType === key
                                    ? 'bg-neutral-0 dark:bg-neutral-0 text-neutral-8 dark:text-neutral-8 shadow-sm'
                                    : 'text-neutral-5 hover:text-neutral-7'
                                }`}
                        >
                            {label}
                            <span className={`ml-1.5 ${filterType === key ? 'text-primary-1' : 'text-neutral-4'}`}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Recherche */}
                <div className="flex-1 min-w-48 relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un fichier…"
                        className="w-full pl-8 pr-4 py-2 rounded-full border border-neutral-4 dark:border-neutral-4 bg-neutral-0 dark:bg-neutral-0 text-xs font-poppins text-neutral-8 dark:text-neutral-8 outline-none focus:border-primary-1 focus:ring-2 focus:ring-primary-5 transition-all"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-5 hover:text-neutral-7 cursor-pointer"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Bascule vue */}
                <div className="flex items-center gap-1 bg-neutral-2 dark:bg-neutral-2 rounded-full p-1">
                    <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`w-8 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer
                            ${viewMode === 'grid' ? 'bg-neutral-0 dark:bg-neutral-0 text-neutral-8 shadow-sm' : 'text-neutral-5 hover:text-neutral-7'}`}
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`w-8 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer
                            ${viewMode === 'list' ? 'bg-neutral-0 dark:bg-neutral-0 text-neutral-8 shadow-sm' : 'text-neutral-5 hover:text-neutral-7'}`}
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* ── Contenu ── */}
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
                        {search || filterType !== 'all' ? 'Aucun fichier ne correspond à votre recherche' : 'Aucun fichier pour l\'instant'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filtered.map(file => (
                        <FileCard
                            key={file.id}
                            file={file}
                            selected={selectedFile?.id === file.id}
                            onSelect={setSelectedFile}
                            onDelete={setDeleteTarget}
                            onCopy={handleCopy}
                            copied={copied}
                            showDeleteFile={showDeleteFile}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                    {filtered.map(file => (
                        <FileRow
                            key={file.id}
                            file={file}
                            onDelete={setDeleteTarget}
                            onCopy={handleCopy}
                            copied={copied}
                            showDeleteFile={showDeleteFile}
                        />
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {!loading && totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                    onPageChange={handlePageChange}
                />
            )}

            {/* ── Panneau détail fichier sélectionné ── */}
            {selectedFile && viewMode === 'grid' && (
                <div className="fixed right-0 top-0 h-full w-72 bg-neutral-0 dark:bg-neutral-0 border-l border-neutral-4 dark:border-neutral-4 z-30 flex flex-col shadow-xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-4 shrink-0">
                        <p className="text-xs font-bold font-poppins text-neutral-8">Détails</p>
                        <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-3 text-neutral-5 cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {/* Aperçu */}
                        <div className="aspect-square w-full rounded-2 overflow-hidden bg-neutral-2 border border-neutral-4">
                            {getFileType(selectedFile.file) === 'image'
                                ? <img src={selectedFile.file} alt="" className="w-full h-full object-contain" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <FileTypeIcon url={selectedFile.file} size={40} />
                                </div>
                            }
                        </div>

                        {/* Infos */}
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Nom', value: selectedFile.name ?? selectedFile.file?.split('/').pop() },
                                { label: 'Type', value: getFileType(selectedFile.file).toUpperCase() },
                                { label: 'Taille', value: formatBytes(selectedFile.size) },
                                { label: 'Date', value: formatDate(selectedFile.created_at) },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-poppins text-neutral-5 shrink-0">{label}</span>
                                    <span className="text-[11px] font-semibold font-poppins text-neutral-7 text-right break-all">{value ?? '—'}</span>
                                </div>
                            ))}
                        </div>

                        {/* URL copiable */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-poppins text-neutral-5">URL</span>
                            <div className="flex items-center gap-2 bg-neutral-2 rounded-xl px-3 py-2">
                                <p className="text-[10px] font-poppins text-neutral-6 flex-1 truncate">{selectedFile.file}</p>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(selectedFile.file)}
                                    className="shrink-0 text-neutral-5 hover:text-primary-1 cursor-pointer transition-colors"
                                >
                                    {copied === selectedFile.file ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 pt-3 border-t border-neutral-4 flex flex-col gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleCopy(selectedFile.file)}
                            className="flex items-center justify-center gap-2 w-full py-2 rounded-full bg-primary-5 text-primary-1 text-xs font-semibold font-poppins hover:bg-primary-4 transition-colors cursor-pointer"
                        >
                            {copied === selectedFile.file ? <Check size={13} /> : <Copy size={13} />}
                            Copier l'URL
                        </button>
                        {showDeleteFile && (
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(selectedFile)}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-full text-danger-1 text-xs font-semibold font-poppins hover:bg-danger-2 transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                                Supprimer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Confirmation suppression ── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteLoading}
                title="Supprimer le fichier"
                message={`Voulez-vous vraiment supprimer ce fichier ? Cette action est irréversible et peut affecter les produits qui l'utilisent.`}
            />
        </div>
    );
};

export default MediaLibraryPage;