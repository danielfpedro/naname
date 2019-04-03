import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InitialAddPartnerPage } from './initial-add-partner';
import { ComponentsModule } from '../../components/components.module';
import { AddPartnerComponent } from '../../components/add-partner/add-partner';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    InitialAddPartnerPage,
    AddPartnerComponent
  ],
  imports: [
    IonicPageModule.forChild(InitialAddPartnerPage),
    QRCodeModule
  ],
})
export class InitialAddPartnerPageModule {}
