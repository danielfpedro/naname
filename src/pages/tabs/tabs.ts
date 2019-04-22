import { Component } from '@angular/core';
import { IonicPage, Platform } from 'ionic-angular';

import { PartnerInvitesProvider } from '../../providers/partner-invites/partner-invites';
import { StatusBar } from '@ionic-native/status-bar';

@IonicPage()
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = 'UserTabPage';
  tab2Root = 'NamesListPage';
  tab3Root = 'ChosenListPage';

  constructor(public partnerInvitesProvider: PartnerInvitesProvider, private platform: Platform, private statusBar: StatusBar) {

  }


}
