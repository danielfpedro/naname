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

  public userDoc: AngularFirestoreDocument;

  public userUid: string;

  public user: any;
  public partner: any;

  public partnerLoaded = false;

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

  async init(): Promise<void> {
    try {
     await this.storage.get('user_uid');
    } catch (error) {
      
    }
    
    return new Promise<void>((resolve, reject) => {
      this.storage.get('user_uid').then(res => {
        this.userUid = res;
        if (this.userUid) {
          this.getMyUser().valueChanges()
          .subscribe(user => {
            if (user) {
              this.user = user;
              if (!this.user.partner_uid) {
                this.partner = null;
              }
              if (!this.partner && this.user.partner_uid) {
                this.afs.collection('users').doc(this.user.partner_uid).valueChanges().subscribe(data => {
                  this.partner = data;
                  resolve();
                });
              }
            }

          });
        } else {
          resolve();
        }
      }).catch(error => {console.error('Ocorreu um erro ao tentar pegar o user uid no storage'); reject()});
    });
  }

  async signIn(providerName: string):Promise<any> {

    let firebaseAuthResponse = null;

    if(this.platform.is('cordova')) {
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
      // GET USER ONCE
      await this.afs.doc(`users/${firebaseAuthResponse.uid}`).valueChanges().subscribe((userResponse: DocumentData) => {
        this.user = userResponse;
        this.partner = (typeof userResponse.partner_uid != 'undefined' && userResponse.partner_uid) ? this.afs.doc(`users/${userResponse.partner_uid}`).valueChanges() : null;
      }); 
    } catch (error) {
      console.error(error);
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

  async setOrUpdateUser(userData: {uid, displayName, email, photoURL}): Promise<AngularFirestoreDocument> {
    console.log('user data to add', userData);
    const userToAdd = {
      uid: userData.uid,
      name: userData.displayName,
      email: userData.email,
      profilePhotoURL: userData.photoURL
    };

    try {
      await this.afs.doc(`users/${userToAdd.uid}`).set(userToAdd, { merge: true });
      return await this.afs.doc(`users/${userToAdd.uid}`);
    } catch (error) {
      throw Error(error);
    }

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
