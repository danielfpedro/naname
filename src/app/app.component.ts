import { Component, ViewChild } from "@angular/core";
import { Platform, LoadingController, NavController, Nav } from "ionic-angular";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { AuthProvider } from "../providers/auth/auth";
import { Storage } from "@ionic/storage";
// import { AuthProvider } from "../providers/auth/auth";

@Component({
  templateUrl: "app.html"
})
export class MyApp {

  @ViewChild(Nav) nav: Nav;

  rootPage: any = null;

  loginPage = 'LoginPage';
  tabsPage = 'TabsPage';
  initialSettingsPage = 'AskAboutPartnershipPage';

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public loadingController: LoadingController,
    public authProvider: AuthProvider,
    private storage: Storage

  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      statusBar.backgroundColorByHexString('#ffffff');
      statusBar.styleDefault();
      splashScreen.hide();
    });


    const loader = this.loadingController.create({
      content: "Entrando, aguarde..."
    });
    loader.present();

    this.authProvider.watchFirebaseAuthState.subscribe(isLogedIn => {
      console.log('Dentro do next do watch login state');
      loader.dismiss()
      console.log('is loggedIn?', isLogedIn);
      if (isLogedIn) {
        console.log('Set TabsPage root if needed');
        console.log('Se tem partner manda pro tabs', this.authProvider.user);
        if (typeof this.nav.getActive() != 'undefined' && this.nav.getActive().id == this.loginPage && !this.authProvider.partner) {
          console.log('Has not partner');
          this.setRootIfNeeded(this.initialSettingsPage);
        } else {
          this.setRootIfNeeded(this.tabsPage);
        }
      } else {
        console.log('Set LoginPage root if needed');
        this.setRootIfNeeded(this.loginPage);
      }
    });
  }

  async setRootIfNeeded(ref: string) {
    const activeView = (typeof this.nav.getActive() != 'undefined') ? this.nav.getActive().id : null;
    console.log('Current root', activeView);
    console.log('Root asked', ref);
    if (activeView === this.initialSettingsPage) {
      return;
    }

    let desiredRef = ref;

    let visitedFirstSettingsResponse = null;
    if (this.authProvider.user) {
      visitedFirstSettingsResponse = await this.storage.get(`visited_first_settings.${this.authProvider.user.id}`)
    }
    console.log('Visited first settings response', visitedFirstSettingsResponse);
    if (visitedFirstSettingsResponse && ref == this.initialSettingsPage) {
      desiredRef = this.tabsPage;
    }

    if (activeView != desiredRef) {
      console.log('Set root is needed, setting...');
      this.nav.setRoot(desiredRef);
    } else {
      console.log('Set root was not necessary');
    }
  }
}