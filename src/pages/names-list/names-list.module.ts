import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NamesListPage } from './names-list';

import { SwingModule } from 'angular2-swing';

@NgModule({
  declarations: [
    NamesListPage,
  ],
  imports: [
    IonicPageModule.forChild(NamesListPage),
    SwingModule
  ],
})
export class NamesListPageModule {}
