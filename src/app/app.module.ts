import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { LoginComponent } from "./login/login.component";
import { RedirectComponent } from "./redirect/redirect.component";
import { LogoutComponent } from "./logout/logout.component";
import { ControlRoomComponent } from "./control-room/control-room.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { TableFilterPipe } from "./pipes/table-filter.pipe";
import { MqttModule } from "ngx-mqtt";
import { MQTT_SERVICE_OPTIONS } from "./utilities/mqtt-service-options";
import { EventIconComponent } from './control-room/event-icon/event-icon.component';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { SettingsMenuComponent } from './settings-menu/settings-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    RedirectComponent,
    LogoutComponent,
    ControlRoomComponent,
    TableFilterPipe,
    EventIconComponent,
    LoadingSpinnerComponent,
    SettingsMenuComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
