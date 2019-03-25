import { Component, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { IonicPage, ModalController, LoadingController, AlertController } from 'ionic-angular';

import {
  StackConfig,
  Direction,
  DragEvent,
  SwingStackComponent,
  SwingCardComponent
} from 'angular2-swing';
import { AuthProvider, ChoicesLimitReached } from '../../providers/auth/auth';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';

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
  cachingNames: boolean = false;

  choicesLimitReached = false;

  filterForm: FormGroup;

  filterValuesBeforeOpenModal: {};
  filterFormSubscription: Subscription;
  filterFormTotalTouchedControls: number = 0;

  constructor(
    public authProvider: AuthProvider,
    public formBuilder: FormBuilder,
    public modalController: ModalController,
    public loadingController: LoadingController,
    private alertController: AlertController
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
  ionViewDidLoad() {
    console.log('Did load');
    this.init();
    this.swingStack.throwin.subscribe((event: DragEvent) => {
      // event.target.style.background = '#ffffff';
    });
  }
  ionViewDidEnter() {
    console.log('Subscribe filter form');
    this.filterFormSubscription = this.filterForm.valueChanges.subscribe(() => {
      this.filterFormTotalTouchedControls = 0;
      Object.keys(this.filterForm.value).forEach(key => {
        if (this.filterForm.value[key]) {
          this.filterFormTotalTouchedControls++;
        }
      })
    });
  }
  ionViewWillLeave() {
    console.log('Unsubscribe filter form');
    this.filterFormSubscription.unsubscribe();
  }

  async init(): Promise<void> {
    const loader = this.loadingController.create({ content: 'Carregando, aguarde...' });
    loader.present();
    const isNeeded = await this.authProvider.isCacheNamesNeeded();
    loader.dismiss();
    console.log('Is needed?', isNeeded);

    if (isNeeded) {
      const modal = this.modalController.create('NamesCachePage');
      modal.onDidDismiss(() => {
        this.getNamesChunk();
      });
      modal.present();
    } else {
      this.getNamesChunk();
    }
  }
  async getNamesChunk(): Promise<void> {

    if (typeof this.authProvider.user.gender == 'undefined' || this.authProvider.user.gender === null) {
      this.openGenderSelectionModal();
      return;
    }

    this.loadingNames = true;
    console.log('Get names chunk, pending coisas?', this.authProvider.namesListPendingInsterations);
    if (this.authProvider.namesListPendingInsterations === 0) {
      console.log('Não tinha pendencia pegar mais');
      try {
        this.choicesLimitReached = false;
        // const chosenNames = await this.authProvider.chosenNamesRef().ref.get();
        const names = await this.authProvider.getNamesToChoose(this.filterForm.value);
        this.noMoreNames = names.size < 1;
        if (!this.noMoreNames) {
          names.forEach(name => {
            this.addNewCard({ ...name.data(), id: name.id });
          });
        }
      } catch (error) {
        if (error instanceof ChoicesLimitReached) {
          this.choicesLimitReached = true;
        }
      } finally {
        this.loadingNames = false;
      }
    } else {
      console.log('Tinha pendnecia esperar um segundo e pegar de novo');
      setTimeout(() => {
        this.getNamesChunk()
      }, 1000);
    }

  }
  // Connected through HTML
  async voteUp(like: boolean): Promise<void> {
    try {
      const removedCard = this.cards.pop();
      this.authProvider.chooseName(removedCard, like);
      if (this.cards.length < 1) {
        this.getNamesChunk();
      }
    } catch (error) {
    }
  }
  // Cards
  addNewCard(card) {
    this.cards.push(card);
  }
  resetCards(): any {
    this.cards = [];
    this.getNamesChunk();
  }
  filterSubmit() {
    this.cards = [];
    this.getNamesChunk();
  }
  openFiltersModal() {
    const modal = this.modalController.create('NamesFiltersPage', { filterForm: this.filterForm });
    modal.onDidDismiss(data => {
      if (data.cancel) {
        this.filterForm.patchValue(this.filterValuesBeforeOpenModal);
        return;
      }
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
      if (changed) {
        this.resetCards();
      }
    });
    modal.present();
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

    // element.style.background = color;
    element.style['transform'] = `translate3d(0, 0, 0) translate(${x}px, ${y}px) rotate(${r}deg)`;
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
}
