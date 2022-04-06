import { Injectable } from "@angular/core";
import { LatLng } from "leaflet";
import { IMqttMessage } from "ngx-mqtt";
import { EtsiMessage } from "../models/etsi-message.model";

@Injectable({
  providedIn: "root",
})
export class MqttMessagesHandlerService {
  constructor() {}
  manageMessage(message: IMqttMessage) {
    //disassemble topic
    let topicData = message.topic.split("/");
    //collect quadkeys or other topic elements
    let quadkey = "";
    for (let i = 0; i < topicData.length; i++) {
      if (i < 2) {
        continue;
      }
      quadkey += topicData[i];
    }
    //reassemble topic assuming text/text/quadkey/quadkey/....
    const topic = topicData[0] + "/" + topicData[1];
    const quadkeyArr = [quadkey];
    let newEtsiMessage;
    let payloadJSON = JSON.parse(message.payload.toString());
    //identify message type
    if (payloadJSON["ivi"]) {
      newEtsiMessage = this.createIVIMMessage(
        message.topic,
        quadkeyArr,
        payloadJSON
      );
    } else if (payloadJSON["cam"]) {
      newEtsiMessage = this.createCAMMessage(
        message.topic,
        quadkeyArr,
        payloadJSON
      );
    } else {
      //if the type is unknown, create dummy log
      console.log("error: unknown message type!");
      newEtsiMessage = this.createErrorMessage(
        topic,
        quadkeyArr,
        message.payload.toString()
      );
    }
    return newEtsiMessage;
  }
  createIVIMMessage(topic: string, quadkeyArr: string[], payloadJSON: any) {
    let id = payloadJSON.ivi.mandatory.iviIdentificationNumber;
    let info = "";
    info += payloadJSON.ivi.optional[1].giv[0].extraText[0].textContent;
    let latitude = +payloadJSON.ivi.optional[0].glc.referencePosition.latitude;
    latitude = latitude / 10000000;
    let longitude = +payloadJSON.ivi.optional[0].glc.referencePosition
      .longitude;
    longitude = longitude / 10000000;
    const category = topic.split("/")[1];
    let newEtsiMessage = new EtsiMessage(
      category,
      "ivim",
      id,
      info,
      topic,
      quadkeyArr,
      new LatLng(latitude, longitude),
      new Date()
    );
    return newEtsiMessage;
  }
  createCAMMessage(topic: string, quadkeyArr: string[], payloadJSON: any) {
    let id = payloadJSON.header.stationID;
    const stationType = payloadJSON.cam.camParameters.basicContainer.stationType.toString();
    let latitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.latitude;
    //latitude = latitude / 10000000;
    let longitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.longitude;
    //longitude = longitude / 10000000;
    if(+latitude>1000 || +longitude> 1000){
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    if(+latitude<-1000 || +longitude< -1000){
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    let info =
      "messageID: " +
      payloadJSON.header.messageID +
      ", stationID: " +
      payloadJSON.header.stationID +
      ", stationType: " +
      stationType;
    let category = "";
    switch (stationType) {
      case "1":
        info = payloadJSON.header.stationID;
        category = "pedestrians";
        break;
      case "5":
        info = payloadJSON.header.stationID;
        category = "cars";
        break;
      case "10":
        info = payloadJSON.header.stationID;
        category = "emergency";
        break;
      default:
        console.log("stationType " + stationType + " non riconosciuto!");
        info = "stationType non riconosciuto";
        category = "";
    }
    let newEtsiMessage = new EtsiMessage(
      category,
      "cam",
      id,
      info,
      topic,
      quadkeyArr,
      new LatLng(latitude, longitude),
      new Date()
    );
    return newEtsiMessage;
  }
  createErrorMessage(topic: string, quadkeyArr: string[], message: string) {
    let newEtsiMessage = new EtsiMessage(
      "error",
      "unknown",
      "unknown",
      message,
      topic,
      quadkeyArr,
      new LatLng(0, 0),
      new Date(),
      false,
      false
    );
    return newEtsiMessage;
  }
}
