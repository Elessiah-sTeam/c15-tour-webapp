
export type Coordinates = [number, number];

export async function calculateRoute(points: Coordinates[]): Promise<Coordinates[]> {
    if (points.length < 2) {
        throw new Error("Il faut au moins 2 points pour calculer une route");
    }

    const coords = points.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error("Aucune route trouvée entre ces points");
        }

        return data.routes[0].geometry.coordinates;

    } catch (error) {
        console.error("Erreur lors du calcul de la route:", error);
        throw error;
    }
}