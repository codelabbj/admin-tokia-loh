import React, { useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import InputField from "../InputField";
import Button from "../Button";
import { useCompany } from "../../hooks/useCompany";
import { useToast } from "../ui/ToastProvider";

const EMPTY_FORM = {
  name: "",
  description: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  logo: "",
  facebook_link: "",
  instagram_link: "",
  linkedin_link: "",
  tiktok_link: "",
  whatsapp_link: "",
  x_link: "",
};

const SettingsCompanyForm = () => {
  const { company, loading, error, update } = useCompany();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name ?? "",
      description: company.description ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      whatsapp: company.whatsapp ?? "",
      address: company.address ?? "",
      logo: company.logo ?? "",
      facebook_link: company.facebook_link ?? "",
      instagram_link: company.instagram_link ?? "",
      linkedin_link: company.linkedin_link ?? "",
      tiktok_link: company.tiktok_link ?? "",
      whatsapp_link: company.whatsapp_link ?? "",
      x_link: company.x_link ?? "",
    });
  }, [company]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Le nom de l’entreprise est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        address: form.address.trim() || null,
        logo: form.logo.trim() || null,
        facebook_link: form.facebook_link.trim() || null,
        instagram_link: form.instagram_link.trim() || null,
        linkedin_link: form.linkedin_link.trim() || null,
        tiktok_link: form.tiktok_link.trim() || null,
        whatsapp_link: form.whatsapp_link.trim() || null,
        x_link: form.x_link.trim() || null,
      });
      toast.success("Informations entreprise enregistrées.");
    } catch {
      toast.error("Enregistrement impossible. Vérifiez les données ou réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !company) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-6 gap-2">
        <Loader2 size={22} className="animate-spin text-primary-1" />
        <span className="text-xs font-poppins">Chargement…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="text-xs font-poppins text-danger-1 bg-danger-2/50 border border-danger-1/30 rounded-2 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex items-center gap-3 rounded-2 border border-neutral-4 bg-neutral-2 p-4 shrink-0">
          {form.logo ? (
            <img
              src={form.logo}
              alt=""
              className="w-16 h-16 object-contain rounded-lg bg-neutral-0 border border-neutral-4"
              onError={(ev) => {
                ev.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-secondary-5 flex items-center justify-center text-secondary-1">
              <Building2 size={28} />
            </div>
          )}
        </div>
        <p className="text-[11px] font-poppins text-neutral-6 leading-relaxed flex-1">
          Ces informations apparaissent sur les factures PDF et représentent votre
          entreprise côté clients. Le logo doit être une URL accessible (fichier hébergé
          sur votre API ou un CDN).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Raison sociale"
          name="name"
          value={form.name}
          onChange={onChange}
          required
          placeholder="TOKIA-LOH"
        />
        <InputField
          label="Logo (URL)"
          name="logo"
          value={form.logo}
          onChange={onChange}
          placeholder="https://…"
        />
      </div>

      <InputField
        label="Description courte"
        name="description"
        type="textarea"
        value={form.description}
        onChange={onChange}
        placeholder="Phrase d’accroche affichée sur la facture…"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="contact@…"
        />
        <InputField
          label="Téléphone"
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="+225 …"
        />
        <InputField
          label="WhatsApp (numéro)"
          name="whatsapp"
          value={form.whatsapp}
          onChange={onChange}
          placeholder="+225 …"
        />
        <InputField
          label="Adresse"
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Pays, ville, quartier…"
        />
      </div>

      <div className="border-t border-neutral-4 pt-5 mt-1">
        <p className="text-xs font-semibold font-poppins text-neutral-7 mb-3">
          Réseaux & liens
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Facebook"
            name="facebook_link"
            value={form.facebook_link}
            onChange={onChange}
            placeholder="https://facebook.com/…"
          />
          <InputField
            label="Instagram"
            name="instagram_link"
            value={form.instagram_link}
            onChange={onChange}
            placeholder="https://instagram.com/…"
          />
          <InputField
            label="LinkedIn"
            name="linkedin_link"
            value={form.linkedin_link}
            onChange={onChange}
            placeholder="https://linkedin.com/…"
          />
          <InputField
            label="TikTok"
            name="tiktok_link"
            value={form.tiktok_link}
            onChange={onChange}
            placeholder="https://tiktok.com/…"
          />
          <InputField
            label="WhatsApp (lien)"
            name="whatsapp_link"
            value={form.whatsapp_link}
            onChange={onChange}
            placeholder="https://wa.me/…"
          />
          <InputField
            label="X (Twitter)"
            name="x_link"
            value={form.x_link}
            onChange={onChange}
            placeholder="https://x.com/…"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="normal"
          disabled={saving}
          icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          iconPosition="left"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
};

export default SettingsCompanyForm;
