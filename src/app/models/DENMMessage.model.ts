export class DENMMessage {
  constructor(
    public stationID: number,
    public causeCode: string,
    public subCauseCode: string,
    public description:string,
    public timestamp: Date
  ) {}
}
