import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AuthResponse } from "../models/auth-response.model";
import { User } from "../models/user.model";
import { tap } from "rxjs/operators";
import { HttpHandlerService } from "./http-handler.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  BASE_URL = "";
  private currentUser!: User;
  private loggedIn = false;
  newUser = new BehaviorSubject<User>(new User(""));

  constructor(private http: HttpHandlerService) {}

  login(username: string, password: string) {
    return this.http.httpLogin(username, password).pipe(
      tap(
        (response: AuthResponse) => {
          if (response.success) {
            if (response.id_org != this.http.currentTenant.id) {
              this.logout();
              return;
            }
            const newUser = new User(
              username,
              response.expiresIn,
              response.expiresAt,
              response.token,
              response.org,
              response.id_org,
              response.profile
            );
            this.currentUser = newUser;
            localStorage.setItem("userData", JSON.stringify(newUser));
            this.loggedIn = true;
            this.newUser.next(newUser);
          } else {
            this.loggedIn = false;
          }
        },
        () => {
          this.loggedIn = false;
        }
      )
    );
  }

  autoLogIn() {
    const data = localStorage.getItem("userData");
    if (!data) {
      return;
    }
    const parsedUser: {
      username: string;
      expiresIn: string;
      expiresAt: string;
      token: string;
      org: string;
      id_org: string;
      profile: string;
    } = JSON.parse(data);
    const tokenExpiration = new Date(parsedUser.expiresAt).getTime();
    const today = new Date().getTime();
    if (today > tokenExpiration) {
      this.logout();
      return;
    }
    const loadedUser = new User(
      parsedUser.username,
      parsedUser.expiresIn,
      parsedUser.expiresAt,
      parsedUser.token,
      parsedUser.org,
      parsedUser.id_org,
      parsedUser.profile
    );
    this.currentUser = loadedUser;
    this.loggedIn = true;
    this.newUser.next(this.currentUser);
  }

  logout() {
    this.loggedIn = false;
    this.currentUser = new User("");
    this.newUser.next(new User(""));
  }

  isLoggedIn() {
    const userData = localStorage.getItem("userData");
    if (userData) {
      return this.loggedIn;
    } else {
      return this.loggedIn;
    }
  }

  getToken() {
    if (this.currentUser) {
      return this.currentUser.token;
    } else {
      return "";
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }
}
