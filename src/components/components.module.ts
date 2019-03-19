import { NgModule } from '@angular/core';
import { BlockedUsersComponent } from './blocked-users/blocked-users';
import { PopoverListComponent } from './popover-list/popover-list';
@NgModule({
	declarations: [BlockedUsersComponent,
    PopoverListComponent],
	imports: [],
	exports: [BlockedUsersComponent,
    PopoverListComponent]
})
export class ComponentsModule {}
