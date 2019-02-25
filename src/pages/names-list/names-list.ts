import { Component, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ActionSheetController } from 'ionic-angular';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import {
  StackConfig,
  Stack,
  Card,
  Direction,
  ThrowEvent,
  DragEvent,
  SwingStackComponent,
  SwingCardComponent
} from 'angular2-swing';
import { NamesProvider } from '../../providers/names/names';
import { AuthProvider } from '../../providers/auth/auth';
import { take } from 'rxjs/operators';

/**
 * Generated class for the NamesListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-names-list',
  templateUrl: 'names-list.html',
})
export class NamesListPage {

  @ViewChild('myswing1') swingStack: SwingStackComponent;
  @ViewChildren('mycards1') swingCards: QueryList<SwingCardComponent>;

  public cards: Array<any> = [];
  stackConfig: StackConfig;
  currentCard;

  constructor(
    public afs: AngularFirestore,
    public namesProvider: NamesProvider,
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastController: ToastController,
    public actionSheetCtrl: ActionSheetController,
    public authProvider: AuthProvider
  ) {

    this.stackConfig = {
      allowedDirections: [Direction.LEFT, Direction.RIGHT],
      throwOutConfidence: (offsetX, offsetY, element) => {
        return Math.min(Math.abs(offsetX) / (element.offsetWidth / 3), 1);
      },
      transform: (element, x, y, r) => {
        this.onItemMove(element, x, y, r);
      },
      throwOutDistance: (d) => {
        return 1200;
      }
    };

  }

  ionViewDidLoad() {
    setTimeout(() => {
      const lastNameCheck = this.authProvider.user.names_cache_last_check;
      this.afs.collection('names', ref => ref.where('created_at', '>', lastNameCheck)).snapshotChanges().pipe(take(1)).subscribe(names => {
        const namesCacheRef = this.authProvider.myUserRef().collection('namesCache');
        if (names.length > 0) {
          let promises = [];
          console.log('NAMES TO CACHE', names);

          names.forEach(name => {
            this.addNewCard({ ...name.payload.doc.data(), id: name.payload.doc.id });
            promises.push(namesCacheRef.doc(name.payload.doc.id).set(name.payload.doc.data(), { merge: true }));
          });
          Promise.all(promises).then(() => {
            this.authProvider.getMyUserRef().update({ names_cache_last_check: new Date() });
            namesCacheRef.ref.get().then(names => {
              names.forEach(name => {
                console.log('NAMEEE', name);
                this.addNewCard(name);
              });
            });
          });
        } else {
          namesCacheRef.ref.get().then(names => {
            names.forEach(name => {
              console.log('NAMEEE', name.data());
              this.addNewCard({ ...name.data(), id: name.id });
            });
          });
        }
      });
    }, 1500);


    // this.afs.collection('names')
    //   .ref
    //   .get()
    //   .then(querySnapshot => {
    //     querySnapshot.forEach(name => {
    //       console.log('NAME', name.data());
    //       let card = name.data();
    //       card.uid = name.id;
    //       this.addNewCard(card);
    //     });
    //   });
    // Either subscribe in controller or set in HTML
    this.swingStack.throwin.subscribe((event: DragEvent) => {
      event.target.style.background = '#ffffff';
    });
  }
  // Called whenever we drag an element
  onItemMove(element, x, y, r) {
    var color = '';
    var abs = Math.abs(x);
    let min = Math.trunc(Math.min(16 * 16 - abs, 16 * 16));
    let hexCode = this.decimalToHex(min, 2);

    if (x < 0) {
      color = '#FF' + hexCode + hexCode;
    } else {
      color = '#' + hexCode + 'FF' + hexCode;
    }

    element.style.background = color;
    element.style['transform'] = `translate3d(0, 0, 0) translate(${x}px, ${y}px) rotate(${r}deg)`;
  }

  // Connected through HTML
  voteUp(like: boolean) {
    console.log('Like', like);
    const removedCard = this.cards.pop();
    console.log('REMOVED CARD', removedCard);
    this.authProvider.choseName(removedCard);
  }

  // Add new cards to our array
  addNewCard(card) {
    this.cards.push(card);
  }

  // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
  decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
      hex = "0" + hex;
    }

    return hex;
  }

  presentActionSheet() {
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Modify your album',
      buttons: [
        {
          text: 'Destructive',
          role: 'destructive',
          handler: () => {
            console.log('Destructive clicked');
          }
        }, {
          text: 'Archive',
          handler: () => {
            console.log('Archive clicked');
          }
        }, {
          text: 'Cancel',
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
