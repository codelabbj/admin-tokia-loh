import { useState, useEffect, useCallback } from "react";
import { productsAPI } from "../api/products.api";
import { filesAPI } from "../api/files.api";

/**
 * Résout une image avant envoi à l'API.
 * Accepte :
 * - string (URL)
 * - File
 * - { file: File, preview }
 */
const resolveImageUrl = async (image) => {
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

/**
 * Normalise les données venant de l'API → format frontend
 */
const normalizeProduct = (p) => ({
  ...p,
  sale_price: p.sale_price ?? null,
  status: p.status ?? true,
  others_details: p.others_details ?? [],
});

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── FETCH ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await productsAPI.list();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setProducts(list.map(normalizeProduct));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── CREATE ────────────────────────────────────────────
  const create = async (formData) => {
    const imageUrl = await resolveImageUrl(
      formData.mainImage ?? formData.image,
    );

    const secondaryUrls = await Promise.all(
      (formData.subImages ?? []).map(resolveImageUrl),
    ).then((urls) => urls.filter(Boolean));

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: Number(formData.price),
      original_price: formData.price ? Number(formData.price) : null,
      price: formData.sale_price
        ? Number(formData.sale_price)
        : Number(formData.price),
      stock: Number(formData.stock),

      // Images
      image: imageUrl,
      secondary_images: secondaryUrls,
      others_details: formData.others_details ?? [],

      status: formData.status ?? formData.is_active ?? true,
      featured: formData.featured ?? false,
    };

    const { data } = await productsAPI.create(payload);
    setProducts((prev) => [...prev, normalizeProduct(data)]);
    return data;
  };

  // ── UPDATE ────────────────────────────────────────────
  const update = async (id, formData) => {
    // Optimistic update
    console.log("useProducts.update called", id, formData);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...formData } : p)),
    );

    try {
      const payload = {};

      if (formData.name !== undefined) payload.name = formData.name;
      if (formData.description !== undefined)
        payload.description = formData.description || null;
      if (formData.category !== undefined) payload.category = formData.category;
      if (formData.price !== undefined) payload.price = Number(formData.price);
      if (formData.stock !== undefined) payload.stock = Number(formData.stock);

      if (formData.stock !== undefined) payload.stock = Number(formData.stock);

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

      if (formData.featured !== undefined) payload.featured = formData.featured;

      // ✅ FORMAT ACTUEL : string[] (déjà construit par buildOthersDetails)
      if (formData.others_details !== undefined)
        payload.others_details = formData.others_details;

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

      const { data } = await productsAPI.update(id, payload);

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? normalizeProduct(data) : p)),
      );

      return data;
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour produit");
      fetchAll(); // rollback
      throw err;
    }
  };

  // ── DELETE ────────────────────────────────────────────
  const remove = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await productsAPI.delete(id);
    } catch (err) {
      setError(err.message ?? "Erreur suppression produit");
      fetchAll(); // rollback
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
