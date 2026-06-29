import { useState, useEffect, useCallback } from "react";
import { productsAPI } from "../api/products.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";

import { fetchAllPaginatedPages } from "../utils/fetchAllPages";

/** Taille de page alignée avec la pagination liste produits (admin). */
export const PRODUCTS_LIST_PAGE_SIZE = 25;

/**
 * Normalise les données venant de l'API → format frontend
 * (identique à useProducts)
 */
const normalizeOthersDetails = (details) => {
  if (!Array.isArray(details)) return [];
  return details
    .map((d) => {
      if (typeof d === "string") {
        const colonIndex = d.indexOf(":");
        if (colonIndex > 0) {
          return {
            key: d.substring(0, colonIndex).trim(),
            value: d.substring(colonIndex + 1).trim(),
          };
        }
        const key = d.trim();
        return key ? { key, value: "" } : null;
      }
      if (d && typeof d === "object") {
        const key = String(d.key ?? "").trim();
        const value = String(d.value ?? "").trim();
        if (!key) return null;
        return { key, value };
      }
      return null;
    })
    .filter(Boolean);
};

const normalizeProduct = (p) => ({
  ...p,
  sale_price: p.sale_price ?? null,
  status: p.status ?? true,
  unlimited_stock: p.unlimited_stock === true,
  others_details: normalizeOthersDetails(p.others_details),
  attributes: Array.isArray(p.attributes) ? p.attributes : [],
  variants: Array.isArray(p.variants) ? p.variants : [],
});

/**
 * Liste produits paginée (API DRF : count, next, results).
 * Recherche et catégorie sont envoyées au backend.
 */
export const useProductsList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [products, setProducts] = useState([]);
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
  }, [searchDebounced, categoryId]);

  const isSearchMode = searchDebounced.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const baseParams = { ordering: ORDERING_NEWEST_FIRST };
        if (categoryId) baseParams.category = categoryId;

        if (isSearchMode) {
          const { items, totalCount: count } = await fetchAllPaginatedPages(
            async (pageNum, pageSize) => {
              const { data } = await productsAPI.list({
                ...baseParams,
                page: pageNum,
                page_size: pageSize,
                search: searchDebounced,
              });
              return data;
            },
            { pageSize: 100 },
          );
          if (cancelled) return;
          setProducts(items.map(normalizeProduct));
          setTotalCount(count);
        } else {
          const params = {
            ...baseParams,
            page,
            page_size: PRODUCTS_LIST_PAGE_SIZE,
          };

          const { data } = await productsAPI.list(params);
          if (cancelled) return;

          const list = Array.isArray(data) ? data : (data.results ?? []);
          setProducts(list.map(normalizeProduct));
          setTotalCount(
            typeof data.count === "number" ? data.count : list.length,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Erreur lors du chargement des produits");
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, searchDebounced, categoryId, reloadNonce, isSearchMode]);

  const totalPages = isSearchMode
    ? 1
    : Math.max(1, Math.ceil(totalCount / PRODUCTS_LIST_PAGE_SIZE));

  const refetch = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  return {
    products,
    loading,
    error,
    page,
    setPage,
    pageSize: PRODUCTS_LIST_PAGE_SIZE,
    totalCount,
    totalPages,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    refetch,
    isSearchMode,
  };
};
