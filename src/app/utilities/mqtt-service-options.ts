import { IMqttServiceOptions } from "ngx-mqtt";

export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  url: "wss://sen-ccar.tilab.com/mqtt/ccar",
  //protocol: "wss",
  connectOnCreate: false,
};
