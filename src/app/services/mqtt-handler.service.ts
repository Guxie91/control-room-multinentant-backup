import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { IMqttMessage, MqttService } from "ngx-mqtt";
import { Subject, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { EtsiMessage } from "../models/etsi-message.model";
import { Tenant } from "../models/tenant.model";
import { MQTT_SERVICE_OPTIONS } from "../utilities/mqtt-service-options";
import { HttpHandlerService } from "./http-handler.service";
import { MqttMessagesHandlerService } from "./mqtt-messages-handler.service";

@Injectable({
  providedIn: "root",
})
export class MqttHandlerService {
  mqtt_url_options: string[] = [];
  topics: string[] = [];
  mqtt_options = {
    username: "",
    password: "",
    rejectUnauthorized: false,
  };
  connectedToBroker = false;
  subscriptions: Subscription[] = [];
  events: EtsiMessage[] = [];
  eventsUpdated = new Subject<EtsiMessage[]>();
  expiredEventId = new Subject<string>();

  constructor(
    private _mqtt: MqttService,
    private messageHandler: MqttMessagesHandlerService,
    private http: HttpHandlerService,
    private router: Router
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
            let settings = data.mqtt_settings;
            this.mqtt_options = settings.mqtt_options;
            this.mqtt_url_options = settings.mqtt_url_options;
            this.connectToBroker();
          });
      });
  }
  connectToBroker() {
    if (
      this.mqtt_url_options == [] ||
      !this.mqtt_options.username ||
      !this.mqtt_options.password
    ) {
      this.initConnection();
      return;
    }
    if (this.connectedToBroker) {
      this.disconnectFromBroker();
    }
    if (MQTT_SERVICE_OPTIONS.url == "") {
      MQTT_SERVICE_OPTIONS.url = this.mqtt_url_options[0];
      console.log("Connecting to default broker: " + this.mqtt_url_options[0]);
    }
    this._mqtt.connect(this.mqtt_options);
    console.log("Connected to " + MQTT_SERVICE_OPTIONS.url);
    console.log("Subscribed on topics " + this.topics);
    this.connectedToBroker = true;
    let topicSubscription = this._mqtt.observe(this.topics[0]).subscribe(
      (message: IMqttMessage) => {
        let etsiMessage: EtsiMessage = this.messageHandler.manageMessage(
          message
        );
        let found = false;
        for (let event of this.events) {
          if (event.id == etsiMessage.id) {
            event.timestamp = etsiMessage.timestamp;
            found = true;
          }
        }
        if (!found) {
          this.events.push(etsiMessage);
        }
        this.checkForExpiredEvents();
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
  checkForExpiredEvents() {
    for (let event of this.events) {
      let eventTime = new Date(event.timestamp).getTime();
      let currentTime = new Date().getTime();
      if (currentTime - eventTime > 20000) {
        let index = this.events.indexOf(event);
        this.events.splice(index, 1);
        this.expiredEventId.next(event.id);
      }
    }
  }
}
