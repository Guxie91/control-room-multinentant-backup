export class Tenant {
  constructor(
    public id: string = "",
    public name: string = "",
    public write: boolean = false,
    public api_key: string = "",
    public coordinates: number[] = [0, 0],
    public zoom:number = 0,
    public title: string = "",
    public footerText: string = "",
    public color:string = "",
    public categories:string[]=["Lavori in corso", "Avvisi", "Meteo", "Traffico"],
    public topics:string[]=["its/#"]
  ) {}
}
