import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';
import InfoPanel from "./InfoPanel.tsx";

/**
 * Composant contenant tous les panneaux
 */
export default function Panels() {
    return (
      <div>
          <ConfigPanel/>
          <InfoPanel/>
      </div>
    );
}