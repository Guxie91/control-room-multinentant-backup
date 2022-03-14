import { Injectable } from "@angular/core";
import {
  CarIcon,
  DefaultIcon,
  EmergencyIcon,
  PedestrianIcon,
  RedEmergencyIcon,
} from "../utilities/marker-icons";
import {
  defaultPopup,
  emergencyVehicleApproachingPopup,
  pedestrianWalkingPopup,
} from "../utilities/popup-ballon";
@Injectable({
  providedIn: "root",
})
export class CodeHandlerService {
  constructor() {}

  getDescription(causeCode: string, subCauseCode: string) {
    if (causeCode == "95" && subCauseCode == "1") {
      return "Emergency Vehicle Approaching";
    }
    return "causeCode: " + causeCode + ", subCauseCode: " + subCauseCode;
  }
  getIcon(causeCode: string, subCausdeCode: string, category: string) {
    if (causeCode == "95" && subCausdeCode == "1" && category == "emergency") {
      return RedEmergencyIcon;
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
    return DefaultIcon;
  }
  getPopupContent(popup: string) {
    switch (popup) {
      case "pedestrianWalking":
        return pedestrianWalkingPopup;
      case "emergencyVehicleApproaching":
        return emergencyVehicleApproachingPopup;
      default:
        return (
          defaultPopup +
          '<div style="text-align:center;min-width: 100px;"><span class="alertLabel">' +
          popup +
          "</span></div>"
        );
    }
  }
}
