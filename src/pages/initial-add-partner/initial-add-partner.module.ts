import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InitialAddPartnerPage } from './initial-add-partner';
import { QRCodeModule } from 'angularx-qrcode';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    InitialAddPartnerPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(InitialAddPartnerPage),
    QRCodeModule
  ],
})
export class InitialAddPartnerPageModule {}
