export class MqttSettings {
  constructor(
    public mqtt_settings: {
      mqtt_url_options: string[];
      mqtt_options: {
        username: string;
        password: string;
        rejectUnauthorized: false;
      };
    }
  ) {}
}
