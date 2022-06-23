export class MarkerBundle {
  constructor(
    public messageId: number,
    public marker: L.Marker,
    public topic: string,
    public type: string
  ) {}
}
