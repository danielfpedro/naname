import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

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
    this.loadingAuthState = false;
    this.checkAuthState();
  }

  async checkAuthState() {
    const loading = this.loadingController.create({ content: 'Carregando, aguarde...' });
    loading.present();
    await this.authProvider.init();
    console.log('USER UID NO LOGIN', this.authProvider.userUid);
    loading.dismiss();
    if (this.authProvider.userUid) {
      this.navCtrl.setRoot('TabsPage');
    }
  }

  async signIn(provider: string) {
    const loading = this.loadingController.create({ content: 'Carregando, aguarde...' });
    loading.present();
    try {
      await this.authProvider.signIn(provider)
      loading.dismiss();
      this.navCtrl.setRoot('TabsPage');
    } catch (error) {
      loading.dismiss();
    }
  }
}
