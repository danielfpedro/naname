import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

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
  showPrompt() {
    const prompt = this.alertController.create({
      title: 'Adicionar Parceiro',
      message: "Entre com o email do parceiro",
      inputs: [{name: 'email', placeholder: 'Email'}],
      buttons: [
        {
          text: 'Cancelar',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Enviar convite',
          handler: data => {

						if (data.email == this.authProvider.user.email) {
			  			const alert = this.alertController.create({
			  				title: 'Email inválido',
			  				message: 'Você informou o seu próprio email',
			  				buttons: ['Ok']
			  			});
			  			alert.present();
			  			return;
						}
            const tey = this.afs;

				  	this.afs.collection('users').ref.where('email', '==', data.email).get().then(querySnapshot => {
				  		if (!querySnapshot.empty) {
                const userTarget = querySnapshot.docs[0];
                // Vejo se eu estou bloqueado pelo usuario que eu estou adicionando
                tey.collection('users').doc(userTarget.id).collection('usersBlocked').doc(userTarget.id +'_'+ this.authProvider.userUid)
                  .ref
                  .get()
                  .then(imBlockedByTarget => {
                    if (!imBlockedByTarget.exists) {
                      // Me salvo como target
                      tey.collection('users').doc(userTarget.id).update({
                        partner_uid: this.authProvider.userUid
                      });
                      tey.collection('users').doc(this.authProvider.userUid).update({
                        partner_uid: userTarget.id
                      });
                    } else {
                      const alert = this.alertController.create({title: 'Bloqueado', message: 'Você está bloqueado.', buttons: ['ok']});
                      alert.present();
                    }
                  });

				  		} else {
				  			const alert = this.alertController.create({
				  				title: 'Email não encontrado',
				  				message: 'Email informado não está usando o App',
				  				buttons: ['Ok']
				  			});
				  			alert.present();
				  		}
				  	});

          }
        }
      ]
    });
    prompt.present();
  }
}
