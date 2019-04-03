import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AskAboutPartnershipPage } from './ask-about-partnership';
import { QRCodeModule } from 'angularx-qrcode';
import { MainLogoComponent } from '../../components/main-logo/main-logo';

@NgModule({
  declarations: [
    AskAboutPartnershipPage,
    MainLogoComponent
  ],
  imports: [
    IonicPageModule.forChild(AskAboutPartnershipPage),
    QRCodeModule
  ],
})
export class AskAboutPartnershipPageModule {}
