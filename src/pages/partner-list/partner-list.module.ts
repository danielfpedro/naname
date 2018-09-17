import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PartnerListPage } from './partner-list';

@NgModule({
  declarations: [
    PartnerListPage,
  ],
  imports: [
    IonicPageModule.forChild(PartnerListPage),
  ],
})
export class PartnerListPageModule {}
