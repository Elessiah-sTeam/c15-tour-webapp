import type {Convoy} from './convoyTypes';

const STORAGE_KEY = 'c15_convoys';

// Charger les convois
export function chargerConvois(): Convoy[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt)
            }));
        }
    } catch (e) {
        console.error('Erreur chargement:', e);
    }
    return [];
}

// Sauvegarder un convoi
export function sauvegarderConvoi(convoy: Convoy) {
    try {
        const convois = chargerConvois();
        convois.unshift(convoy); // Ajoute au début
        localStorage.setItem(STORAGE_KEY, JSON.stringify(convois));
        console.log('✅ Convoi sauvegardé');
    } catch (e) {
        console.error('Erreur sauvegarde:', e);
    }
}

// Supprimer un convoi
export function supprimerConvoi(id: string) {
    try {
        const convois = chargerConvois();
        const nouveaux = convois.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nouveaux));
        console.log('✅ Convoi supprimé');
    } catch (e) {
        console.error('Erreur suppression:', e);
    }
}