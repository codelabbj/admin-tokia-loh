import { useState, useEffect, useCallback } from "react";
import { categoriesAPI } from "../api/categories.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { filesAPI } from "../api/files.api";

/** Aligné sur la liste paginée admin — parcourt toutes les pages en interne. */
export const CATEGORIES_PAGE_SIZE = 50;

const USE_MOCK = false; // 🔧 Branché sur la vraie API

/**
 * Normalise l’API (status) vers les composants (is_active).
 */
export const normalizeCategory = (c) => ({
  ...c,
  is_active: c.status ?? c.is_active ?? true,
});

const MOCK_CATEGORIES = [
  {
    id: "cat-001",
    name: "Électronique",
    icon: null,
    is_active: true,
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "cat-002",
    name: "Mode & Vêtements",
    icon: null,
    is_active: true,
    created_at: "2025-01-11T00:00:00Z",
  },
  {
    id: "cat-003",
    name: "Beauté",
    icon: null,
    is_active: false,
    created_at: "2025-01-12T00:00:00Z",
  },
  {
    id: "cat-004",
    name: "Maison & Cuisine",
    icon: null,
    is_active: true,
    created_at: "2025-01-13T00:00:00Z",
  },
  {
    id: "cat-005",
    name: "Sport",
    icon: null,
    is_active: true,
    created_at: "2025-01-14T00:00:00Z",
  },
];

/**
 * Résout l'icône d'une catégorie avant envoi à l'API.
 *
 * L'icône peut arriver sous 3 formes depuis le formulaire :
 *   1. null / undefined         → on envoie null
 *   2. string (URL)             → on envoie l'URL directement
 *   3. File                     → on upload via /shop/files/ et on retourne l'URL
 *   4. { file: File, preview }  → même chose, on prend .file
 *
 * @param {null|string|File|{file:File}} icon
 * @returns {Promise<string|null>} URL string ou null
 */
const resolveIconUrl = async (icon) => {
  if (!icon) return null;

  // Cas 2 : déjà une URL string
  if (typeof icon === "string") return icon;

  // Cas 3 : File natif
  if (icon instanceof File) {
    const { data: response } = await filesAPI.upload(icon);
    // L'API retourne { success, data: { id, file, created_at } }
    return response.data?.file ?? response.url ?? response.file ?? null;
  }

  // Cas 4 : objet { file, preview } (format interne du formulaire)
  if (typeof icon === "object" && icon.file instanceof File) {
    const { data: response } = await filesAPI.upload(icon.file);
    // L'API retourne { success, data: { id, file, created_at } }
    return response.data?.file ?? response.url ?? response.file ?? null;
  }

  return null;
};

/**
 * useCategories — gère le CRUD des catégories avec upload d'image intégré.
 *
 * Usage :
 *   const { categories, loading, error, create, update, remove } = useCategories();
 * @param {{ skipInitialFetch?: boolean }} options — true sur CategoriesPage (liste paginée séparée)
 */
export const useCategories = (options = {}) => {
  const skipInitialFetch = options.skipInitialFetch === true;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        setCategories(MOCK_CATEGORIES);
      } else {
        let merged = [];
        let pageNum = 1;
        for (;;) {
          const { data } = await categoriesAPI.list({
            page: pageNum,
            page_size: CATEGORIES_PAGE_SIZE,
            ordering: ORDERING_NEWEST_FIRST,
          });
          const list = Array.isArray(data) ? data : (data.results ?? []);
          merged = merged.concat(list.map(normalizeCategory));
          if (!data.next || list.length === 0) break;
          pageNum += 1;
        }
        // Fallback front : sécurité si le backend n'applique pas `ordering`.
        setCategories(merged);
      }
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipInitialFetch) fetchAll();
  }, [skipInitialFetch, fetchAll]);

  // ── Créer ─────────────────────────────────────────────────
  const create = async (formData) => {
    if (USE_MOCK) {
      const newItem = {
        ...formData,
        id: `cat-${Date.now()}`,
        is_active: formData.is_active ?? true,
        created_at: new Date().toISOString(),
        icon: typeof formData.icon === "string" ? formData.icon : null,
      };
      setCategories((prev) => [...prev, newItem]);
      return newItem;
    }

    // 1. Upload l'image si nécessaire, récupère l'URL
    const iconUrl = await resolveIconUrl(formData.icon);

    // 2. Construit le payload JSON propre pour l'API
    // ⚠️  L'API utilise "status" (booléen) et non "is_active"
    const payload = {
      name: formData.name,
      icon: iconUrl,
      description: formData.description || null,
      status: formData.is_active ?? true, // ← "status" côté API
    };

    const { data } = await categoriesAPI.create(payload);
    // Normalise "status" → "is_active" pour les composants
    const normalized = normalizeCategory(data);
    if (!skipInitialFetch) {
      setCategories((prev) => [...prev, normalized]);
    }
    return normalized;
  };

  // ── Modifier ──────────────────────────────────────────────
  const update = async (id, formData) => {
    if (USE_MOCK) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...formData } : c)),
      );
      return { ...formData, id };
    }

    if (!skipInitialFetch) {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            ...formData,
            icon: typeof formData.icon === "string" ? formData.icon : c.icon,
          };
        }),
      );
    }

    try {
      // Upload l'image si c'est un File, sinon garde l'URL existante
      const iconUrl = await resolveIconUrl(formData.icon);

      // Construit le payload : n'inclut que les champs modifiés
      // ⚠️  L'API utilise "status" (booléen) et non "is_active"
      const payload = {};
      if (formData.name !== undefined) payload.name = formData.name;
      if (formData.description !== undefined)
        payload.description = formData.description || null;
      if (formData.is_active !== undefined) payload.status = formData.is_active; // ← "status" côté API
      // N'inclut icon que si explicitement modifié
      if (formData.icon !== undefined) payload.icon = iconUrl;

      const { data } = await categoriesAPI.update(id, payload);
      // Normalise status → is_active pour les composants
      const normalized = normalizeCategory(data);
      if (!skipInitialFetch) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? normalized : c)),
        );
      }
      return normalized;
    } catch (err) {
      // Rollback en cas d'erreur
      setError(err.message ?? "Erreur mise à jour catégorie");
      if (!skipInitialFetch) fetchAll();
      throw err;
    }
  };

  // ── Supprimer ─────────────────────────────────────────────
  const remove = async (id) => {
    if (USE_MOCK) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    if (!skipInitialFetch) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    try {
      await categoriesAPI.delete(id);
    } catch (err) {
      setError(err.message ?? "Erreur suppression catégorie");
      if (!skipInitialFetch) fetchAll();
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
};
