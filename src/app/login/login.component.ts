import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { AuthResponse } from "../models/auth-response.model";
import { Tenant } from "../models/tenant.model";
import { AuthService } from "../services/auth.service";
import { HttpHandlerService } from "../services/http-handler.service";
import { TenantHandlerService } from "../services/tenant-handler.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit, OnDestroy {
  error = false;
  subscriptions: Subscription[] = [];
  tenants: Tenant[] = [];
  currentTenant: Tenant = new Tenant();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private tenantService: TenantHandlerService,
    private http: HttpHandlerService,
    private auth: AuthService
  ) {}

  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.http
      .fetchTenants()
      .pipe(take(1))
      .subscribe((response) => {
        this.tenants = response.tenants;
        this.phase2();
      });
  }

  phase2() {
    let paramsSub = this.activatedRoute.params.subscribe((params) => {
      const tenantName = params["tenant"];
      if (!tenantName) {
        alert("You must specify a tenant!");
        this.router.navigate(["/", "redirect"]);
        return;
      }
      for (let org of this.tenants) {
        if (tenantName == org.name) {
          this.currentTenant = org;
          this.tenantService.handleTenant(tenantName);
          return;
        }
      }
      console.log("Tenant not found!");
      this.router.navigate(["/", "redirect"]);
    });
    this.subscriptions.push(paramsSub);
  }
  onSubmit(form: NgForm) {
    this.error = false;
    if (!form.valid) {
      this.error = true;
      return;
    }
    const username = form.value.username;
    const password = form.value.password;
    this.auth.login(username, password).subscribe(
      (response: AuthResponse) => {
        console.log(response);
        if (response.success) {
          if (response.id_org != this.tenantService.getTenantId()) {
            console.log("Organization id mismatch:");
            console.log("user org id: " + response.id_org);
            console.log("org id: " + this.tenantService.getTenantId());
            this.error = true;
            return;
          }
          this.router.navigate(["/", this.currentTenant.name, "control-room"]);
        } else {
          this.error = true;
        }
      },
      (error) => {
        this.error = true;
        console.log(error);
      }
    );
  }
}
