import { useState } from 'react';
import BackgroundMap from './components/BackgroundMap.tsx';
import Panels from './components/Panels/Panels.tsx';
import { ConvoyHistory } from './components/convoyHistory/ConvoyHistory';
import { chargerConvois } from './components/convoyHistory/convoyUtils';
import './components/convoyHistory/Navigation.css';
import './App.css';

type Page = 'editor' | 'history';

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>('editor');
    const [convoys, setConvoys] = useState(chargerConvois());

    // Handler pour aller à l'historique
    const goToHistory = () => {
        setConvoys(chargerConvois()); // Recharger les convois
        setCurrentPage('history');
    };

    // Handler pour aller à l'éditeur
    const goToEditor = () => {
        setCurrentPage('editor');
    };

    // ── AFFICHAGE HISTORIQUE ───────────────────────────────────────
    if (currentPage === 'history') {
        return (
            <ConvoyHistory
                convoys={convoys}
                onCreateNew={goToEditor}
                onBack={goToEditor}
            />
        );
    }

    // ── AFFICHAGE ÉDITEUR ──────────────────────────────────────────
    return (
        <div className="window">
            <BackgroundMap />

            <div className="panel">
                {/* ✅ BOUTON EN HAUT DU PANNEAU */}
                <button
                    className="btn-goto-history-panel"
                    onClick={goToHistory}
                >
                    📋 Historique
                </button>

                <Panels onSaved={goToHistory} />
            </div>
        </div>
    );
}