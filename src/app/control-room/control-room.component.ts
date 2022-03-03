import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import * as L from "leaflet";
import { Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { forEachTrailingCommentRange } from "typescript";
import { CustomMessage } from "../models/custom-message.model";
import { DENMMessage } from "../models/DENMMessage.model";
import { EtsiMessage } from "../models/etsi-message.model";
import { MarkerBundle } from "../models/marker-bundle.model";
import { HttpHandlerService } from "../services/http-handler.service";
import { MqttHandlerService } from "../services/mqtt-handler.service";
import { OPEN_STREET_MAP } from "../utilities/maps";
import {
  CarIcon,
  DangerIcon,
  DefaultIcon,
  EmergencyIcon,
  InfoIcon,
  PedestrianIcon,
  RedEmergencyIcon,
  RoadworksIcon,
  TrafficIcon,
  WeatherIcon,
} from "../utilities/marker-icons";
import { POPUP_CONTENT } from "../utilities/popup-ballon";

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
    {
      label: "LAVORI IN CORSO",
      name: "roadworks",
      active: true,
      url: "./assets/img/RoadworksCat.png",
    },
    {
      label: "INFO",
      name: "info",
      active: true,
      url: "./assets/img/InfoCat.png",
    },
    {
      label: "METEO",
      name: "weather",
      active: true,
      url: "./assets/img/WeatherCat.png",
    },
    {
      label: "TRAFFICO",
      name: "traffic",
      active: true,
      url: "./assets/img/TrafficCat.png",
    },
    {
      label: "AVVISI",
      name: "alert",
      active: true,
      url: "./assets/img/AlertCat.png",
    },
  ];
  subCategoriesVehicles = [
    {
      label: "AUTO",
      name: "cars",
      active: true,
      url: "./assets/img/CarCat.png",
    },
    {
      label: "EMERGENZA",
      name: "emergency",
      active: true,
      url: "./assets/img/AmbulanceCat.png",
    },
    {
      label: "PEDONI",
      name: "pedestrians",
      active: true,
      url: "./assets/img/PedestrianCat.png",
    },
  ];
  subscriptions: Subscription[] = [];
  markers: MarkerBundle[] = [];
  lastSelectedEvent = "-1";
  searchKey = "";
  /* ************************************** */
  constructor(
    private mqtt: MqttHandlerService,
    private http: HttpHandlerService
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
    this.getCategories();
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
    let newCustomMessageSub = this.mqtt.newCustomMessage.subscribe(
      (message: CustomMessage) => {
        this.handleCustomMessage(message);
      }
    );
    let DENMMessageSub = this.mqtt.newDENMMessage.subscribe(
      (message: DENMMessage) => {
        this.handleDENM(message);
        return;
      }
    );
    let DENMExpiredSub = this.mqtt.DENMExpired.subscribe(
      (message: DENMMessage) => {
        this.handleExpiredDENM(message);
      }
    );
    this.mqtt.connectToBroker();
    this.subscriptions.push(DENMExpiredSub);
    this.subscriptions.push(mqttMessagesSub);
    this.subscriptions.push(mqttExpiredEventId);
    this.subscriptions.push(newCustomMessageSub);
    this.subscriptions.push(DENMMessageSub);
  }
  private initMap(): void {
    let lat = localStorage.getItem("lat");
    let lng = localStorage.getItem("lng");
    let zoom = localStorage.getItem("zoom");
    if (!lat || !lng || !zoom) {
      lat = "44.40233147421894";
      lng = "8.946791963838923";
      zoom = "10";
    }
    this.map = L.map("map", {
      center: [+lat, +lng],
      zoom: +zoom,
      closePopupOnClick: false,
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
        if (mark.messageId == this.lastSelectedEvent) {
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
        }
        return;
      }
    }
    //else create new marker for that id
    let dynamicIcon = DefaultIcon;
    if (etsiMessage.category == "roadworks") {
      dynamicIcon = RoadworksIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[0].active;
    }
    if (etsiMessage.category == "info") {
      dynamicIcon = InfoIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[1].active;
    }
    if (etsiMessage.category == "weather") {
      dynamicIcon = WeatherIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[2].active;
    }
    if (etsiMessage.category == "traffic") {
      etsiMessage.hide = !this.subCategoriesItsEvents[3].active;
      dynamicIcon = TrafficIcon;
    }
    if (etsiMessage.category == "alert") {
      etsiMessage.hide = !this.subCategoriesItsEvents[4].active;
      dynamicIcon = DangerIcon;
    }
    if (etsiMessage.category == "pedestrians") {
      etsiMessage.hide = !this.subCategoriesVehicles[2].active;
      dynamicIcon = PedestrianIcon;
    }
    if (etsiMessage.category == "cars") {
      etsiMessage.hide = !this.subCategoriesVehicles[0].active;
      dynamicIcon = CarIcon;
    }
    if (etsiMessage.category == "emergency") {
      etsiMessage.hide = !this.subCategoriesVehicles[1].active;
      dynamicIcon = EmergencyIcon;
    }
    var newMarker = L.marker(
      [etsiMessage.coordinates.lat, etsiMessage.coordinates.lng],
      { icon: dynamicIcon, riseOnHover: true }
    );
    newMarker.on("click", () => {
      this.onMarkerClicked(etsiMessage.id);
    });
    let mark = new MarkerBundle(
      etsiMessage.id,
      newMarker,
      etsiMessage.topic,
      etsiMessage.type
    );
    this.markers.push(mark);
    this.markers[this.markers.length - 1].marker.addTo(this.map);
    if (etsiMessage.hide) {
      this.hideMarker(etsiMessage.id);
    }
  }
  onFocus(id: string) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = "-1";
      return;
    } else {
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
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
        mark.marker.closePopup();
        mark.marker.removeFrom(this.map);
      }
    }
  }
  showMarker(id: string) {
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        mark.marker.addTo(this.map);
        mark.marker.openPopup();
      }
    }
  }
  onMarkerClicked(id: string) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = "-1";
    } else {
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          this.lastSelectedEvent = id;
          let elem = document.getElementById(mark.messageId);
          elem?.scrollIntoView({ behavior: "smooth" });
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
          break;
        }
      }
    }
  }
  getCategories() {
    let currentTenantName = localStorage.getItem("tenant");
    this.http
      .fetchLabels()
      .pipe(take(1))
      .subscribe((data) => {
        let tenants = data.tenants;
        for (let tnt of tenants) {
          if (tnt.name == currentTenantName) {
            for (let i = 0; i < this.subCategoriesItsEvents.length; i++) {
              this.subCategoriesItsEvents[i].label = tnt.categories[
                i
              ].toUpperCase();
            }
          }
        }
      });
  }
  handleCustomMessage(message: CustomMessage) {
    for (let marker of this.markers) {
      if (
        marker.messageId == message.stationId &&
        message.status == "on" &&
        marker.type == "cam"
      ) {
        let popup = L.popup({
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          closeOnEscapeKey: false,
          className: "popupBackground",
        });
        popup.setContent(
          "<span class='popupLabel'>Stringa ricevuta: " +
            message.popup +
            "</span><br/>" +
            POPUP_CONTENT +
            "<label='popup'>" +
            "Messaggio visualizzato alle : " +
            new Date().toLocaleTimeString("it-IT") +
            "</label>"
        );
        marker.marker.closePopup();
        marker.marker.unbindPopup();
        marker.marker.bindPopup(popup);
        marker.marker.openPopup();
        /*
        POPUP BACKGROUND EXPERIMENT
        */
        let popupElement = document.getElementsByClassName(
          "leaflet-popup-content-wrapper"
        );
        let htmlPopupElement;
        if (popupElement[0] instanceof HTMLElement) {
          htmlPopupElement = popupElement[0] as HTMLElement;
          htmlPopupElement.style.backgroundColor = "lightyellow";
        }
        /****************************************** */
        return;
      }
      if (
        marker.messageId == message.stationId &&
        message.status == "off" &&
        marker.type == "cam"
      ) {
        marker.marker.closePopup();
        marker.marker.unbindPopup();
        return;
      }
    }
    console.log("ATTENZIONE: errore su messaggio da dashboard/hud!");
    console.log("stationID " + message.stationId + " non trovato!");
  }
  handleDENM(message: DENMMessage) {
    for (let event of this.events) {
      if (message.stationID == event.id) {
        for (let denm of event.denms) {
          if (
            denm.causeCode == message.causeCode &&
            denm.subCauseCode == message.subCauseCode
          ) {
            denm.expired = false;
            denm.timestamp = message.timestamp;
            if (message.causeCode == "0" && message.subCauseCode == "0") {
              for (let mark of this.markers) {
                if (mark.messageId == event.id) {
                  mark.marker.setIcon(RedEmergencyIcon);
                }
              }
            }
            return;
          }
        }
        event.denms.push(message);
        if (
          event.category == "emergency" &&
          message.causeCode == "0" &&
          message.subCauseCode == "0"
        ) {
          for (let mark of this.markers) {
            if (mark.messageId == event.id) {
              mark.marker.setIcon(RedEmergencyIcon);
            }
          }
        }
        console.log("denm match not found!");
        return;
      }
    }
    console.log("ERROR: DENM stationID " + message.stationID + " not found!");
  }
  //test
  handleExpiredDENM(message: DENMMessage) {
    for (let event of this.events) {
      if (message.stationID == event.id) {
        for (let denm of event.denms) {
          if (
            denm.causeCode == message.causeCode &&
            denm.subCauseCode == message.subCauseCode
          ) {
            denm.expired = true;
            for (let mark of this.markers) {
              if (mark.messageId == event.id) {
                switch (event.category) {
                  case "emergency":
                    mark.marker.setIcon(EmergencyIcon);
                    return;
                  case "pedestrians":
                    mark.marker.setIcon(PedestrianIcon);
                    return;
                  case "cars":
                    mark.marker.setIcon(CarIcon);
                    return;
                }
              }
            }
          }
        }
      }
    }
  }
}
