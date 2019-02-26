import { Injectable } from '@angular/core';
import { Platform, NavController, App, AlertController, ToastController } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase, { database, firestore } from 'firebase/app';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentSnapshot, DocumentData, DocumentSnapshotExists, Action } from '@angular/fire/firestore';

import { forkJoin, of } from "rxjs";

import { Storage } from '@ionic/storage';

import { GooglePlus } from '@ionic-native/google-plus';
import { map, switchMap, flatMap, mergeMap, merge, take } from 'rxjs/operators';

import * as _ from 'lodash';
import { NamesProvider } from '../names/names';

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

  // Names
  mergedNames = [];

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
        const userUid = response;
        this.userUid = userUid;
        this.afs.collection('users').doc(userUid).snapshotChanges().subscribe(user => {
          if (user.payload.exists) {
            console.log('SETANDO USER UID');

            this.userUid = userUid;
            this.user = user.payload.data();

            this.watchUser();
          }
        });
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
      }
    } else {
      console.log('login browser');
      switch (providerName) {
        case 'google':
          console.log('login with google provider');
          firebaseAuthResponse = await this.sigInGoogleBrowser();
          console.log('RESOINBSE', firebaseAuthResponse);
          break;
      }
    }
    console.log('FIREBASE AUTH RESPONSE', firebaseAuthResponse);

    try {
      await this.setOrUpdateUser(firebaseAuthResponse);
      await this.storage.set('user_uid', firebaseAuthResponse.uid);

      this.afs.collection('users').doc(firebaseAuthResponse.uid).snapshotChanges().subscribe(user => {
        if (user.payload.exists) {
          this.userUid = firebaseAuthResponse.uid;
          this.user = user.payload.data();
          this.watchUser();
        }
      });

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
      throw error;
    }
  }

  async sigInGoogleNative() {
    try {
      const loginResponse = await this.gPlus.login({
        'webClientId': '459444398002-fj9tp1hku8k7rj4l283ho962due544ic.apps.googleusercontent.com',
        'offline': true,
        'scopes': 'profile email'
      });
      console.log('GOOGLE LOGUN NATIVE RESPONSE', loginResponse);
      return await this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(loginResponse.idToken));
    } catch (error) {
      console.error('Error login google native', error);
      throw error;
    }
  }

  async setOrUpdateUser(userData: { uid, displayName, email, photoURL }) {
    console.log('user data to add', userData);
    const userToAdd = {
      uid: userData.uid,
      name: userData.displayName,
      email: userData.email,
      profilePhotoURL: userData.photoURL,
      names_cache_last_check: new Date('2000-01-01')
    };

    try {
      await this.afs.doc(`users/${userToAdd.uid}`).set(userToAdd, { merge: true });
    } catch (error) {
      throw Error(error);
    }
  }
  watchUser() {
    this.getMyUserRef().snapshotChanges()
      .pipe(
        flatMap(user => {
          if (user.payload.exists) {
            return this.watchBlockedUsers();
          } else {
            return of(null);
          }
        })
        , flatMap(blockedUsers => {

          this.blockedUsers = blockedUsers;
          if (this.user && this.user.partner_uid) {
            return this.afs.collection('users').doc(this.user.partner_uid).snapshotChanges();
          } else {
            return of(null);
          }
        })
        , map(partner => {
          return partner && partner.payload.exists ? partner.payload.data() : null;
        })
        , switchMap(partner => {
          if (!this.user) {
            return of(null);
          }

          this.partner = partner;
          return this.afs.collection('users').doc(this.user.uid).collection('chosenNames').valueChanges()
            .pipe(
              map(w => {
                return w.map(e => {
                  return this.getNameSubscription(e, 'me');
                });
              }),
              mergeMap(r => {
                if (this.partner) {
                  return this.afs.collection('users').doc(this.partner.uid).collection('chosenNames').valueChanges()
                    .pipe(
                      map(w => {
                        return w.map(e => {
                          return this.getNameSubscription(e, 'partner');
                        });
                      })
                      , map(x => {
                        return [r, x];
                      })
                    );
                } else {
                  return of([r, []]);
                }
              })
            );
        })
      )
      .subscribe(result => {
        if (!result || result.length < 2) {
          return;
        }
        let mergedNames = _.keyBy(result[0], 'id');
        const partnerNames = result[1];

        partnerNames.forEach((q: any) => {
          let output = q;
          if (typeof mergedNames[q.id] != 'undefined') {
            output = { ...output, votes: (parseInt(mergedNames[q.id].votes) + parseInt(output.votes)), owner: 'both' };
          }
          mergedNames[q.id] = output;
        });

        this.mergedNames = _.values(mergedNames);
        console.log('MERGED', this.mergedNames);

        // const user = res.payload.data();
        // if (!res.payload.exists) {
        //   this.logout();
        //   return;
        // }

        // this.user = user;
        // if (user.partner_uid) {
        //   this.afs.collection('users').doc(user.partner_uid).valueChanges()
        //     .subscribe(partner => {
        //       this.partner = partner;
        //       // Watch names
        //       this.watchMyNames();
        //     });
        // } else {
        //   this.partner = null;
        // }
      });
  }

  // watchMyNames() {
  //   this.getMyUserRef().collection('chosenNames').valueChanges()
  //     .pipe(
  //       map(w => {
  //         return w.map(e => {
  //           return this.getNameSubscription(e.id, 'me');
  //         });
  //       }),
  //       mergeMap(r => {
  //         return this.getPartnerRef().collection('chosenNames').valueChanges()
  //           .pipe(
  //             map(w => {
  //               return w.map(e => {
  //                 return this.getNameSubscription(e.id, 'partner');
  //               });
  //             }),
  //             map(x => {
  //               return [r, x];
  //             })
  //           );
  //       })
  //     )
  //     .subscribe(result => {
  //       let mergedNames = _.keyBy(result[0], 'id');
  //       const partnerNames = result[1];

  //       partnerNames.forEach((q: any) => {
  //         let output = q;
  //         if (typeof mergedNames[q.id] != 'undefined') {
  //           output = { ...output, owner: 'both' };
  //         }
  //         mergedNames[q.id] = output;
  //       });

  //       this.mergedNames = _.values(mergedNames);
  //       console.log('MERGED', this.mergedNames);
  //     });
  // }

  getNameSubscription(nameChosen, owner) {
    return { id: nameChosen.id, votes: nameChosen.votes || 0, owner: owner, name: this.afs.collection('names').doc(nameChosen.id).valueChanges() }
  }

  getMyUserRef(): AngularFirestoreDocument<any> {
    console.log('DENTRO DO GET MY YSER REF', this.user.uid);
    return this.afs.collection('users').doc(this.user.uid);
  }
  getPartnerRef(): AngularFirestoreDocument<any> {
    return this.afs.collection('users').doc(this.partner.uid);
  }
  async logout() {
    try {
      await this.storage.set('user_uid', null)
      this.userUid = null;
      this.user = null;
      this.partner = null;
      await this.afAuth.auth.signOut();
      this.app.getActiveNavs()[0].setRoot('LoginPage');
    } catch (error) {
      console.error(error);
      this.toast('Ocorreu um erro ao tentar deslogar do app.');
    }
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
   * Add partner
   * @param email Email address to be added as partner
   */
  async addPartner(email: string): Promise<void> {
    try {
      // Verifico se ele não informou o próprio email
      if (email == this.user.email) {
        throw 'Você informou o seu próprio email';
      }
      // Verifico se ele informou um usuario do sistema
      const targetUserQuery = await this.afs.collection('users').ref.where('email', '==', email).get();
      // console.log('QUERY COM EMAIL', email);
      // console.log('QUERY QUERY RESULT', targetUserQuery);
      if (targetUserQuery.empty) {
        throw 'Você informou um email que não existe no sistema.';
      }
      const targetUser = targetUserQuery.docs[0];
      if (targetUser.get('partner_uid')) {
        throw 'O usuário que você tentou adicionar já possui um parceiro.';
      }
      const targetUserRef = this.afs.collection('users').doc(targetUser.id);
      //Verifico se o id dele está na minha lista de bloqueados
      const imBlocked = await targetUserRef.collection('blockedUsers').doc(this.userUid).ref.get();
      if (imBlocked.exists) {
        throw 'Você está bloqueado por este usuário e não pode adicioná-lo como parceiro.';
      }
      // Add target uid as partner and add logged user uid on partner record too
      await this.myUserRef().update({ partner_uid: targetUser.id });
      await targetUserRef.update({ partner_uid: this.userUid });
      // DONE!
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  /**
   * Remove partner
   */
  async removePartner(partner: any): Promise<void> {
    try {
      await this.myUserRef().update({ partner_uid: null });
      await this.afs.collection('users').doc(partner.uid).update({ partner_uid: null });
    } catch (error) {
      this.toast('Ocorreu um erro ao tentar remover o parceiro.');
    }
  }

  // Blocks
  watchBlockedUsers() {
    return this.afs.collection('users').doc(this.user.uid).collection('blockedUsers').snapshotChanges()
      // Collection de ids do bloqueados do meu user
      .pipe(
        // Para cada eu pego o user em questao
        map(blockedUsersIdsCollection => {
          console.log('IDS COLLECTION', blockedUsersIdsCollection);
          return blockedUsersIdsCollection.map((blockedUserIdDoc: any) => {
            console.log('BLOCKED COLLECTION', blockedUserIdDoc.payload.doc.id);
            return this.afs.collection('users').doc(blockedUserIdDoc.payload.doc.id).valueChanges();
          });
        })
      );
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

  getChosenNamesRef() {
    return this.getMyUserRef().collection('chosenNames');
  }

  // Names
  getNamesCacheRef() {
    return this.getMyUserRef().collection('namesCache');
  }
  async choseName(name, like: boolean) {
    if (like) {
      await this.getChosenNamesRef().doc(name.id).set({ id: name.id });
    }
    await this.myUserRef().collection('namesCache').doc(name.id).delete();
  }
  async removeChosenName(id: string) {
    try {
      await this.getChosenNamesRef().doc(id).delete();
    } catch (error) {
      console.error(error);
      this.toast('Ocorreu um erro ao tentar remover o nome da sua lista de escolhas');
    }
  }
  async cacheNamesIfNeeded() {
    const namesCacheLastCheck = this.user.names_cache_last_check;
    const namesToCache = await this.afs.collection('names', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (namesCacheLastCheck) {
        query = query.where('created_at', '>', namesCacheLastCheck);
      }
      return query;
    }).get().toPromise();

    let namesToSavePromises = [];
    namesToCache.forEach(name => {
      console.log('CAGUEI', name.data());
      namesToSavePromises.push(this.getNamesCacheRef().doc(name.id).set({ ...name.data() }, { merge: true }));
    });

    await Promise.all(namesToSavePromises);
    this.getMyUserRef().set({ names_cache_last_check: new Date() }, { merge: true });
  }
  async getNamesToChose(limit: number, conditions = null) {
    const namesRef = this.getMyUserRef().collection('namesCache', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (conditions.genre) {
        query = query.where('genre', '==', conditions.genre);
      }
      if (conditions.firstLetter) {
        query = query.where('first_letter', '==', conditions.firstLetter);
      }
      if (conditions.category) {
        query = query.where('categories', 'array-contains', conditions.category);
      }
      query = query.limit(limit);
      return query;
    });

    return await namesRef.get().toPromise();
  }
}