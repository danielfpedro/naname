import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the PopoverListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-popover-list',
  templateUrl: 'popover-list.html',
})
export class PopoverListPage {

  items: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewController: ViewController) {
  }

  ionViewDidEnter() {
    this.items = this.navParams.get('items');
  }

  close(index) {
    this.viewController.dismiss(index);
  }

}
