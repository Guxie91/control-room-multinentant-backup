import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { take } from "rxjs/operators";
import { HttpHandlerService } from "../services/http-handler.service";
import { MQTT_SERVICE_OPTIONS } from "../utilities/mqtt-service-options";

export class BrokerMQTT {
  constructor(
    public name: string,
    public url: string,
    public options: {
      username: string;
      password: string;
      rejectUnauthorized: boolean;
    }
  ) {}
}

@Component({
  selector: "app-settings-menu",
  templateUrl: "./settings-menu.component.html",
  styleUrls: ["./settings-menu.component.css"],
})
export class SettingsMenuComponent implements OnInit {
  currentBroker: BrokerMQTT = {
    name: "",
    url: "",
    options: { username: "", password: "", rejectUnauthorized: false },
  };
  brokers: BrokerMQTT[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpHandlerService
  ) {}
  ngOnInit(): void {
    this.http
      .fetchMqttOptions()
      .pipe(take(1))
      .subscribe((data: any) => {
        this.brokers = data.mqtt_settings;
        for (let broker of this.brokers) {
          if (MQTT_SERVICE_OPTIONS.url == broker.url) {
            this.currentBroker = broker;
          }
        }
      });
  }
  trackByFn(index: number) {
    return index;
  }
  onSubmit() {}
}
