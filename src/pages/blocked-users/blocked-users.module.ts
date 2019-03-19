import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BlockedUsersPage } from './blocked-users';

@NgModule({
  declarations: [
    BlockedUsersPage,
  ],
  imports: [
    IonicPageModule.forChild(BlockedUsersPage),
  ],
})
export class BlockedUsersPageModule {}
