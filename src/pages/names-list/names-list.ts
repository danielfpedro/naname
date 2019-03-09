import { Component, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ActionSheetController, ModalController, LoadingController } from 'ionic-angular';

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
import { Subscription } from 'rxjs';

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

  filterValuesBeforeOpenModal: {};
  filterFormSubscription: Subscription;
  filterFormTotalTouchedControls: number = 0;

  constructor(
    public afs: AngularFirestore,
    public namesProvider: NamesProvider,
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastController: ToastController,
    public actionSheetCtrl: ActionSheetController,
    public authProvider: AuthProvider,
    public formBuilder: FormBuilder,
    public modalController: ModalController,
    public loadingController: LoadingController
  ) {

    this.filterForm = formBuilder.group({
      firstLetter: [''],
      category: [''],
    });

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

  ionViewDidEnter() {
    console.log('Hello Did Enter');
    this.filterFormSubscription = this.filterForm.valueChanges.subscribe(() => {
      console.log('FILTER FORM CHANGED');
      this.filterFormTotalTouchedControls = 0;
      Object.keys(this.filterForm.value).forEach(key => {
        if (this.filterForm.value[key]) {
          this.filterFormTotalTouchedControls++;
        }
      })
    });
  }
  ionViewWillLeave() {
    console.log('Bye bye view');
    this.filterFormSubscription.unsubscribe();
  }

  ionViewDidLoad() {

    const loader = this.loadingController.create({ content: 'Carregando, aguarde...' });
    loader.present();
    this.authProvider.cacheNamesIfNeeded()
      .then(() => {
        loader.dismiss();
        // Atenção... só abre selecionar gender se for null... não ''... pois '' significa ambos e null
        // significa que ele ainda não selecionou
        if (typeof this.authProvider.user.gender == 'undefined' || this.authProvider.user.gender === null) {
          this.openGenderSelectionModal();
        } else {
          this.getNamesChunk();
        }
      })
      .catch(() => {
        loader.dismiss();
      });

    this.swingStack.throwin.subscribe((event: DragEvent) => {
      event.target.style.background = '#ffffff';
    });
  }
  async cacheNamesIfNeeded() {
    await this.authProvider.cacheNamesIfNeeded();
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

  openFiltersModal() {
    const modal = this.modalController.create('NamesFiltersPage', { filterForm: this.filterForm });
    modal.onDidDismiss(data => {
      const hasFilterTouched = JSON.stringify(this.filterForm.value) !== JSON.stringify(this.filterValuesBeforeOpenModal);
      if (hasFilterTouched) {
        this.cards = [];
        this.getNamesChunk();
      }
    });


    this.filterValuesBeforeOpenModal = { ...this.filterForm.value };
    modal.present();
  }

  openGenderSelectionModal() {
    const modal = this.modalController.create('GenderSelectionPage');
    const currentGender = this.authProvider.user.gender;
    modal.onDidDismiss(() => {
      const changed = currentGender !== this.authProvider.user.gender;
      console.log('GENDER CHANGED?', changed);
      if (changed) {
        this.resetCards();
      }
    });
    modal.present();
  }
  resetCards(): any {
    this.cards = [];
    this.getNamesChunk();
  }

}
