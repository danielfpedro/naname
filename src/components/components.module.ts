import { NgModule } from '@angular/core';
import { BlockedUsersComponent } from './blocked-users/blocked-users';
import { PopoverListComponent } from './popover-list/popover-list';
import { AddPartnerComponent } from './add-partner/add-partner';
import { QRCodeModule } from 'angularx-qrcode';
import { MainLogoComponent } from './main-logo/main-logo';
import { IonicModule } from 'ionic-angular';

@NgModule({
    declarations: [
        BlockedUsersComponent,
        PopoverListComponent,
        AddPartnerComponent,
        MainLogoComponent
    ],
    imports: [
        IonicModule,
        QRCodeModule
    ],
    exports: [
        BlockedUsersComponent,
        PopoverListComponent,
        AddPartnerComponent,
        MainLogoComponent
    ]
})
export class ComponentsModule { }
