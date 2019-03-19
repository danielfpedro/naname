import { Component } from '@angular/core';

/**
 * Generated class for the BlockedUsersComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'blocked-users',
  templateUrl: 'blocked-users.html'
})
export class BlockedUsersComponent {

  text: string;

  constructor() {
    console.log('Hello BlockedUsersComponent Component');
    this.text = 'Hello World';
  }

}
