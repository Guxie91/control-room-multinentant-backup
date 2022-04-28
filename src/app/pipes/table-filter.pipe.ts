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
      list.sort((a, b) => {
        return a.category >= b.category ? 1 : -1;
      });
      return list;
    }
    let filtered = list.filter((message: EtsiMessage) =>
      message.info.includes(searchKey)
    );
    filtered.sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });
    return filtered;
  }
}
