import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { mergeMap, map, take } from 'rxjs/operators';

/**
 * Generated class for the VotesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-votes',
  templateUrl: 'votes.html',
})
export class VotesPage {

  loading: boolean = true;
  name = null;
  voters = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public authService: AuthProvider,
    public afs: AngularFirestore,
    public viewController: ViewController) {
    this.name = this.navParams.get('name');
  }

  ionViewDidEnter() {
    this.loading = true;
    this.loadVoters();
  }

  async loadVoters() {
    try {
      this.loading = true;
      this.voters = await this.authService.chosenNamesRef().doc(this.name.id).collection('votes')
        .snapshotChanges()
        .pipe(
          map((res: any) => {
            console.log('REF', res);
            return res.map(name => {
              return name.payload.doc.data();
            });
          }),
          take(1)
        ).toPromise();

    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;

    }

  }

  dismiss() {
    this.viewController.dismiss();
  }

}
