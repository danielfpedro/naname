import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PartnerListPage } from './partner-list';
import { QRCodeModule } from 'angularx-qrcode';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    PartnerListPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(PartnerListPage),
    QRCodeModule,
  ],
})
export class PartnerListPageModule { }
