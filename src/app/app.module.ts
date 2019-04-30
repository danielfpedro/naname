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
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { QRScanner } from "@ionic-native/qr-scanner";

import { HttpClientModule } from '@angular/common/http';

const firebaseConfig: FirebaseAppConfig = {
  apiKey: "AIzaSyDBBqcLQF3T5C_-olzql5ICHrZNxKrj43A",
  authDomain: "nename-d08b1.firebaseapp.com",
  databaseURL: "https://nename-d08b1.firebaseio.com",
  projectId: "nename-d08b1",
  storageBucket: "nename-d08b1.appspot.com",
  messagingSenderId: "423286092881"
};

@NgModule({
  declarations: [
    MyApp
  ],
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
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
