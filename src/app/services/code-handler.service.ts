import {
  BikeIcon,
  BusIcon,
  DangerIcon,
  FireTruckIcon,
  RedBikeIcon,
  RedBusIcon,
  RedCarIcon,
  RedFireTruckIcon,
} from "./../utilities/marker-icons";
import { Injectable } from "@angular/core";
import {
  CarIcon,
  DefaultIcon,
  EmergencyIcon,
  PedestrianIcon,
  RedEmergencyIcon,
  RedPedestrianIcon,
} from "../utilities/marker-icons";
import {
  defaultPopup,
  emergencyVehicleApproachingPopup,
  pedestrianWalkingPopup,
  roadworksPopup,
  stationaryVehicleWarning,
  trafficPopup,
  weatherPopup,
} from "../utilities/popup-ballon";
import { EtsiMessage } from "../models/etsi-message.model";
import { HttpHandlerService } from "./http-handler.service";
declare var denm: any;

@Injectable({
  providedIn: "root",
})
export class CodeHandlerService {
  constructor() {}

  getDescriptionDetail(message: any) {
    let causeCodeDesc = denm.getCauseCode(message);
    let subCauseCodeDesc = denm.getSubCauseCode(message);
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
  getIconForDENM(
    causeCode: string,
    subCausdeCode: string,
    stationType: number,
    vehicleRole: number
  ) {
    if (causeCode == "95" && subCausdeCode == "1" && stationType == 10) {
      if (vehicleRole == 6) {
        return RedEmergencyIcon;
      }
      if (vehicleRole == 5) {
        return RedFireTruckIcon;
      }
    }
    if (causeCode == "91" && stationType == 5) {
      return RedCarIcon;
    }
    if (causeCode == "91" && stationType == 6) {
      return RedBusIcon;
    }
    if (causeCode == "12" && stationType == 1) {
      return RedPedestrianIcon;
    }
    if (causeCode == "12" && stationType == 2) {
      return RedBikeIcon;
    }
    if (stationType == 10) {
      if (vehicleRole == 5) {
        return FireTruckIcon;
      }
      if (vehicleRole == 6) {
        return EmergencyIcon;
      }
    }
    if (stationType == 5) {
      return CarIcon;
    }
    if (stationType == 6) {
      return BusIcon;
    }
    if (stationType == 1) {
      return PedestrianIcon;
    }
    if (stationType == 2) {
      return BikeIcon;
    }
    return DangerIcon;
  }
  getPopupContent(popup: string) {
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
