import "./Panels.css";
import StepList from "./DragNDrop/StepList.tsx";

/**
 * Contient les étapes et segments
 */
export default function Route() {
    return (
        <div className="route">
            <StepList/>
        </div>
    );
}