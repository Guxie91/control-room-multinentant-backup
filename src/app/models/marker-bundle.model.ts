export class MarkerBundle {
  constructor(
    public messageId: string,
    public marker: L.Marker,
    public topic: string,
    public type: string
  ) {}
}
