import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, LoadingController } from 'ionic-angular';
import { NamesProvider } from '../../providers/names/names';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthProvider } from '../../providers/auth/auth';
import { SocialSharing } from '@ionic-native/social-sharing';

/**
 * Generated class for the ChosenListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chosen-list',
  templateUrl: 'chosen-list.html',
})
export class ChosenListPage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public namesProvider: NamesProvider,
    public authProvider: AuthProvider,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController,
    public socialSharing: SocialSharing
  ) {
  }

  ionViewDidLoad() {
    // console.log('RSRSRS', this.authProvider.partner);
  }

  presentNameActionSheetOption(chosen: any) {
    if (chosen.owner == 'partner') {
      this.authProvider.toast('Você não pode remover da lista o nome que somente o seu parceiro adicionou.', 4000);
      return;
    }
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Opções',
      buttons: [
        {
          text: 'Remover nome',
          role: 'destructive',
          handler: () => {
            this.removeName(chosen.id);
          }
        }, {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  async removeName(id: string) {
    const loader = this.loadingCtrl.create({ content: 'Removendo nome da sua lista, por favor aguarde...' });
    loader.present();
    await this.authProvider.removeChosenName(id);
    loader.dismiss();
  }

  share() {
    this.socialSharing.share('Escolhe o nome do filhão ai meu amigo, é divertix', 'Aqui o assunto não sei a diferença', null, 'http://naname.com.br./enquete/123456789');
  }
}
