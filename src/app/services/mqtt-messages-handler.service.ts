import { take } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { LatLng } from 'leaflet';
import { IMqttMessage } from 'ngx-mqtt';
import { EtsiMessage } from '../models/etsi-message.model';
import { CodeHandlerService } from './code-handler.service';
import { HttpHandlerService } from './http-handler.service';

@Injectable({
  providedIn: 'root',
})
export class MqttMessagesHandlerService {
  publishersMap: { name: string; code: string }[] = [];
  constructor(
    private codeHandler: CodeHandlerService,
    private http: HttpHandlerService
  ) {
    this.http
      .fetchPublishers()
      .pipe(take(1))
      .subscribe((response) => {
        this.publishersMap = response.publishers;
      });
  }
  manageMessage(message: IMqttMessage) {
    let decodedMessage = this.extractMessage(message);
    let payloadJSON = decodedMessage.payloadJSON;
    let quadkeyArr = decodedMessage.quadkeyArr;
    let topic = decodedMessage.topic;
    let newEtsiMessage;
    //identify message type
    if (
      payloadJSON['messageType'] === 'DENM' ||
      payloadJSON['messageType'] === 'denm'
    ) {
      newEtsiMessage = this.createAMQP_DENM(message.topic, payloadJSON);
      return newEtsiMessage;
    }
    if (
      payloadJSON['messageType'] === 'IVIM' ||
      payloadJSON['messageType'] === 'ivim'
    ) {
      newEtsiMessage = this.createAMQP_IVIM(message.topic, payloadJSON);
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
    let publisherLabel = this.getPublisherLabel(topic.split('/')[1]);
    let newEtsiMessage = new EtsiMessage(
      category,
      'ivim',
      id,
      info,
      [topic],
      quadkeyArr,
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      -1,
      -1,
      publisherLabel,
      JSON.stringify(payloadJSON)
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
      [topic],
      [],
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      stationType,
      vehicleRole,
      'Cooperative Awareness Message',
      JSON.stringify(payloadJSON)
    );
    return newEtsiMessage;
  }
  createErrorMessage(topic: string, quadkeyArr: string[], message: string) {
    let publisherLabel = this.getPublisherLabel(topic.split('/')[1]);
    let newEtsiMessage = new EtsiMessage(
      'error',
      'unknown',
      -1,
      message,
      [topic],
      quadkeyArr,
      new LatLng(0, 0),
      new Date(),
      false,
      false,
      [],
      false,
      0,
      0,
      publisherLabel,
      message
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
    info = this.codeHandler.getDescriptionDetail(decodedMessage.payloadJSON);
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
    let publisherId =
      decodedMessage.payloadJSON.denm.management.actionID.originatingStationID;
    let publisherLabel = this.getPublisherLabel(
      decodedMessage.topic.split('/')[1],
      publisherId
    );
    let newMessage = new EtsiMessage(
      category,
      'denm',
      id,
      info,
      [decodedMessage.topic],
      decodedMessage.quadkeyArr,
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      causeCode,
      subCauseCode,
      publisherLabel,
      JSON.stringify(decodedMessage.payloadJSON)
    );
    return newMessage;
  }
  createSPATEM_MAPEMMessage(topic: string, payload: any) {
    let latitude = +payload['latitude'];
    let longitude = +payload['longitude'];
    let id = +(latitude + longitude).toString().replace('.', '');
    let publisherId = payload['publisherId'];
    let originatingCountry = payload['originatingCountry'];
    let messageType = payload['messageType'].toUpperCase();
    let info =
      messageType + ' - ' + publisherId + ' (' + originatingCountry + ')';
    if (messageType === 'MAPEM') {
      id = id + 1000;
      info = 'Road and Lane Topology Message';
    } else {
      info = 'Traffic Light Maneuver Message';
    }
    let publisherLabel = this.getPublisherLabel(
      topic.split('/')[1],
      publisherId
    );
    let quadTree = payload.quadTree.split(',');
    if(quadTree[0] == ""){
      quadTree.splice(0,1);
    }
    for (let quad of quadTree) {
      if (quad == "") {
        quadTree.splice(quad.indexOf(), 1);
      } else {
        quad.replaceAll(',', '');
      }
    }
    let newMessage = new EtsiMessage(
      'traffic_lights',
      messageType,
      id,
      info,
      [topic],
      quadTree,
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      0,
      0,
      publisherLabel,
      JSON.stringify(payload)
    );
    return newMessage;
  }
  createAMQP_IVIM(topic: string, payloadJSON: any) {
    let latitude = +payloadJSON.latitude;
    let longitude = +payloadJSON.longitude;
    let id = latitude + longitude;
    let publisherId = payloadJSON['publisherId'];
    let info = 'Infrastructure to Vehicle Information Message';
    let publisherLabel = this.getPublisherLabel(
      topic.split('/')[1],
      publisherId
    );
    let quadTree = payloadJSON.quadTree.split(',');
    if(quadTree[0] == ""){
      quadTree.splice(0,1);
    }
    for (let quad of quadTree) {
      if (quad == "") {
        quadTree.splice(quad.indexOf(), 1);
      } else {
        quad.replaceAll(',', '');
      }
    }
    let newMessage = new EtsiMessage(
      'info',
      'ivim',
      id,
      info,
      [topic],
      quadTree,
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      0,
      0,
      publisherLabel,
      JSON.stringify(payloadJSON)
    );
    return newMessage;
  }
  createAMQP_DENM(topic: string, payloadJSON: any) {
    let latitude = +payloadJSON.latitude;
    let longitude = +payloadJSON.longitude;
    let id = latitude + longitude;
    let publisherId = payloadJSON['publisherId'];
    let originatingCountry = payloadJSON['originatingCountry'];
    let causeCode = payloadJSON['causeCode'];
    let subCauseCode = payloadJSON['subCauseCode']
      ? payloadJSON['subCauseCode']
      : 0;
    let defaultInfo =
      payloadJSON['messageType'].toUpperCase() +
      ' [' +
      causeCode +
      ', ' +
      subCauseCode +
      '] - ' +
      publisherId +
      ' (' +
      originatingCountry +
      ')';
    let info = this.codeHandler.getAdHocDescription(
      defaultInfo,
      causeCode.toString(),
      subCauseCode.toString()
    );
    info = info.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => {
      return str.toUpperCase();
    });
    let publisherLabel = this.getPublisherLabel(
      topic.split('/')[1],
      publisherId
    );
    let quadTree = payloadJSON.quadTree.split(',');
    if(quadTree[0] == ""){
      quadTree.splice(0,1);
    }
    for (let quad of quadTree) {
      if (quad == "") {
        quadTree.splice(quad.indexOf(), 1);
      } else {
        quad.replaceAll(',', '');
      }
    }
    let newMessage = new EtsiMessage(
      topic.split('/')[2],
      'denm',
      id,
      info,
      [topic],
      quadTree,
      new LatLng(latitude, longitude),
      new Date(),
      false,
      false,
      [],
      false,
      +causeCode,
      +subCauseCode,
      publisherLabel,
      JSON.stringify(payloadJSON)
    );
    return newMessage;
  }
  extractMessage(message: IMqttMessage) {
    //disassemble topic
    let topicData = message.topic.split('/');
    //collect quadkeys or other topic elements
    let quadkey = '';
    for (let i = 3; i < topicData.length; i++) {
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
  getPublisherLabel(tenantId: string, publisherId?: string) {
    if (+tenantId == 2) {
      return 'Città Metropolitana di Genova';
    }
    if (+tenantId == 4 || +tenantId == 1) {
      return 'TIM Innovation Lab';
    }
    if (+tenantId == 5) {
      if (publisherId) {
        for (let pub of this.publishersMap) {
          if (pub.code == publisherId) {
            return 'C-Roads [' + pub.name + ']';
          }
        }
        return 'C-Roads [' + publisherId + ']';
      } else {
        return 'C-Roads';
      }
    }
    return '';
  }
}
