import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import InputField from "../InputField";
import Button from "../Button";
import { useAdmin } from "../../hooks/useAdmin"; // Ajustez le chemin

const SettingsPasswordForm = () => {
    const { changePassword, currentUser } = useAdmin();
    const [form, setForm] = useState({
        old_password: "",
        new_password: "",
        confirm_new_password: ""
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
        if (success) setSuccess("");
    };

    const validate = () => {
        const e = {};
        if (!form.old_password) e.old_password = "Mot de passe actuel requis";
        if (!form.new_password) e.new_password = "Nouveau mot de passe requis";
        if (!form.confirm_new_password) e.confirm_new_password = "Confirmation requise";
        if (form.new_password && form.confirm_new_password && form.new_password !== form.confirm_new_password)
            e.confirm_new_password = "Les mots de passe ne correspondent pas";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSuccess("");

        try {
            const { ok, data } = await changePassword(form);

            if (ok && data?.success) {
                setSuccess(data.message || "Mot de passe modifié avec succès.");
                setForm({ old_password: "", new_password: "", confirm_new_password: "" });
                setErrors({});
            } else if (data?.message && typeof data.message === "object") {
                // Erreurs backend structurées
                const be = {};
                Object.entries(data.message).forEach(([k, v]) => {
                    be[k] = Array.isArray(v) ? v[0] : v;
                });
                setErrors(be);
            } else {
                setErrors({
                    old_password: data?.message || "Une erreur est survenue"
                });
            }
        } catch (error) {
            setErrors({ old_password: "Erreur réseau" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-poppins text-neutral-7 dark:text-neutral-7">
                    Adresse e-mail
                </label>
                <div className="px-3 py-2.5 rounded-2 border border-neutral-4 bg-neutral-3 dark:bg-neutral-3 text-xs font-poppins text-neutral-7 cursor-not-allowed select-none">
                    {currentUser?.email || "Non disponible"}
                </div>
                <p className="text-[11px] font-poppins text-neutral-5">
                    L'adresse e-mail ne peut pas être modifiée ici.
                </p>
            </div>

            <InputField
                label="Mot de passe actuel"
                name="old_password"
                type="password"
                value={form.old_password}
                onChange={handleChange}
                placeholder="Saisir votre mot de passe actuel"
                error={errors.old_password}
                required
            />

            <InputField
                label="Nouveau mot de passe"
                name="new_password"
                type="password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Nouveau mot de passe"
                error={errors.new_password}
                required
            />

            <InputField
                label="Confirmer le nouveau mot de passe"
                name="confirm_new_password"
                type="password"
                value={form.confirm_new_password}
                onChange={handleChange}
                placeholder="Confirmer"
                error={errors.confirm_new_password}
                required
            />

            {success && (
                <div className="flex items-center gap-2 bg-success-2 border border-success-1 rounded-2 px-3 py-2.5">
                    <CheckCircle2 size={14} className="text-success-1 shrink-0" />
                    <p className="text-xs font-poppins text-success-1">{success}</p>
                </div>
            )}

            <Button
                type="submit"
                variant="primary"
                size="normal"
                loading={submitting}
                disabled={submitting}
            >
                {submitting ? "Enregistrement..." : "Modifier le mot de passe"}
            </Button>
        </form>
    );
};

export default SettingsPasswordForm;