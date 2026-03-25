import { useState, useEffect, useCallback } from "react";
import { productsAPI } from "../api/products.api";
import { filesAPI } from "../api/files.api";

/**
 * Résout une image avant envoi à l'API.
 * Accepte : null | string (URL) | File | { file: File, preview }
 * Réponse de /shop/files/ : { success: true, data: { id, file: "https://...", created_at } }
 */
const resolveImageUrl = async (image) => {
  if (!image) return null;

  // Déjà une URL string
  if (typeof image === "string") return image;

  // File natif
  if (image instanceof File) {
    console.log("[resolveImageUrl] Upload File natif:", image.name, image.size);
    try {
      const { data: response } = await filesAPI.upload(image);
      console.log("[resolveImageUrl] Réponse brute:", JSON.stringify(response));
      // { success: true, data: { id, file: "https://...", created_at } }
      const url =
        response?.data?.file ?? response?.file ?? response?.url ?? null;
      console.log("[resolveImageUrl] URL extraite:", url);
      return url;
    } catch (err) {
      console.error(
        "[resolveImageUrl] Erreur:",
        err?.response?.data ?? err.message,
      );
      throw err;
    }
  }

  // { file: File, preview: string } — format interne de ProductFormModal
  if (typeof image === "object" && image.file instanceof File) {
    console.log(
      "[resolveImageUrl] Upload {file, preview}:",
      image.file.name,
      image.file.size,
    );
    try {
      const { data: response } = await filesAPI.upload(image.file);
      console.log("[resolveImageUrl] Réponse brute:", JSON.stringify(response));
      const url =
        response?.data?.file ?? response?.file ?? response?.url ?? null;
      console.log("[resolveImageUrl] URL extraite:", url);
      return url;
    } catch (err) {
      console.error(
        "[resolveImageUrl] Erreur:",
        err?.response?.data ?? err.message,
      );
      throw err;
    }
  }

  console.warn("[resolveImageUrl] Format non reconnu:", typeof image, image);
  return null;
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await productsAPI.list();
      // API v2 : { count, total_pages, current_page, next, previous, results: [...] }
      setProducts(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Créer ─────────────────────────────────────────────────
  const create = async (formData) => {
    console.log("[useProducts.create] formData reçu:", {
      ...formData,
      mainImage: formData.mainImage ? "FILE_OR_URL" : null,
    });

    // 1. Upload image principale si c'est un File
    const imageUrl = await resolveImageUrl(
      formData.mainImage ?? formData.image,
    );
    console.log("[useProducts.create] imageUrl résolu:", imageUrl);

    // 2. Upload images secondaires
    const secondaryUrls = await Promise.all(
      (formData.subImages ?? formData.secondary_images ?? []).map(
        resolveImageUrl,
      ),
    ).then((urls) => urls.filter(Boolean));

    // 3. Payload propre pour l'API
    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      image: imageUrl,
      secondary_images: secondaryUrls,
      others_details: formData.others_details ?? [],
    };
    if (formData.sale_price) payload.sale_price = Number(formData.sale_price);

    console.log("[useProducts.create] payload final envoyé à l'API:", payload);

    const { data } = await productsAPI.create(payload);
    setProducts((prev) => [...prev, data]);
    return data;
  };

  // ── Modifier ──────────────────────────────────────────────
  const update = async (id, formData) => {
    // Mise à jour optimiste immédiate
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
      if (formData.sale_price !== undefined)
        payload.sale_price = formData.sale_price
          ? Number(formData.sale_price)
          : null;
      if (formData.is_active !== undefined)
        payload.is_active = formData.is_active;
      if (formData.featured !== undefined) payload.featured = formData.featured;
      if (formData.others_details !== undefined)
        payload.others_details = formData.others_details;

      // Image principale
      const imageSource = formData.mainImage ?? formData.image;
      if (imageSource !== undefined) {
        payload.image = await resolveImageUrl(imageSource);
      }

      // Images secondaires
      const subSource = formData.subImages ?? formData.secondary_images;
      if (subSource !== undefined) {
        payload.secondary_images = await Promise.all(
          subSource.map(resolveImageUrl),
        ).then((urls) => urls.filter(Boolean));
      }

      console.log("[useProducts.update] payload final:", payload);
      const { data } = await productsAPI.update(id, payload);
      setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      return data;
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour produit");
      fetchAll();
      throw err;
    }
  };

  // ── Supprimer ─────────────────────────────────────────────
  const remove = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await productsAPI.delete(id);
    } catch (err) {
      setError(err.message ?? "Erreur suppression produit");
      fetchAll();
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
