import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';

@IonicPage()
@Component({
  selector: 'page-user-settings',
  templateUrl: 'user-settings.html',
})
export class UserSettingsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public authProvider: AuthProvider, private popoverController: PopoverController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UserSettingsPage');
  }

  presentPopover(event) {
    let items = [{ index: 0, label: 'Sair' }];

    const popover = this.popoverController.create('PopoverListPage', { items });
    popover.onDidDismiss(data => {
      if (data !== null) {
        switch (data) {
          case 0:
            this.authProvider.logout();
            break;
        }
      }
    });
    popover.present({ ev: event });
  }

}
