export class MqttSettings {
  constructor(
    public name: string,
    public url: string,
    public options: {
      username: string;
      password: string;
      rejectUnauthorized: boolean;
    }
  ) {}
}
