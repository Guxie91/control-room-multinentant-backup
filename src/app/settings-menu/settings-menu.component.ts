import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { take } from "rxjs/operators";
import { HttpHandlerService } from "../services/http-handler.service";
import { MqttHandlerService } from "../services/mqtt-handler.service";
import { MQTT_SERVICE_OPTIONS } from "../utilities/mqtt-service-options";

export class BrokerMQTT {
  constructor(
    public name: string = "",
    public url: string = "",
    public options: {
      username: string;
      password: string;
      rejectUnauthorized: boolean;
    } = { username: "", password: "", rejectUnauthorized: false }
  ) {}
}

@Component({
  selector: "app-settings-menu",
  templateUrl: "./settings-menu.component.html",
  styleUrls: ["./settings-menu.component.css"],
})
export class SettingsMenuComponent implements OnInit {
  brokers: BrokerMQTT[] = [];
  autoFocus: boolean = true;
  currentlySelectedBroker: BrokerMQTT = new BrokerMQTT();
  previousBroker: BrokerMQTT = new BrokerMQTT();

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpHandlerService,
    private mqtt: MqttHandlerService
  ) {}
  ngOnInit(): void {
    this.http
      .fetchMqttOptions()
      .pipe(take(1))
      .subscribe((data: any) => {
        this.brokers = data.mqtt_settings;
        for (let broker of this.brokers) {
          if (MQTT_SERVICE_OPTIONS.url == broker.url) {
            this.previousBroker = broker;
            this.currentlySelectedBroker = broker;
          }
        }
      });
    let autoFocus = localStorage.getItem("autoFocus");
    if (autoFocus == "true" || autoFocus == null) {
      this.autoFocus = true;
      this.mqtt.autoFocusChanged.next("on");
    }
    if (autoFocus == "false") {
      this.autoFocus = false;
      this.mqtt.autoFocusChanged.next("off");
    }
  }
  onSubmit() {
    let broker = this.currentlySelectedBroker;
    if (broker.name != this.previousBroker.name) {
      this.mqtt.disconnectFromBroker();
      console.log(
        "Disconnected from previous broker, switching to " + broker.name + "..."
      );
      MQTT_SERVICE_OPTIONS.url = broker.url;
      this.mqtt.connectToBroker(broker.options);
    } else {
      console.log("No broker changes detected!");
    }
    if (this.autoFocus == true) {
      this.mqtt.autoFocusChanged.next("on");
      localStorage.setItem("autoFocus", "on");
    } else {
      this.mqtt.autoFocusChanged.next("off");
      localStorage.setItem("autoFocus", "off");
    }
    this.activeModal.close();
    return;
  }
  onCancel() {
    this.activeModal.close();
  }
}
