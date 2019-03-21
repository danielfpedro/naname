import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AskAboutPartnershipPage } from './ask-about-partnership';
import { QRCodeModule } from 'angularx-qrcode';

import {GenderSelectionPage} from '../gender-selection/gender-selection'

@NgModule({
  declarations: [
    AskAboutPartnershipPage,
    GenderSelectionPage
  ],
  imports: [
    IonicPageModule.forChild(AskAboutPartnershipPage),
    QRCodeModule
  ],
})
export class AskAboutPartnershipPageModule {}
