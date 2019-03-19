import { Component } from '@angular/core';

/**
 * Generated class for the PopoverListComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'popover-list',
  templateUrl: 'popover-list.html'
})
export class PopoverListComponent {

  text: string;

  constructor() {
    console.log('Hello PopoverListComponent Component');
    this.text = 'Hello World';
  }

}
