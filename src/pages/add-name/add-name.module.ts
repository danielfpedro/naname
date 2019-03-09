import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddNamePage } from './add-name';

@NgModule({
  declarations: [
    AddNamePage,
  ],
  imports: [
    IonicPageModule.forChild(AddNamePage),
  ],
})
export class AddNamePageModule {}
