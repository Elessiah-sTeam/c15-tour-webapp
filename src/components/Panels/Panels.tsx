import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';

export default function Panels() {

    return (
      <div>
          <ConfigPanel />
          <div className={"info-panel"}>

          </div>
      </div>
    );
}