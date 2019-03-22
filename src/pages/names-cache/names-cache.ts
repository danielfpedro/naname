import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';

/**
 * Generated class for the NamesCachePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-names-cache',
  templateUrl: 'names-cache.html',
})
export class NamesCachePage {

  failed = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public authProvider: AuthProvider, private viewController: ViewController) {
  }

  ionViewDidLoad() {
    this.do()
  }

  async do() {
    const allNames = await this.authProvider.allNames();
    this.authProvider.cacheNamesListen.subscribe(
      success => {
      },
      error => {
        
      },
      () => {
        this.viewController.dismiss();
      });
    this.authProvider.tey(allNames);
  }

}
