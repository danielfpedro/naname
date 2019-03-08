import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { mergeMap } from 'rxjs/operators';

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

  name = null;
  voters = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public authService: AuthProvider,
    public afs: AngularFirestore,
    public viewController: ViewController) {
  }

  ionViewDidEnter() {
    this.name = this.navParams.get('name');
    this.afs.collection('partnerships').doc(this.authService.user.partnership_id).collection('chosenNames').doc(this.name.id).collection('votes')
      .snapshotChanges()
      .pipe(
        mergeMap(votes => {
          const promises = votes.map(vote => {
            return this.afs.collection('users').doc(vote.payload.doc.id).ref.get();
          });

          return Promise.all(promises);
        })
      )
      .subscribe(res => {
        this.voters = res.map(name => name.data());
      });
  }

  dismiss() {
    this.viewController.dismiss();
  }

}
