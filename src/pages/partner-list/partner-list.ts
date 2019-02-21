import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController, AlertOptions } from 'ionic-angular';

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

  blockedUsers = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afs: AngularFirestore,
    public authProvider: AuthProvider,
    public partnerInvitesProviders: PartnerInvitesProvider,
    // Ionic components
    public alertCtrl: AlertController,
    public loaderCtrl: LoadingController
  ) {

  }

  showPrompt() {
    const prompt = this.alertCtrl.create({
      title: 'Adicionar Parceiro',
      message: "Entre com o email do parceiro",
      inputs: [{ name: 'email', placeholder: 'Email' }],
      buttons: [
        {
          text: 'Cancelar',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Adicionar Parceiro',
          handler: data => {

            if (data.email == this.authProvider.user.email) {
              const alert = this.alertCtrl.create({
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
                tey.collection('users').doc(userTarget.id).collection('usersBlocked').doc(userTarget.id + '_' + this.authProvider.userUid)
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
                      const alert = this.alertCtrl.create({ title: 'Bloqueado', message: 'Você está bloqueado.', buttons: ['ok'] });
                      alert.present();
                    }
                  });

              } else {
                const alert = this.alertCtrl.create({
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

  presentRemovePartnerAlert(block: boolean = false) {
    const title = `<strong>Remover</strong> o seu parceiro ${this.authProvider.partner.name}?`;
    const message = 'Ao remover, a lista de nomes escolhidos irá exibir apenas os nomes que você escolheu.';

    const partnerToBeRemoved = this.authProvider.partner;

    const alertOptions: AlertOptions = {
      title,
      message,
      buttons: [
        {
          text: 'Ok, quero remover',
          handler: () => {
            this.removePartner().then(() => {
              if (block) {
                this.presentBlockUserAlert(partnerToBeRemoved);
              }
            });
          }
        },
        'Cancelar'
      ]
    };
    const alert = this.alertCtrl.create(alertOptions);
    alert.present();
  }
  presentBlockUserAlert(partnerToBeBlocked): void {
    console.log('PARTNER TO BE BLOQUED', partnerToBeBlocked);
    const title = `<strong>Bloquear</strong> ${partnerToBeBlocked.name}?`;
    const message = `Ao bloquear, o usuário ficará impedido de te adicionar como parceiro novamente. Se bater o arrependimento você opderá desbloquear depois =D`;

    const alertOptions: AlertOptions = {
      title,
      message,
      buttons: [
        {
          text: 'Ok, quero bloquear também',
          handler: () => {
            this.blockPartner(partnerToBeBlocked);
          }
        },
        'Cancelar'
      ]
    };
    const alert = this.alertCtrl.create(alertOptions);
    alert.present();
  }
  async removePartner() {
    const loader = this.loaderCtrl.create({ content: `Removendo ${this.authProvider.partner.name} (${this.authProvider.partner.email})` });
    loader.present();
    await this.authProvider.removePartner();
    loader.dismiss();
  }
  async blockPartner(partnerToBeBlocked) {
    console.log('BLOCK PARTNER TO BE BLOQKEC', partnerToBeBlocked);
    const loader = this.loaderCtrl.create({ content: `Bloqueando ${partnerToBeBlocked.name} (${partnerToBeBlocked.email})` });
    loader.present();
    await this.authProvider.blockUser(partnerToBeBlocked.uid);
    loader.dismiss();
  }
  async unblockUser(userToBeUnblocked) {
    const loader = this.loaderCtrl.create({ content: `Desbloqueando ${userToBeUnblocked.name} (${userToBeUnblocked.email})` });
    loader.present();
    await this.authProvider.unblockUser(userToBeUnblocked.uid);
    loader.dismiss();
  }
}
