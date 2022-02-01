import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { Tenant } from "../models/tenant.model";
import { AuthService } from "../services/auth.service";
import { TenantHandlerService } from "../services/tenant-handler.service";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.css"],
})
export class FooterComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  currentTenant:Tenant = new Tenant();
  currentUser = "";
  footerImg = "";
  constructor(
    private tenantService: TenantHandlerService,
    private auth: AuthService  ) {}
  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
  ngOnInit(): void {
    let tenantSub = this.tenantService.tenant.subscribe((tenant) => {
      this.currentTenant = tenant;
      this.footerImg = "./assets/"+this.currentTenant.name+"/img/footer.png"
    });
    this.subscriptions.push(tenantSub);
    let userSub = this.auth.newUser.subscribe((user) => {
      this.currentUser = user.username;
    });
    this.subscriptions.push(userSub);
  }
}
