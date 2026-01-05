import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';
import InfoPanel from "./InfoPanel.tsx";
import {TimeSpan} from "../../customObject/TimeSpan.ts";

export default function Panels() {
    const totalTime: TimeSpan = new TimeSpan(3600000 * 1.755);

    return (
      <div>
          <ConfigPanel />
          <InfoPanel totalDistance={10} totalTime={totalTime}/>
      </div>
    );
}