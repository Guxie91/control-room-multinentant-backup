import * as L from "leaflet";
import "node_modules/leaflet.tilelayer.colorfilter/src/leaflet-tilelayer-colorfilter.js";

export const ESRI_WORLD_IMAGERY = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    minZoom: 5,
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);
export const OPEN_STREET_MAP = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    minZoom: 5,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
);

export const ESRI_FILTER = ["bright:150%", "contrast:69%", "saturate:80%"];
export const ESRI_FILTERED = (L.tileLayer as any).colorFilter(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    minZoom: 5,
    attribution:
      "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    filter: ESRI_FILTER,
  }
);

export const OSM_FILTER = [];
export const OSM_FILTERED = (L.tileLayer as any).colorFilter(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    minZoom: 5,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    filter: OSM_FILTER,
  }
);
export const GOOGLE_FILTER = ['contrast:70%'];
export const GOOGLE_TERRAIN = (L.tileLayer as any).colorFilter(
  "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    minZoom: 5,
    attribution: "Copyright Google Maps",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    filter: GOOGLE_FILTER
  }
);
