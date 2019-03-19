import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PartnerListPage } from './partner-list';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    PartnerListPage,
  ],
  imports: [
    IonicPageModule.forChild(PartnerListPage),
    QRCodeModule,
  ],
})
export class PartnerListPageModule { }
