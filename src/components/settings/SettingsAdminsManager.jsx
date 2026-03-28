import React, { useState } from "react";
import { Plus, Trash2, Shield, AlertCircle } from "lucide-react";
import Button from "../Button";
import InputField from "../InputField";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { useAdmin } from "../../hooks/useAdmin";
import { toFrenchUserMessage } from "../../utils/apiMessagesFr";

/** Extrait un message lisible depuis le corps d'erreur API (ex. { success, message }). */
const messageFromApiData = (data) => {
    if (!data || typeof data !== "object") return null;
    const m = data.message;
    if (typeof m === "string" && m.trim()) return m.trim();
    if (Array.isArray(m) && m.length && typeof m[0] === "string") return m[0].trim();
    if (m && typeof m === "object") {
        const first = Object.values(m).flat()[0];
        if (typeof first === "string") return first.trim();
    }
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
    return null;
};

const SettingsAdminsManager = () => {
    const {
        admins,
        adminsLoading: loading,
        adminsError: error,
        createAdmin,
        deleteAdmin,
        currentUser,
    } = useAdmin();
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: "", phone: "", password: "", is_admin: true, is_superuser: false });
    const [formErrors, setFormErrors] = useState({});
    const [localError, setLocalError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setLocalError("");

        const result = await createAdmin(form);

        setSubmitting(false);

        if (result.ok) {
            setForm({ email: "", phone: "", password: "", is_admin: true, is_superuser: false });
            setIsAdding(false);
        } else {
            const raw = messageFromApiData(result.data);
            setLocalError(
                toFrenchUserMessage(
                    raw,
                    "Erreur lors de la création du compte.",
                ),
            );
        }
    };

    const handleConfirmDeleteAdmin = async () => {
        if (!deleteTarget?.id) return;
        setLocalError("");
        const result = await deleteAdmin(deleteTarget.id);
        if (!result.ok) {
            const raw =
                messageFromApiData(result.data) ||
                "Impossible de supprimer cet administrateur.";
            const msg = toFrenchUserMessage(
                raw,
                "Impossible de supprimer cet administrateur.",
            );
            setLocalError(msg);
            throw new Error(msg);
        }
        setDeleteTarget(null);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setForm({ email: "", phone: "", password: "", is_admin: true, is_superuser: false });
        setFormErrors({});
        setLocalError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const e = {};

        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            e.email = "Email invalide";
        }

        if (!form.phone) {
            e.phone = "Telephone requis";
        }

        if (!form.password || form.password.length < 6) {
            e.password = "Mot de passe trop court (6 caracteres min)";
        }

        setFormErrors(e);
        return Object.keys(e).length === 0;
    };

    if (loading) return <div className="text-xs font-poppins text-neutral-6 py-4">Chargement...</div>;

    return (
        <div className="flex flex-col gap-4">
            {(error || localError) && (
                <div className="bg-danger-2 border border-danger-1 rounded-2 p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-danger-1 shrink-0 mt-0.5" />
                    <p className="text-xs font-poppins text-danger-1">{error || localError}</p>
                </div>
            )}

            {!isAdding && (
                <div>
                    <Button type="button" variant="primary" size="normal" onClick={() => setIsAdding(true)}>
                        <Plus size={14} />
                        Ajouter un administrateur
                    </Button>
                </div>
            )}

            {isAdding && (
                <div className="bg-neutral-2 dark:bg-neutral-2 border border-neutral-4 dark:border-neutral-4 rounded-2 p-4 flex flex-col gap-4">
                    <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">Nouvel administrateur</p>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@exemple.com" error={formErrors.email} required />
                        <InputField label="Telephone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+22999000000" error={formErrors.phone} required />
                        <div className="relative">
                            <InputField label="Mot de passe" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Mot de passe" error={formErrors.password} required />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-5 hover:text-neutral-7 transition-colors" tabIndex={-1}>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_superuser"
                                name="is_superuser"
                                checked={form.is_superuser}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        is_superuser: e.target.checked
                                    }))
                                }
                                className="w-4 h-4"
                            />
                            <label htmlFor="is_superuser" className="text-xs font-poppins text-neutral-7">
                                Super administrateur
                            </label>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Button type="submit" variant="primary" size="normal" loading={submitting} disabled={submitting}>
                                {submitting ? "Creation..." : "Creer l administrateur"}
                            </Button>
                            <Button type="button" variant="secondary" size="normal" onClick={handleCancel}>Annuler</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex flex-col divide-y divide-neutral-4 dark:divide-neutral-4 border border-neutral-4 dark:border-neutral-4 rounded-2 overflow-hidden">
                {admins.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield size={28} className="mx-auto mb-2 text-neutral-5" />
                        <p className="text-xs font-poppins text-neutral-5">Aucun administrateur</p>
                    </div>
                ) : admins.map(admin => (
                    <div key={admin.id}
                        className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors ${admin.id === currentUser?.id
                            ? "bg-primary-5/20 border-l-4 border-primary-1"
                            : "hover:bg-neutral-2 dark:hover:bg-neutral-2"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-5 flex items-center justify-center shrink-0">
                                <Shield size={14} className="text-primary-1" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">{admin.email}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-[11px] font-poppins text-neutral-6">
                                        {admin.phone}
                                    </p>

                                    {currentUser?.is_superuser ? (
                                        <span className="px-1.5 py-0.5 rounded-full bg-primary-5 text-primary-1 text-[10px] font-semibold font-poppins">
                                            Super Admin
                                        </span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded-full bg-neutral-3 text-neutral-6 text-[10px] font-semibold font-poppins">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={admin.id === currentUser?.id}
                            className={`p-2 rounded-2 transition-all ${admin.id === currentUser?.id
                                ? "text-neutral-4 cursor-not-allowed"
                                : "text-danger-1 hover:bg-danger-2 cursor-pointer"
                                }`}
                            title={admin.id === currentUser?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet administrateur"}
                            onClick={() => setDeleteTarget(admin)}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onConfirm={handleConfirmDeleteAdmin}
                onCancel={() => setDeleteTarget(null)}
                title="Supprimer l'administrateur"
                message={
                    deleteTarget
                        ? `Voulez-vous vraiment retirer l'accès de « ${deleteTarget.email} » ? Cette action est irréversible.`
                        : ""
                }
            />
        </div>
    );
};

export default SettingsAdminsManager;