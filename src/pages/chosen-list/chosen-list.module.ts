import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChosenListPage } from './chosen-list';

import { OrderModule } from 'ngx-order-pipe';

@NgModule({
  declarations: [
    ChosenListPage,
  ],
  imports: [
    OrderModule,
    IonicPageModule.forChild(ChosenListPage),
    
  ],
})
export class ChosenListPageModule { }
