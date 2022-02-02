import { LatLng } from "leaflet";

export class EtsiMessage{
  constructor(
    public category:string,
    public type:string,
    public id:string,
    public info:string,
    public topic:string,
    public quadkeys:string[],
    public coordinates:LatLng,
    public timestamp: Date,
    public highlight = false,
    public hide = false
  ) {

  }
}
