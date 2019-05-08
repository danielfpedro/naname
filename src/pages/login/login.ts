import { Component } from "@angular/core";
import { IonicPage, LoadingController, Platform, Nav, NavController } from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";
import { StatusBar } from "@ionic-native/status-bar";
import { AngularFireAuth } from "@angular/fire/auth";
import { take } from "rxjs/operators";
import { Storage } from "@ionic/storage";

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
    private afAuth: AngularFireAuth,
    public storage: Storage
  ) {
  }

  ionViewDidLoad() {

  }

  async signIn(provider: string) {
    const loader = this.authProvider.customLoading('Entrando, aguarde...');
    loader.present();

    try {
      const firstTime = await this.storage.get('first_time');
      await this.authProvider.signIn(provider);

      this.afAuth.authState.pipe(take(1)).subscribe(result => {
        if (result) {
          this.authProvider.userId = result.uid;
          this.authProvider.watchUser();
          this.authProvider.readyToRock.pipe(take(1)).subscribe(() => {
            loader.dismiss();
            if (firstTime) {
              this.navController.setRoot('TabsPage');
            } else {
              if (this.authProvider.user.partner_id) {
                this.navController.setRoot('TabsPage');
              } else {
                this.navController.setRoot('AskAboutPartnershipPage');
              }
            }
          });
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      loader.dismiss();
    }
  }
}
