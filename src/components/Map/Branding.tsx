import roadTour from "../../assets/road_tour.svg";
import byC15Tour from "../../assets/by_c15_tour.svg";
import logo from "../../assets/logo.svg";

/**
 * Contient toutes les marques affichées
 * @constructor
 */
export default function Branding()
{
    return (
        <>
            <div className="map-branding">
                <img src={roadTour} alt="Roads Tour" className="brand-road" />
                <img src={byC15Tour} alt="By C15 Tour" className="brand-by" />
            </div>

            <div className="map-logo">
                <img src={logo} alt="C15 Tour" />
            </div>
        </>
    )
}