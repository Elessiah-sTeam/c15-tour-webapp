import './Panels.css';
import Route from "./Route.tsx";
import ItineraryTitle from "./ItineraryTitle.tsx";
import ActionButtons from "./ActionButtons.tsx";

export default function ConfigPanel() {
    return (
    <div className={"config-panel"}>
        <ItineraryTitle/>
        <Route/>
        <ActionButtons/>
    </div>
    );
}