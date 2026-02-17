import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';
import InfoPanel from "./InfoPanel.tsx";
import {sauvegarderConvoi} from '../convoyHistory/convoyUtils';
import type {Convoy} from '../convoyHistory/convoyTypes';

interface PanelsProps {
    onSaved?: () => void
}

/**
 * Composant contenant tous les panneaux
 */
export default function Panels({onSaved}: PanelsProps) {

    const handleSave = () => {
        // Créer un convoi simple
        const convoy: Convoy = {
            id: `convoy-${Date.now()}`,
            name: `Convoi ${new Date().toLocaleDateString('fr-FR')}`,
            status: 'draft',
            startCity: 'Départ',
            endCity: 'Arrivée',
            points: [],
            totalDistance: 0,
            totalDuration: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        sauvegarderConvoi(convoy);
        // Animation de succès
        const btn = document.querySelector('.btn-save-convoy') as HTMLButtonElement;
        if (btn) {
            btn.textContent = '✅ Sauvegardé !';
            btn.style.background = '#10b981';

            setTimeout(() => {
                // Naviguer vers l'historique après 1 seconde
                if (onSaved) {
                    onSaved();
                }
            }, 1000);
        }
    };

    return (
        <div>
            <ConfigPanel/>
            <InfoPanel/>

            {/* Bouton de sauvegarde */}
            <div className="save-section">
                <button
                    className="btn-save-convoy"
                    onClick={handleSave}
                >
                    <span className="save-icon">💾</span>
                    <span className="save-text">Sauvegarder le convoi</span>
                </button>
                <p className="save-hint">
                </p>
            </div>
        </div>
    );
}