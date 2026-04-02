import { useState, useEffect, useCallback } from "react";
import { productsAPI } from "../api/products.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";

/** Taille de page alignée avec la pagination liste produits (admin). */
export const PRODUCTS_LIST_PAGE_SIZE = 25;

/**
 * Normalise les données venant de l'API → format frontend
 * (identique à useProducts)
 */
const normalizeProduct = (p) => ({
  ...p,
  sale_price: p.sale_price ?? null,
  status: p.status ?? true,
  unlimited_stock: p.unlimited_stock === true,
  others_details: p.others_details ?? [],
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          page_size: PRODUCTS_LIST_PAGE_SIZE,
          ordering: ORDERING_NEWEST_FIRST,
        };
        if (searchDebounced) params.search = searchDebounced;
        if (categoryId) params.category = categoryId;

        const { data } = await productsAPI.list(params);
        if (cancelled) return;

        const list = Array.isArray(data) ? data : (data.results ?? []);
        setProducts(list.map(normalizeProduct));
        setTotalCount(
          typeof data.count === "number" ? data.count : list.length,
        );
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
  }, [page, searchDebounced, categoryId, reloadNonce]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_LIST_PAGE_SIZE));

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
  };
};
