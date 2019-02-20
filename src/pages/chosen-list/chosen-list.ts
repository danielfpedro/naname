import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { NamesProvider } from '../../providers/names/names';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthProvider } from '../../providers/auth/auth';

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
    public actionSheetCtrl: ActionSheetController
  ) {
  }

  ionViewDidLoad() {
    // console.log('RSRSRS', this.authProvider.partner);
  }

  presentActionSheet(name: any) {
    if (name.owner == 'partner')
      return;

    const actionSheet = this.actionSheetCtrl.create({
      title: 'Opções',
      buttons: [
        {
          text: 'Remover',
          role: 'destructive',
          handler: () => {
            this.namesProvider.removeName(name.id);
          }
        },{
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
}
