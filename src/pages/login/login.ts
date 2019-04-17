import { Component } from "@angular/core";
import { IonicPage, LoadingController, Platform } from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";
import { StatusBar } from "@ionic-native/status-bar";

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
  ) {
    platform.ready().then(() => {
      statusBar.styleLightContent();
      statusBar.backgroundColorByHexString('#B2ECF7');
    });
  }

  ionViewDidLoad() {
  }

  async signIn(provider: string) {
    const loading = this.authProvider.customLoading('Entrando, aguarde...');
    loading.present();
    try {
      await this.authProvider.signIn(provider);
    } finally {
      loading.dismiss();
    }
  }
}
