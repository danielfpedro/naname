import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AskAboutPartnershipPage } from './ask-about-partnership';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    AskAboutPartnershipPage,
  ],
  imports: [
    IonicPageModule.forChild(AskAboutPartnershipPage),
    QRCodeModule
  ],
})
export class AskAboutPartnershipPageModule {}
