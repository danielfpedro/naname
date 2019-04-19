import { Component } from "@angular/core";
import { IonicPage, LoadingController, Platform, Nav, NavController } from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";
import { StatusBar } from "@ionic-native/status-bar";
import { AngularFireAuth } from "@angular/fire/auth";
import { take } from "rxjs/operators";

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html"
})
export class LoginPage {

  constructor(
    public authProvider: AuthProvider,
    public loadingController: LoadingController,
    private platform: Platform,
    private statusBar: StatusBar,
    private navController: NavController,
    private afAuth: AngularFireAuth
  ) {
    platform.ready().then(() => {
      statusBar.styleLightContent();
      statusBar.backgroundColorByHexString('#B2ECF7');
    });
  }

  ionViewDidLoad() {
  }

  async signIn(provider: string) {
    const loader = this.authProvider.customLoading('Entrando, aguarde...');
    loader.present();

    try {
      await this.authProvider.signIn(provider);

      this.afAuth.authState.pipe(take(1)).subscribe(result => {
        if (result) {
          this.authProvider.userId = result.uid;
          this.authProvider.watchUser();
          this.authProvider.readyToRock.subscribe(() => {
            loader.dismiss();
            this.navController.setRoot('TabsPage');
          });
        }
      });
    } catch (error) {
      loader.dismiss();
      console.error(error);
    }
  }
}
