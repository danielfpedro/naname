import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';

import { AuthProvider } from '../../providers/auth/auth';
import { PartnerInvitesProvider } from '../../providers/partner-invites/partner-invites';

import firebase from 'firebase/app';
import firestore from 'firebase/firestore';
import database from 'firebase/database';

/**
 * Generated class for the UserTabPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-user-tab',
  templateUrl: 'user-tab.html',
})
export class UserTabPage {

  user: {};

  constructor(
    public partnerInvitesProvider: PartnerInvitesProvider,
    public navController: NavController,
    public navParams: NavParams,
    public authProvider: AuthProvider,
    private afs: AngularFirestore) {
  }

  ionViewDidEnter() {

  }

  goToUserSettings() {
    this.navController.push('UserSettingsPage');
  }

}
