import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, ModalController, AlertOptions, AlertController } from 'ionic-angular';

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
    private popoverController: PopoverController,
    public modalController: ModalController,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {

  }

  presentPopover(event) {
    let items = [{ index: 0, label: 'Usuários bloqueados' }];

    if (this.authProvider.user.partner_id) {
      items.push({ index: 1, label: 'Remover parceiro' });
      items.push({ index: 2, label: 'Remover e bloquear parceiro' });
    }

    items.push({ index: 3, label: 'Sair' });

    const popover = this.popoverController.create('PopoverListPage', { items });
    popover.onDidDismiss(data => {
      console.log('Popover was dismissed', data);
      console.log('IS !== NULL', data !== null);
      if (data !== null) {
        switch (data) {
          case 0:
            const modal = this.modalController.create('BlockedUsersPage');
            console.log('Presenting modal');
            modal.present();
            break;
          case 1:
            this.presentRemovePartnerAlert();
            break;
          case 2:
            this.presentRemovePartnerAlert(true);
            break;
          case 3:
            this.authProvider.logout();
            break;
        }
      }
    });
    popover.present({ ev: event });
  }

  presentRemovePartnerAlert(block: boolean = false) {
    const title = `<strong>Remover</strong> o seu parceiro ${
      this.authProvider.user.partner.name
      }?`;
    const message =
      "Ao remover, a lista de nomes escolhidos irá exibir apenas os nomes que você escolheu.";

    const partnerToBeRemoved = this.authProvider.user.partner;

    const alertOptions: AlertOptions = {
      title,
      message,
      buttons: [
        {
          text: "Ok, quero remover",
          handler: () => {
            this.removePartner(partnerToBeRemoved).then(() => {
              if (block) {
                this.presentBlockUserAlert(partnerToBeRemoved);
              }
            });
          }
        },
        "Cancelar"
      ]
    };
    const alert = this.alertCtrl.create(alertOptions);
    alert.present();
  }
  presentBlockUserAlert(partnerToBeBlocked): void {
    console.log("PARTNER TO BE BLOQUED", partnerToBeBlocked);
    const title = `<strong>Bloquear</strong> ${partnerToBeBlocked.name}?`;
    const message = `Ao bloquear, o usuário ficará impedido de te adicionar como parceiro novamente. Se bater o arrependimento você opderá desbloquear depois =D`;

    const alertOptions: AlertOptions = {
      title,
      message,
      buttons: [
        {
          text: "Ok, quero bloquear também",
          handler: () => {
            this.blockPartner(partnerToBeBlocked);
          }
        },
        "Cancelar"
      ]
    };
    const alert = this.alertCtrl.create(alertOptions);
    alert.present();
  }

  async blockPartner(partnerToBeBlocked) {
    const loader = this.authProvider.customLoading(`Bloqueando ${partnerToBeBlocked.name} (${
      partnerToBeBlocked.email
      })`);
    loader.present();
    await this.authProvider.blockUser(partnerToBeBlocked);
    loader.dismiss();
  }

  async removePartner(partner) {
    const loader = this.authProvider.customLoading(`Removendo ${this.authProvider.user.partner.name} (${
      this.authProvider.user.partner.email
      })`);
    loader.present();
    await this.authProvider.removePartner(partner);
    loader.dismiss();
  }

  goToPartnerList() {
    this.navController.push('PartnerListPage');
  }

}
