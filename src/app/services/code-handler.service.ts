import { DangerIcon, RedCarIcon } from "./../utilities/marker-icons";
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
  getIconForDENM(causeCode: string, subCausdeCode: string, category: string) {
    if (causeCode == "95" && subCausdeCode == "1" && category == "emergency") {
      return RedEmergencyIcon;
    }
    if (causeCode == "91" && category == "cars") {
      return RedCarIcon;
    }
    if (causeCode == "12" && category == "pedestrians") {
      return RedPedestrianIcon;
    }
    if (category == "emergency") {
      return EmergencyIcon;
    }

    if (category == "cars") {
      return CarIcon;
    }

    if (category == "pedestrians") {
      return PedestrianIcon;
    }

    if (category == "alert") {
      return DangerIcon;
    }
    return DefaultIcon;
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
