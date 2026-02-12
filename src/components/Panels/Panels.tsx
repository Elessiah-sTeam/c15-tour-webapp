import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';
import InfoPanel from "./InfoPanel.tsx";

/**
 * Composant contenant tous les panneaux
 */
type PanelsProps = {
    onClose?: () => void;
}

export default function Panels({onClose}: PanelsProps) {
    return (
      <>
          <ConfigPanel onClose={onClose}/>
          <InfoPanel/>
      </>
    );
}
