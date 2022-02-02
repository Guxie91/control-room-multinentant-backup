import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "filterTable",
})
export class TableFilterPipe implements PipeTransform {
  transform(list: any[], filter: { name: string; active: boolean }[][]): any[] {
    if (!list) {
      return [];
    }
    let subCategoriesItsEvents = filter[0];
    let subCategoriesVehicles = filter[1];
    let filtered = list;
    return filtered;
  }
}
