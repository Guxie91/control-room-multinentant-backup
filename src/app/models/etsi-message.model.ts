import { LatLng } from "leaflet";
import { DENMMessage } from "./DENMMessage.model";

export class EtsiMessage{
  constructor(
    public category:string,
    public type:string,
    public id:number,
    public info:string,
    public topics:string[] = [],
    public quadkeys:string[],
    public coordinates:LatLng,
    public timestamp: Date,
    public highlight = false,
    public hide = false,
    public denms:DENMMessage[] = [],
    public special:boolean = false,
    public code:number = 0,
    public subCode = 0,
    public publisherLabel = "",
    public originalPayload = ""
  ) {

  }
}
