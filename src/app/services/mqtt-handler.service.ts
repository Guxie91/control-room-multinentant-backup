import { Injectable } from "@angular/core";
import { IMqttMessage, MqttService } from "ngx-mqtt";
import { Subject, Subscription } from "rxjs";
import { EtsiMessage } from "../models/etsi-message.model";
import { MQTT_SERVICE_OPTIONS } from "../utilities/mqtt-service-options";
import { MqttMessagesHandlerService } from "./mqtt-messages-handler.service";

@Injectable({
  providedIn: "root",
})
export class MqttHandlerService {
  MQTT_URL = "";
  topics = ["its/#"];
  options = {
    username: "ccar",
    password: "1q2w3e4r5t",
    rejectUnauthorized: false,
  };
  connectedToBroker = false;
  subscriptions: Subscription[] = [];
  events:EtsiMessage[] = [];
  eventsUpdated = new Subject<EtsiMessage[]>();

  constructor(
    private _mqtt: MqttService,
    private messageHandler: MqttMessagesHandlerService
  ) {}

  connectToBroker() {
    this._mqtt.connect(this.options);
    this.connectedToBroker = true;
    let topicSubscription = this._mqtt.observe(this.topics[0]).subscribe(
      (message: IMqttMessage) => {
        console.log(message.payload.toString());
        let etsiMessage: EtsiMessage = this.messageHandler.manageMessage(message);
        let found = false;
        for(let event of this.events){
          if(event.id == etsiMessage.id){
            event.timestamp = etsiMessage.timestamp;
            found = true;
          }
        }
        if(!found){
          this.events.push(etsiMessage);
        }
        this.eventsUpdated.next(this.events);
      },
      (error) => {
        console.log("ERROR ON TOPIC: " + this.topics[0]);
        console.log(error);
      }
    );
    this.subscriptions.push(topicSubscription);
  }
  disconnectFromBroker() {
    console.log("Disconnecting from " + MQTT_SERVICE_OPTIONS.url);
    this._mqtt.disconnect();
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
    this.connectedToBroker = false;
  }
}
