import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/app';

import { AuthProvider } from '../../providers/auth/auth';
import { PartnerInvitesProvider } from '../../providers/partner-invites/partner-invites';

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


	usersBlocked = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
  	private afs: AngularFirestore,
  	public authProvider: AuthProvider,
  	public alertController: AlertController,
  	public partnerInvitesProviders: PartnerInvitesProvider
  	) {

  }

  ionViewDidLoad() {





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
