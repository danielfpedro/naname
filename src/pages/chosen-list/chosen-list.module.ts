import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChosenListPage } from './chosen-list';

@NgModule({
  declarations: [
    ChosenListPage,
  ],
  imports: [
    IonicPageModule.forChild(ChosenListPage),
  ],
})
export class ChosenListPageModule {}
