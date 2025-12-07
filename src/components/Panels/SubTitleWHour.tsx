import type {JSX} from "react";

type Props = {
    tag: keyof JSX.IntrinsicElements;
    imgPath: string,
    txt: string,
    hour: Date
}

export default function SubTitleWHour({tag: Tag, imgPath, txt, hour}: Props) {
    return (
        <div className={"subtitle"}>
            <div className={"left"}>
                <img src={imgPath} alt="" className="icon" />
                <Tag>
                    {txt}
                </Tag>
            </div>
                <b className={"hour"}>{hour.getHours()}:{hour.getMinutes().toString().padStart(2, "0")}</b>
        </div>
    )
}