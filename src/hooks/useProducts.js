import { useState, useEffect, useCallback } from "react";
import { productsAPI } from "../api/products.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { filesAPI } from "../api/files.api";
import { apiCache } from "../utils/apiCache";

/**
 * Résout une image avant envoi à l'API.
 * Accepte :
 * - string (URL)
 * - File
 * - { file: File, preview }
 */
export const resolveImageUrl = async (image) => {
  if (!image) return null;

  // Déjà une URL
  if (typeof image === "string") return image;

  // File natif
  if (image instanceof File) {
    const { data: response } = await filesAPI.upload(image);
    return response?.data?.file ?? response?.file ?? response?.url ?? null;
  }

  // { file, preview }
  if (typeof image === "object" && image.file instanceof File) {
    const { data: response } = await filesAPI.upload(image.file);
    return response?.data?.file ?? response?.file ?? response?.url ?? null;
  }

  return null;
};

/** Même pas que la liste paginée admin — utilisé pour parcourir toutes les pages. */
export const PRODUCTS_PAGE_SIZE = 50;

export const normalizeVariantsForAPI = async (variants, globalUnlimited = true) => {
  if (!Array.isArray(variants)) return [];
  const normalized = await Promise.all(variants.map(async (v) => {
    const cleaned = { name: v.name };
    if (v.id) cleaned.id = v.id;
    if (v.key) cleaned.key = v.key;

    if (v.price !== undefined && v.price !== null && v.price !== "") {
      cleaned.price = Number(v.price);
    }

    cleaned.unlimited_stock = globalUnlimited ? !!v.unlimited_stock : false;

    if (!cleaned.unlimited_stock && v.stock !== undefined && v.stock !== null && v.stock !== "") {
      cleaned.stock = Number(v.stock);
    }
    // Si unlimited_stock est true, la propriété `stock` est purement ignorée (non envoyée)

    if (v.image) {
      const resolvedImage = await resolveImageUrl(v.image);
      if (resolvedImage) cleaned.image = resolvedImage;
    }
    if (Array.isArray(v.secondary_images)) {
      cleaned.secondary_images = (
        await Promise.all(v.secondary_images.map((img) => resolveImageUrl(img)))
      ).filter(Boolean);
    }

    if (Array.isArray(v.sub_variants) && v.sub_variants.length > 0) {
      cleaned.sub_variants = await normalizeVariantsForAPI(v.sub_variants, globalUnlimited);
    }

    return cleaned;
  }));
  return normalized;
};

export const normalizeOthersDetails = (details) => {
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

/**
 * Normalise les données venant de l'API → format frontend
 */
export const normalizeProduct = (p) => ({
  ...p,
  sale_price: p.sale_price ?? null,
  status: p.status ?? true,
  unlimited_stock: p.unlimited_stock === true,
  others_details: normalizeOthersDetails(p.others_details),
  attributes: Array.isArray(p.attributes) ? p.attributes : [],
  variants: Array.isArray(p.variants) ? p.variants : [],
});

/**
 * @param {{ skipInitialFetch?: boolean }} options
 *   skipInitialFetch : true pour ProductsPage (liste paginée séparée) — mutations seulement.
 */
export const useProducts = (options = {}) => {
  const skipInitialFetch = options.skipInitialFetch === true;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);

  // ── FETCH (toutes les pages, pour compteurs / catégories / fallback liste) ──
  const fetchAll = useCallback(async ({ force = false } = {}) => {
    // Servir depuis le cache si les données sont encore fraîches
    if (!force) {
      const cached = apiCache.get('products:all');
      if (cached) {
        setProducts(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      let merged = [];
      let pageNum = 1;

      for (;;) {
        const { data } = await productsAPI.list({
          page: pageNum,
          page_size: PRODUCTS_PAGE_SIZE,
          ordering: ORDERING_NEWEST_FIRST,
        });
        const list = Array.isArray(data) ? data : (data.results ?? []);
        merged = merged.concat(list.map(normalizeProduct));
        if (!data.next || list.length === 0) break;
        pageNum += 1;
      }

      apiCache.set('products:all', merged);
      setProducts(merged);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipInitialFetch) fetchAll();
  }, [skipInitialFetch, fetchAll]);

  // ── CREATE ────────────────────────────────────────────
  const create = async (formData) => {
    const imageUrl = await resolveImageUrl(
      formData.mainImage ?? formData.image,
    );

    const secondaryUrls = await Promise.all(
      (formData.subImages ?? []).map(resolveImageUrl),
    ).then((urls) => urls.filter(Boolean));

    const initialPrice = Number(formData.price);
    const salePrice = formData.sale_price
      ? Number(formData.sale_price)
      : null;
    const priceFields =
      salePrice != null
        ? { price: salePrice, original_price: initialPrice }
        : { price: initialPrice, original_price: null };
    const unlimited = !!formData.unlimited_stock;

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      ...priceFields,
      unlimited_stock: unlimited,

      // Images
      image: imageUrl,
      secondary_images: secondaryUrls,
      others_details: normalizeOthersDetails(formData.others_details),

      status: formData.status ?? formData.is_active ?? true,
      variants: await normalizeVariantsForAPI(formData.variants || [], unlimited), // Added for API v2
    };


    if (!unlimited) {
      payload.stock = Number(formData.stock ?? 0);
    }

    const { data } = await productsAPI.create(payload);
    apiCache.invalidate('products:all');
    if (!skipInitialFetch) {
      setProducts((prev) => [...prev, normalizeProduct(data)]);
    }
    return data;
  };

  // ── UPDATE ────────────────────────────────────────────
  const update = async (id, formData) => {
    if (!skipInitialFetch) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...formData } : p)),
      );
    }

    try {
      const payload = {};

      if (formData.name !== undefined) payload.name = formData.name;
      if (formData.description !== undefined)
        payload.description = formData.description || null;
      if (formData.category !== undefined) payload.category = formData.category;
      if (formData.price !== undefined) {
        payload.price = Number(formData.price);
      }

      if (formData.unlimited_stock !== undefined) {
        payload.unlimited_stock = !!formData.unlimited_stock;
      }

      if (
        formData.stock !== undefined &&
        formData.unlimited_stock !== true
      ) {
        payload.stock = Number(formData.stock);
      }

      if (formData.price !== undefined || formData.sale_price !== undefined) {
        const initialPrice = Number(formData.price);
        const salePrice = formData.sale_price
          ? Number(formData.sale_price)
          : null;

        if (salePrice) {
          payload.price = salePrice; // prix affiché = prix réduit
          payload.original_price = initialPrice; // prix barré = prix initial
        } else {
          payload.price = initialPrice; // pas de promo
          payload.original_price = null;
        }
      }

      if (formData.status !== undefined) {
        payload.status = formData.status;
      } else if (formData.is_active !== undefined) {
        payload.status = formData.is_active;
      }

      // ✅ FORMAT ACTUEL : string[] (déjà construit par buildOthersDetails)
      if (formData.others_details !== undefined)
        payload.others_details = normalizeOthersDetails(formData.others_details);

      // Image principale
      if (formData.mainImage !== undefined) {
        payload.image = await resolveImageUrl(formData.mainImage);
      }

      // Images secondaires
      if (formData.subImages !== undefined) {
        payload.secondary_images = await Promise.all(
          formData.subImages.map(resolveImageUrl),
        ).then((urls) => urls.filter(Boolean));
      }

      // API v2: variants support
      if (formData.variants !== undefined) {
        const isUnlimited = !!formData.unlimited_stock;
        payload.variants = await normalizeVariantsForAPI(formData.variants, isUnlimited) || [];
      }

      const { data } = await productsAPI.update(id, payload);
      apiCache.invalidate('products:all');

      if (!skipInitialFetch) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? normalizeProduct(data) : p)),
        );
      }

      return data;
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour produit");
      if (!skipInitialFetch) fetchAll();
      throw err;
    }
  };

  // ── DELETE ────────────────────────────────────────────
  const remove = async (id) => {
    if (!skipInitialFetch) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }

    try {
      await productsAPI.delete(id);
      apiCache.invalidate('products:all');
    } catch (err) {
      setError(err.message ?? "Erreur suppression produit");
      if (!skipInitialFetch) fetchAll();
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
};
