import { Injectable } from '@angular/core';
import { LatLng } from 'leaflet';
import { IMqttMessage } from 'ngx-mqtt';
import { EtsiMessage } from '../models/etsi-message.model';
import { CodeHandlerService } from './code-handler.service';

@Injectable({
  providedIn: 'root',
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
    if (payloadJSON['messageType'] == 'denm') {
      newEtsiMessage = this.createHLNDENM(message.topic, payloadJSON);
      return newEtsiMessage;
    }
    if (
      payloadJSON['messageType'] == 'SPATEM' ||
      payloadJSON['messageType'] == 'MAPEM' ||
      payloadJSON['messageType'] == 'mapem' ||
      payloadJSON['messageType'] == 'spatem'
    ) {
      newEtsiMessage = this.createSPATEM_MAPEMMessage(
        message.topic,
        payloadJSON
      );
      return newEtsiMessage;
    }
    if (payloadJSON['ivi']) {
      newEtsiMessage = this.createIVIMMessage(
        message.topic,
        quadkeyArr,
        payloadJSON
      );
      return newEtsiMessage;
    }
    if (payloadJSON['cam']) {
      newEtsiMessage = this.createCAMMessage(
        message.topic,
        quadkeyArr,
        payloadJSON
      );
      return newEtsiMessage;
    }
    //if the type is unknown, create dummy log
    console.log('error: unknown message type!');
    newEtsiMessage = this.createErrorMessage(
      topic,
      quadkeyArr,
      message.payload.toString()
    );
    return newEtsiMessage;
  }
  createIVIMMessage(topic: string, quadkeyArr: string[], payloadJSON: any) {
    let id = payloadJSON.ivi.mandatory.iviIdentificationNumber;
    let info = '';
    info += payloadJSON.ivi.optional[1].giv[0].extraText[0].textContent;
    let latitude = +payloadJSON.ivi.optional[0].glc.referencePosition.latitude;
    latitude = latitude / 10000000;
    let longitude = +payloadJSON.ivi.optional[0].glc.referencePosition
      .longitude;
    longitude = longitude / 10000000;
    //topic switch +1
    let category = topic.split('/')[1];
    if (category.length == 1) {
      category = topic.split('/')[2];
    }
    let newEtsiMessage = new EtsiMessage(
      category,
      'ivim',
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
      -1,
      -1
    );
    return newEtsiMessage;
  }
  createCAMMessage(topic: string, quadkeyArr: string[], payloadJSON: any) {
    let stationType = payloadJSON.cam.camParameters.basicContainer.stationType;
    let vehicleRole = payloadJSON.cam.camParameters.basicContainer.vehicleRole;
    let latitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.latitude;
    let longitude =
      payloadJSON.cam.camParameters.basicContainer.referencePosition.longitude;
    if (+latitude > 1000 || +longitude > 1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    if (+latitude < -1000 || +longitude < -1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    let info =
      'messageID: ' +
      payloadJSON.header.messageID +
      ', stationID: ' +
      payloadJSON.header.stationID +
      ', stationType: ' +
      stationType;
    let category = '';
    let id = payloadJSON.header.stationID;
    switch (stationType) {
      case 0:
        info = 'Sconosciuto (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 1:
        info = 'Pedone (ID: ' + payloadJSON.header.stationID + ')';
        category = 'pedestrians';
        break;
      case 2:
        info = 'Ciclista (ID: ' + payloadJSON.header.stationID + ')';
        category = 'pedestrians';
        break;
      case 3:
        info = 'Ciclomotore (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 4:
        info = 'Motociclo (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 5:
        info = 'Veicolo (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 6:
        info = 'Bus (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 7:
        info = 'Camion (leggero) (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 8:
        info = 'Camion (pesante) (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 9:
        info = 'Rimorchio (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 10:
        switch (vehicleRole) {
          case 0:
            info = 'Ambulanza (ID: ' + payloadJSON.header.stationID + ')';
            break;
          case 5:
            info = 'Pompieri (ID: ' + payloadJSON.header.stationID + ')';
            break;
          case 6:
            info = 'Ambulanza (ID: ' + payloadJSON.header.stationID + ')';
            break;
          default:
            info =
              'Veicolo di Emergenza (ID: ' + payloadJSON.header.stationID + ')';
            break;
        }
        category = 'emergency';
        break;
      case 11:
        info = 'Tram (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      case 12:
        info = 'Unità Stradale (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
      default:
        console.log('stationType ' + stationType + ' non riconosciuto!');
        info = 'Sconosciuto (ID: ' + payloadJSON.header.stationID + ')';
        category = 'cars';
        break;
    }
    let newEtsiMessage = new EtsiMessage(
      category,
      'cam',
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
      'error',
      'unknown',
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
    let causeCode = +decodedMessage.payloadJSON.denm.situation.eventType
      .causeCode;
    let subCauseCode = +decodedMessage.payloadJSON.denm.situation.eventType
      .subCauseCode;
    let info = '';
    switch (causeCode) {
      /*
      case 12:
        if (subCauseCode == 0) {
          info = 'Avviso (Vulnerable Road User)';
        }
        break;
      case 91:
        if (subCauseCode == 0) {
          info = 'Avviso (Vehicle Breakdown)';
        }
        break;
      case 95:
        if (subCauseCode == 1) {
          info = 'Avviso (Emergency Vehicle Approaching)';
        }
        break;
      */
      default:
        info = this.codeHandler.getDescriptionDetail(
          decodedMessage.payloadJSON
        );
    }
    let latitude = +decodedMessage.payloadJSON.denm.management.eventPosition
      .latitude;
    let longitude = +decodedMessage.payloadJSON.denm.management.eventPosition
      .longitude;
    if (+latitude > 1000 || +longitude > 1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    if (+latitude < -1000 || +longitude < -1000) {
      latitude = latitude / 10000000;
      longitude = longitude / 10000000;
    }
    //critical id problem
    let id = latitude + longitude;
    let category = 'alert';
    if (decodedMessage.topic.includes('json')) {
      category = 'alert';
    } else {
      //tenant id
      category = decodedMessage.topic.split('/')[2];
    }
    let newMessage = new EtsiMessage(
      category,
      'denm',
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
      subCauseCode
    );
    return newMessage;
  }
  createSPATEM_MAPEMMessage(topic: string, payload: any) {
    let latitude = +payload['latitude'];
    let longitude = +payload['longitude'];
    let id = +(latitude + longitude).toString().replace('.', '');
    let publisherId = payload['publisherId'];
    let originatingCountry = payload['originatingCountry'];
    let info =
      payload['messageType'].toUpperCase() +
      ' - ' +
      publisherId +
      ' (' +
      originatingCountry +
      ')';
    let newMessage = new EtsiMessage(
      'traffic_lights',
      payload['messageType'].toUpperCase(),
      id,
      info,
      topic,
      [],
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      0,
      0
    );
    return newMessage;
  }
  createHLNDENM(topic: string, payloadJSON: any) {
    let latitude = +payloadJSON.latitude;
    let longitude = +payloadJSON.longitude;
    let id = latitude + longitude;
    let publisherId = payloadJSON['publisherId'];
    let originatingCountry = payloadJSON['originatingCountry'];
    let causeCode = payloadJSON['causeCode'];
    let subCauseCode = payloadJSON['subCause'] ? payloadJSON['subCause'] : 0;
    let info =
      payloadJSON['messageType'].toUpperCase() +
      causeCode +
      subCauseCode +
      ' - ' +
      publisherId +
      ' (' +
      originatingCountry +
      ')';
    info = this.codeHandler.getAdHocDescription(info, causeCode, subCauseCode);
    let newMessage = new EtsiMessage(
      'alert',
      'denm',
      id,
      info,
      topic,
      [payloadJSON.quadTree],
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      causeCode,
      subCauseCode
    );
    return newMessage;
  }
  extractMessage(message: IMqttMessage) {
    //disassemble topic
    //topic switch +1
    let topicData = message.topic.split('/');
    //collect quadkeys or other topic elements
    let quadkey = '';
    for (let i = 2; i < topicData.length; i++) {
      quadkey += topicData[i];
    }
    const quadkeyArr = [quadkey];
    let payloadJSON = JSON.parse(message.payload.toString());
    return {
      topic: message.topic,
      quadkeyArr: quadkeyArr,
      payloadJSON: payloadJSON,
    };
  }
}
