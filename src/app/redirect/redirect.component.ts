import { Component, OnInit } from "@angular/core";
import { take } from "rxjs/operators";
import { Tenant } from "../models/tenant.model";
import { HttpHandlerService } from "../services/http-handler.service";

@Component({
  selector: "app-redirect",
  templateUrl: "./redirect.component.html",
  styleUrls: ["./redirect.component.css"],
})
export class RedirectComponent implements OnInit {
  tenants: Tenant[] = [];
  constructor(private http: HttpHandlerService) {}

  ngOnInit(): void {
    this.http
      .fetchTenants()
      .pipe(take(1))
      .subscribe((result) => {
        this.tenants = result.tenants;
      });
  }
}
