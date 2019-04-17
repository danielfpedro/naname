import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-name-meaning',
  templateUrl: 'name-meaning.html',
})
export class NameMeaningPage {

  public name: string;

  constructor(private viewController: ViewController) {
    this.name = viewController.data.name;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad NameMeaningPage');
  }

  dismiss() {
    this.viewController.dismiss();
  }

}
