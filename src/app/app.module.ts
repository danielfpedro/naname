import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { AngularFireModule } from "@angular/fire";

import {
  AngularFireDatabaseModule,
  AngularFireDatabase
} from "@angular/fire/database";
import { AngularFirestoreModule } from "@angular/fire/firestore";

import { AngularFireAuthModule } from "@angular/fire/auth";

import { Facebook } from "@ionic-native/facebook";
import { AuthProvider } from "../providers/auth/auth";
import { PartnerInvitesProvider } from "../providers/partner-invites/partner-invites";
import { SwingModule } from "angular2-swing";

import { GooglePlus } from "@ionic-native/google-plus";
import { SocialSharing } from "@ionic-native/social-sharing";
import { IonicStorageModule } from "@ionic/storage";
import { NamesProvider } from "../providers/names/names";

export const firebaseConfig = {
  apiKey: "AIzaSyAjWLKZffxTxeWckc3UymVZ2UJEoCEu66Y",
  authDomain: "naname-590a0.firebaseapp.com",
  databaseURL: "https://naname-590a0.firebaseio.com",
  projectId: "naname-590a0",
  storageBucket: "naname-590a0.appspot.com",
  messagingSenderId: "228545191361"
};

@NgModule({
  declarations: [MyApp],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    SwingModule,
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp],
  providers: [
    AuthProvider,
    AngularFireDatabase,
    Facebook,
    AuthProvider,
    GooglePlus,
    StatusBar,
    SplashScreen,
    PartnerInvitesProvider,
    SocialSharing,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    NamesProvider
  ]
})
export class AppModule {}
