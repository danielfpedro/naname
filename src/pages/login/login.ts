import { Component } from '@angular/core';
import {  IonicPage, NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
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
    
    const loading = this.loadingController.create({content: 'Carregando, aguarde...'});
    loading.present();

    const toast = this.toastController.create({message: 'Ocorreu um erro ao tentar recuperar o seu login'});

    this.authProvider.init().then(() => {
      loading.dismiss();
      if (this.authProvider.userUid) {
        this.navCtrl.setRoot('TabsPage')  
      } else {
        this.loadingAuthState = false;
      }
    })
    .catch(() => {
      toast.present();
      loading.dismiss();
      this.loadingAuthState = false;
    });

  }

  signIn(provider) {
    
    let loading = this.loadingController.create({content: 'Entrando, aguarde...'});
    loading.present();

    this.authProvider.signIn(provider)
      .then(success => {
        loading.dismiss();
        this.navCtrl.setRoot('TabsPage');
      })
      .catch(error => {
        loading.dismiss();
        const toast = this.toastController.create({
          message: 'Ocorreu um erro ao tentar entrar',
          duration: 3000
        });
        toast.present()
      })

  }
}
