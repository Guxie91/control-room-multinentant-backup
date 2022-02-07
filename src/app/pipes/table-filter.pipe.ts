import { Pipe, PipeTransform } from "@angular/core";
import { EtsiMessage } from "../models/etsi-message.model";

@Pipe({
  name: "filterTable",
})
export class TableFilterPipe implements PipeTransform {
  transform(list: any[], filter: string[]): any[] {
    if (!list) {
      return [];
    }
    let searchKey = filter[0];
    if (searchKey === "") {
      return list;
    }
    let filtered = list.filter((message: EtsiMessage) =>
      message.info.includes(searchKey)
    );
    return filtered;
  }
}
