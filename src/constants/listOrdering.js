/**
 * Tri « plus récent en premier » pour les listes Django REST Framework
 * (query param `ordering`, via OrderingFilter sur la vue).
 *
 * Si une vue ne supporte pas `created_at`, le backend doit soit l’ajouter
 * au queryset, soit exposer un autre champ (ex. `date_joined`) et adapter ici.
 */
export const ORDERING_NEWEST_FIRST = "-created_at";
