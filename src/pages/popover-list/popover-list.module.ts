import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PopoverListPage } from './popover-list';

@NgModule({
  declarations: [
    PopoverListPage,
  ],
  imports: [
    IonicPageModule.forChild(PopoverListPage),
  ],
})
export class PopoverListPageModule {}
