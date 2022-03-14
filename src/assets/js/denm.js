/* jshint esversion: 10 */
/* jshint sub:true */
// # DENM ASN.1 decoder
var denm = (function (self) {
    'use strict';

    //const VERS = '1.2.1';

    self.getActionID = getActionID;
    self.getMsgId = getMsgId;
    self.getReferenceTime = getReferenceTime;
    self.getTermination = getTermination;
    self.isCancellation = isCancellation;
    self.isNegation = isNegation;
    self.getEventType = getEventType;
    self.getCauseCode = getCauseCode;
    self.getSubCauseCode = getSubCauseCode;
    self.getStationType = getStationType;
    self.getDetectionZone = getDetectionZone;
    self.getRelevanceZone = getRelevanceZone;
    self.getEventPos = getEventPos;
    self.setDetectionZone = setDetectionZone;
    self.setRelevanceZone = setRelevanceZone;
    self.setEventPos = setEventPos;
    self.createMsg = createMsg;

    self.dec = function (con) {
        var out = {};
        if (con.denm == undefined) con.denm = con;
        out.ActionID = denm.getActionID(con);
        out.ReferenceTime = denm.getReferenceTime(con);
        out.Termination = denm.getTermination(con);
        out.isCancellation = denm.isCancellation(con);
        out.isNegation = denm.isNegation(con);
        out.EventType = denm.getEventType(con);
        out.CauseCode = denm.getCauseCode(con);
        out.StationType = denm.getStationType(con);
        out.Code = out.EventType.causeCode + ":" + out.EventType.subCauseCode;
        out.SubCauseCode = denm.getSubCauseCode(con);
        out.eventPosition = denm.getEventPos(con);
        return out;
    };

    function getActionID(denm) {
        try {
            return denm['denm']['management']['actionID'];
        } catch {
            return '';
        }
    }

    function getMsgId(denm) {
        try {
            var actId = self.getActionID(denm);
            return actId['originatingStationID'] + "." + actId['sequenceNumber'];
        } catch {
            return '';
        }
    }

    function getReferenceTime(denm) {
        try {
            return denm['denm']['management']['referenceTime'];
        } catch {
            return;
        }
    }

    function getTermination(denm) {
        /*     """
            0: isCancellation
            1: isNegation
            -1: none
            """ */
        try {
            var term = denm['denm']['management']['termination'];
            return term;
        } catch {
            return -1;
        }
    }

    function isCancellation(denm) {
        if (getTermination(denm) == 0)
            return true;
        else
            return false;
    }

    function isNegation(denm) {
        if (getTermination(denm) == 1)
            return true;
        else
            return false;
    }

    function getEventType(denm) {
        try {
            return denm['denm']['situation']['eventType'];
        } catch {
            return '';
        }
    }

    function getCauseCode(denm) {
        var eventType = denm['denm']['situation']['eventType'];
        try {
            if (DENM_CAUSE[eventType['causeCode']])
                return DENM_CAUSE[eventType['causeCode']];
            else
                return eventType['causeCode'];
        } catch {
            return eventType['causeCode'];
        }
    }

    function getSubCauseCode(denm) {
        var eventType = denm['denm']['situation']['eventType'];
        try {
            if (DENM_CAUSE[eventType['causeCode']]) {
                cc = DENM_CAUSE[eventType['causeCode']];
                return DENM_SUBCAUSE[cc][eventType['subCauseCode']];
            } else
                return eventType['subCauseCode'];
        } catch {
            return eventType['subCauseCode'];
        }
    }

    function getStationType(denm) {
        try {
            var eventType = denm['denm']['situation']['eventType'];
            return DENM_STATION_TYPE[denm['denm']['management']['stationType']];
        } catch {
            return '';
        }
    }

    function getEventPos(denm) {
        try {
            var eventPos = denm['denm']['management']['eventPosition'];
            return toDeg({
                'lat': eventPos.latitude,
                'lng': eventPos.longitude
            });
        } catch (e) {
            console.log(">>ERROR-getEventPos", e);
            return null;
        }
    }

    function setEventPos(denm, new_pos) {
        try {
            var eventPos = denm['denm']['management']['eventPosition'];
            new_pos = fromDeg(new_pos);
            eventPos.latitude = new_pos.lat;
            eventPos.longitude = new_pos.lng;
            return eventPos;
        } catch (e) {
            console.log(">>ERROR-setEventPos", e);
            return null;
        }
    }

    function getRelevanceZone(denm) {
        try {
            var eventPos = denm['denm']['management']['eventPosition'];
            var eventHistory = denm['denm']['situation']['eventHistory'];
            var out = [],
                p_lat = eventPos.latitude,
                p_lng = eventPos.longitude;
            for (var i in eventHistory) {
                var pos = eventHistory[i].eventPosition;
                p_lat += pos.deltaLatitude;
                p_lng += pos.deltaLongitude;
                out.push(toDeg({
                    'lat': p_lat,
                    'lng': p_lng
                }));
            }
            return out;
        } catch (e) {
            console.log(">>ERROR-getRelevanceZone", e);
            return null;
        }
    }

    function getDetectionZone(denm) {
        try {
            var eventPos = denm['denm']['management']['eventPosition'];
            var trace = denm['denm']['location']['traces'][0];
            var out = [],
                p_lat = eventPos.latitude,
                p_lng = eventPos.longitude;
            for (var i in trace) {
                var pos = trace[i].pathPosition;
                p_lat += pos.deltaLatitude;
                p_lng += pos.deltaLongitude;
                out.push(toDeg({
                    'lat': p_lat,
                    'lng': p_lng
                }));
            }
            return out;
        } catch (e) {
            console.log(">>ERROR-getDetectionZone", e);
            return null;
        }
    }

    function setRelevanceZone(denm, det) {
        try {
            var eventHistory = denm['denm']['situation']['eventHistory'];
            for (var k in eventHistory) {
                var orig_det = eventHistory[k].eventPosition;
                orig_det.deltaLatitude = det[k].lat;
                orig_det.deltaLongitude = det[k].lng;
            }
        } catch (e) {
            console.log(">>ERROR-setRelevanceZone", e);
            return null;
        }
    }

    function setDetectionZone(denm, det) {
        try {
            var trace = denm['denm']['location']['traces'][0];
            for (var k in trace) {
                var orig_det = trace[k].pathPosition;
                orig_det.deltaLatitude = det[k].lat;
                orig_det.deltaLongitude = det[k].lng;
            }
        } catch (e) {
            console.log(">>ERROR-setRelevanceZone", e);
            return null;
        }
    }

    /* { lat: , lng: } */
    function toDeg(obj) {
        if (Array.isArray(obj)) {
            for (var k in obj) {
                obj[k] = toDeg(obj[k]);
            }
            return obj;
        } else {
            obj.lat = obj.lat * 0.0000001;
            obj.lng = obj.lng * 0.0000001;
            return obj;
        }
    }

    function fromDeg(obj) {
        if (obj.lat < 180) {
            obj.lat = parseInt(obj.lat * 10000000);
            obj.lng = parseInt(obj.lng * 10000000);
        }
        return obj;
    }

    /**
        pos: {lat,lng}
        stationID
        stationType
        causeCode, subCauseCode
        detectionZone[{lat,lng}, {lat,lng}]
        relevanceZone[{lat,lng}, {lat,lng}]
        hardShoulderStatus
        drivingLaneStatus
        speedLimit
        lane
    **/
    function createMsg(_props) {
        _props = Object.assign({}, _props);
        var pos = fromDeg(_props['pos'] || _props['point'] || {
            lat: 46.07828356,
            lng: 11.10587586
        });
        if (!_props['detectionZone']) {
            _props['detectionZone'] = [];
            _props['detectionZone'][0] = _props['pos'];
            _props['detectionZone'][1] = _props['pos'];
        }
        if (!_props['relevanceZone']) {
            _props['relevanceZone'] = [];
            _props['relevanceZone'][0] = _props['pos'];
            _props['relevanceZone'][1] = _props['pos'];
        }
        var msg = {
            'header': {
                'protocolVersion': 1,
                'messageID': 1, // DENM
                'stationID': _props['stationID'] || 999
            },
            'denm': {
                'management': {
                    'actionID': {
                        'originatingStationID': _props['stationID'] || 999,
                        'sequenceNumber': _props['seq'] || 1
                    },
                    'detectionTime': 0,
                    'referenceTime': 0,
                    'eventPosition': {
                        "latitude": pos.lat,
                        "longitude": pos.lng,
                        'positionConfidenceEllipse': {
                            "semiMajorConfidence": 4095,
                            /* unavailable */
                            "semiMajorOrientation": 3601,
                            /* unavailable */
                            "semiMinorConfidence": 4095 /* unavailable */
                        },
                        'altitude': {
                            'altitudeValue': 800001,
                            /* unavailable */
                            'altitudeConfidence': 'unavailable'
                        }
                    },
                    'relevanceDistance': _props['relevanceDistance'] ? _props['relevanceDistance'] : undefined,
                    'relevanceTrafficDirection': _props['relevanceTrafficDirection'] ? _props['relevanceTrafficDirection'] : undefined,
                    'validityDuration': 0,
                    'stationType': _props['stationType'] || 0 // unknown
                },
                'situation': {
                    'informationQuality': 0, // unavailable
                    'eventType': {
                        'causeCode': _props['causeCode'] || 0,
                        'subCauseCode': _props['subCauseCode'] || 0
                    },
                    'eventHistory': [{
                        'eventPosition': {
                            'deltaLatitude': fromDeg(_props['relevanceZone'][0])['lat'] - pos['lat'],
                            'deltaLongitude': fromDeg(_props['relevanceZone'][0])['lng'] - pos['lng'],
                            'deltaAltitude': 12800 // unavailable
                        },
                        'informationQuality': 4
                    }, {
                        'eventPosition': {
                            'deltaLatitude': fromDeg(_props['relevanceZone'][1])['lat'] - pos['lat'],
                            'deltaLongitude': fromDeg(_props['relevanceZone'][1])['lng'] - pos['lng'],
                            'deltaAltitude': 12800 // unavailable
                        },
                        'informationQuality': 4
                    }]
                },
                'location': {
                    'traces': [
                        [{
                            'pathPosition': {
                                'deltaLatitude': fromDeg(_props['detectionZone'][0])['lat'] - pos['lat'],
                                'deltaLongitude': fromDeg(_props['detectionZone'][0])['lng'] - pos['lng'],
                                'deltaAltitude': 12800 // unavailable
                            }
                        }, {
                            'pathPosition': {
                                'deltaLatitude': fromDeg(_props['detectionZone'][1])['lat'] - pos['lat'],
                                'deltaLongitude': fromDeg(_props['detectionZone'][1])['lng'] - pos['lng'],
                                'deltaAltitude': 12800 // unavailable
                            }
                        }]
                    ]
                },
                'alacarte': {}
            }
        };
        if (_props['causeCode'] == 1) {
            /* # traffic */
            msg['denm']['alacarte'] = {};
        } else if (_props['causeCode'] == 3) {
            /* # roadworks */
            msg['denm']['alacarte'] = {
                'roadWorks': {
                    'closedLanes': {
                        'hardShoulderStatus': _props['hardShoulderStatus'] ? _props['hardShoulderStatus'] : 'availableForStopping',
                        'drivingLaneStatus': {
                            "value": _props['drivingLaneStatus'] || "00", // bitstring (from right to left, first bit dummy)
                            "length": 1
                        }
                    },
                    'speedLimit': _props['speedLimit'],
                    'startingPointSpeedLimit': {
                        'deltaLatitude': 0,
                        'deltaLongitude': 0,
                        'deltaAltitude': 12800 // unavailable
                    },
                    'trafficFlowRule': _props['lane'] ? _props['lane'] : "passToLeft"
                }
            };
        } else if (_props['causeCode'] == 19) {
            /* # weather precip */
            msg['denm']['alacarte'] = {};
        }
        return msg;
    }

    var DENM_CAUSE = _invert({
        'reserved': 0,
        'trafficCondition': 1,
        'accident': 2,
        'roadworks': 3,
        'adverseWeatherCondition_Adhesion': 6,
        'hazardousLocation_SurfaceCondition': 9,
        'hazardousLocation_ObstacleOnTheRoad': 10,
        'hazardousLocation_AnimalOnTheRoad': 11,
        'humanPresenceOnTheRoad': 12,
        'wrongWayDriving': 14,
        'rescueAndRecoveryWorkInProgress': 15,
        'adverseWeatherCondition_ExtremeWeatherCondition': 17,
        'adverseWeatherCondition_Visibility': 18,
        'adverseWeatherCondition_Precipitation': 19,
        //'emergencyVehicleApproaching': 20,  // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        //'hazardousLocation_DangerousCurve': 21,  // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        //'collisionRisk': 22,  // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        //'signalViolation': 23,  // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        //'dangerousSituation': 24,  // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        'slowVehicle': 26, // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        'dangerousEndOfQueue': 27, // not in ETSI EN 302 637-3 V1.2.2 (2014-11)
        'vehicleBreakdown': 91,
        'postCrash': 92,
        'humanProblem': 93,
        'stationaryVehicle': 94,
        'emergencyVehicleApproaching': 95,
        'hazardousLocation_DangerousCurve': 96,
        'collisionRisk': 97,
        /* DUPLICATE */
        'signalViolation': 98,
        /* DUPLICATE */
        'dangerousSituation': 99 /* DUPLICATE */
    });

    var DENM_SUBCAUSE = {
        'trafficCondition': {
            1: "increasedVolumeOfTraffic",
            2: "trafficJamSlowlyIncreasing",
            3: "trafficJamIncreasing",
            4: "trafficJamStronglyIncreasing",
            5: "trafficStationary",
            6: "trafficJamSlightlyDecreasing",
            7: "trafficJamDecreasing",
            8: "trafficJamStronglyDecreasing"
        },
        'accident': {
            1: "multiVehicleAccident",
            2: "heavyAccident",
            3: "accidentInvolvingLorry",
            4: "accidentInvolvingBus",
            5: "accidentInvolvingHazardousMaterials",
            6: "accidentOnOppositeLane",
            7: "unsecuredAccident",
            8: "assistanceRequested"
        },
        'roadworks': {
            1: "majorRoadworks",
            2: "roadMarkingWork",
            3: "slowMovingRoadMaintenance",
            4: "shortTermStationaryRoadworks",
            5: "streetCleaning",
            6: "winterService"
        },
        'adverseWeatherCondition_Adhesion': {
            1: "heavyFrostOnRoad",
            2: "fuelOnRoad",
            3: "mudOnRoad",
            4: "snowOnRoad",
            5: "iceOnRoad",
            6: "blackIceOnRoad",
            7: "oilOnRoad",
            8: "looseChippings",
            9: "instantBlackIce",
            10: "roadsSalted"
        },
        'hazardousLocation_SurfaceCondition': {
            1: "rockfalls",
            2: "earthquakeDamage",
            3: "sewerCollapse",
            4: "subsidence",
            5: "snowDrifts",
            6: "stormDamage",
            7: "burstPipe",
            8: "volcanoEruption",
            9: "fallingIce"
        },
        'hazardousLocation_ObstacleOnTheRoad': {
            1: "shedLoad",
            2: "partsOfVehicles",
            3: "partsOfTyres",
            4: "bigObjects",
            5: "fallenTrees",
            6: "hubCaps",
            7: "waitingVehicles"
        },
        'hazardousLocation_AnimalOnTheRoad': {},
        'humanPresenceOnTheRoad': {
            1: "childrenOnRoadway",
            2: "cyclistOnRoadway",
            3: "motorcyclistOnRoadway"
        },
        'wrongWayDriving': {
            1: "wrongLane",
            2: "wrongDirection"
        },
        'rescueAndRecoveryWorkInProgress': {
            1: "emergencyVehicles",
            2: "rescueHelicopterLanding",
            3: "policeActivityOngoing",
            4: "medicalEmergencyOngoing",
            5: "childAbductionInProgress"
        },
        'adverseWeatherCondition_ExtremeWeatherCondition': {
            1: "strongWinds",
            2: "damagingHail",
            3: "hurricane",
            4: "thunderstorm",
            5: "tornado",
            6: "blizzard"
        },
        'adverseWeatherCondition_Visibility': {
            1: "fog",
            2: "smoke",
            3: "heavy snowfall",
            4: "heavyRain",
            5: "heavyHail",
            6: "lowSunGlare",
            7: "sandstorms",
            8: "swarmsOfInsects"
        },
        'adverseWeatherCondition_Precipitation': {
            1: "heavyRain",
            2: "heavySnowfall",
            3: "softHail"
        },
        'slowVehicle': {
            1: "maintenanceVehicle",
            2: "vehiclesSlowingToLookAtAccident",
            3: "abnormalLoad",
            4: "abnormalWideLoad",
            5: "convoy",
            6: "snowplough",
            7: "deicing",
            8: "saltingVehicles"
        },
        'dangerousEndOfQueue': {
            1: "suddenEndOfQueue",
            2: "queueOverHill",
            3: "queueAroundBend",
            4: "queueInTunnel"
        },
        'vehicleBreakdown': {
            1: "lackOfFuel",
            2: "lackOfBatteryPower",
            3: "engineProblem",
            4: "transmissionProblem",
            5: "engineCoolingProblem",
            6: "brakingSystemProblem",
            7: "steeringProblem",
            8: "Tyre tyrePuncture",
            9: "tyrePressureProblem"
        },
        'postCrash': {
            1: "accidentWithoutECallTriggered",
            2: "accidentWithECallManuallyTriggered",
            3: "accidentWithECallAutomaticallyTriggered",
            4: "accidentWithECallTriggeredWithoutAccessToCellularNetwork"
        },
        'humanProblem': {
            1: "glycemiaProblem",
            2: "heartProblem"
        },
        'stationaryVehicle': {
            1: "humanProblem",
            2: "vehicleBreakdown",
            3: "postCrash",
            4: "publicTransportStop",
            5: "carryingDangerousGoods"
        },
        'emergencyVehicleApproaching': {
            1: "emergencyVehicleApproaching",
            2: "prioritizedVehicleApproaching"
        },
        'collisionRisk': {
            1: "longitudinalCollisionRisk",
            2: "crossingCollisionRisk",
            3: "lateralCollisionRisk",
            4: "vulnerableRoadUser"
        },
        'signalViolation': {
            1: "stopSignViolation",
            2: "trafficLightViolation",
            3: "turningRegulationViolation"
        },
        'dangerousSituation': {
            1: "emergencyElectronicBrakeEngaged",
            2: "preCrashSystemEngaged",
            3: "espEngaged",
            4: "absEngaged",
            5: "aebEngaged",
            6: "brakeWarningEngaged",
            7: "collisionRiskWarningEngaged"
        },
    };

    var DENM_STATION_TYPE = _invert({
        'unknown': 0,
        'pedestrian': 1,
        'cyclist': 2,
        'moped': 3,
        'motorcycle': 4,
        'passengerCar': 5,
        'bus': 6,
        'lightTruck': 7,
        'heavyTruck': 8,
        'trailer': 9,
        'specialVehicles': 10,
        'tram': 11,
        'roadSideUnit': 12
    });

    var DENM_RelevanceDistance = [
        'lessThan50m',
        'lessThan100m',
        'lessThan200m',
        'lessThan500m',
        'lessThan1000m',
        'lessThan5km',
        'lessThan10km',
        'over10km'
    ];

    var DENM_RelevanceTrafficDirection = [
        'allTrafficDirections',
        'upstreamTraffic',
        'downstreamTraffic',
        'oppositeTraffic'
    ];

    var DENM_HardShoulderStatus = ['availableForStopping', 'closed', 'availableForDriving'];

    var messageID = _invert({
        'denm': 1,
        'cam': 2,
        'poi': 3,
        'spat': 4,
        'map': 5,
        'ivi': 6,
        'ev-rsr': 7
    }); /* (0..255), */

    self.MESSAGE_ID = messageID;

    function _invert(obj) {
        var map = {};
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                map[obj[k]] = k;
            }
        }
        return map;
    }


    return self;
}(denm || {}));

if (typeof module === 'object' && module.exports) {
    module.exports = denm;
}