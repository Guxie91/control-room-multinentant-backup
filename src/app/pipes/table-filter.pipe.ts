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
    filtered.sort((a, b) => {
      if (b.category > a.category) return 1;
      if (b.category < a.category) return -1;
      return 0;
    });
    return filtered;
  }
}
