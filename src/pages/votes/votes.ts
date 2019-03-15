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
  }

  ionViewDidEnter() {
    console.log('LOADING?', this.loading);
    this.loading = true;
    this.name = this.navParams.get('name');
    this.loadVoters();
  }

  async loadVoters() {
    try {
      this.loading = true;
      this.voters = await this.authService.chosenNamesRef().doc(this.name.id).collection('votes')
        .snapshotChanges()
        .pipe(
          mergeMap(votes => {
            console.log('Votes', votes);
            const promises = votes.map(vote => {
              console.log('Vote inside mao', vote);
              return this.afs.collection('users').doc(vote.payload.doc.id).ref.get();
            });
            console.log('Promises array', promises);
            return Promise.all(promises);
          }),
          map((res: any) => {
            console.log('Inside res', res);
            return res.map(name => {
              console.log('Inside map name', name.data());
              return name.data();
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
