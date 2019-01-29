import { Injectable } from '@angular/core';
import { Platform, NavController, App, AlertController, ToastController } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
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

  init(): Promise<void> {
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

  signIn(providerName: string):Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {

          if (providerName == 'google') {
            console.log('Google login');
            this.gPlus.login({
              'webClientId': '492626879402-uph3f5a6akmq4ldh70cb6ke7okfsljtl.apps.googleusercontent.com',
              'offline': true,
              'scopes': 'profile email'
            })
            .then(response => {
              console.log('Result google login', response);
              this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(response.idToken))
                .then(res => {
                  console.log('DEU BOA', response);
                  this.setOrUpdateUser(res.uid, res)
                  .then(() => {
                    this.storage.set('user_uid', res.uid)
                      .then(() => {
                        this.init()
                          .then(() => resolve())
                          .catch(error => reject());
                      })
                      .catch(error => {console.log(error), reject()});
                  })
                  .catch(error => {console.log(error), reject()});
                })
                .catch(error => {
                  console.log('DEU RUIM', error);
                });
            })
            .catch(error => {
              console.log('DEU ERRO NO GOOGLE LOGIN', error);
              reject();
            });
          }
        // this.fb.login(['email', 'public_profile'])
        //   .then(res => {
        //     const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        //     return firebase.auth().signInWithCredential(facebookCredential)
        //       .then(res => resolve(res))
        //       .catch(error => reject(error));
        //   })
        //   .catch(error => reject(error));

      } else {
        const provider = (providerName == 'facebook') ? new firebase.auth.FacebookAuthProvider() : new firebase.auth.GoogleAuthProvider();
        return this.afAuth.auth
          .signInWithPopup(provider)
          .then(res => {

            this.setOrUpdateUser(res.user.uid, res.user)
              .then(() => {
                this.storage.set('user_uid', res.user.uid)
                  .then(() => {
                    this.init()
                      .then(() => resolve())
                      .catch(error => reject());
                  })
                  .catch(error => {console.log(error), reject()});
              })
              .catch(error => {console.log(error), reject()});

          })
          .catch(error => {console.log(error), reject()});
      }
    });
  }

  setOrUpdateUser(uid: string, user: {displayName, email, photoURL}): Promise<void> {

    const userToAdd = {
      name: user.displayName,
      email: user.email,
      profilePhotoURL: user.photoURL
    };

    return new Promise<void>((resolve, reject) => {
      firebase.firestore().collection('users').doc(uid).get().then(res => {
        if (res.exists) {
          this.afs.collection('users').doc(uid).update(userToAdd)
            .then(res => {
              resolve();
            })
            .catch(error => {console.log(error), reject()});
        } else {
          this.afs.collection('users').doc(uid).set(userToAdd)
            .then(res => {
              resolve();
            })
            .catch(error => {console.log(error), reject()});
        }
      });
    });
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
