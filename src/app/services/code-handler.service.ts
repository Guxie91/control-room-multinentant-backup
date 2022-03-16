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
} from "../utilities/popup-ballon";
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
  getAdHocDescription(description:string, causeCode: string, subCauseCode: string){
    if (causeCode == "95" && subCauseCode == "1") {
      return "Emergency Vehicle Approaching";
    }
    if (causeCode == "12" && subCauseCode == "1") {
      return "Children on Roadway";
    }
    return description;
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
    if (causeCode == "12" && category == "pedestrians") {
      return RedPedestrianIcon;
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
