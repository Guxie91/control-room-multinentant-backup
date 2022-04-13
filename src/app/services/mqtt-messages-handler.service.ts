import { Injectable } from "@angular/core";
import { LatLng } from "leaflet";
import { IMqttMessage } from "ngx-mqtt";
import { EtsiMessage } from "../models/etsi-message.model";
import { CodeHandlerService } from "./code-handler.service";

@Injectable({
  providedIn: "root",
})
export class MqttMessagesHandlerService {
  constructor(private codeHandler: CodeHandlerService) {}
  manageMessage(message: IMqttMessage) {
    let decodedMessage = this.extractMessage(message);
    let payloadJSON = decodedMessage.payloadJSON;
    let quadkeyArr = decodedMessage.quadkeyArr;
    let topic = decodedMessage.topic;
    let newEtsiMessage;
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
    let stationType = payloadJSON.cam.camParameters.basicContainer.stationType;
    let vehicleRole = payloadJSON.cam.camParameters.basicContainer.vehicleRole;
    let latitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.latitude;
    //latitude = latitude / 10000000;
    let longitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.longitude;
    //longitude = longitude / 10000000;
    if (+latitude > 1000 || +longitude > 1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    if (+latitude < -1000 || +longitude < -1000) {
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
    let id = payloadJSON.header.stationID;
    switch (stationType) {
      case 1:
        info = "Pedone (ID: "+payloadJSON.header.stationID+")";
        category = "pedestrians";
        break;
      case 2:
        info = "Ciclista (ID: "+payloadJSON.header.stationID+")";
        category = "pedestrians";
        break;
      case 5:
        info = "Veicolo (ID: "+payloadJSON.header.stationID+")";
        category = "cars";
        break;
      case 10:
        info = "Veicolo di Emergenza (ID: "+payloadJSON.header.stationID+")";
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
      new Date(),
      false,
      false,
      [],
      false,
      stationType,
      vehicleRole
    );
    return newEtsiMessage;
  }
  createErrorMessage(topic: string, quadkeyArr: string[], message: string) {
    let newEtsiMessage = new EtsiMessage(
      "error",
      "unknown",
      -1,
      message,
      topic,
      quadkeyArr,
      new LatLng(0, 0),
      new Date(),
      false,
      false,
      [],
      false,
      0,
      0
    );
    return newEtsiMessage;
  }
  createDENMMessage(message: IMqttMessage) {
    let decodedMessage = this.extractMessage(message);
    let causeCode = decodedMessage.payloadJSON.denm.situation.eventType.causeCode;
    let subCauseCode = decodedMessage.payloadJSON.denm.situation.eventType.subCauseCode;
    let info;
    switch (causeCode) {
      case 12:
        info = "Avviso da server centrale (Utenti Vulnerabili)";
        break;
      case 91:
        info = "Avviso da server centrale (Veicoli)";
        break;
      case 95:
        info = "Avviso da server centrale (Veicoli di Emergenza)";
        break;
      default:
        console.log("causeCode " + causeCode + " non riconosciuto!");
        info = this.codeHandler.getDescriptionDetail(decodedMessage.payloadJSON);
    }
    let latitude = decodedMessage.payloadJSON.denm.management.eventPosition.latitude;
    let longitude = decodedMessage.payloadJSON.denm.management.eventPosition.longitude;
    if (+latitude > 1000 || +longitude > 1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    if (+latitude < -1000 || +longitude < -1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    let id = decodedMessage.payloadJSON.denm.management.actionID.originatingStationID;
    id += decodedMessage.payloadJSON.header.messageID;
    let newMessage = new EtsiMessage(
    "alert",
    "denm",
    id,
    info,
    decodedMessage.topic,
    decodedMessage.quadkeyArr,
    new LatLng(latitude, longitude),
    new Date(),
    false,
    false,
    [],
    false,
    causeCode,
    subCauseCode);
    return newMessage;
  }
  extractMessage(message: IMqttMessage) {
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
    let payloadJSON = JSON.parse(message.payload.toString());
    return { topic: topic, quadkeyArr: quadkeyArr, payloadJSON: payloadJSON };
  }
}
