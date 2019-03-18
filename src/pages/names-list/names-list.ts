import { Component, ViewChildren, ViewChild, QueryList } from '@angular/core';
import { IonicPage, ModalController, LoadingController, AlertController } from 'ionic-angular';

import {
  StackConfig,
  Direction,
  DragEvent,
  SwingStackComponent,
  SwingCardComponent
} from 'angular2-swing';
import { AuthProvider } from '../../providers/auth/auth';
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

  chunkSize: number = 30;

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
    this.loadingNames = true;
    // const loader = this.loadingController.create({ content: 'Carregando, aguarde...' });
    // loader.present();
    try {
      await this.authProvider.cacheNamesIfNeeded();
      // Atenção... só abre selecionar gender se for null... não ''... pois '' significa ambos e null
      // significa que ele ainda não selecionou
      if (typeof this.authProvider.user.gender == 'undefined' || this.authProvider.user.gender === null) {
        this.openGenderSelectionModal();
      } else {
        console.log('Get names chunk');
        this.getNamesChunk();
      }
    } catch (error) {

    } finally {
      this.loadingNames = false;
    }
  }
  async getNamesChunk(): Promise<void> {
    try {
      this.choicesLimitReached = false;
      this.loadingNames = true;

      const chosenNames = await this.authProvider.chosenNamesRef().ref.get();
      console.log('Total chosen names', chosenNames.size);
      if (chosenNames.size >= this.authProvider.maxChosenNames) {
        this.choicesLimitReached = true;
        const alert = this.alertController.create({ title: 'Máximo nomes', message: 'Você atingiu o máximo de nomes que pode escolher. Você pode deletar alguns para abrir espaço para escrever mais', buttons: ['Ok'] });
        alert.present();
        throw "Máximo de nomes escolhidos";
      }
      const names = await this.authProvider.getNamesToChose(this.chunkSize, this.filterForm.value);
      this.noMoreNames = names.size < 1;
      if (!this.noMoreNames) {
        names.forEach(name => {
          this.addNewCard(name.data());
        });
      }
    } catch (error) {

    } finally {
      this.loadingNames = false;
    }
  }
  // Connected through HTML
  async voteUp(like: boolean): Promise<void> {
    try {
      const removedCard = this.cards.pop();
      this.loadingNames = this.cards.length < 1;
      await this.authProvider.choseName(removedCard, like);
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
