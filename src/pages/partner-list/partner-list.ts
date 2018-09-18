import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/app';

import { AuthProvider } from '../../providers/auth/auth';

/**
 * Generated class for the PartnerListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-partner-list',
  templateUrl: 'partner-list.html',
})
export class PartnerListPage {

	usersBlockedCollection: any;
	requestsSentCollection: any;
	partnerCollection: any;
	requestsCollection: any;
	requests = [];
	requestsSent = [];

	partner = null;

	usersBlocked = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
  	private afs: AngularFirestore,
  	public authProvider: AuthProvider,
  	public alertController: AlertController
  	) {

  }

  ionViewDidLoad() {

  	this.partnerCollection = this.afs.doc('users/' + this.authProvider.userUid);
    this.partnerCollection.valueChanges()
    	.subscribe(value => {
    		if (typeof value.partner == 'undefined') {
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

    this.requestsCollection = this.afs.collection('partnershipRequests', ref => ref.where('to', '==', this.authProvider.userUid));
    this.requestsCollection.valueChanges()
    	.subscribe(values => {
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

  acceptRequest(user) {
  	console.log('USER ACEITAR', user);
  	firebase.firestore().doc('partnershipRequests/' + user.id + '_' + this.authProvider.userUid).delete();
  	firebase.firestore().doc('partnershipRequests/' + this.authProvider.userUid + '_' + user.id).delete();
  	firebase.firestore().doc('users/' + this.authProvider.userUid).update({
  		partner: user.id
  	});
  	firebase.firestore().doc('users/' + user.id).update({
  		partner: this.authProvider.userUid
  	});
  }
  denyRequest(user) {
  	firebase.firestore().doc('partnershipRequests/' + user.id + '_' + this.authProvider.userUid).delete();
  }

  blockRequest(user) {
  	firebase.firestore().doc('usersBlocked/' + this.authProvider.userUid + '_' + user.id).set({
  		user_id: this.authProvider.userUid,
  		blocked_user_id: user.id
  	});
  	firebase.firestore().doc('partnershipRequests/' + user.id + '_' + this.authProvider.userUid).delete();
  }

  unblockRequest(user) {
  	firebase.firestore().doc('usersBlocked/' + this.authProvider.userUid + '_' + user.id).delete();
 	}

  cancelRequest(user) {
  	firebase.firestore().doc('partnershipRequests/' + this.authProvider.userUid + '_' + user.id).delete();
  }
  showPrompt() {
    const prompt = this.alertController.create({
      title: 'Adicionar Parceiro',
      message: "Entre com o email do parceiro",
      inputs: [
        {
          name: 'email',
          placeholder: 'Email'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Enviar convite',
          handler: data => {

						if (data.email == this.authProvider.user.email) {
			  			const alert = this.alertController.create({
			  				title: 'Email não encontrado',
			  				message: 'Você informou o seu próprio email',
			  				buttons: ['Ok']
			  			});
			  			alert.present();
			  			return;
						}

          	const myUserId = this.authProvider.userUid;

				  	firebase.firestore().collection('users').where('email', '==', data.email).get().then(querySnapshot => {
				  		console.log('QuerySnapshot', querySnapshot.empty);
				  		if (!querySnapshot.empty) {
								querySnapshot.forEach(function(doc) {
									console.log('DOC', doc.id);
							  	firebase.firestore().doc('partnershipRequests/' + myUserId + '_' + doc.id).set({
							  		from: myUserId,
							  		to: doc.id,
							  	});
								});
				  		} else {
				  			const alert = this.alertController.create({
				  				title: 'Email não encontrado',
				  				message: 'Email informado não está usando o App',
				  				buttons: ['Ok']
				  			});

				  			alert.present();
				  		}
				  	})
          }
        }
      ]
    });
    prompt.present();
  }

}
