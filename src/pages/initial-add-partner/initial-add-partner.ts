import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-initial-add-partner',
  templateUrl: 'initial-add-partner.html',
})
export class InitialAddPartnerPage {

  constructor(public navController: NavController) {
  }

  ionViewDidLoad() {

  }

  skip() {
    this.navController.setRoot('TabsPage');
  }

}
