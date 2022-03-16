import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { IMqttMessage, MqttService } from "ngx-mqtt";
import { Subject, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { CustomMessage } from "../models/custom-message.model";
import { DENMMessage } from "../models/DENMMessage.model";
import { EtsiMessage } from "../models/etsi-message.model";
import { MqttSettings } from "../models/mqtt-settings";
import { MQTT_SERVICE_OPTIONS } from "../utilities/mqtt-service-options";
import { CodeHandlerService } from "./code-handler.service";
import { HttpHandlerService } from "./http-handler.service";
import { MqttMessagesHandlerService } from "./mqtt-messages-handler.service";

@Injectable({
  providedIn: "root",
})
export class MqttHandlerService {
  topics: string[] = [];
  connectedToBroker = false;
  subscriptions: Subscription[] = [];
  events: EtsiMessage[] = [];
  eventsUpdated = new Subject<EtsiMessage[]>();
  expiredEventId = new Subject<string>();
  newCustomMessage = new Subject<CustomMessage>();
  newDENMMessage = new Subject<DENMMessage>();
  DENMExpired = new Subject<DENMMessage>();
  brokers: MqttSettings[] = [];
  readyToConnect = false;
  currentBroker!: MqttSettings;

  constructor(
    private _mqtt: MqttService,
    private messageHandler: MqttMessagesHandlerService,
    private http: HttpHandlerService,
    private router: Router,
    private codeHandler: CodeHandlerService
  ) {}

  initConnection() {
    this.http
      .fetchTenants()
      .pipe(take(1))
      .subscribe((data) => {
        let currentTenant = localStorage.getItem("tenant");
        if (!currentTenant) {
          console.log("Failed to detect tenant!");
          this.router.navigate(["/", "redirect"]);
        }
        let tenants = data.tenants;
        for (let tenant of tenants) {
          if (tenant.name == currentTenant) {
            this.topics = tenant.topics;
          }
        }
        if (this.topics == []) {
          console.log("Tenant was not recognized!");
          this.router.navigate(["/", currentTenant, "login"]);
        }
        this.http
          .fetchMqttOptions()
          .pipe(take(1))
          .subscribe((data: any) => {
            this.brokers = data.mqtt_settings;
            this.readyToConnect = true;
            this.connectToBroker();
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
    if (MQTT_SERVICE_OPTIONS.url == "" || !options) {
      MQTT_SERVICE_OPTIONS.url = this.brokers[0].url;
      console.log("Connecting to default broker: " + this.brokers[0].name);
      options = this.brokers[0].options;
    }
    this._mqtt.connect(options);
    for (let opt of this.brokers) {
      if (MQTT_SERVICE_OPTIONS.url == opt.url && options) {
        console.log(
          "Connected to " + opt.name + " with username: " + options.username
        );
        this.currentBroker = opt;
        break;
      }
    }
    this.connectedToBroker = true;
    let topicSubscription;
    for (let topic of this.topics) {
      console.log("Subscribing to topic " + topic);
      topicSubscription = this._mqtt.observe(topic).subscribe(
        (message: IMqttMessage) => {
          let topicData = message.topic.split("/");
          const topic = topicData[0] + "/" + topicData[1];
          if(topic == "json/denm"){
            this.handleDENM(message);
            return;
          }
          if (topic == "dashboard/hud") {
            this.handleCustomMessage(message);
            return;
          } else {
            let etsiMessage: EtsiMessage = this.messageHandler.manageMessage(
              message
            );
            let found = false;
            for (let event of this.events) {
              if (event.id == etsiMessage.id) {
                event.timestamp = etsiMessage.timestamp;
                event.coordinates = etsiMessage.coordinates;
                found = true;
              }
            }
            if (!found) {
              this.events.push(etsiMessage);
            }
            this.checkForExpiredEvents();
            this.eventsUpdated.next(this.events);
          }
        },
        (error) => {
          console.log("ERROR ON TOPIC: " + this.topics[0]);
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
    console.log("Disconnected from " + this.currentBroker.name);
    this.currentBroker.name = "";
    MQTT_SERVICE_OPTIONS.url == "";
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.connectedToBroker = false;
    for (let event of this.events) {
      this.expiredEventId.next(event.id);
    }
    this.eventsUpdated.next([]);
  }
  checkForExpiredEvents() {
    for (let event of this.events) {
      let eventTime = new Date(event.timestamp).getTime();
      let currentTime = new Date().getTime();
      if (currentTime - eventTime > 60000) { //CAM EXPIRING TIME 60sec
        let index = this.events.indexOf(event);
        this.events.splice(index, 1);
        this.expiredEventId.next(event.id);
      }
      if(event.type == "cam" && event.denms.length>0){
        for(let denm of event.denms){
          let denmTime = denm.timestamp.getTime();
          if(currentTime - denmTime > 30000){ //DENM EXPIRING TIME 30sec
            this.DENMExpired.next(denm);
          }
        }
      }
    }
  }
  handleCustomMessage(message: IMqttMessage) {
    let customMessage: CustomMessage = JSON.parse(message.payload.toString());
    this.newCustomMessage.next(customMessage);
  }
  handleDENM(message: IMqttMessage){
    let payloadJSON = JSON.parse(message.payload.toString());
    let stationID = payloadJSON.denm.management.actionID.originatingStationID;
    let causeCode = payloadJSON.denm.situation.eventType.causeCode;
    let subCauseCode = payloadJSON.denm.situation.eventType.subCauseCode;
    let timestamp = new Date();
    let tempDescription = this.codeHandler.getDescriptionDetail(payloadJSON);
    let description = this.codeHandler.getAdHocDescription(tempDescription, causeCode, subCauseCode);
    let new_denm = new DENMMessage(
      stationID,
      causeCode,
      subCauseCode,
      description,
      timestamp
    );
    this.newDENMMessage.next(new_denm);
  }
}
