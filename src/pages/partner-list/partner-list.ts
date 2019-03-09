import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController,
  LoadingController,
  AlertOptions,
  ModalController,
  Platform
} from "ionic-angular";

import {
  AngularFirestore,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { Observable, throwError, Subscription } from "rxjs";
import firebase from "firebase/app";

import { AuthProvider } from "../../providers/auth/auth";
import { PartnerInvitesProvider } from "../../providers/partner-invites/partner-invites";
import { QRScanner, QRScannerStatus } from "@ionic-native/qr-scanner";

/**
 * Generated class for the PartnerListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-partner-list",
  templateUrl: "partner-list.html"
})
export class PartnerListPage {
  usersBlockedCollection: any;
  requestsSentCollection: any;

  blockedUsersSubscription: Subscription;
  blockedUsers = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public authProvider: AuthProvider,
    public partnerInvitesProviders: PartnerInvitesProvider,
    // Ionic components
    public alertCtrl: AlertController,
    public loaderCtrl: LoadingController,
    private qrScanner: QRScanner,
    private platform: Platform
  ) {}

  ionViewDidLoad() {
    console.log("SUBSCRIBING BLOCKED USERS");

    this.blockedUsersSubscription = this.authProvider
      .blockedUsersRef()
      .valueChanges()
      .subscribe(blockedUsers => {
        this.blockedUsers = blockedUsers.map(blockedUser => {
          return blockedUser;
        });
      });
  }
  ionViewWillLeave() {
    console.log("UNSUBSCRIBE BLOCKED USERS");
    this.blockedUsersSubscription.unsubscribe();
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
    const loader = this.loaderCtrl.create({
      content: "Adicionando parceiro, aguarde..."
    });
    loader.present();
    try {
      await this.authProvider.addPartner(email);
      loader.dismiss();
    } catch (error) {
      loader.dismiss().then(() => {
        const alert = this.alertCtrl.create({
          title: "Ops, algo deu errado!",
          message: error,
          buttons: ["ok"]
        });
        alert.present();
      });
      throw Error(error);
    }
  }
  presentRemovePartnerAlert(block: boolean = false) {
    const title = `<strong>Remover</strong> o seu parceiro ${
      this.authProvider.partner.name
    }?`;
    const message =
      "Ao remover, a lista de nomes escolhidos irá exibir apenas os nomes que você escolheu.";

    const partnerToBeRemoved = this.authProvider.partner;

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
  presentUnblockUserAlert(userToBeUnblocked): void {
    const title = `<strong>Desbloquear</strong> ${userToBeUnblocked.name}?`;
    const message = `Ao desbloquear, o usuário poderá te adicionar como parceiro novamente.`;

    const alertOptions: AlertOptions = {
      title,
      message,
      buttons: [
        {
          text: "Ok, quero desbloquear",
          handler: () => {
            this.unblockUser(userToBeUnblocked);
          }
        },
        "Cancelar"
      ]
    };
    const alert = this.alertCtrl.create(alertOptions);
    alert.present();
  }
  async removePartner(partner) {
    const loader = this.loaderCtrl.create({
      content: `Removendo ${this.authProvider.partner.name} (${
        this.authProvider.partner.email
      })`
    });
    loader.present();
    await this.authProvider.removePartner(partner);
    loader.dismiss();
  }
  async blockPartner(partnerToBeBlocked) {
    const loader = this.loaderCtrl.create({
      content: `Bloqueando ${partnerToBeBlocked.name} (${
        partnerToBeBlocked.email
      })`
    });
    loader.present();
    await this.authProvider.blockUser(partnerToBeBlocked);
    loader.dismiss();
  }
  async unblockUser(userToBeUnblocked) {
    const loader = this.loaderCtrl.create({
      content: `Desbloqueando ${userToBeUnblocked.name} (${
        userToBeUnblocked.email
      })`
    });
    loader.present();
    await this.authProvider.unblockUser(userToBeUnblocked.uid);
    loader.dismiss();
  }

  async scanQrCode() {
    this.qrScanner
      .prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          // camera permission was granted

          // start scanning
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            console.log("Scanned something", text);

            this.qrScanner.hide(); // hide camera preview
            scanSub.unsubscribe(); // stop scanning
          });

          // show camera preview
          this.qrScanner.show();

          // wait for user to scan something, then the observable callback will be called
        } else if (status.denied) {
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
        }
      })
      .catch((e: any) => console.log("Error is", e));
  }
}
