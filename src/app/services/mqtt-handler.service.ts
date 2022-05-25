import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Subject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomMessage } from '../models/custom-message.model';
import { DENMMessage } from '../models/DENMMessage.model';
import { EtsiMessage } from '../models/etsi-message.model';
import { MqttSettings } from '../models/mqtt-settings';
import { MQTT_SERVICE_OPTIONS } from '../utilities/mqtt-service-options';
import { CodeHandlerService } from './code-handler.service';
import { HttpHandlerService } from './http-handler.service';
import { MqttMessagesHandlerService } from './mqtt-messages-handler.service';

@Injectable({
  providedIn: 'root',
})
export class MqttHandlerService {
  topics: string[] = [];
  connectedToBroker = false;
  subscriptions: Subscription[] = [];
  events: EtsiMessage[] = [];
  eventsUpdated = new Subject<EtsiMessage[]>();
  expiredEventId = new Subject<number>();
  newCustomMessage = new Subject<CustomMessage>();
  newDENMMessage = new Subject<DENMMessage>();
  DENMExpired = new Subject<DENMMessage>();
  brokers: MqttSettings[] = [];
  readyToConnect = false;
  currentBroker!: MqttSettings;
  autoFocusChanged = new Subject<string>();
  connectionStatusChanged = new Subject<boolean>();
  serversIds: number[] = [];

  constructor(
    private _mqtt: MqttService,
    private messageHandler: MqttMessagesHandlerService,
    private http: HttpHandlerService,
    private router: Router,
    private codeHandler: CodeHandlerService
  ) {
    this._mqtt.state.subscribe((status: any) => {
      if (+status >= 2) {
        this.connectionStatusChanged.next(true);
      } else {
        this.connectionStatusChanged.next(false);
      }
    });
  }

  initConnection() {
    this.http
      .fetchTenants()
      .pipe(take(1))
      .subscribe((data) => {
        let currentTenant = localStorage.getItem('tenant');
        if (!currentTenant) {
          console.log('Failed to detect tenant!');
          this.router.navigate(['/', 'redirect']);
        }
        let tenants = data.tenants;
        for (let tenant of tenants) {
          if (tenant.name == currentTenant) {
            this.topics = tenant.topics;
          }
        }
        if (this.topics == []) {
          console.log('Tenant was not recognized!');
          this.router.navigate(['/', currentTenant, 'login']);
        }
        this.http
          .fetchMqttOptions()
          .pipe(take(1))
          .subscribe((data: any) => {
            this.brokers = data.mqtt_settings;
            this.readyToConnect = true;
            this.http
              .fetchServersIds()
              .pipe(take(1))
              .subscribe((ids) => {
                this.serversIds = ids.serversIDs;
                this.connectToBroker();
              });
          });
      });
  }
  connectToBroker(options?: {
    username: string;
    password: string;
    rejectUnauthorized: boolean;
  }) {
    if (!this.readyToConnect) {
      this.initConnection();
      return;
    }
    if (this.connectedToBroker) {
      return;
    }
    if (MQTT_SERVICE_OPTIONS.url == '' || !options) {
      MQTT_SERVICE_OPTIONS.url = this.brokers[0].url;
      console.log('Connecting to default broker: ' + this.brokers[0].name);
      options = this.brokers[0].options;
    }
    this._mqtt.connect(options);
    for (let opt of this.brokers) {
      if (MQTT_SERVICE_OPTIONS.url == opt.url && options) {
        console.log(
          'Connected to ' + opt.name + ' with username: ' + options.username
        );
        this.currentBroker = opt;
        break;
      }
    }
    this.connectedToBroker = true;
    let topicSubscription;
    for (let topic of this.topics) {
      console.log('Subscribing to topic ' + topic);
      topicSubscription = this._mqtt.observe(topic).subscribe(
        (message: IMqttMessage) => {
          this.checkForExpiredEvents();
          let payloadJSON = JSON.parse(message.payload.toString());
          //check blocklist
          for (let id of this.serversIds) {
            if (payloadJSON.header.stationId == id) {
              // con questa modifica gli utenti registrati vengono ignorati
              return;
            }
          }
          //identify message type
          if (payloadJSON['denm']) {
            for (let event of this.events) {
              if (
                payloadJSON.denm.management.actionID.originatingStationID ==
                event.id
              ) {
                if (event.type == 'denm') {
                  this.handleDENMFromServer(message);
                  return;
                } else {
                  this.handleDENM(message);
                  return;
                }
              }
            }
            this.handleDENMFromServer(message);
            return;
          }
          if (
            payloadJSON['popup'] ||
            (payloadJSON['status'] && payloadJSON['stationId'])
          ) {
            this.handleCustomMessage(message);
            return;
          } else {
            let etsiMessage: EtsiMessage = this.messageHandler.manageMessage(
              message
            );
            if (etsiMessage.category == 'error') {
              console.log('Error: Unknown message type!');
              console.log(etsiMessage);
              return;
            }
            this.insertOrUpdateMessage(etsiMessage);
          }
        },
        (error) => {
          console.log('ERROR ON TOPIC: ' + this.topics[0]);
          console.log(error);
        }
      );
      this.subscriptions.push(topicSubscription);
    }
  }
  disconnectFromBroker() {
    if (!this.connectedToBroker) {
      return;
    }
    this._mqtt.disconnect();
    console.log('Disconnected from ' + this.currentBroker.name);
    this.currentBroker.name = '';
    MQTT_SERVICE_OPTIONS.url == '';
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.connectedToBroker = false;
    for (let event of this.events) {
      this.expiredEventId.next(event.id);
    }
    this.events = [];
    this.eventsUpdated.next(this.events);
  }
  checkForExpiredEvents() {
    for (let event of this.events) {
      let eventTime = new Date(event.timestamp).getTime();
      let currentTime = new Date().getTime();
      //DISCRIMINARE PER TIPO
      switch (event.type) {
        case 'ivim':
          if (currentTime - eventTime > 300000) {
            //IVIM EXPIRING TIME 5 min
            let index = this.events.indexOf(event);
            this.events.splice(index, 1);
            this.expiredEventId.next(event.id);
          }
          break;
        case 'cam':
          if (currentTime - eventTime > 5000) {
            //CAM EXPIRING TIME 5sec
            let index = this.events.indexOf(event);
            this.events.splice(index, 1);
            this.expiredEventId.next(event.id);
          }
          break;
        case 'denm':
          switch (event.category) {
            case 'alert':
              let time = 500;
              if (event.topic.includes('json')) {
                time = 500;//DENM EXPIRING TIME 0.5sec FOR CV2X DENMS
              } else {
                time = 300000;//DENM EXPIRING TIME 0.5sec FOR ITS DENMS
              }
              if (currentTime - eventTime > time) {
                let index = this.events.indexOf(event);
                this.events.splice(index, 1);
                this.expiredEventId.next(event.id);
              }
              break;
            default:
              if (currentTime - eventTime > 300000) {
                let index = this.events.indexOf(event);
                this.events.splice(index, 1);
                this.expiredEventId.next(event.id);
              }
              break;
          }
          break;
        default:
          //SPATEM MAPEM
          if (currentTime - eventTime > 300000) {
            //EXPIRING TIME 5 min
            let index = this.events.indexOf(event);
            this.events.splice(index, 1);
            this.expiredEventId.next(event.id);
          }
          break;
      }
      if (event.type == 'cam' && event.denms.length > 0) {
        for (let denm of event.denms) {
          let denmTime = denm.timestamp.getTime();
          if (currentTime - denmTime > 10000) {
            //DENM STATUS EXPIRING TIME 10sec
            this.DENMExpired.next(denm);
          }
        }
      }
    }
  }
  handleCustomMessage(message: IMqttMessage) {
    let customMessage: CustomMessage = JSON.parse(message.payload.toString());
    if (customMessage.popup == '' || customMessage.popup == undefined) {
      customMessage.popup = 'unknown';
    }
    this.newCustomMessage.next(customMessage);
  }
  handleDENM(message: IMqttMessage, id?: number) {
    let payloadJSON = JSON.parse(message.payload.toString());
    let stationID = payloadJSON.denm.management.actionID.originatingStationID;
    if (id != undefined) {
      stationID = id;
    }
    let causeCode = payloadJSON.denm.situation.eventType.causeCode;
    let subCauseCode = payloadJSON.denm.situation.eventType.subCauseCode;
    let timestamp = new Date();
    let tempDescription = this.codeHandler.getDescriptionDetail(payloadJSON);
    let description = this.codeHandler.getAdHocDescription(
      tempDescription,
      causeCode,
      subCauseCode
    );
    let new_denm = new DENMMessage(
      stationID,
      causeCode,
      subCauseCode,
      description,
      timestamp
    );
    this.newDENMMessage.next(new_denm);
  }
  insertOrUpdateMessage(etsiMessage: EtsiMessage) {
    let found = false;
    for (let event of this.events) {
      if (event.id == etsiMessage.id) {
        event.timestamp = etsiMessage.timestamp;
        event.coordinates = etsiMessage.coordinates;
        if (event.type != 'cam') {
          event.info = etsiMessage.info;
        }
        found = true;
      }
    }
    if (!found) {
      this.events.push(etsiMessage);
    }
    this.checkForExpiredEvents();
    this.events.sort((a, b) => {
      return a.category >= b.category ? 1 : -1;
    });
    this.eventsUpdated.next(this.events);
  }
  handleDENMFromServer(message: IMqttMessage) {
    let newMessage = this.messageHandler.createDENMMessage(message);
    this.insertOrUpdateMessage(newMessage);
  }
}
