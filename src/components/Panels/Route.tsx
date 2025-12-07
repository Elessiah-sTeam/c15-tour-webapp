import SubTitleWHour from "./SubTitleWHour.tsx";
import "./Panels.css";
import type {DndCat} from "../../dndTypes.ts";
import DndList from "./DragNDrop/DndList.tsx";
import {useState} from "react";


export default function Route() {
    const now = new Date();
    const duration = new Date(now.getTime() - 100000);

    const exampleSteps: DndCat[] = [{
        id: "step-1",
        content: {
            title: "Etape1",
            duration: duration,
            hour: now},
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
        items: []
    }]

    const [categories, setCategories] = useState<DndCat[]>(exampleSteps);

    return (
        <div>
            <SubTitleWHour tag={"h2"} imgPath={"/icons/depart-icon.png"} txt={"Départ"} hour={now}/>
            <DndList categories={categories} setCategories={setCategories} />
            <SubTitleWHour tag={"h2"} imgPath={"/icons/depart-icon.png"} txt={"Arrivée"} hour={now}/>
        </div>
    );
}