import { Component } from "@angular/core";
import {
  IonicPage,
  AlertController,
  AlertOptions,
  Platform,
  ActionSheetController,
  PopoverController,
  ModalController,
  LoadingController
} from "ionic-angular";

import { AuthProvider } from "../../providers/auth/auth";
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Subscription } from "rxjs";

@IonicPage()
@Component({
  selector: "page-partner-list",
  templateUrl: "partner-list.html"
})
export class PartnerListPage {

  usersBlockedCollection: any;
  requestsSentCollection: any;

  user: any = null;
  userSubscription: Subscription;


  constructor(
    public platform: Platform,
    public authProvider: AuthProvider,
    // Ionic components
    public alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private popoverController: PopoverController,
    private modalController: ModalController,
  ) { }

  ionViewDidEnter() {
  }
  ionViewWillLeave() {
  }

  showPrompt() {
    const prompt = this.alertCtrl.create({
      title: "Adicionar Parceiro",
      message: "Entre com o email do parceiro",
      inputs: [{ name: "email", placeholder: "Email" }],
      buttons: [
        {
          text: "Cancelar"
        },
        {
          text: "Adicionar Parceiro",
          handler: data => {
            this.addPartner(data.email)
              .then(() => prompt.dismiss())
              .catch(() => null);
            return false;
          }
        }
      ]
    });
    prompt.present();
  }
  async addPartner(email: string) {
    const loader = this.authProvider.customLoading("Adicionando parceiro, aguarde...");
    loader.present();
    try {
      await this.authProvider.addPartner(email);
    } finally {
      loader.dismiss();
    }
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

  async removePartner(partner) {
    const loader = this.authProvider.customLoading(`Removendo ${this.authProvider.user.partner.name} (${
      this.authProvider.user.partner.email
      })`);
    loader.present();
    await this.authProvider.removePartner(partner);
    loader.dismiss();
  }
  async blockPartner(partnerToBeBlocked) {
    const loader = this.authProvider.customLoading(`Bloqueando ${partnerToBeBlocked.name} (${
      partnerToBeBlocked.email
      })`);
    loader.present();
    await this.authProvider.blockUser(partnerToBeBlocked);
    loader.dismiss();
  }
  async scanQrCode(): Promise<void> {
    const barcodeScanResult = await this.barcodeScanner
      .scan({
        resultDisplayDuration: 0,
        orientation: "portrait",
        prompt: 'Mire no QRCODE do parceiro para adicioná-lo automaticamente'
      });
    if (!barcodeScanResult.cancelled) {
      this.addPartner(barcodeScanResult.text);
    }
  }

  // presentActionSheet() {
  //   const actionSheet = this.actionSheetController.create({
  //     title: 'Opções do parceiro',
  //     buttons: [
  //       {
  //         text: 'Remover',
  //         role: 'destructive',
  //         handler: () => {
  //           this.presentRemovePartnerAlert();
  //         }
  //       }, {
  //         text: 'Remover e bloquear',
  //         role: 'destructive',
  //         handler: () => {
  //           this.presentRemovePartnerAlert(true);
  //         }
  //       }, {
  //         text: 'Cancelar',
  //         role: 'cancel',
  //         handler: () => {
  //           console.log('Cancel clicked');
  //         }
  //       }
  //     ]
  //   });
  //   actionSheet.present();
  // }

  presentPopover(event) {
    let items = [{ index: 0, label: 'Usuários bloqueados' }];

    if (this.authProvider.user.partner_id) {
      items.push({ index: 1, label: 'Remover parceiro' });
      items.push({ index: 2, label: 'Remover e bloquear parceiro' });
    }

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
        }
      }
    });
    popover.present({ ev: event });
  }

}