import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChosenListPage } from './chosen-list';

import { OrderModule } from 'ngx-order-pipe';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    ChosenListPage,
  ],
  imports: [
    OrderModule,
    PipesModule,
    IonicPageModule.forChild(ChosenListPage),

  ],
})
export class ChosenListPageModule { }
