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
