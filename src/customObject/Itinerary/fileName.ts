/**
 * Nettoie un nom pour le transformer en nom de fichier sûr.
 * Supprime les caractères interdits par le système de fichiers et normalise les espaces.
 *
 * @param name Nom d'origine à convertir
 * @returns Nom de fichier lisible et sans caractères risqués
 */
export function sanitizeFileName(name: string): string {
    const baseName = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[<>:"/\\|?*]/g, "-")
        .split("")
        .filter((character) => {
            const code = character.charCodeAt(0);
            return code >= 32;
        })
        .join("")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return baseName.length > 0 ? baseName : "itinerary";
}
