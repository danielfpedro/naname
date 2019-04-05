import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AskAboutPartnershipPage } from './ask-about-partnership';
import { QRCodeModule } from 'angularx-qrcode';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    AskAboutPartnershipPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(AskAboutPartnershipPage),
    QRCodeModule
  ]
})
export class AskAboutPartnershipPageModule { }
