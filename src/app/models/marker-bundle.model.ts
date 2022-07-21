export class MarkerBundle {
  constructor(
    public messageId: number,
    public marker: L.Marker,
    public topics: string[],
    public type: string
  ) {}
}
