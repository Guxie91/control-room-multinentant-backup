import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from "rxjs";
import { Tenant } from "../models/tenant.model";
import { AuthService } from "../services/auth.service";
import { MqttHandlerService } from "../services/mqtt-handler.service";
import { TenantHandlerService } from "../services/tenant-handler.service";
import { SettingsMenuComponent } from "../settings-menu/settings-menu.component";

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.css"],
})
export class FooterComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  currentTenant: Tenant = new Tenant();
  currentUser = "";
  footerImg = "";
  connected = false;
  constructor(
    private tenantService: TenantHandlerService,
    private auth: AuthService,
    private modalService: NgbModal,
    private mqtt: MqttHandlerService
  ) {}
  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
  ngOnInit(): void {
    let tenantSub = this.tenantService.tenant.subscribe((tenant) => {
      this.currentTenant = tenant;
      this.footerImg =
        "./assets/" + this.currentTenant.name + "/img/footer.png";
    });
    this.subscriptions.push(tenantSub);
    let userSub = this.auth.newUser.subscribe((user) => {
      this.currentUser = user.username;
    });
    this.subscriptions.push(userSub);
    let connectionStatusSub = this.mqtt.connectionStatusChanged.subscribe(
      (status) => {
        this.connected = status;
      }
    );
    this.subscriptions.push(connectionStatusSub);
  }
  openSettings() {
    this.modalService.open(SettingsMenuComponent, { centered: true });
  }
}
