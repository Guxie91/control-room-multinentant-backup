import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { take } from "rxjs/operators";
import { Tenant } from "../models/tenant.model";
import { HttpHandlerService } from "./http-handler.service";

@Injectable({
  providedIn: "root",
})
export class TenantHandlerService {
  private tenants: Tenant[] = [];
  tenant = new BehaviorSubject<Tenant>(new Tenant());
  currentTenant: Tenant = new Tenant();

  constructor(
    private http: HttpHandlerService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  handleTenant(tenant: string) {
    if (!tenant || tenant == "" || tenant.length == 0) {
      return;
    }
    this.http
      .fetchTenants()
      .pipe(take(1)) //take global settings only once
      .subscribe((result) => {
        this.tenants = result.tenants;
        for (let option of this.tenants) {
          if (option.name == tenant) {
            if (this.currentTenant.name != "") {
              localStorage.removeItem("tenant");
            }
            this.currentTenant = option;
            this.http.currentTenant = option;
            break;
          }
        }
        this.tenant.next(this.currentTenant);
        localStorage.setItem("tenant", tenant);
        localStorage.setItem("lat", this.currentTenant.coordinates[0].toString());
        localStorage.setItem("lng", this.currentTenant.coordinates[1].toString())
        this.loadIcon();
        this.loadStyle();
      });
  }
  getTenantId() {
    return this.currentTenant.id;
  }
  getCurrentTenant() {
    return this.currentTenant;
  }
  getTenants() {
    return this.tenants.slice();
  }
  setTenants(newTenants: Tenant[]) {
    this.tenants = newTenants;
  }
  loadIcon() {
    if (this.currentTenant.name == "") {
      return;
    }
    const head = this.document.getElementsByTagName("head")[0];
    const iconUrl = "./assets/" + this.currentTenant.name + "/favicon.ico";
    let favIcon = this.document.getElementById("favicon") as HTMLLinkElement;
    if (favIcon) {
      favIcon.href = iconUrl;
    } else {
      const favIconTag = this.document.createElement("link");
      favIconTag.id = "favicon";
      favIconTag.rel = "icon";
      favIconTag.href = iconUrl;
      head.appendChild(favIconTag);
    }
  }
  loadStyle() {
    if (this.currentTenant.name == "") {
      return;
    }
    const head = this.document.getElementsByTagName("head")[0];
    const styleUrl = "./assets/" + this.currentTenant.name + "/style.css";
    let style = this.document.getElementById("tenantStyle") as HTMLLinkElement;
    if (style) {
      style.href = styleUrl;
    } else {
      const styleTag = this.document.createElement("link");
      styleTag.id = "tenantStyle";
      styleTag.rel = "stylesheet";
      styleTag.href = `${styleUrl}`;
      head.appendChild(styleTag);
    }
  }
}
