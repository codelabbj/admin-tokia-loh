import { useState, useEffect, useCallback } from "react";
import { filesAPI } from "../api/files.api";

/**
 * useFiles — état centralisé pour la médiathèque avec pagination.
 *
 * Réponse API réelle :
 *  - list()   → { count, next, previous, results: [{ id, file, created_at }] }
 *  - upload() → { success: true, data: { id, file, created_at } }
 *  - detail() → { id, file, created_at }
 *
 * ⚠️  Le champ URL du fichier s'appelle "file", pas "url".
 *
 * Expose :
 *  - files        : tableau de fichiers de la page courante
 *  - loading      : chargement initial
 *  - uploading    : upload en cours
 *  - upload(file) : upload un File natif, retourne le fichier créé
 *  - remove(id)   : supprime un fichier par id
 *  - refresh()    : recharge la page courante
 *  - page         : page courante (1-indexed)
 *  - totalPages   : nombre total de pages
 *  - totalCount   : nombre total de fichiers
 *  - hasNext      : page suivante disponible
 *  - hasPrev      : page précédente disponible
 *  - goToPage(n)  : aller à la page n
 *  - pageSize     : taille de page (50 par défaut)
 */
export const useFiles = (pageSize = 50) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchFiles = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        const res = await filesAPI.list({
          page: targetPage,
          page_size: pageSize,
        });
        const data = res.data;

        if (Array.isArray(data)) {
          // Réponse non paginée (fallback)
          setFiles(data);
          setTotalCount(data.length);
          setHasNext(false);
          setHasPrev(false);
        } else {
          // Réponse paginée Django : { count, next, previous, results }
          setFiles(data?.results ?? []);
          setTotalCount(data?.count ?? 0);
          setHasNext(!!data?.next);
          setHasPrev(!!data?.previous);
        }
      } catch (err) {
        console.error("[useFiles] fetch error", err);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    fetchFiles(page);
  }, [fetchFiles, page]);

  const goToPage = useCallback((targetPage) => {
    setPage(targetPage);
  }, []);

  const upload = useCallback(
    async (file) => {
      setUploading(true);
      try {
        const res = await filesAPI.upload(file);
        const created = res.data?.data ?? res.data;

        // Si on est sur la page 1, on insère en tête (sinon refresh suffira)
        setFiles((prev) => {
          if (page === 1) {
            const next = [created, ...prev];
            // Respecter la taille de page : retirer le dernier si on déborde
            return next.length > pageSize ? next.slice(0, pageSize) : next;
          }
          return prev;
        });
        setTotalCount((c) => c + 1);

        return created;
      } finally {
        setUploading(false);
      }
    },
    [page, pageSize],
  );

  const remove = useCallback(
    async (id) => {
      await filesAPI.delete(id);
      setTotalCount((c) => Math.max(0, c - 1));

      const newFiles = files.filter((f) => f.id !== id);
      // Si on vide la page courante (et ce n'est pas la page 1), revenir en arrière
      if (newFiles.length === 0 && page > 1) {
        setPage((p) => p - 1);
      } else if (newFiles.length < pageSize && hasNext) {
        // Il reste de la place sur la page : recharger pour combler
        fetchFiles(page);
      } else {
        setFiles(newFiles);
      }
    },
    [files, page, pageSize, hasNext, fetchFiles],
  );

  return {
    files,
    loading,
    uploading,
    upload,
    remove,
    refresh: () => fetchFiles(page),
    // Pagination
    page,
    totalPages,
    totalCount,
    hasNext,
    hasPrev,
    goToPage,
    pageSize,
  };
};
