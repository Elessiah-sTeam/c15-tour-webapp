import { useState } from "react";
import { Trash, Pencil, Settings, Upload } from "lucide-react";
import './Panels.css';
import { deleteModStore } from "../../customObject/DeleteMod/DeleteModStore.ts";
import { useDeleteMod } from "../../customObject/DeleteMod/useDeleteMod.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import { SettingsModal, type GlobalSettings, type PauseConfig } from "../SettingsModal/SettingsModal";

export default function ActionButtons() {
    const delMod = useDeleteMod(deleteModStore);
    const itinerary = useItinerary(itineraryModel.store);
    const [showSettings, setShowSettings] = useState(false);
    const [currentSettings, setCurrentSettings] = useState<GlobalSettings | undefined>(undefined);

    const handleOpenSettings = () => {

        const isNewEmptyConvoy = itinerary.id === -1 &&
            itinerary.segments.filter(s => !s.isStartEnd).length === 0;

        const storageKey = `globalSettings_${itinerary.id}`;
        const saved = localStorage.getItem(storageKey);
        let baseSettings: GlobalSettings;

        if (saved && !isNewEmptyConvoy) {
            baseSettings = JSON.parse(saved);
        } else {
            baseSettings = {
                convoyName: itinerary.name || 'Mon convoi',
                departureDate: new Date().toISOString().split('T')[0],
                departureTime: '08:00',
                speedPercentage: 100,
                minSegmentDuration: 1,
                maxSegmentDuration: 4,
                pauseConfigs: []
            };
        }

        const pauseConfigs: PauseConfig[] = itinerary.segments
            .filter(seg => !seg.isStartEnd && seg.id !== 'start' && seg.id !== 'end')
            .map(seg => {
                const existingPause = baseSettings.pauseConfigs.find(p => p.segmentId === seg.id);
                return {
                    segmentId: seg.id,
                    segmentName: seg.content.title || 'Segment sans nom',
                    duration: existingPause?.duration || 30
                };
            });

        setCurrentSettings({
            ...baseSettings,
            convoyName: itinerary.name || baseSettings.convoyName || 'Mon convoi',
            pauseConfigs
        });

        setShowSettings(true);
    };

    const handleSaveSettings = (settings: GlobalSettings) => {
        console.log('Paramètres sauvegardés:', settings);

        // Sauvegarder avec l'ID du convoi
        const storageKey = `globalSettings_${itinerary.id}`;
        localStorage.setItem(storageKey, JSON.stringify(settings));

        // Synchroniser le nom du convoi avec itineraryModel
        if (settings.convoyName && settings.convoyName !== itinerary.name) {
            itineraryModel.renameItinerary(settings.convoyName);
        }
    };

    return (
        <>
            <div className={"action-buttons"}>
                <button
                    className={"global-settings-btn"}
                    aria-label={"Paramètres globaux"}
                    onClick={handleOpenSettings}
                >
                    <Settings color={"#BB487C"}/>
                </button>
                <button
                    className={"delete-btn"}
                    aria-label={"Supprimer"}
                    onClick={() => {deleteModStore.set(prev => !prev)}}
                >
                    { delMod
                        ?
                        <Pencil color={"#BB487C"}/>
                        :
                        <Trash color={"#BB487C"}/>
                    }
                </button>
                <button
                    className={"export-btn"}
                    aria-label={"Export"}
                    onClick={async() => {await itineraryModel.netModel.put()}}
                >
                    <Upload color={"#BB487C"}/>
                </button>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={handleSaveSettings}
                initialSettings={currentSettings}
            />
        </>
    );
}