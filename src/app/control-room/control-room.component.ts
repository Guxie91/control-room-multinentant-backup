import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import * as L from "leaflet";
import { Subscription } from "rxjs";
import { EtsiMessage } from "../models/etsi-message.model";
import { MarkerBundle } from "../models/marker-bundle.model";
import { MqttHandlerService } from "../services/mqtt-handler.service";
import { OPEN_STREET_MAP } from "../utilities/maps";
import {
  DangerIcon,
  DefaultIcon,
  RoadworksIcon,
  TrafficIcon,
  WeatherIcon,
} from "../utilities/marker-icons";

@Component({
  selector: "app-control-room",
  templateUrl: "./control-room.component.html",
  styleUrls: ["./control-room.component.css"],
  animations: [],
})
export class ControlRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  private map!: L.Map;
  events: EtsiMessage[] = [];
  categories = [
    { name: "itsEvents", active: true, url: "" },
    { name: "vehicles", active: false, url: "" },
  ];
  subCategoriesItsEvents = [
    { name: "roadworks", active: true, url: "./assets/img/RoadworksCat.png" },
    { name: "info", active: true, url: "./assets/img/AlertCat.png" },
    { name: "weather", active: true, url: "./assets/img/WeatherCat.png" },
    { name: "traffic", active: true, url: "./assets/img/TrafficCat.png" },
  ];
  subCategoriesVehicles = [
    { name: "cars", active: true, url: "./assets/img/ShuttleCat.png" },
    { name: "emergency", active: true, url: "./assets/img/BikeCat.png" },
    {
      name: "pedestrians",
      active: true,
      url: "./assets/img/PedestrianCat.png",
    },
  ];
  subscriptions: Subscription[] = [];
  markers: MarkerBundle[] = [];
  lastSelectedEvent = "-1";
  /* ************************************** */
  constructor(private mqtt: MqttHandlerService) {}
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
    let mqttExpiredEventId = this.mqtt.expiredEventId.subscribe((id) => {
      this.hideMarker(id);
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          let index = this.markers.indexOf(mark);
          this.markers.splice(index, 1);
        }
      }
    });
    this.mqtt.connectToBroker();
    this.subscriptions.push(mqttMessagesSub);
    this.subscriptions.push(mqttExpiredEventId);
  }
  private initMap(): void {
    let lat = localStorage.getItem("lat");
    let lng = localStorage.getItem("lng");
    if (!lat || !lng) {
      lat = "44.40233147421894";
      lng = "8.946791963838923";
    }
    this.map = L.map("map", {
      center: [+lat, +lng],
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
    for (let event of this.events) {
      if (event.category == filter) {
        event.hide = !event.hide;
        if (event.hide) {
          this.hideMarker(event.id);
        } else {
          this.showMarker(event.id);
        }
      }
    }
  }
  onSubFilterVehicles(filter: string) {
    for (let sub of this.subCategoriesVehicles) {
      if (sub.name == filter) {
        sub.active = !sub.active;
      }
    }
    for (let event of this.events) {
      if (event.category == filter) {
        event.hide = !event.hide;
        if (event.hide) {
          this.hideMarker(event.id);
        } else {
          this.showMarker(event.id);
        }
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
    let dynamicIcon = DefaultIcon;
    if (etsiMessage.category == "roadworks") {
      dynamicIcon = RoadworksIcon;
    }
    if (etsiMessage.category == "weather") {
      dynamicIcon = WeatherIcon;
    }
    if (etsiMessage.category == "traffic") {
      dynamicIcon = TrafficIcon;
    }
    if (etsiMessage.category == "info") {
      dynamicIcon = DangerIcon;
    }
    const type = etsiMessage.type == "denm/alert" ? "denm" : etsiMessage.type;
    var newMarker = L.marker(
      [etsiMessage.coordinates.lat, etsiMessage.coordinates.lng],
      { icon: dynamicIcon }
    ).bindPopup(
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
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = "-1";
      return;
    } else {
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          this.map.setView(
            [mark.marker.getLatLng().lat, mark.marker.getLatLng().lng],
            this.map.getZoom()
          );
          this.lastSelectedEvent = id;
          break;
        }
      }
    }
  }
  hideMarker(id: string) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = "-1";
    }
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        mark.marker.removeFrom(this.map);
      }
    }
  }
  showMarker(id: string) {
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        mark.marker.addTo(this.map);
      }
    }
  }
}
