import { Injectable } from '@angular/core';
import { Platform, NavController, App, AlertController, ToastController } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Storage } from '@ionic/storage';

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {

  public userUid;
  public user: any;

  constructor(
    private platform: Platform,
    private fb: Facebook,
    private afAuth: AngularFireAuth,
    public app: App,
    public storage: Storage,

    private afs: AngularFirestore,
    private alertController: AlertController,
    private toastController: ToastController
  ) {

    // afAuth.authState
    //   .subscribe(user => {
    //   if (!user) {
    //     this.displayName = null;
    //     this.user = null;
    //     console.log('Primeiro aqui');
    //     this.isLoggedIn().then(userUid => {
    //       console.log('Is Loggedbu', userUid);
    //       if (userUid) {
    //         console.log('Dentro do user uid');
    //         // this.app.getActiveNavs()[0].setRoot('LoginPage');
    //         const alert = this.alertController.create({
    //           title: 'New Friend!',
    //           subTitle: 'Your friend, Obi wan Kenobi, just accepted your friend request!',
    //           buttons: [
    //             {
    //               text: 'Logar novamente',
    //               handler: data => {
    //                 this.app.getActiveNavs()[0].setRoot('LoginPage');
    //               }
    //             }
    //           ]
    //         });
    //         alert.present();
    //       }
    //     });

    //     return;
    //   }
    //   this.user = user;
    //   this.displayName = user.displayName;
    // });

  }

  // isLoggedIn(): Promise<string> {
  //   return this.storage.get('user_uid')
  // }

  init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.storage.get('user_uid').then(res => {
        this.userUid = res;
        if (this.userUid) {
          this.getUser()
            .then(() => resolve())
            .catch(error => {console.log(error); reject()});
        } else {
          resolve();
        }
      }).catch(error => {console.error('Ocorreu um erro ao tentar pegar o user uid no storage'); reject()});
    });
  }

  async signIn(providerName: string) {
    return new Promise((resolve, reject) => {
        resolve();
    });
    //   if (this.platform.is('cordova')) {
    //
    //     if (providerName == 'facebook') {
    //         // this.fb.login(['email', 'public_profile'])
    //         //   .then(res => {
    //         //     const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
    //         //     return firebase.auth().signInWithCredential(facebookCredential)
    //         //       .then(res => {
    //         //           this.setOrUpdateUser(user.uid, user)
    //         //             .then(() => {
    //         //               this.storage.set('user_uid', user.uid)
    //         //                 .then(() => {
    //         //                   this.init()
    //         //                     .then(() => resolve())
    //         //                     .catch(error => reject());
    //         //                 })
    //         //                 .catch(error => {console.log(error), reject()});
    //         //             })
    //         //             .catch(error => {console.log(error), reject()});
    //         //       })
    //         //       .catch(error => reject(error));
    //         //   })
    //         //   .catch(error => reject(error));
    //     } else {
    //
    //     }
    //
    //   } else {
    //     const provider = (providerName == 'facebook') ? new firebase.auth.FacebookAuthProvider() : new firebase.auth.GoogleAuthProvider();
    //     return this.afAuth.auth
    //       .signInWithPopup(provider)
    //       .then(res => {
    //
    //         this.setOrUpdateUser(res.user.uid, res.user)
    //           .then(() => {
    //             this.storage.set('user_uid', res.user.uid)
    //               .then(() => {
    //                 this.init()
    //                   .then(() => resolve())
    //                   .catch(error => reject());
    //               })
    //               .catch(error => {console.log(error), reject()});
    //           })
    //           .catch(error => {console.log(error), reject()});
    //
    //       })
    //       .catch(error => {console.log(error), reject()});
    //   }
    // });
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

  getUser(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      firebase.firestore().collection('users').doc(this.userUid).get().then(res => {
        this.user = res.data();
        resolve();
      })
      .catch(error => {console.error(error); reject()});
    });
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
