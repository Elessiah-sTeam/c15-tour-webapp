import L from "leaflet";

export const c15Marker = L.icon({
    iconUrl: "/markers/marker64.png",
    iconSize: [48, 48],        // taille de l'icône
    iconAnchor: [22, 48],      // où se trouve la "pointe"
    popupAnchor: [0, -48],     // position du popup
    shadowUrl: undefined,      // <─ aucune ombre
    shadowSize: undefined,
    shadowAnchor: undefined,
});
