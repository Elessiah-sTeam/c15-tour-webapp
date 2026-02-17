export type ConvoyStatus = 'draft' | 'finalized' | 'archived';

export interface ConvoyPoint {
    id: string;
    name: string;
    coordinates: [number, number]; // [lat, lng]
}

export interface Convoy {
    id: string;
    name: string;
    status: ConvoyStatus;
    startCity: string;
    endCity: string;
    points: ConvoyPoint[];
    totalDistance: number; // en km
    totalDuration: number; // en minutes
    createdAt: Date;
    updatedAt: Date;
    thumbnail?: string; // URL de la miniature de carte (optionnel)
}

export interface ConvoyFilters {
    searchQuery: string;
    status: 'all' | ConvoyStatus;
    recent: boolean; // Derniers 7 jours
}