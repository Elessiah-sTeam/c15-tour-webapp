import type {JSX} from "react";
import './Panels.css';
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";
import ClickInput from "../ClickInput.tsx";
type Props = {
    tag: keyof JSX.IntrinsicElements,
    model: ItineraryModel,
    imgPath: string,
    segmentId: string,
    stepId?: string,
    subtitle: string,
    hour: Date | null
}

export default function SubTitleWHour({tag: Tag, model, imgPath, segmentId, stepId, subtitle, hour}: Props) {
    function manageSetter(newString: string)
    {
        if (stepId != undefined) {
            model.renameStep(segmentId, stepId, newString);
        } else {
            model.renameSegment(segmentId, newString);
        }
    }

    const classNameIcon: string = "icon-" + Tag;
    const className: string = Tag == "h2" ? "segmentTitle" : "stepTitle";
    return (
        <div className={"subtitle"}>
            <div className={"left"}>
                <img src={imgPath} alt="" className={classNameIcon} />
                <ClickInput currentStr={subtitle} setter={manageSetter} Tag={Tag} className={className}/>
            </div>
            {hour ?
                <b className={"hour"}>{hour.getHours()}:{hour.getMinutes().toString().padStart(2, "0")}</b>
                :
                <></>
            }
        </div>
    )
}