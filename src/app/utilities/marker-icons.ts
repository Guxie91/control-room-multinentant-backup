import * as L from "leaflet";

export const DangerIcon = L.icon({
  iconUrl: "./assets/img/OrangeAlert.png",
  iconSize: [34, 30], // size of the icon
  iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
});

export const RoadworksIcon = L.icon({
  iconUrl: "./assets/img/OrangeRoadworks.png",
  iconSize: [34, 30], // size of the icon
  iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
});

export const WeatherIcon = L.icon({
  iconUrl: "./assets/img/OrangeWeather.png",
  iconSize: [36, 30], // size of the icon
  iconAnchor: [18, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
});

export const TrafficIcon = L.icon({
  iconUrl: "./assets/img/OrangeTraffic.png",
  iconSize: [44, 30], // size of the icon
  iconAnchor: [22, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
});

export const DefaultIcon = L.icon({
  iconUrl: "marker-icon.png",
  iconSize: [20, 30], // size of the icon
  iconAnchor: [10, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
});

