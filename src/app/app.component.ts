import { Component } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthProvider } from '../providers/auth/auth';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = null;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public loadingController: LoadingController,
    public authProvider: AuthProvider
  ) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });

    // this.authProvider.init();

    const loader = this.loadingController.create({ content: 'Aguarde...' });
    loader.present();

    this.authProvider.watchFirebaseAuthState.subscribe(isLogedIn => {
      loader.dismiss();
      if (isLogedIn) {
        this.rootPage = 'TabsPage';
      } else {
        this.rootPage = 'LoginPage';
      }
    });
  }

  // ngOnInit() {
  //   let loading = this.loadingController.create({content: 'Carregando, aguarde...'});
  //   loading.present();

  //   this.afAuth.authState.subscribe(user => {
  //     if (!user) {
  //       this.navCtrl.setRoot('LoginPage');
  //     } else {
  //       this.navCtrl.setRoot('TabUserPage');
  //     }
  //   });
  //  }

}
