import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GenderSelectionPage } from './gender-selection';

@NgModule({
  declarations: [
    GenderSelectionPage,
  ],
  imports: [
    IonicPageModule.forChild(GenderSelectionPage),
  ],
})
export class GenderSelectionPageModule {}
