import { Component, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ActionSheetController } from 'ionic-angular';

import firebase, { database, firestore } from 'firebase/app';
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
import { FormGroup, FormBuilder } from '@angular/forms';

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

  noMoreNames: boolean = false;
  loadingNames: boolean = false;

  chunkSize: number = 30;

  filterForm: FormGroup;

  letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'z'];
  categories: any = [];

  constructor(
    public afs: AngularFirestore,
    public namesProvider: NamesProvider,
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastController: ToastController,
    public actionSheetCtrl: ActionSheetController,
    public authProvider: AuthProvider,
    public formBuilder: FormBuilder
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

    this.filterForm = formBuilder.group({
      genre: ['m'],
      firstLetter: [''],
      category: [''],
    });
  }

  ionViewDidLoad() {
    setTimeout(() => {
      this.authProvider.cacheNamesIfNeeded().then(() => this.getNamesChunk());
    }, 1500);

    this.swingStack.throwin.subscribe((event: DragEvent) => {
      event.target.style.background = '#ffffff';
    });

    this.afs.collection('categories').ref.get().then(categories => {
      console.log('CATEGORIES', categories);
      categories.forEach(category => {
        this.categories.push(category.data());
      });
    });
  }

  async getNamesChunk() {
    console.log('GETANDO NAMES ');
    this.loadingNames = true;
    const names = await this.authProvider.getNamesToChose(this.chunkSize, this.filterForm.value);
    console.log('NAMES GETADOS', names);
    console.log('NAMES GETADOS SIZE ', names.size);
    this.noMoreNames = names.size < 1;
    if (!this.noMoreNames) {
      names.forEach(name => {
        this.addNewCard(name.data());
      });
    }
    this.loadingNames = false;
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
    const removedCard = this.cards.pop();

    if (this.cards.length < 1) {
      this.loadingNames = true;
    }
    this.authProvider.choseName(removedCard, like).then(() => {
      if (this.cards.length < 1) {
        this.getNamesChunk();
      }
    });
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
  filterSubmit() {
    this.cards = [];
    this.getNamesChunk();
  }
}
