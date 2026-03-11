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

        const saved = localStorage.getItem('globalSettings');
        let baseSettings: GlobalSettings;

        if (saved) {
            baseSettings = JSON.parse(saved);
        } else {

            baseSettings = {
                convoyName: itinerary.name || 'Mon convoi',
                departureDate: new Date().toISOString().split('T')[0],
                departureTime: '08:00',
                speedPercentage: 100,
                minSegmentDuration: 1,
                maxSegmentDuration: 4,
                pauseConfigs: [],
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

        // Mettre à jour avec les nouveaux segments
        setCurrentSettings({
            ...baseSettings,
            pauseConfigs
        });

        setShowSettings(true);
    };

    const handleSaveSettings = (settings: GlobalSettings) => {
        console.log('Paramètres sauvegardés:', settings);
        localStorage.setItem('globalSettings', JSON.stringify(settings));
        alert('Paramètres enregistrés avec succès !');
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