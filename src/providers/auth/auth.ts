import { Injectable } from '@angular/core';
import { Platform, NavController, App, AlertController, ToastController } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentSnapshot, DocumentData, DocumentSnapshotExists, Action } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { forkJoin } from "rxjs";

import { Storage } from '@ionic/storage';

import { GooglePlus } from '@ionic-native/google-plus';
import { map, switchMap, flatMap } from 'rxjs/operators';

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
  public blockedUsers: any;
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
    private toastCtrl: ToastController,

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
        this.watchBlockedUsers();
      }
    } catch (error) {
      const toast = this.toastCtrl.create({ message: 'Ocorreu um erro ao iniciar o login' });
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
      const toast = this.toastCtrl.create({ message: 'Ocorreu um erro ao tentar fazer o login.' });
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
          this.afs.collection('users').doc(res.partner_uid).snapshotChanges()
            .pipe(
              map(partner => {
                return { ...partner.payload.data(), uid: partner.payload.id }
              })
            )
            .subscribe(partner => {
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

  // Refs
  myUserRef() {
    return this.afs.collection('users').doc(this.userUid);
  }
  blockedUsersRef() {
    return this.myUserRef().collection('blockedUsers');
  }

  // Partnership
  /**
   * Remove partner and/or block him
   * @param block Flag that tells if the user will be blocked after being removed
   */
  async removePartner(): Promise<void> {
    try {
      await this.myUserRef().update({ partner_uid: null });
    } catch (error) {
      this.toast('Ocorreu um erro ao tentar remover o parceiro.');
    }
  }

  // Blocks
  watchBlockedUsers() {
    this.afs.collection(`users/${this.userUid}/blockedUsers`).snapshotChanges()
      // Collection de ids do bloqueados do meu user
      .pipe(
        // Para cada eu pego o user em questao
        map(blockedUsersIdsCollection => {
          return blockedUsersIdsCollection.map((blockedUserIdDoc: any) => {
            return this.afs.collection('users').doc(blockedUserIdDoc.payload.doc.id).snapshotChanges()
              .pipe(
                map((blockedUser: any) => {
                  return { ...blockedUser.payload.data(), uid: blockedUser.payload.id };
                })
              );
          });
        })
      )
      .subscribe(blockedUsers => {
        this.blockedUsers = blockedUsers.map(blockedUser => {
          return blockedUser;
        })
      });
  }
  async blockUser(uid) {
    try {
      await this.blockedUsersRef().doc(uid).set({ uid });
    } catch (error) {
      this.toast('Ocorreu um erro ao tentar bloquear o parceiro');
    }
  }
  /**
   * 
   * @param uid Uid of the user that will be deleted
   */
  async unblockUser(uid: string) {
    try {
      await this.blockedUsersRef().doc(uid).delete();
    } catch (error) {
      this.toast('Ocorreu um erro ao tentar desbloquear o parceiro');
    }
  }

  // Helpers

  /** Toast Helper
   * @param message Message to be displayed at toast
   */
  toast(message: string, duration: number = 3000): void {
    const toast = this.toastCtrl.create({ message, duration });
    toast.present();
  }
}