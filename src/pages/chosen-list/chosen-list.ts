import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { NamesProvider } from '../../providers/names/names';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthProvider } from '../../providers/auth/auth';

/**
 * Generated class for the ChosenListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chosen-list',
  templateUrl: 'chosen-list.html',
})
export class ChosenListPage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public namesProvider: NamesProvider,
    public authProvider: AuthProvider
  ) {
  }

  ionViewDidLoad() {

  }

}
