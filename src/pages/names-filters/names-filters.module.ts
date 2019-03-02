import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NamesFiltersPage } from './names-filters';

@NgModule({
  declarations: [
    NamesFiltersPage,
  ],
  imports: [
    IonicPageModule.forChild(NamesFiltersPage),
  ],
})
export class NamesFiltersPageModule {}
