import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertOptions, AlertController, LoadingController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { Observable } from 'rxjs';

/**
 * Generated class for the BlockedUsersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-blocked-users',
  templateUrl: 'blocked-users.html',
})
export class BlockedUsersPage {

  blockedUsers = [];
  loading: boolean = true;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private viewController: ViewController,
    private authProvider: AuthProvider,
    private alertController: AlertController,
    private loaderController: LoadingController) {

  }
  ionViewDidEnter() {
    this.init();
  }

  async init() {
    this.loading = true;
    this.blockedUsers = [];
    try {
      const blockedUsers = await this.authProvider.blockedUsersLimited();
      this.blockedUsers = blockedUsers.docs.map(blockedUser => {
        console.log('Blocked user', blockedUser.data());
        return { ...blockedUser.data(), id: blockedUser.id };
      });
    } catch (error) {

    } finally {
      this.loading = false;
    }
  }

  close() {
    this.viewController.dismiss();
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
    const alert = this.alertController.create(alertOptions);
    alert.present();
  }
  async unblockUser(userToBeUnblocked) {
    const loader = this.loaderController.create({
      content: `Desbloqueando ${userToBeUnblocked.name} (${
        userToBeUnblocked.email
        })`
    });
    loader.present();
    await this.authProvider.unblockUser(userToBeUnblocked.id);
    loader.dismiss();
    this.init();
  }

}
