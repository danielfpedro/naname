import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { AngularFireModule } from '@angular/fire';

import { AngularFireDatabaseModule, AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { AngularFireAuthModule } from '@angular/fire/auth';

import { Facebook } from '@ionic-native/facebook';
import { AuthProvider } from '../providers/auth/auth';
import { PartnerInvitesProvider } from '../providers/partner-invites/partner-invites';

import { IonicStorageModule } from '@ionic/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyCKF5qFhpqMUVNX1G4CZgLkdlq4V5P7ttk",
  authDomain: "naname-754c3.firebaseapp.com",
  databaseURL: "https://naname-754c3.firebaseio.com",
  projectId: "naname-754c3",
  storageBucket: "naname-754c3.appspot.com",
  messagingSenderId: "492626879402"
};


@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
  ],
  providers: [
    AuthProvider,
    AngularFireDatabase,
    Facebook,
    AuthProvider,
    StatusBar,
    SplashScreen,
    PartnerInvitesProvider,
    // {provide: ErrorHandler, useClass: IonicErrorHandler},
  ]
})
export class AppModule {}
