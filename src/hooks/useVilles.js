import { useState, useEffect, useCallback } from "react";
import { citiesAPI } from "../api/cities.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";

/**
 * useVilles — gère la liste et le CRUD des villes de livraison.
 *
 * Usage liste :
 *   const { villes, loading, error, create, update, remove } = useVilles();
 *
 * Usage détail :
 *   const { ville, loading } = useVilles({ id: 'uuid-xxx' });
 *
 * Champs API : { id, name, delivery_price, created_at }
 */
export const useVilles = (options = {}) => {
  const { id = null } = options;

  const [villes, setVilles] = useState([]);
  const [ville, setVille] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch liste ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await citiesAPI.list({
        ordering: ORDERING_NEWEST_FIRST,
      });
      // Django REST retourne { count, next, previous, results: [...] }
      setVilles(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des villes");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch détail ────────────────────────────────────────────
  const fetchOne = useCallback(async (villeId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await citiesAPI.detail(villeId);
      setVille(data);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement de la ville");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) fetchOne(id);
    else fetchAll();
  }, [id, fetchAll, fetchOne]);

  // ── Créer ───────────────────────────────────────────────────
  const create = async (payload) => {
    const { data } = await citiesAPI.create(payload);
    setVilles((prev) => [...prev, data]);
    return data;
  };

  // ── Modifier (optimiste) ────────────────────────────────────
  const update = async (villeId, payload) => {
    // Mise à jour optimiste immédiate
    setVilles((prev) =>
      prev.map((v) => (v.id === villeId ? { ...v, ...payload } : v)),
    );
    setVille((prev) => (prev?.id === villeId ? { ...prev, ...payload } : prev));

    try {
      const { data } = await citiesAPI.update(villeId, payload);
      setVilles((prev) => prev.map((v) => (v.id === villeId ? data : v)));
      setVille((prev) => (prev?.id === villeId ? data : prev));
      return data;
    } catch (err) {
      setError(err.message ?? "Erreur mise à jour ville");
      fetchAll(); // Rollback
      throw err;
    }
  };

  // ── Supprimer (optimiste) ───────────────────────────────────
  const remove = async (villeId) => {
    setVilles((prev) => prev.filter((v) => v.id !== villeId));
    try {
      await citiesAPI.delete(villeId);
    } catch (err) {
      setError(err.message ?? "Erreur suppression ville");
      fetchAll(); // Rollback
      throw err;
    }
  };

  return {
    villes,
    ville,
    loading,
    error,
    create,
    update,
    remove,
    refetch: id ? () => fetchOne(id) : fetchAll,
  };
};
