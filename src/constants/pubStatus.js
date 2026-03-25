// Mapping statuts API → label UI français
export const STATUS_LABEL = {
  ongoing: "Active",
  paused: "En pause",
  draft: "Brouillon",
  ended: "Terminée",
};

// Mapping label UI → valeur API (pour les filtres et toggles)
export const STATUS_API = {
  Active: "ongoing",
  "En pause": "paused",
  Brouillon: "draft",
  Terminée: "ended",
};

// Onglets affichés dans AdCampaignList
export const STATUS_TABS = [
  "Toutes",
  "Active",
  "En pause",
  "Brouillon",
  "Terminée",
];

// Config visuelle par label UI
export const STATUS_CONFIG = {
  Active: { color: "bg-success-2 text-success-1", dot: "bg-success-1" },
  "En pause": { color: "bg-warning-2 text-warning-1", dot: "bg-warning-1" },
  Terminée: { color: "bg-neutral-3 text-neutral-6", dot: "bg-neutral-5" },
  Brouillon: {
    color: "bg-secondary-5 text-secondary-1",
    dot: "bg-secondary-1",
  },
};
