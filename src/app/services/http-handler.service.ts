import { AuthResponse } from "./../models/auth-response.model";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Tenant } from "../models/tenant.model";
import { MqttSettings } from "../models/mqtt-settings";
import { take } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class HttpHandlerService {
  currentTenant = new Tenant();
  BASE_URL = "";
  constructor(private http: HttpClient) {
    this.BASE_URL = "https://smart-roads.tilab.com";
  }
  fetchTenants() {
    return this.http.get<{ tenants: Tenant[] }>(
      "./assets/settings.json?t=" + new Date().getTime()
    );
  }
  fetchMqttOptions() {
    return this.http.get<MqttSettings>(
      "./assets/mqtt-settings.json?t=" + new Date().getTime()
    );
  }
  httpLogin(username: string, password: string) {
    return this.http.post<AuthResponse>(
      this.BASE_URL + "/its/api/admin/authenticate",
      {
        username: username,
        password: password,
      }
    );
  }
  fetchLabels() {
    return this.http.get<{ tenants: Tenant[] }>(
      "./assets/settings.json?t=" + new Date().getTime()
    );
  }
}
