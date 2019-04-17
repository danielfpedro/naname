import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NameMeaningPage } from './name-meaning';

@NgModule({
  declarations: [
    NameMeaningPage,
  ],
  imports: [
    IonicPageModule.forChild(NameMeaningPage),
  ],
})
export class NameMeaningPageModule {}
