import type {JSX} from "react";
import './Panels.css';

type Props = {
    tag: keyof JSX.IntrinsicElements;
    imgPath: string,
    txt: string,
    hour: Date | null
}

export default function SubTitleWHour({tag: Tag, imgPath, txt, hour}: Props) {
    const classNameIcon: string = "icon-" + Tag;
    return (
        <div className={"subtitle"}>
            <div className={"left"}>
                <img src={imgPath} alt="" className={classNameIcon} />
                <Tag>
                    {txt}
                </Tag>
            </div>
            {hour ?
                <b className={"hour"}>{hour.getHours()}:{hour.getMinutes().toString().padStart(2, "0")}</b>
                :
                <></>
            }
        </div>
    )
}