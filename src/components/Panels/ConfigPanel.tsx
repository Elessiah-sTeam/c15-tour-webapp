import './Panels.css';
import Route from "./Route.tsx";
import ItineraryTitle from "./ItineraryTitle.tsx";
import ActionButtons from "./ActionButtons.tsx";

/**
 * Composant contenant le panneau de configuration
 */
type ConfigPanelProps = {
    onClose?: () => void;
}

export default function ConfigPanel({onClose}: ConfigPanelProps) {

    return (
    <div className={"config-panel"}>
        <ItineraryTitle onClose={onClose}/>
        <Route/>
        <ActionButtons/>
    </div>
    );
}
