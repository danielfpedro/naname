import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NamesCachePage } from './names-cache';

@NgModule({
  declarations: [
    NamesCachePage,
  ],
  imports: [
    IonicPageModule.forChild(NamesCachePage),
  ],
})
export class NamesCachePageModule {}
