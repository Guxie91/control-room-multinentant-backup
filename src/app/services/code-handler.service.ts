import {
  BikeIcon,
  BusIcon,
  DangerIcon,
  FireTruckIcon,
  RedBikeIcon,
  RedBusIcon,
  RedCarIcon,
  RedFireTruckIcon,
  RedMotorBikeIcon,
} from "./../utilities/marker-icons";
import { Injectable } from "@angular/core";
import {
  CarIcon,
  EmergencyIcon,
  PedestrianIcon,
  RedEmergencyIcon,
  RedPedestrianIcon,
} from "../utilities/marker-icons";
import {
  collisionRiskWarning,
  defaultPopup,
  emergencyVehicleApproachingPopup,
  pedestrianWalkingPopup,
  roadworksPopup,
  stationaryVehicleWarning,
  trafficPopup,
  weatherPopup,
} from "../utilities/popup-ballon";
import { EtsiMessage } from "../models/etsi-message.model";
declare var denm: any;

@Injectable({
  providedIn: "root",
})
export class CodeHandlerService {
  constructor() {}

  getDescriptionDetail(message: any) {
    let causeCodeDesc = denm.getCauseCode(message).toString();
    let subCauseCodeDesc = denm.getSubCauseCode(message).toString();
    //convert from Camel Case to String Case
    causeCodeDesc = causeCodeDesc
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str: string) => {
        return str.toUpperCase();
      });
    subCauseCodeDesc = subCauseCodeDesc
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str: string) => {
        return str.toUpperCase();
      });
    if (subCauseCodeDesc.length > 3 && causeCodeDesc.length > 3) {
      return causeCodeDesc + ": " + subCauseCodeDesc;
    } else {
      return (
        "causeCode: " + causeCodeDesc + ", subCauseCode: " + subCauseCodeDesc
      );
    }
  }
  getAdHocDescription(
    description: string,
    causeCode: string,
    subCauseCode: string
  ) {
    if (causeCode == "95" && subCauseCode == "1") {
      return "Emergency Vehicle Approaching";
    }
    if (causeCode == "12" && subCauseCode == "0") {
      return "Vulnerable Road User";
    }
    if (causeCode == "91" && subCauseCode == "0") {
      return "Vehicle Breakdown";
    }
    return description;
  }
  getIconForDENM(causeCode: string, subCauseCode: string, event: EtsiMessage) {
    let stationType = event.code;
    let vehicleRole = event.subCode;
    if (event.type == "denm") {
      return DangerIcon;
    }
    //elenco di use-case implementati, ritorna icona rossa
    if (causeCode == "95" && subCauseCode == "1" && stationType == 10) {
      switch (vehicleRole) {
        case 0:
          return RedEmergencyIcon;
        case 5:
          return RedFireTruckIcon;
        case 6:
          return RedEmergencyIcon;
        default:
          return RedEmergencyIcon;
      }
    }
    if (causeCode == "91" && subCauseCode == "0") {
      switch (stationType) {
        case 3:
        case 4:
          return RedMotorBikeIcon;
        case 5:
          return RedCarIcon;
        case 6:
          return RedBusIcon;
        default:
          return RedCarIcon;
      }
    }
    if (causeCode == "12" && subCauseCode == "0") {
      switch (stationType) {
        case 1:
          return RedPedestrianIcon;
        case 2:
          return RedBikeIcon;
        default:
          return RedPedestrianIcon;
      }
    }
    //use-case non riconosciuto, ritorna icona nera
    if (stationType == 1) {
      return PedestrianIcon;
    }
    if (stationType == 2) {
      return BikeIcon;
    }
    if (stationType == 3) {
      return BikeIcon;
    }
    if (stationType == 4) {
      return BikeIcon;
    }
    if (stationType == 5) {
      return CarIcon;
    }
    if (stationType == 6) {
      return CarIcon;
    }
    if (stationType == 7) {
      return CarIcon;
    }
    if (stationType == 8) {
      return CarIcon;
    }
    if (stationType == 9) {
      return CarIcon;
    }
    if (stationType == 10) {
      switch (vehicleRole) {
        case 0:
          return EmergencyIcon;
        case 5:
          return FireTruckIcon;
        case 6:
          return EmergencyIcon;
        default:
          return EmergencyIcon;
      }
    }
    return DangerIcon;
  }
  getPopupContent(popup: string) {
    //metodo che ritorna il contenuto html del popup
    switch (popup) {
      case "RWW":
        return roadworksPopup;
      case "WCW":
        return weatherPopup;
      case "TCW":
        return trafficPopup;
      case "VRUW":
        return pedestrianWalkingPopup;
      case "EVW":
        return emergencyVehicleApproachingPopup;
      case "SVW":
        return stationaryVehicleWarning;
      case "CCRW":
        return collisionRiskWarning;
      default:
        return (
          defaultPopup +
          '<div style="text-align:center;min-width: 100px;"><span class="alertLabel whiteText">' +
          popup +
          "</span></div>"
        );
    }
  }
}
