import { useState, useEffect, useCallback, useMemo } from "react";
import { filesAPI } from "../api/files.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { fetchAllPaginatedPages } from "../utils/fetchAllPages";
import { getMediaFileType } from "../utils/mediaFileType";

/**
 * Médiathèque : charge toutes les pages API pour recherche et filtres Images/Vidéos fiables.
 *
 * @param {{ enabled?: boolean, lockTab?: 'image' | 'video' | null }} options
 *   - enabled : ne charge l'API que si true (ex. modale ouverte)
 *   - lockTab : force un onglet (ex. accept="image" dans le picker)
 */
export const useMediaLibrary = ({ enabled = true, lockTab = null } = {}) => {
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [mediaTab, setMediaTab] = useState(lockTab ?? "image");
  const [reloadNonce, setReloadNonce] = useState(0);

  const activeTab = lockTab ?? mediaTab;

  useEffect(() => {
    if (lockTab) setMediaTab(lockTab);
  }, [lockTab]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { items } = await fetchAllPaginatedPages(
          async (pageNum, pageSize) => {
            const { data } = await filesAPI.list({
              page: pageNum,
              page_size: pageSize,
              ordering: ORDERING_NEWEST_FIRST,
            });
            return data;
          },
          { pageSize: 100 },
        );
        if (!cancelled) setAllFiles(items);
      } catch (err) {
        console.error("[useMediaLibrary] fetch error", err);
        if (!cancelled) setAllFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadNonce, enabled]);

  const counts = useMemo(
    () => ({
      image: allFiles.filter((f) => getMediaFileType(f.file) === "image").length,
      video: allFiles.filter((f) => getMediaFileType(f.file) === "video").length,
    }),
    [allFiles],
  );

  const files = useMemo(() => {
    const q = searchDebounced.toLowerCase();
    return allFiles.filter((f) => {
      if (getMediaFileType(f.file) !== activeTab) return false;
      if (!q) return true;
      return (
        (f.file ?? "").toLowerCase().includes(q)
        || (f.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [allFiles, activeTab, searchDebounced]);

  const upload = useCallback(async (file) => {
    setUploading(true);
    try {
      const res = await filesAPI.upload(file);
      const created = res.data?.data ?? res.data;
      setAllFiles((prev) => [created, ...prev]);
      return created;
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = useCallback(async (id) => {
    await filesAPI.delete(id);
    setAllFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const refresh = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  return {
    files,
    loading,
    uploading,
    upload,
    remove,
    refresh,
    search,
    setSearch,
    mediaTab: activeTab,
    setMediaTab,
    counts,
    totalCount: allFiles.length,
    filteredCount: files.length,
    isSearchMode: searchDebounced.length > 0,
    showTabs: !lockTab,
  };
};
