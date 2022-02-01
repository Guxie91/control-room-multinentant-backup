import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { Observable, Subscription } from "rxjs";
import { Tenant } from "../models/tenant.model";
import { User } from "../models/user.model";
import { AuthService } from "./auth.service";
import { TenantHandlerService } from "./tenant-handler.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuardService implements CanActivate {
  currentUser: User = new User("");
  currentTenant: Tenant = new Tenant();
  subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private tenantService: TenantHandlerService,
    private router: Router
  ) {
    let sub = this.authService.newUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.subs.push(sub);
    sub = this.tenantService.tenant.subscribe((tenant) => {
      this.currentTenant = tenant;
    });
    this.subs.push(sub);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    const tenant = localStorage.getItem("tenant");
    this.authService.autoLogIn();
    if (this.authService.isLoggedIn()) {
      if (tenant) {
        this.tenantService.handleTenant(tenant);
        return true;
      } else {
        return false;
      }
    } else {
      if (tenant) {
        this.router.navigate(["/", tenant, "login"]);
      } else {
        this.router.navigate(["/", "error"]);
        console.log("auth-guard error, no tenant found");
      }
      return false;
    }
  }
}
