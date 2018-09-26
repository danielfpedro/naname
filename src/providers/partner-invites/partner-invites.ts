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

  	console.log('Constructor do Invites');

    this.requestsCollection = this.afs.collection('partnershipRequests', ref => ref.where('to', '==', this.authProvider.userUid));
    this.requestsCollection.valueChanges()
    	.subscribe(values => {
    		console.log('Dentro do subscribe requests!', values);
				console.log('Resquests fom to', this.authProvider.userUid);
    		this.requests = [];
    		values.forEach(value => {
    			firebase.firestore().doc('users/' + value.from).get()
    				.then(user => {
    					let userWithUid = user.data();
    					userWithUid.id = user.id;

    					this.requests.push(userWithUid);
    				});
    		});
    	});


    this.requestsSentCollection = this.afs.collection('partnershipRequests', ref => ref.where('from', '==', this.authProvider.userUid));
    this.requestsSentCollection.valueChanges()
    	.subscribe(values => {
    		console.log('Dentro do subscribe requests sent!', values);
    		this.requestsSent = [];
    		values.forEach(value => {
    			firebase.firestore().doc('users/' + value.to).get()
    				.then(user => {
    					let userWithUid = user.data();
    					userWithUid.id = user.id;
    					this.requestsSent.push(userWithUid);
    				});
    		});
    	});

    this.usersBlockedCollection = this.afs.collection('usersBlocked', ref => ref.where('user_id', '==', this.authProvider.userUid));
    this.usersBlockedCollection.valueChanges()
    	.subscribe(values => {
    		console.log('Blocked users', values);
    		this.usersBlocked = [];
    		values.forEach(value => {
    			console.log('VALUE', value);
    			firebase.firestore().doc('users/' + value.blocked_user_id).get()
    				.then(user => {
    					console.log('USER', user.data());
    					console.log('USER ID', user.id);
    					let userWithUid = user.data();
    					userWithUid.id = user.id;
    					this.usersBlocked.push(userWithUid);
    				});
    		});
    	});

  	this.partnerCollection = this.afs.doc('users/' + this.authProvider.userUid);
    this.partnerCollection.valueChanges()
    	.subscribe(value => {
				console.log('The user', value);
    		if (typeof value == 'undefined' || typeof value.partner == 'undefined') {
    			this.partner = null;
    		} else {
    			firebase.firestore().doc('users/' + value.partner).get()
    				.then(user => {
    					if (user.data()) {
	    					let userWithUid = user.data();
	    					userWithUid.id = user.id;
	    					this.partner = userWithUid;
    					} else {
    						this.partner = null;
    					}
    				});
    		}
    	});

  }

  removePartner() {
  	console.log('Partner', this.partner);
  	firebase.firestore().doc('users/' + this.partner.id).update({
  		partner: null
  	}).then(() => {
	  	firebase.firestore().doc('users/' + this.authProvider.userUid).update({
	  		partner: null
	  	});
  	});
  }
}
