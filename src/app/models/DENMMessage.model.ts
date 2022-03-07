export class DENMMessage {
  constructor(
    public stationID: string,
    public causeCode: string,
    public subCauseCode: string,
    public description:string,
    public timestamp: Date
  ) {}
}
