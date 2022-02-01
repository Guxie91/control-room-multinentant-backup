import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { Tenant } from "../models/tenant.model";
import { AuthService } from "../services/auth.service";
import { TenantHandlerService } from "../services/tenant-handler.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentTenant: Tenant = new Tenant();
  subscriptions: Subscription[] = [];
  logoUrl = "";
  currentUser = "";
  constructor(
    private tenantService: TenantHandlerService,
    private auth: AuthService  ) {}
  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
  ngOnInit(): void {
    let subTenant = this.tenantService.tenant.subscribe((tenant) => {
      this.currentTenant = tenant;
      this.logoUrl = "./assets/" + this.currentTenant.name + "/img/logo.png";
    });
    this.subscriptions.push(subTenant);
    let subUser = this.auth.newUser.subscribe((user) => {
      this.currentUser = user.username;
    });
    this.subscriptions.push(subUser);
  }
}
