import { useState, useEffect, useCallback } from "react";
import { categoriesAPI } from "../api/categories.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { normalizeCategory } from "./useCategories";

export const CATEGORIES_LIST_PAGE_SIZE = 25;

/**
 * Liste catégories paginée (DRF : count, next, results).
 */
export const useCategoriesList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          page_size: CATEGORIES_LIST_PAGE_SIZE,
          ordering: ORDERING_NEWEST_FIRST,
        };
        if (searchDebounced) params.search = searchDebounced;

        const { data } = await categoriesAPI.list(params);
        if (cancelled) return;

        const list = Array.isArray(data) ? data : (data.results ?? []);
        const normalized = list.map(normalizeCategory);
        setCategories(normalized);
        setTotalCount(
          typeof data.count === "number" ? data.count : list.length,
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Erreur lors du chargement des catégories");
          setCategories([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, searchDebounced, reloadNonce]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / CATEGORIES_LIST_PAGE_SIZE),
  );

  const refetch = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  return {
    categories,
    loading,
    error,
    page,
    setPage,
    pageSize: CATEGORIES_LIST_PAGE_SIZE,
    totalCount,
    totalPages,
    search,
    setSearch,
    refetch,
  };
};
