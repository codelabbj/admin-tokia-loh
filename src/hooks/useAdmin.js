import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/client";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { useAuth } from "../context/AuthContext";

export function useAdmin() {
  const { admin: authAdmin, isFullAdmin } = useAuth();

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("admin");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (authAdmin) setCurrentUser(authAdmin);
  }, [authAdmin]);

  const isSuperAdmin = !!currentUser?.is_superuser;
  const canManageTeam = useMemo(() => {
    if (isFullAdmin) return true;
    if (!currentUser) return false;
    if (currentUser.is_superuser) return true;
    if (currentUser.is_full_admin) return true;
    return !!(currentUser.is_admin && currentUser.role !== "staff");
  }, [isFullAdmin, currentUser]);

  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannersError, setBannersError] = useState(null);

  const fetchBanners = useCallback(async () => {
    setBannersLoading(true);
    setBannersError(null);
    try {
      const { data } = await api.get("/shop/banners/", {
        params: { ordering: ORDERING_NEWEST_FIRST },
      });
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      setBannersError(error.message || "Impossible de charger les bannières.");
    } finally {
      setBannersLoading(false);
    }
  }, []);

  const addBanner = useCallback(
    async (formData) => {
      try {
        const { data } = await api.post("/shop/banners/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await fetchBanners();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [fetchBanners],
  );

  const updateBanner = useCallback(
    async (id, formData) => {
      try {
        const { data } = await api.put(`/shop/banners/${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await fetchBanners();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [fetchBanners],
  );

  const deleteBanner = useCallback(async (id) => {
    try {
      const { data } = await api.delete(`/shop/banners/${id}/`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        data: error.response?.data || { message: error.message },
      };
    }
  }, []);

  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);

  const fetchAdmins = useCallback(async () => {
    if (!canManageTeam) return;
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const { data } = await api.get("/accounts/admin/list/");
      if (data?.success) {
        setAdmins(data.data || []);
      } else {
        setAdminsError("Impossible de charger l'équipe.");
      }
    } catch (error) {
      setAdminsError(error.message || "Impossible de charger l'équipe.");
    } finally {
      setAdminsLoading(false);
    }
  }, [canManageTeam]);

  const createAdmin = useCallback(
    async ({ email, phone, password, role = "staff" }) => {
      if (!canManageTeam) {
        return { ok: false, data: { message: "Permission refusée." } };
      }
      try {
        const { data } = await api.post("/accounts/admin/create-admin/", {
          email,
          phone,
          password,
          is_admin: true,
          role: role === "admin" ? "admin" : "staff",
        });
        await fetchAdmins();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [canManageTeam, fetchAdmins],
  );

  const deleteAdmin = useCallback(
    async (id) => {
      if (!canManageTeam) {
        return { ok: false, data: { message: "Permission refusée." } };
      }
      try {
        const { data } = await api.delete(
          `/accounts/admin/delete-admin/${id}/`,
        );
        setAdmins((prev) => prev.filter((a) => a.id !== id));
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [canManageTeam],
  );

  const changePassword = useCallback(
    async ({ old_password, new_password, confirm_new_password }) => {
      try {
        const { data } = await api.post("/accounts/admin/change_password/", {
          email: currentUser?.email,
          old_password,
          new_password,
          confirm_new_password,
        });
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          data: error.response?.data || { message: error.message },
        };
      }
    },
    [currentUser],
  );

  useEffect(() => {
    fetchBanners();
    if (canManageTeam) fetchAdmins();
  }, [fetchBanners, fetchAdmins, canManageTeam]);

  return {
    currentUser,
    isSuperAdmin,
    isFullAdmin: canManageTeam,
    canManageTeam,
    banners,
    bannersLoading,
    bannersError,
    fetchBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    admins,
    adminsLoading,
    adminsError,
    fetchAdmins,
    createAdmin,
    deleteAdmin,
    changePassword,
  };
}
