import {useEffect} from "react";
import {useItinerary} from "../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../customObject/Itinerary/ItineraryStore.ts";
import {useNavigate, useSearchParams} from "react-router-dom";

export default function IdRoutingManager() {
    const navigate = useNavigate();
    const itinerary = useItinerary(itineraryModel.store);
    const [searchParams] = useSearchParams();

    const id: string | null = searchParams.get("id");

    useEffect(() => {
        if (itinerary.id != -1 && (id == null || Number(id) != itinerary.id)) {
            navigate("/planner?id=" + itinerary.id);
        }
        if (id && Number(id) !== itinerary.id) {
            itineraryModel.netModel.get(Number(id)).then();
        }
    }, [id, itinerary.id, navigate]);

    return (<></>);
}