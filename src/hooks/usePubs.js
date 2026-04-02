import { useState, useEffect, useCallback } from "react";
import { pubsAPI } from "../api/pubs.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

/** Réponse création / mise à jour : objet pub ou { data: { id, ... } } */
function normalizePubEntity(data) {
  if (!data || typeof data !== "object") return null;
  if (data.id) return data;
  const inner = data.data;
  if (inner && typeof inner === "object" && inner.id) return inner;
  return null;
}

export const usePubs = () => {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await pubsAPI.list({
        ordering: ORDERING_NEWEST_FIRST,
      });
      setPubs(toArray(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (payload) => {
    const { data } = await pubsAPI.create(payload);
    const entity = normalizePubEntity(data) ?? (data?.id ? data : null);
    if (!entity?.id) {
      const msg =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.detail === "string" && data.detail) ||
        "Réponse API inattendue à la création";
      throw new Error(msg);
    }
    setPubs((prev) => [entity, ...prev]);
    return entity;
  };

  const update = async (id, payload) => {
    const { data } = await pubsAPI.update(id, payload);
    const entity = normalizePubEntity(data) ?? (data?.id ? data : null);
    if (entity?.id) {
      setPubs((prev) => prev.map((p) => (p.id === id ? entity : p)));
      return entity;
    }
    setPubs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...payload } : p)),
    );
    return data;
  };

  const remove = async (id) => {
    await pubsAPI.delete(id);
    setPubs((prev) => prev.filter((p) => p.id !== id));
  };

  return { pubs, loading, error, create, update, remove, refetch: fetchAll };
};
