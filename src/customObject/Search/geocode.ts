/**
 * Helpers de géocodage Nominatim partagés entre la barre de recherche
 * (géocodage direct) et l'ajout de points sur la carte (géocodage inverse).
 */

// Passe par le proxy nginx / Vite (/nominatim) plutôt que d'appeler OSM en direct :
// le navigateur est sinon bloqué (CORS/403) faute de User-Agent identifiant l'app.
export const BASE_NOMINATIM_REVERSE_URL =
  "/nominatim/reverse?format=json&addressdetails=0";

type NominatimReverseResult = {
  display_name?: string;
};

/**
 * Raccourcit un display_name Nominatim en gardant les parties les plus pertinentes
 * (numéro + rue, ville) pour un libellé d'étape lisible.
 * @param value display_name complet renvoyé par Nominatim
 */
export const shortenDisplayName = (value: string): string => {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length >= 3 && /^\d+[A-Za-z]?$/.test(parts[0])) {
    const street = `${parts[0]} ${parts[1]}`;
    return `${street}, ${parts[2]}`;
  }

  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  if (parts.length === 1) return parts[0];
  return value;
};

/**
 * Géocodage inverse : retourne l'adresse correspondant à des coordonnées,
 * raccourcie via shortenDisplayName. Retourne null en cas d'échec ou d'absence
 * de résultat, pour laisser l'appelant conserver un libellé de repli.
 * @param lat latitude
 * @param lon longitude
 * @param signal AbortSignal optionnel
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<string | null> {
  const url = `${BASE_NOMINATIM_REVERSE_URL}&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as NominatimReverseResult;
  const name = data.display_name?.trim();
  return name ? shortenDisplayName(name) : null;
}
