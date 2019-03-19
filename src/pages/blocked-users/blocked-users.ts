import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { Observable } from 'rxjs';

/**
 * Generated class for the BlockedUsersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-blocked-users',
  templateUrl: 'blocked-users.html',
})
export class BlockedUsersPage {

  blockedUsers = [];
  loading: boolean = true;

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewController: ViewController, private authProvider: AuthProvider) {

  }
  ionViewDidEnter() {
    this.init();
  }

  async init() {
    this.loading = true;
    try {
      const blockedUsers = await this.authProvider.blockedUsersLimited()
      this.blockedUsers = blockedUsers.docs.map(blockedUser => {
        console.log('Blocked user', blockedUser.data());
        return blockedUser.data();
      }); 
    } catch (error) {
      
    } finally {
      this.loading = false;
    }
  }

  close() {
    this.viewController.dismiss();
  }

}
