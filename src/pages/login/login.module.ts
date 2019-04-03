import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LoginPage } from './login';
import { MainLogoComponent } from '../../components/main-logo/main-logo';

@NgModule({
  declarations: [
    LoginPage,
    MainLogoComponent
  ],
  imports: [
    IonicPageModule.forChild(LoginPage),
  ],
  exports: [LoginPage]
})
export class LoginPageModule {}
