import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NamesListPage } from './names-list';

@NgModule({
  declarations: [
    NamesListPage,
  ],
  imports: [
    IonicPageModule.forChild(NamesListPage),
  ],
})
export class NamesListPageModule {}
