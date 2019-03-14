import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';

/**
 * Generated class for the NamesFiltersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-names-filters',
  templateUrl: 'names-filters.html',
})
export class NamesFiltersPage {

  filterForm: FormGroup;

  letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'z'];
  categories: any = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder, public viewCtrl: ViewController, public afs: AngularFirestore) {
    this.filterForm = this.navParams.get('filterForm');

    this.afs.collection('categories').ref.get().then(categories => {
      categories.forEach(category => {
        this.categories.push(category.data());
      });
    });

  }

  dismiss(flag: boolean) {
    this.viewCtrl.dismiss({cancel: flag});
  }

}
