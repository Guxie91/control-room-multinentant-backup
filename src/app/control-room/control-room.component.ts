import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomMessage } from '../models/custom-message.model';
import { DENMMessage } from '../models/DENMMessage.model';
import { EtsiMessage } from '../models/etsi-message.model';
import { MarkerBundle } from '../models/marker-bundle.model';
import { CodeHandlerService } from '../services/code-handler.service';
import { HttpHandlerService } from '../services/http-handler.service';
import { MqttHandlerService } from '../services/mqtt-handler.service';
import { GOOGLE_TERRAIN, OPEN_STREET_MAP } from '../utilities/maps';
import {
  BikeIcon,
  BusIcon,
  CarIcon,
  DangerIcon,
  DefaultIcon,
  EmergencyIcon,
  FireTruckIcon,
  InfoIcon,
  MotorBikeIcon,
  PedestrianIcon,
  RedCarIcon,
  RedPedestrianIcon,
  RedRoadworksIcon,
  RoadworksIcon,
  TrafficIcon,
  TrafficLightsIcon,
  WeatherIcon,
} from '../utilities/marker-icons';

@Component({
  selector: 'app-control-room',
  templateUrl: './control-room.component.html',
  styleUrls: ['./control-room.component.css'],
  animations: [],
})
export class ControlRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  private map!: L.Map;
  events: EtsiMessage[] = [];
  categories = [
    { name: 'itsEvents', active: true, url: '' },
    { name: 'vehicles', active: false, url: '' },
  ];
  subCategoriesItsEvents = [
    {
      label: 'LAVORI IN CORSO',
      name: 'roadworks',
      active: true,
      url: './assets/img/RoadworksCat.png',
    },
    {
      label: 'INFO',
      name: 'info',
      active: true,
      url: './assets/img/InfoCat.png',
    },
    {
      label: 'TRAFFIC LIGHTS',
      name: 'traffic_lights',
      active: true,
      url: './assets/img/TrafficLight.png',
    },
    {
      label: 'METEO',
      name: 'weather',
      active: true,
      url: './assets/img/WeatherCat.png',
    },
    {
      label: 'TRAFFICO',
      name: 'traffic',
      active: true,
      url: './assets/img/TrafficCat.png',
    },
    {
      label: 'AVVISI',
      name: 'alert',
      active: true,
      url: './assets/img/AlertCat.png',
    },
  ];
  subCategoriesVehicles = [
    {
      label: 'VEICOLI',
      name: 'cars',
      active: true,
      url: './assets/img/VehicleCat.png',
    },
    {
      label: 'UTENTI VULNERABILI',
      name: 'pedestrians',
      active: true,
      url: './assets/img/VRUCat.png',
    },

    {
      label: 'VEICOLI DI EMERGENZA',
      name: 'emergency',
      active: true,
      url: './assets/img/EmergencyCat.png',
    },
  ];
  subscriptions: Subscription[] = [];
  markers: MarkerBundle[] = [];
  lastSelectedEvent = -1;
  searchKey = '';
  autoFocus = 'on';
  specialVehiclesIDs: number[] = [];
  specialVehiclesNames: string[] = [];
  /* ************************************** */
  constructor(
    private mqtt: MqttHandlerService,
    private http: HttpHandlerService,
    private codeHandler: CodeHandlerService
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
    let autoFocusSub = this.mqtt.autoFocusChanged.subscribe((value: string) => {
      this.autoFocus = value;
    });
    let specialVehiclesSub = this.http
      .fetchSpecialVehicles()
      .subscribe((data) => {
        this.specialVehiclesIDs = data.special_ids;
        this.specialVehiclesNames = data.names;
      });
    this.mqtt.connectToBroker();
    this.subscriptions.push(DENMExpiredSub);
    this.subscriptions.push(mqttMessagesSub);
    this.subscriptions.push(mqttExpiredEventId);
    this.subscriptions.push(newCustomMessageSub);
    this.subscriptions.push(DENMMessageSub);
    this.subscriptions.push(autoFocusSub);
    this.subscriptions.push(specialVehiclesSub);
  }
  private initMap(): void {
    let lat = localStorage.getItem('lat');
    let lng = localStorage.getItem('lng');
    let zoom = localStorage.getItem('zoom');
    if (!lat || !lng || !zoom) {
      lat = '44.40233147421894';
      lng = '8.946791963838923';
      zoom = '10';
    }
    this.map = L.map('map', {
      center: [+lat, +lng],
      zoom: +zoom,
      closePopupOnClick: false,
    });
    OPEN_STREET_MAP.addTo(this.map);
    L.control
      .layers(
        {
          Cartina: OPEN_STREET_MAP,
          Satellitare: GOOGLE_TERRAIN,
        },
        undefined,
        {
          position: 'bottomleft',
        }
      )
      .addTo(this.map);
    L.control
      .scale({ position: 'topright', imperial: false, maxWidth: 200 })
      .addTo(this.map);
    let autoFocus = localStorage.getItem('autoFocus');
    if (autoFocus != null) {
      this.autoFocus = autoFocus;
    }
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
      if (
        etsiMessage.id == mark.messageId &&
        etsiMessage.type == mark.type &&
        etsiMessage.topic == mark.topic
      ) {
        //update coordinates
        mark.marker.setLatLng({
          lat: etsiMessage.coordinates.lat,
          lng: etsiMessage.coordinates.lng,
        });
        if (
          mark.messageId == this.lastSelectedEvent &&
          mark.type == 'cam' &&
          this.autoFocus == 'on'
        ) {
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
        }
        return;
      }
    }
    //else create new marker for that id
    let dynamicIcon = DangerIcon;
    //ITS EVENTS SECTION
    if (etsiMessage.category == 'roadworks') {
      dynamicIcon = RoadworksIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[0].active;
    }
    if (etsiMessage.category == 'info') {
      dynamicIcon = InfoIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[1].active;
    }
    if (etsiMessage.category == 'traffic_lights') {
      dynamicIcon = TrafficLightsIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[2].active;
    }
    if (etsiMessage.category == 'weather') {
      dynamicIcon = WeatherIcon;
      etsiMessage.hide = !this.subCategoriesItsEvents[3].active;
    }
    if (etsiMessage.category == 'traffic') {
      etsiMessage.hide = !this.subCategoriesItsEvents[4].active;
      dynamicIcon = TrafficIcon;
    }
    if (etsiMessage.category == 'alert') {
      etsiMessage.hide = !this.subCategoriesItsEvents[5].active;
      switch (etsiMessage.code) {
        case 3:
          dynamicIcon = RedRoadworksIcon;
          break;
        case 97:
          switch (etsiMessage.subCode) {
            case 2:
              dynamicIcon = RedCarIcon;
              break;
            case 4:
              dynamicIcon = RedPedestrianIcon;
              break;
            default:
              dynamicIcon = RedCarIcon;
              break;
          }

          break;
        default:
          dynamicIcon = DangerIcon;
          break;
      }
    }
    //VEHICLES SECTION
    if (etsiMessage.type == 'cam') {
      dynamicIcon = CarIcon;
      if (etsiMessage.code == 0) {
        //stationType 'unknown'
        etsiMessage.hide = !this.subCategoriesVehicles[0].active;
        dynamicIcon = DefaultIcon;
      }
      if (etsiMessage.code == 1) {
        etsiMessage.hide = !this.subCategoriesVehicles[1].active;
        //stationType 'pedestrian'
        dynamicIcon = PedestrianIcon;
      }
      if (etsiMessage.code == 2) {
        etsiMessage.hide = !this.subCategoriesVehicles[1].active;
        //stationType 'cyclist'
        dynamicIcon = BikeIcon;
      }
      if (etsiMessage.code == 3) {
        etsiMessage.hide = !this.subCategoriesVehicles[1].active;
        //stationType 'moped'
        dynamicIcon = MotorBikeIcon;
      }
      if (etsiMessage.code == 4) {
        etsiMessage.hide = !this.subCategoriesVehicles[1].active;
        //stationType 'motorcycle'
        dynamicIcon = MotorBikeIcon;
      }
      if (etsiMessage.code == 5) {
        etsiMessage.hide = !this.subCategoriesVehicles[0].active;
        //stationType 'passengerCar'
        dynamicIcon = CarIcon;
      }
      if (etsiMessage.code == 6) {
        etsiMessage.hide = !this.subCategoriesVehicles[0].active;
        //stationType 'bus'
        dynamicIcon = BusIcon;
      }
      if (etsiMessage.code == 10) {
        etsiMessage.hide = !this.subCategoriesVehicles[1].active;
        //stationType 'emergency'
        switch (etsiMessage.subCode) {
          case 0:
            dynamicIcon = EmergencyIcon;
            break;
          case 5:
            dynamicIcon = FireTruckIcon;
            break;
          case 6:
            dynamicIcon = EmergencyIcon;
            break;
          default:
            dynamicIcon = EmergencyIcon;
            break;
        }
      }
    }
    dynamicIcon = this.getSpecialMarkerIcon(dynamicIcon, etsiMessage);
    etsiMessage.info = this.getSpecialName(etsiMessage.id, etsiMessage.info);
    let zIndex = etsiMessage.type == 'denm' ? 1000 : 0; //denms must be on top
    var newMarker = L.marker(
      [etsiMessage.coordinates.lat, etsiMessage.coordinates.lng],
      { icon: dynamicIcon, riseOnHover: true, zIndexOffset: zIndex }
    );
    newMarker.on('click', () => {
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
  onFocus(id: number) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = -1;
      for (let mark of this.markers) {
        if (!mark.marker.isPopupOpen()) {
          mark.marker.openPopup();
        }
      }
      return;
    } else {
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
          this.lastSelectedEvent = id;
        } else {
          mark.marker.closePopup();
        }
      }
    }
  }
  hideMarker(id: number) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = -1;
    }
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        mark.marker.closePopup();
        mark.marker.removeFrom(this.map);
      }
    }
  }
  showMarker(id: number) {
    for (let mark of this.markers) {
      if (mark.messageId == id) {
        mark.marker.addTo(this.map);
        mark.marker.openPopup();
      }
    }
  }
  onMarkerClicked(id: number) {
    if (this.lastSelectedEvent == id) {
      this.lastSelectedEvent = -1;
    } else {
      this.lastSelectedEvent = id;
      for (let mark of this.markers) {
        if (mark.messageId == id) {
          let elem = document.getElementById(mark.messageId.toString());
          elem?.scrollIntoView({ behavior: 'smooth' });
          this.map.setView(mark.marker.getLatLng(), this.map.getZoom());
          break;
        }
      }
    }
  }
  getCategories() {
    let currentTenantName = localStorage.getItem('tenant');
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
        message.status == 'on' &&
        marker.type == 'cam'
      ) {
        if (marker.marker.isPopupOpen()) {
          return;
        }
        marker.marker.closePopup();
        marker.marker.unbindPopup();
        let popup = L.popup({
          autoClose: false,
          autoPan: false,
          closeButton: false,
          closeOnClick: false,
          closeOnEscapeKey: false,
          className: 'popupBackground',
        });
        let content = this.codeHandler.getPopupContent(message.popup);
        popup.setContent(content);
        marker.marker.bindPopup(popup);
        if (
          message.stationId == this.lastSelectedEvent ||
          this.lastSelectedEvent == -1
        ) {
          marker.marker.openPopup();
        }
        return;
      }
      if (
        marker.messageId == message.stationId &&
        message.status == 'off' &&
        marker.type == 'cam'
      ) {
        marker.marker.closePopup();
        marker.marker.unbindPopup();
        return;
      }
    }
    console.log('ATTENZIONE: errore su messaggio da dashboard/hud!');
    console.log('stationID ' + message.stationId + ' non trovato!');
  }
  handleDENM(message: DENMMessage) {
    for (let event of this.events) {
      if (message.stationID == event.id) {
        for (let denm of event.denms) {
          if (
            denm.causeCode == message.causeCode &&
            denm.subCauseCode == message.subCauseCode
          ) {
            denm.timestamp = message.timestamp;
            denm.description = message.description;
            return;
          }
        }
        event.denms.push(message);
        let icon = this.codeHandler.getIconForDENM(
          message.causeCode,
          message.subCauseCode,
          event
        );
        for (let id of this.specialVehiclesIDs) {
          if (event.id == id) {
            icon = this.createRedSpecialIcon(event.id);
          }
        }
        for (let mark of this.markers) {
          if (mark.messageId == event.id) {
            mark.marker.setIcon(icon);
            return;
          }
        }
      }
    }
    console.log('ERROR: DENM stationID ' + message.stationID + ' not found!');
  }
  handleExpiredDENM(message: DENMMessage) {
    for (let event of this.events) {
      if (message.stationID == event.id) {
        for (let denm of event.denms) {
          if (
            denm.causeCode == message.causeCode &&
            denm.subCauseCode == message.subCauseCode
          ) {
            let index = event.denms.indexOf(denm);
            event.denms.splice(index, 1);
            for (let mark of this.markers) {
              if (mark.messageId == event.id) {
                for (let id of this.specialVehiclesIDs) {
                  if (event.id == id) {
                    let customIcon = this.createSpecialIcon(event.id);
                    mark.marker.setIcon(customIcon);
                    return;
                  }
                }
                switch (event.code) {
                  case 10:
                    switch (event.subCode) {
                      case 5:
                        mark.marker.setIcon(FireTruckIcon);
                        break;
                      case 6:
                        mark.marker.setIcon(EmergencyIcon);
                        break;
                      default:
                        mark.marker.setIcon(EmergencyIcon);
                        break;
                    }
                    break;
                  case 1:
                    mark.marker.setIcon(PedestrianIcon);
                    break;
                  case 2:
                    mark.marker.setIcon(BikeIcon);
                    break;
                  case 3:
                    mark.marker.setIcon(MotorBikeIcon);
                    break;
                  case 4:
                    mark.marker.setIcon(MotorBikeIcon);
                    break;
                  case 5:
                    mark.marker.setIcon(CarIcon);
                    break;
                  case 6:
                    mark.marker.setIcon(BusIcon);
                    break;
                  default:
                    mark.marker.setIcon(CarIcon);
                    break;
                }
              }
            }
          }
        }
      }
    }
  }
  getSpecialMarkerIcon(previousIcon: L.Icon, etsiMessage: EtsiMessage) {
    for (let id of this.specialVehiclesIDs) {
      if (etsiMessage.id == id) {
        let customIcon = this.createSpecialIcon(etsiMessage.id);
        for (let event of this.events) {
          if (event.id == etsiMessage.id) {
            event.special = true;
            break;
          }
        }
        return customIcon;
      }
    }
    return previousIcon;
  }
  createSpecialIcon(id: number) {
    return L.icon({
      iconUrl: './assets/special-vehicles/' + id + '/default.png',
      iconSize: [44, 44], // size of the icon
      iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
    });
  }
  createRedSpecialIcon(id: number) {
    return L.icon({
      iconUrl: './assets/special-vehicles/' + id + '/red.png',
      iconSize: [44, 44], // size of the icon
      iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -30], // point from which the popup should open relative to the iconAnchor
    });
  }
  getSpecialName(id: number, info: string) {
    for (let vehicleID of this.specialVehiclesIDs) {
      if (id == vehicleID) {
        return (
          this.specialVehiclesNames[
            this.specialVehiclesIDs.indexOf(vehicleID)
          ] +
          ' (ID: ' +
          id +
          ')'
        );
      }
    }
    return info;
  }
}
