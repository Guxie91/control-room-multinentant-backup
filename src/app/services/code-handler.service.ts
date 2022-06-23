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
} from './../utilities/marker-icons';
import { Injectable } from '@angular/core';
import {
  CarIcon,
  EmergencyIcon,
  PedestrianIcon,
  RedEmergencyIcon,
  RedPedestrianIcon,
} from '../utilities/marker-icons';
import {
  collisionRiskWarning,
  defaultPopup,
  emergencyVehicleApproachingPopup,
  infoPopup,
  pedestrianWalkingPopup,
  roadworksPopup,
  stationaryVehicleWarning,
  trafficPopup,
  weatherPopup,
} from '../utilities/popup-ballon';
import { EtsiMessage } from '../models/etsi-message.model';
declare var denm: any;

@Injectable({
  providedIn: 'root',
})
export class CodeHandlerService {
  constructor() {}

  getDescriptionDetail(message: any) {
    let causeCodeDesc = denm.getCauseCode(message).toString();
    let subCauseCodeDesc = denm.getSubCauseCode(message).toString();
    //convert from Camel Case to String Case
    causeCodeDesc = causeCodeDesc
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str: string) => {
        return str.toUpperCase();
      });
    subCauseCodeDesc = subCauseCodeDesc
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str: string) => {
        return str.toUpperCase();
      });
    if (subCauseCodeDesc.length > 3 && causeCodeDesc.length > 3) {
      return causeCodeDesc + ': ' + subCauseCodeDesc;
    }
    if (causeCodeDesc.length > 3 && subCauseCodeDesc.length < 3) {
      return causeCodeDesc;
    }
    return (
      'CauseCode: ' + causeCodeDesc + ', SubCauseCode: ' + subCauseCodeDesc
    );
  }
  getAdHocDescription(
    description: string,
    causeCode: string,
    subCauseCode: string
  ) {
    switch (causeCode) {
      case '0':
        return 'reserved';
      case '1':
        switch (subCauseCode) {
          case '1':
            return 'trafficCondition: increasedVolumeOfTraffic';
          case '2':
            return 'trafficCondition: trafficJamSlowlyIncreasing';
          case '3':
            return 'trafficCondition: trafficJamIncreasing';
          case '4':
            return 'trafficCondition: trafficJamStronglyIncreasing';
          case '5':
            return 'trafficCondition: trafficStationary';
          case '6':
            return 'trafficCondition: trafficJamSlightlyDecreasing';
          case '7':
            return 'trafficCondition: trafficJamDecreasing';
          case '8':
            return 'trafficCondition: trafficJamStronglyDecreasing';
          default:
            return 'trafficCondition';
        }
      case '2':
        switch (subCauseCode) {
          case '1':
            return 'accident: multiVehicleAccident';
          case '2':
            return 'accident: heavyAccident';
          case '3':
            return 'accident: accidentInvolvingLorry';
          case '4':
            return 'accident: accidentInvolvingBus';
          case '5':
            return 'accident: accidentInvolvingHazardousMaterials';
          case '6':
            return 'accident: accidentOnOppositeLane';
          case '7':
            return 'accident: unsecuredAccident';
          case '8':
            return 'accident: assistanceRequested';
          default:
            return 'accident';
        }
      case '3':
        switch (subCauseCode) {
          case '1':
            return 'roadworks: majorRoadworks';
          case '2':
            return 'roadworks: roadMarkingWork';
          case '3':
            return 'roadworks: slowMovingRoadMaintenance';
          case '4':
            return 'roadworks: shortTermStationaryRoadworks';
          case '5':
            return 'roadworks: streetCleaning';
          case '6':
            return 'roadworks: winterService';
          default:
            return 'roadworks';
        }
      case '6':
        switch (+subCauseCode) {
          case 1:
            return 'adverseWeatherCondition_Adhesion: heavyFrostOnRoad';
          case 2:
            return 'adverseWeatherCondition_Adhesion: fuelOnRoad';
          case 3:
            return 'adverseWeatherCondition_Adhesion: mudOnRoad';
          case 4:
            return 'adverseWeatherCondition_Adhesion: snowOnRoad';
          case 5:
            return 'adverseWeatherCondition_Adhesion: iceOnRoad';
          case 6:
            return 'adverseWeatherCondition_Adhesion: blackIceOnRoad';
          case 7:
            return 'adverseWeatherCondition_Adhesion: oilOnRoad';
          case 8:
            return 'adverseWeatherCondition_Adhesion: looseChippings';
          case 9:
            return 'adverseWeatherCondition_Adhesion: instantBlackIce';
          case 10:
            return 'adverseWeatherCondition_Adhesion: roadsSalted';
          default:
            return 'adverseWeatherCondition_Adhesion';
        }
      case '9':
        switch (+subCauseCode) {
          case 1:
            return 'hazardousLocation_SurfaceCondition: rockfalls';
          case 2:
            return 'hazardousLocation_SurfaceCondition: earthquakeDamage';
          case 3:
            return 'hazardousLocation_SurfaceCondition: sewerCollapse';
          case 4:
            return 'hazardousLocation_SurfaceCondition: subsidence';
          case 5:
            return 'hazardousLocation_SurfaceCondition: snowDrifts';
          case 6:
            return 'hazardousLocation_SurfaceCondition: stormDamage';
          case 7:
            return 'hazardousLocation_SurfaceCondition: burstPipe';
          case 8:
            return 'hazardousLocation_SurfaceCondition: volcanoEruption';
          case 9:
            return 'hazardousLocation_SurfaceCondition: fallingIce';
          default:
            return 'hazardousLocation_SurfaceCondition';
        }
      case '10':
        switch (+subCauseCode) {
          case 1:
            return 'hazardousLocation_ObstacleOnTheRoad: shedLoad';
          case 2:
            return 'hazardousLocation_ObstacleOnTheRoad: partsOfVehicles';
          case 3:
            return 'hazardousLocation_ObstacleOnTheRoad: partsOfTyres';
          case 4:
            return 'hazardousLocation_ObstacleOnTheRoad: bigObjects';
          case 5:
            return 'hazardousLocation_ObstacleOnTheRoad: fallenTrees';
          case 6:
            return 'hazardousLocation_ObstacleOnTheRoad: hubCaps';
          case 7:
            return 'hazardousLocation_ObstacleOnTheRoad: waitingVehicles';
          default:
            return 'hazardousLocation_ObstacleOnTheRoad';
        }
      case '11':
        return 'hazardousLocation_AnimalOnTheRoad';
      case '12':
        switch (+subCauseCode) {
          case 1:
            return 'humanPresenceOnTheRoad: childrenOnRoadway';
          case 2:
            return 'humanPresenceOnTheRoad: cyclistOnRoadway';
          case 3:
            return 'humanPresenceOnTheRoad: motorcyclistOnRoadway';
          default:
            return 'humanPresenceOnTheRoad';
        }
      case '14':
        switch (+subCauseCode) {
          case 1:
            return 'wrongWayDriving: wrongLane';
          case 2:
            return 'wrongWayDriving: wrongDirection';
          default:
            return 'wrongWayDriving';
        }
      case '15':
        switch (+subCauseCode) {
          case 1:
            return 'rescueAndRecoveryWorkInProgress: emergencyVehicles';
          case 2:
            return 'rescueAndRecoveryWorkInProgress: rescueHelicopterLanding';
          case 3:
            return 'rescueAndRecoveryWorkInProgress: policeActivityOngoing';
          case 4:
            return 'rescueAndRecoveryWorkInProgress: medicalEmergencyOngoing';
          case 5:
            return 'rescueAndRecoveryWorkInProgress: childAbductionInProgress';
          default:
            return 'rescueAndRecoveryWorkInProgress';
        }
      case '17':
        switch (+subCauseCode) {
          case 1:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: strongWinds';
          case 2:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: damagingHail';
          case 3:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: hurricane';
          case 4:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: thunderstorm';
          case 5:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: tornado';
          case 6:
            return 'adverseWeatherCondition_ExtremeWeatherCondition: blizzard';
          default:
            return 'adverseWeatherCondition_ExtremeWeatherCondition';
        }
      case '18':
        switch (+subCauseCode) {
          case 1:
            return 'adverseWeatherCondition_Visibility: fog';
          case 2:
            return 'adverseWeatherCondition_Visibility: smoke';
          case 3:
            return 'adverseWeatherCondition_Visibility: heavy snowfall';
          case 4:
            return 'adverseWeatherCondition_Visibility: heavyRain';
          case 5:
            return 'adverseWeatherCondition_Visibility: heavyHail';
          case 6:
            return 'adverseWeatherCondition_Visibility: lowSunGlare';
          case 7:
            return 'adverseWeatherCondition_Visibility: sandstorms';
          case 8:
            return 'adverseWeatherCondition_Visibility: swarmsOfInsects';
          default:
            return 'adverseWeatherCondition_Visibility';
        }
      case '19':
        switch (+subCauseCode) {
          case 1:
            return 'adverseWeatherCondition_Precipitation: heavyRain';
          case 2:
            return 'adverseWeatherCondition_Precipitation: heavySnowfall';
          case 3:
            return 'adverseWeatherCondition_Precipitation: softHail';
          default:
            return 'adverseWeatherCondition_Precipitation';
        }
      case '26':
        switch (+subCauseCode) {
          case 1:
            return 'slowVehicle: maintenanceVehicle';
          case 2:
            return 'slowVehicle: vehiclesSlowingToLookAtAccident';
          case 3:
            return 'slowVehicle: abnormalLoad';
          case 4:
            return 'slowVehicle: abnormalWideLoad';
          case 5:
            return 'slowVehicle: convoy';
          case 6:
            return 'slowVehicle: snowplough';
          case 7:
            return 'slowVehicle: deicing';
          case 8:
            return 'slowVehicle: saltingVehicles';
          default:
            return 'slowVehicle';
        }
      case '27':
        switch (+subCauseCode) {
          case 1:
            return 'dangerousEndOfQueue: suddenEndOfQueue';
          case 2:
            return 'dangerousEndOfQueue: queueOverHill';
          case 3:
            return 'dangerousEndOfQueue: queueAroundBend';
          case 4:
            return 'dangerousEndOfQueue: queueInTunnel';
          default:
            return 'dangerousEndOfQueue';
        }
      case '91':
        switch (+subCauseCode) {
          case 1:
            return 'vehicleBreakdown: lackOfFuel';
          case 2:
            return 'vehicleBreakdown: lackOfBatteryPower';
          case 3:
            return 'vehicleBreakdown: engineProblem';
          case 4:
            return 'vehicleBreakdown: transmissionProblem';
          case 5:
            return 'vehicleBreakdown: engineCoolingProblem';
          case 6:
            return 'vehicleBreakdown: brakingSystemProblem';
          case 7:
            return 'vehicleBreakdown: steeringProblem';
          case 8:
            return 'vehicleBreakdown: Tyre tyrePuncture';
          case 9:
            return 'vehicleBreakdown: tyrePressureProblem';
          default:
            return 'vehicleBreakdown';
        }
      case '92':
        switch (+subCauseCode) {
          case 1:
            return 'postCrash: accidentWithoutECallTriggered';
          case 2:
            return 'postCrash: accidentWithECallManuallyTriggered';
          case 3:
            return 'postCrash: accidentWithECallAutomaticallyTriggered';
          case 4:
            return 'postCrash: accidentWithECallTriggeredWithoutAccessToCellularNetwork';
          default:
            return 'postCrash';
        }
      case '93':
        switch (+subCauseCode) {
          case 1:
            return 'humanProblem: glycemiaProblem';
          case 2:
            return 'humanProblem: heartProblem';
          default:
            return 'humanProblem';
        }
      case '94':
        switch (+subCauseCode) {
          case 1:
            return 'humanProblem';
          case 2:
            return 'vehicleBreakdown';
          case 3:
            return 'postCrash';
          case 4:
            return 'publicTransportStop';
          case 5:
            return 'carryingDangerousGoods';
          default:
            return 'stationaryVehicle';
        }
      case '95':
        switch (+subCauseCode) {
          case 1:
            return 'emergencyVehicleApproaching: emergencyVehicleApproaching';
          case 2:
            return 'emergencyVehicleApproaching: prioritizedVehicleApproaching';
          default:
            return 'emergencyVehicleApproaching';
        }
      case '96':
        return 'hazardousLocation_DangerousCurve';
      case '97':
        switch (+subCauseCode) {
          case 1:
            return 'collisionRisk: longitudinalCollisionRisk';
          case 2:
            return 'collisionRisk: crossingCollisionRisk';
          case 3:
            return 'collisionRisk: lateralCollisionRisk';
          case 4:
            return 'collisionRisk: vulnerableRoadUser';
          default:
            return 'collisionRisk';
        }
      case '98':
        switch (+subCauseCode) {
          case 1:
            return 'signalViolation: stopSignViolation';
          case 2:
            return 'signalViolation: trafficLightViolation';
          case 3:
            return 'signalViolation: turningRegulationViolation';
          default:
            return 'signalViolation';
        }
      case '99':
        switch (+subCauseCode) {
          case 1:
            return 'dangerousSituation: emergencyElectronicBrakeEngaged';
          case 2:
            return 'dangerousSituation: preCrashSystemEngaged';
          case 3:
            return 'dangerousSituation: espEngaged';
          case 4:
            return 'dangerousSituation: absEngaged';
          case 5:
            return 'dangerousSituation: aebEngaged';
          case 6:
            return 'dangerousSituation: brakeWarningEngaged';
          case 7:
            return 'dangerousSituation: collisionRiskWarningEngaged';
          default:
            return 'dangerousSituation';
        }
      default:
        return description;
    }
  }
  getIconForDENM(causeCode: string, subCauseCode: string, event: EtsiMessage) {
    let stationType = event.code;
    let vehicleRole = event.subCode;
    if (event.type == 'denm') {
      return DangerIcon;
    }
    //elenco di use-case implementati, ritorna icona rossa
    if (causeCode == '95' && subCauseCode == '1' && stationType == 10) {
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
    if (causeCode == '91' && subCauseCode == '0') {
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
    if (causeCode == '12' && subCauseCode == '0') {
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
    /*
    if (popup.includes('INF')) {
      let text = popup.split('-')[1];
      return (
        '<div style="text-align:center;">' +
        '<img src="./assets/img/WhiteInfoCat.png" class="alertImg popupImg" />' +
        '<br/><span class="alertLabel whiteText">' +
        text +
        '</span></div>'
      );
    }
    */
    switch (popup) {
      case 'RWW':
        return roadworksPopup;
      case 'WCW':
        return weatherPopup;
      case 'TCW':
        return trafficPopup;
      case 'VRUW':
        return pedestrianWalkingPopup;
      case 'EVW':
        return emergencyVehicleApproachingPopup;
      case 'SVW':
        return stationaryVehicleWarning;
      case 'CCRW':
        return collisionRiskWarning;
      case 'INF':
        return infoPopup;
      case '': {
        return (
          defaultPopup +
          '<div style="text-align:center;min-width: 100px;"><span class="alertLabel whiteText">' +
          'Sconosciuto' +
          '</span></div>'
        );
      }
      default:
        return (
          defaultPopup +
          '<div style="text-align:center;min-width: 100px;"><span class="alertLabel whiteText">' +
          popup +
          '</span></div>'
        );
    }
  }
}
