import SubTitleWHour from "./SubTitleWHour.tsx";
import "./Panels.css";
import Item from "./Item.tsx";

export default function Route() {
    const now = new Date();
    const duration = new Date(now.getTime() - 100000);
    return (
        <div>
            <SubTitleWHour tag={"h2"} imgPath={"/icons/depart-icon.png"} txt={"Départ"} hour={now}/>
            <Item duration={duration}>
                <SubTitleWHour tag={"h2"} imgPath={"/icons/etape-icon.png"} txt={"Etape 1"} hour={now}/>
            </Item>
            <SubTitleWHour tag={"h2"} imgPath={"/icons/depart-icon.png"} txt={"Arrivée"} hour={now}/>
        </div>
    );
}