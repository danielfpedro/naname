import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ViewController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';

/**
 * Generated class for the GenderSelectionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-gender-selection',
  templateUrl: 'gender-selection.html',
})
export class GenderSelectionPage {
  constructor(public navCtrl: NavController, public navParams: NavParams, public authService: AuthProvider,
    public loadingCtrl: LoadingController, public viewCtrl: ViewController) {
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad GenderSelectionPage');
  }
  async selectGender(gender: string) {
    const loader = this.authService.customLoading('Alterando gênero, por favor aguarde...');
    loader.present();
    await this.authService.setGender(gender);
    loader.dismiss();
    this.viewCtrl.dismiss();
  }
}
