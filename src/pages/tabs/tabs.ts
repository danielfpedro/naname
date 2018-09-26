import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';

import { PartnerInvitesProvider } from '../../providers/partner-invites/partner-invites';

//IMPORTANTE: coloo ele aqui pra ficar o singleton disponivel por
// todo o app


@IonicPage()
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = 'UserTabPage';
  tab2Root = 'NamesListPage';

  constructor(public partnerInvitesProvider: PartnerInvitesProvider) {

  }
}
