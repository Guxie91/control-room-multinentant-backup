import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ControlRoomComponent } from "./control-room/control-room.component";
import { LoginComponent } from "./login/login.component";
import { LogoutComponent } from "./logout/logout.component";
import { RedirectComponent } from "./redirect/redirect.component";
import { AuthGuardService } from "./services/auth-guard.service";

const routes: Routes = [
  { path: "", pathMatch: "full", component: RedirectComponent },
  { path: ":tenant/login", component: LoginComponent },
  {
    path: ":tenant/control-room",
    component: ControlRoomComponent,
    canActivate: [AuthGuardService],
  },
  { path: "logout", component: LogoutComponent },
  { path: "**", redirectTo: "" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
