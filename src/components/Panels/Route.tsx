import "./Panels.css";
import type {DndCat} from "../../dndTypes.ts";
import StepList from "./DragNDrop/StepList.tsx";
import {useState} from "react";
import {TimeSpan} from "../../customObject/TimeSpan.ts";


export default function Route() {
    const now = new Date();
    const starthour = new Date();
    starthour.setHours(11);
    starthour.setMinutes(10);
    const endhour = new Date();
    endhour.setHours(15);
    endhour.setMinutes(0);
    const duration: TimeSpan = new TimeSpan(6318000);

    const exampleSteps: DndCat[] = [{
        id: "start",
        content: {title: "", duration: duration, hour: starthour},
        isStartEnd: true,
        items: [{
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
            hour: now},
        isStartEnd: false,
        items: [{
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
            hour: now},
        isStartEnd: false,
        items: [{
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
        items: [{
            id: "pdp-4",
            content: {
                title: "Arrivée",
                duration: duration,
            }
        }]
    }]

    const [categories, setCategories] = useState<DndCat[]>(exampleSteps);

    return (
        <div>
            <StepList categories={categories} setCategories={setCategories} />
        </div>
    );
}