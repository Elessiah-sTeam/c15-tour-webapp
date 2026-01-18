import ConfigPanel from "./ConfigPanel.tsx";
import './Panels.css';
import InfoPanel from "./InfoPanel.tsx";
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";

export default function Panels({itineraryModel} : {itineraryModel: ItineraryModel}) {
    return (
      <div>
          <ConfigPanel itineraryModel={itineraryModel} />
          <InfoPanel store={itineraryModel.store}/>
      </div>
    );
}