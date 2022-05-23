import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { DENMMessage } from "src/app/models/DENMMessage.model";
import { EtsiMessage } from "src/app/models/etsi-message.model";
import { MqttHandlerService } from "src/app/services/mqtt-handler.service";

@Component({
  selector: "app-event-icon",
  templateUrl: "./event-icon.component.html",
  styleUrls: ["./event-icon.component.css"],
})
export class EventIconComponent implements OnInit, OnDestroy {
  @Input() event!: EtsiMessage;
  unknown = false;
  red = false;
  subscriptions: Subscription[] = [];

  constructor(private mqtt: MqttHandlerService) {}

  ngOnInit(): void {
    let DENMMessageSub = this.mqtt.newDENMMessage.subscribe(
      (message: DENMMessage) => {
        if (message.stationID == this.event.id) {
          this.red = true;
          for (let denm of this.event.denms) {
            if (
              message.causeCode == denm.causeCode &&
              message.subCauseCode == denm.subCauseCode
            ) {
              denm.timestamp = message.timestamp;
              return;
            }
          }
          this.event.denms.push(message);
        }
      }
    );
    this.subscriptions.push(DENMMessageSub);
    let DENMExpiredSub = this.mqtt.DENMExpired.subscribe(
      (message: DENMMessage) => {
        if (message.stationID == this.event.id) {
          this.red = false;
        }
      }
    );
    this.subscriptions.push(DENMExpiredSub);
    if (
      this.event.category != "roadworks" &&
      this.event.category != "weather" &&
      this.event.category != "traffic_lights" &&
      this.event.category != "info" &&
      this.event.category != "traffic" &&
      this.event.category != "pedestrians" &&
      this.event.category != "cars" &&
      this.event.category != "emergency" &&
      this.event.category != "alert"
    ) {
      this.unknown = true;
    }
    if (this.event.highlight == true) {
      this.red = true;
    }
  }
  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
}
