import { Component, ViewChild } from "@angular/core";
import { Platform, LoadingController, NavController, Nav } from "ionic-angular";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { AuthProvider } from "../providers/auth/auth";
// import { AuthProvider } from "../providers/auth/auth";

@Component({
  templateUrl: "app.html"
})
export class MyApp {

  @ViewChild(Nav) nav: Nav;

  rootPage: any = 'LoginPage';

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public loadingController: LoadingController,
    public authProvider: AuthProvider,

  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });


    const loader = this.loadingController.create({
      content: "Entrando, aguarde..."
    });
    loader.present();

    this.authProvider.watchFirebaseAuthState.subscribe(isLogedIn => {
      loader.dismiss()
      console.log('is loggedIn?', isLogedIn);
      if (isLogedIn) {
        this.nav.setRoot('TabsPage');
      } else {
        this.nav.setRoot('LoginPage');
      }
    });

  }
}
