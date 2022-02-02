import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import * as L from "leaflet";
import { Subscription } from "rxjs";
import { EtsiMessage } from "../models/etsi-message.model";
import { MarkerBundle } from "../models/marker-bundle.model";
import { MqttHandlerService } from "../services/mqtt-handler.service";
import { TenantHandlerService } from "../services/tenant-handler.service";
import { OPEN_STREET_MAP } from "../utilities/maps";

@Component({
  selector: "app-control-room",
  templateUrl: "./control-room.component.html",
  styleUrls: ["./control-room.component.css"],
})
export class ControlRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  private map!: L.Map;
  events: EtsiMessage[] = [];
  categories = [
    { name: "itsEvents", active: true },
    { name: "vehicles", active: false },
  ];
  subCategoriesItsEvents = [
    { name: "roadworks", active: true },
    { name: "alert", active: true },
    { name: "weather", active: true },
    { name: "traffic", active: true },
  ];
  subCategoriesVehicles = [
    { name: "cars", active: true },
    { name: "emergency", active: true },
    { name: "pedestrians", active: true },
  ];
  subscriptions: Subscription[] = [];
  markers: MarkerBundle[] = [];
  constructor(
    private tenantService: TenantHandlerService,
    private mqtt: MqttHandlerService
  ) {}

  ngOnDestroy(): void {
    this.map.removeLayer(OPEN_STREET_MAP);
    this.mqtt.disconnectFromBroker();
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
  ngAfterViewInit(): void {
    this.initMap();
  }
  ngOnInit(): void {
    let mqttMessagesSub = this.mqtt.eventsUpdated.subscribe((newMessages) => {
      this.events = newMessages;
      for (let message of this.events) {
        this.createOrUpdateMarker(message);
      }
    });
    this.mqtt.connectToBroker();
    this.subscriptions.push(mqttMessagesSub);
  }
  private initMap(): void {
    let tenant = this.tenantService.getCurrentTenant();
    this.map = L.map("map", {
      center: [tenant.coordinates[0], tenant.coordinates[1]],
      zoom: 10,
    });
    OPEN_STREET_MAP.addTo(this.map);
    L.control
      .scale({ position: "topright", imperial: false, maxWidth: 200 })
      .addTo(this.map);
  }
  onFilter(filter: string) {
    for (let cat of this.categories) {
      if (cat.name == filter) {
        cat.active = true;
      } else {
        cat.active = false;
      }
    }
  }
  onSubFilterIts(filter: string) {
    for (let sub of this.subCategoriesItsEvents) {
      if (sub.name == filter) {
        sub.active = !sub.active;
      }
    }
  }
  onSubFilterVehicles(filter: string) {
    for (let sub of this.subCategoriesVehicles) {
      if (sub.name == filter) {
        sub.active = !sub.active;
      }
    }
  }
  createOrUpdateMarker(etsiMessage: EtsiMessage) {
    //if marker for that id exists, check for update
    for (let mark of this.markers) {
      if (etsiMessage.id == mark.messageId) {
        //update coordinates
        mark.marker.setLatLng({
          lat: etsiMessage.coordinates.lat,
          lng: etsiMessage.coordinates.lng,
        });
        const type =
          etsiMessage.type == "denm/alert" ? "denm" : etsiMessage.type;
        mark.marker.setPopupContent(
          "<span style='font-size:0.9em; font-weight:normal; font-family:'TIMSansWeb-Regular';color:white;line-height:140%;padding:5px;color:#484848;letter-spacing:0px;'><strong>" +
            type.toUpperCase() +
            "</strong><br/>" +
            etsiMessage.info +
            "<br/>" +
            etsiMessage.timestamp.toLocaleString() +
            "</span>"
        );
        return;
      }
    }
    //else create new marker for that id
    const type = etsiMessage.type == "denm/alert" ? "denm" : etsiMessage.type;
    var newMarker = L.marker([
      etsiMessage.coordinates.lat,
      etsiMessage.coordinates.lng,
    ]).bindPopup(
      "<span style='font-size:0.9em; font-weight:normal; font-family:'TIMSansWeb-Regular';color:white;line-height:140%;padding:5px;color:#484848;letter-spacing:0px;'><strong>" +
        type.toUpperCase() +
        "</strong><br/>" +
        etsiMessage.info +
        "<br/>" +
        etsiMessage.timestamp.toLocaleString() +
        "</span>"
    );
    let mark = new MarkerBundle(
      etsiMessage.id,
      newMarker,
      etsiMessage.topic,
      etsiMessage.type
    );
    this.markers.push(mark);
    this.markers[this.markers.length - 1].marker.addTo(this.map);
  }
  onFocus(id: string) {
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        this.map.setView(
          [mark.marker.getLatLng().lat, mark.marker.getLatLng().lng],
          16
        );
        break;
      }
    }
  }
}
