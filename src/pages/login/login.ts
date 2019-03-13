import { Component } from "@angular/core";
import { IonicPage, LoadingController } from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html"
})
export class LoginPage {

  // @ViewChild(Slides) slides: Slides;

  constructor(
    public authProvider: AuthProvider,
    public loadingController: LoadingController
  ) {
  }

  ionViewDidLoad() {
    
  }

  async signIn(provider: string) {
    const loading = this.loadingController.create({
      content: "Entrando, aguarde..."
    });
    loading.present();
    try {
      await this.authProvider.signIn(provider);
    } finally {
      loading.dismiss();
    }
  }
}
