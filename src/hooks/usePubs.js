import { useState, useEffect, useCallback } from "react";
import { pubsAPI } from "../api/pubs.api";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const usePubs = () => {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await pubsAPI.list();
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
    setPubs((prev) => [data, ...prev]);
    return data;
  };

  const update = async (id, payload) => {
    const { data } = await pubsAPI.update(id, payload);
    setPubs((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  };

  const remove = async (id) => {
    await pubsAPI.delete(id);
    setPubs((prev) => prev.filter((p) => p.id !== id));
  };

  return { pubs, loading, error, create, update, remove, refetch: fetchAll };
};
