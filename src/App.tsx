import BackgroundMap from './components/BackgroundMap.tsx';
import Panels from './components/Panels/Panels.tsx'
import './App.css';
import type {Itinerary} from "./customObject/Itinerary/types.ts";
import {TimeSpan} from "./customObject/TimeSpan.ts";
import {ItineraryModel} from "./customObject/Itinerary/ItineraryModel.ts";

export default function App() {
    const now = new Date();
    const starthour = new Date();
    starthour.setHours(11);
    starthour.setMinutes(10);
    const endhour = new Date();
    endhour.setHours(15);
    endhour.setMinutes(0);
    const duration: TimeSpan = new TimeSpan(6318000);

    const initial: Itinerary = {
        name: "Mon premier convoi",
        totalDuration: new TimeSpan(),
        totalDistance: 157,
        segments: [{
            id: "start",
            content: {title: "", duration: duration, hour: starthour},
            isStartEnd: true,
            steps: [{
                id: "pdp-0",
                content: {
                    title: "Départ",
                    duration: duration,
                }
            }]
        },
        {
            id: "step-1",
            content: {
                title: "Etape1",
                duration: duration,
                hour: now
            },
            isStartEnd: false,
            steps: [{
                id: "pdp-1",
                content: {
                    title: "Point de passage 1",
                    duration: duration
                }
            },
                {
                    id: "pdp-2",
                    content: {
                        title: "Point de passage 2",
                        duration: duration
                    }
                }]
        },
        {
            id: "step-2",
            content: {
                title: "Etape2",
                duration: duration,
                hour: now
            },
            isStartEnd: false,
            steps: [{
                id: "pdp-3",
                content: {
                    title: "Point de passage 3",
                    duration: duration
                }
            }]
        },
        {
            id: "end",
            content: {title: "", duration: duration, hour: endhour},
            isStartEnd: true,
            steps: [{
                id: "pdp-4",
                content: {
                    title: "Arrivée",
                    duration: duration,
                }
            }]
        }]
    }

    const itineraryModel: ItineraryModel = new ItineraryModel({initial: initial});

    return (
        <div className={"window"}>
            <BackgroundMap/>

            <div className={"panel"}>
                <Panels itineraryModel={itineraryModel} />
            </div>
        </div>
    );
}
