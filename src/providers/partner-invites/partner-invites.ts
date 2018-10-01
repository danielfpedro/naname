import { Injectable, OnInit } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/app';

import { AuthProvider } from '../../providers/auth/auth';

/*
  Generated class for the PartnerInvitesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PartnerInvitesProvider {

	public requestsCollection;
	public requests = [];

	public requestsSentCollection;
	public requestsSent = [];

	public usersBlockedCollection;
	public usersBlocked = [];

	public partnerCollection: any;
	public partner = null;

  constructor(
  	private afs: AngularFirestore,
  	public authProvider: AuthProvider
  ) {
  }

  removePartner(block: boolean = false) {
		// faço o cache pq ele vai sumir quando fazer o update abaixo
		const partnerUid = this.authProvider.user.partner_uid;
  	this.afs.collection('users').doc(partnerUid).update({
  		partner_uid: null
  	}).then(() => {
	  	this.afs.collection('users').doc(this.authProvider.userUid).update({
	  		partner_uid: null
	  	}).then(() => {
				if (block) {
					this.afs.collection('users').doc(this.authProvider.userUid).collection('usersBlocked').doc(this.authProvider.userUid + '_' + partnerUid)
						.set({
							'blocked_user_uid': partnerUid
						});
				}
			});
  	});
  }

	unblockRequest(user) {
  	this.myUsersBlocked().doc(this.authProvider.userUid + '_' + user.id).delete();
 	}

	myUsersBlocked() {
		return this.afs.collection('users').doc(this.authProvider.userUid).collection('usersBlocked');
	}

}
