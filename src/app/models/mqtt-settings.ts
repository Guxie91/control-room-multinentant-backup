export class MqttSettings {
  constructor(
      public url: string,
      public options: {
        username: string;
        password: string;
        rejectUnauthorized: boolean;
      }
  ) {}
}
