import { useItinerary } from '../customObject/Itinerary/UseItinerary';
import { itineraryModel } from '../customObject/Itinerary/ItineraryStore';
import type { GlobalSettings } from '../components/SettingsModal/SettingsModal';

const defaultSettings: GlobalSettings = {
    convoyName: 'Mon convoi',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00',
    speedPercentage: 100,
    minSegmentDuration: 1,
    maxSegmentDuration: 4,
    pauseConfigs: []
};

export function useGlobalSettings(): GlobalSettings {
    const itinerary = useItinerary(itineraryModel.store);
    const storageKey = `globalSettings_${itinerary.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
        try {
            const parsed = JSON.parse(saved) as Partial<GlobalSettings>;
            return {
                ...defaultSettings,
                ...parsed,
                convoyName: itinerary.name || 'Mon convoi'
            };
        } catch {
            // En cas de settings corrompus, on repart sur des valeurs utilisables.
        }
    }

    return {
        ...defaultSettings,
        convoyName: itinerary.name || 'Mon convoi'
    };
}
