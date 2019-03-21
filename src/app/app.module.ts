import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { AngularFireModule, FirebaseAppConfig } from "@angular/fire";

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
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { QRScanner } from "@ionic-native/qr-scanner";

import { HttpClientModule } from '@angular/common/http';

const firebaseConfig: FirebaseAppConfig = {
  apiKey: "AIzaSyAXpIzdLG-2o0CP4EBhfOEt3p2sdJbohBo",
  authDomain: "nenem-381db.firebaseapp.com",
  databaseURL: "https://nenem-381db.firebaseio.com",
  projectId: "nenem-381db",
  storageBucket: "nenem-381db.appspot.com",
  messagingSenderId: "459444398002"
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
    HttpClientModule,
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
    QRScanner,
    BarcodeScanner,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    NamesProvider
  ]
})
export class AppModule { }
