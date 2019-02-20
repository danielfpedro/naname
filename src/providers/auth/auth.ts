import { Injectable } from '@angular/core';
import { Platform, NavController, App, AlertController, ToastController } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentSnapshot, DocumentData, DocumentSnapshotExists, Action } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Storage } from '@ionic/storage';

import { GooglePlus } from '@ionic-native/google-plus';

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {

  // public userDoc: AngularFirestoreDocument;

  public userUid: string = null;
  public user: any;
  public partner: any = null;
  // public partner: any;

  // public partnerLoaded = false;

  constructor(
    private platform: Platform,
    private fb: Facebook,
    private afAuth: AngularFireAuth,
    public app: App,
    public storage: Storage,

    private afs: AngularFirestore,
    private alertController: AlertController,
    private toastController: ToastController,

    public gPlus: GooglePlus
  ) {

  }

  async init() {
    try {
      console.log('USER UID FROM STORATE');
      const response = await this.storage.get('user_uid');
      if (response) {
        this.userUid = response;
        this.watchUser();
      }
    } catch (error) {
      const toast = this.toastController.create({ message: 'Ocorreu um erro ao iniciar o login' });
      toast.present();
      console.error(error);
      throw Error(error);
    }
  }

  async signIn(providerName: string): Promise<any> {

    let firebaseAuthResponse = null;

    if (this.platform.is('cordova')) {
      switch (providerName) {
        case 'google':
          firebaseAuthResponse = await this.sigInGoogleNative();
          break;

        default:
          break;
      }
    } else {
      console.log('login browser');
      switch (providerName) {
        case 'google':
          console.log('login with google provider');
          firebaseAuthResponse = await this.sigInGoogleBrowser();
          break;
        default:
          break;
      }
    }

    try {
      await this.setOrUpdateUser(firebaseAuthResponse);
      await this.storage.set('user_uid', firebaseAuthResponse.uid);
      this.userUid = firebaseAuthResponse.uid;
      this.watchUser();
    } catch (error) {
      console.error(error);
      const toast = this.toastController.create({ message: 'Ocorreu um erro ao tentar fazer o login.' });
      toast.present();
      throw Error(error);
    }
  }



  async sigInGoogleBrowser() {
    try {
      const authResponse = await this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      return authResponse.user;
    } catch (error) {
      console.error('Error login google browser', error);
    }
  }

  async sigInGoogleNative() {
    try {
      const loginResponse = await this.gPlus.login({
        'webClientId': '492626879402-uph3f5a6akmq4ldh70cb6ke7okfsljtl.apps.googleusercontent.com',
        'offline': true,
        'scopes': 'profile email'
      });
      return await this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(loginResponse.idToken));
    } catch (error) {
      console.error('Error login google native', error);
    }
  }

  async setOrUpdateUser(userData: { uid, displayName, email, photoURL }) {
    console.log('user data to add', userData);
    const userToAdd = {
      uid: userData.uid,
      name: userData.displayName,
      email: userData.email,
      profilePhotoURL: userData.photoURL
    };

    try {
      await this.afs.doc(`users/${userToAdd.uid}`).set(userToAdd, { merge: true });
    } catch (error) {
      throw Error(error);
    }
  }

  watchUser() {
    this.afs.collection('users').doc(this.userUid).valueChanges()
      .subscribe((res: any) => {
        this.user = res;
        if (res.partner_uid) {
          this.afs.collection('users').doc(res.partner_uid).valueChanges().subscribe(partner => {
            this.partner = partner;
          });
        } else {
          this.partner = null;
        }
      });
  }

  getPartner() {

  }

  getMyUser(): AngularFirestoreDocument<any> {
    return this.afs.collection('users').doc(this.userUid);
  }

  logout() {
    this.storage.set('user_uid', null).then(() => {

      this.userUid = null;
      this.user = null;

      this.app.getActiveNavs()[0].setRoot('LoginPage');
      this.afAuth.auth.signOut();

    });
  }

}