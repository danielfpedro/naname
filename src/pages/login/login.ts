import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { AngularFireAuth } from '@angular/fire/auth';


@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  public loadingAuthState: boolean = true;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public authProvider: AuthProvider,
    public loadingController: LoadingController,
    public afAuth: AngularFireAuth,
    public toastController: ToastController
  ) {
  }

  ionViewDidLoad() {
  }

  async signIn(provider: string) {
    const loading = this.loadingController.create({ content: 'Carregando, aguarde...' });
    loading.present();
    try {
      await this.authProvider.signIn(provider)
      loading.dismiss();
      // this.navCtrl.setRoot('TabsPage');
    } catch (error) {
      loading.dismiss();
    }
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
