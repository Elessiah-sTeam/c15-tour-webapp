import './Panels.css';
import * as React from "react";

type Props = {
    duration: Date;
    children: React.ReactNode;
}

export default function Item({duration, children}: Props) {
    return (
        <div className={"item"}>
            <div className={"left-part-item"}>
                {children}
            </div>
            <b className={"hour"}>{duration.getHours()}:{duration.getMinutes().toString().padStart(2, "0")}</b>
            <img className={"reorder-icon"} src="/icons/dragdrop-icon.png" alt={""}/>
        </div>
    )
}