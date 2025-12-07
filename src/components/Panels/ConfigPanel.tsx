import {useState} from "react";
import './Panels.css';
import Route from "./Route.tsx";

export default function ConfigPanel() {
    const [convoyName, setConvoyName] = useState('C15 Fiesta TOUR #1');

    return (
    <div className={"config-panel"}>
        <h1>{convoyName}</h1>
        <Route/>
    </div>
    )
}