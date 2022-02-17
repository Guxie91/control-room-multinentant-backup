import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { MqttHandlerService } from "../services/mqtt-handler.service";

@Component({
  selector: "app-logout",
  templateUrl: "./logout.component.html",
  styleUrls: ["./logout.component.css"],
})
export class LogoutComponent implements OnInit, OnDestroy {
  constructor(
    private auth: AuthService,
    private router: Router,
    private mqtt: MqttHandlerService
  ) {}
  ngOnDestroy(): void {}
  ngOnInit(): void {
    this.auth.logout();
    let currentTenant = localStorage.getItem("tenant");
    localStorage.clear();
    this.mqtt.disconnectFromBroker();
    this.mqtt.readyToConnect = false;
    if (!currentTenant) {
      this.router.navigate(["/", "genova", "login"]);
    } else {
      this.router.navigate(["/", currentTenant, "login"]);
    }
  }
}
