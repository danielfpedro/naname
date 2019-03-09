import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Facebook } from "@ionic-native/facebook";
import { GooglePlus } from "@ionic-native/google-plus";
import { Storage } from "@ionic/storage";
import firebase from "firebase/app";
import { AlertController, App, Platform, ToastController } from "ionic-angular";
import * as _ from "lodash";
import { of, Subject, Observable } from "rxjs";
import { flatMap, map, mergeMap, switchMap, filter } from "rxjs/operators";
import { UserTabPage } from "../../pages/user-tab/user-tab";

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {
  public userDoc: AngularFirestoreDocument;

  public userUid: string = null;
  public user: any;
  public partner: any = null;
  public blockedUsers = [];

  public partnerLoaded = false;

  // Names
  mergedNames = [];

  watchFirebaseAuthState: Subject<boolean> = new Subject();
  authStateFirstCheck: boolean;
  partnerChange = new Subject();
  // Object with two users (currentUser and partner) to easely fetch their profiles
  // across the app
  actors = {};

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
    this.afAuth.authState
      .pipe(
        mergeMap(userSignedIn => {
          console.log("USER SIGNED IN", userSignedIn);
          if (userSignedIn) {
            return this.createUserIfNeeded(userSignedIn);
          } else {
            return of(null);
          }
        }),
        mergeMap(userId => {
          if (userId) {
            return this.afs
              .collection("users")
              .doc(userId)
              .valueChanges();
          } else {
            return of(null);
          }
        }),
        mergeMap(userProfile => {
          console.log("USER DO /users", userProfile);
          this.user = userProfile ? userProfile : null;
          if (this.user) {
            this.actors[this.user.id] = this.user;
          }

          if (this.user && this.user.partner_id) {
            return this.afs
              .collection("users")
              .doc(userProfile.partner_id)
              .ref.get();
          }
          return of(null);
        })
      )
      .subscribe(partner => {
        // IMPORTANTE!!!!!!!!!!!!!!!!
        // Se o partner_id for de um user que não existe(fluxo normal nunca vai acontecer mas estamos antecipando um bug)
        // transformamos partner_id para nul... pois o bug ocorreria do usuario ficar com partner_id de um user que não existe
        // e o parceiro querendo adicionar mas não consegue que iria dizer que o cara já tem parceiro.. porem o parceiro não existe
        // ele nem conseguiria remover... então resultaria em um bug impossivel de resolver para o usuario
        if (partner && !partner.exists) {
          this.myUserRef().set({ partner_id: null }, { merge: true });
        }
        this.partner = partner && partner.exists ? partner.data() : null;
        if (this.partner) {
          this.actors[this.partner.id] = this.partner;
        }
        this.watchFirebaseAuthState.next(this.user !== null);
      });
  }

  init() {
    // try {
    //   console.log('USER UID FROM STORATE');
    //   const response = await this.storage.get('user_uid');
    //   if (response) {
    //     const userUid = response;
    //     this.userUid = userUid;
    //     this.afs.collection('users').doc(userUid).snapshotChanges().subscribe(user => {
    //       if (user.payload.exists) {
    //         console.log('SETANDO USER UID');
    //         this.userUid = userUid;
    //         this.user = user.payload.data();
    //         this.watchUser();
    //       }
    //     });
    //   }
    // } catch (error) {
    //   const toast = this.toastCtrl.create({ message: 'Ocorreu um erro ao iniciar o login' });
    //   toast.present();
    //   console.error(error);
    //   throw Error(error);
    // }
  }

  async signIn(providerName: string): Promise<any> {
    let firebaseAuthResponse = null;

    if (this.platform.is("cordova")) {
      switch (providerName) {
        case "google":
          firebaseAuthResponse = await this.sigInGoogleNative();
      }
    } else {
      console.log("login browser");
      switch (providerName) {
        case "google":
          console.log("login with google provider");
          firebaseAuthResponse = await this.sigInGoogleBrowser();
          console.log("RESOINBSE", firebaseAuthResponse);
          break;
      }
    }
    console.log("FIREBASE AUTH RESPONSE", firebaseAuthResponse);

    try {
      // await this.storage.set('user_uid', firebaseAuthResponse.uid);
      // this.afs.collection('users').doc(firebaseAuthResponse.uid).snapshotChanges().subscribe(user => {
      //   if (user.payload.exists) {
      //     this.userUid = firebaseAuthResponse.uid;
      //     this.user = user.payload.data();
      //     this.watchUser();
      //   }
      // });
    } catch (error) {
      console.error(error);
      const toast = this.toastCtrl.create({
        message: "Ocorreu um erro ao tentar fazer o login."
      });
      toast.present();
      throw Error(error);
    }
  }

  async sigInGoogleBrowser() {
    try {
      const authResponse = await this.afAuth.auth.signInWithPopup(
        new firebase.auth.GoogleAuthProvider()
      );
      return authResponse.user;
    } catch (error) {
      console.error("Error login google browser", error);
      throw error;
    }
  }
  async sigInGoogleNative() {
    try {
      const loginResponse = await this.gPlus.login({
        webClientId:
          "459444398002-fj9tp1hku8k7rj4l283ho962due544ic.apps.googleusercontent.com",
        offline: true,
        scopes: "profile email"
      });
      console.log("GOOGLE LOGUN NATIVE RESPONSE", loginResponse);
      return await this.afAuth.auth.signInWithCredential(
        firebase.auth.GoogleAuthProvider.credential(loginResponse.idToken)
      );
    } catch (error) {
      console.error("Error login google native", error);
      throw error;
    }
  }

  async createUserIfNeeded(userData) {
    const userToAdd = {
      id: userData.uid,
      name: userData.displayName,
      email: userData.email,
      profilePhotoURL: userData.photoURL
    };
    console.log("SALVA LA", userToAdd);
    try {
      const userCheck = await this.afs
        .collection("users")
        .doc(userToAdd.id)
        .ref.get();
      if (!userCheck.exists) {
        await this.afs
          .collection("users")
          .doc(userToAdd.id)
          .set(userToAdd);
      }
      return userToAdd.id;
    } catch (error) {
      throw Error(error);
    }
  }
  // watchUser() {
  //   this.getMyUserRef().snapshotChanges()
  //     .pipe(
  //       flatMap(user => {
  //         if (user.payload.exists) {
  //           return this.watchBlockedUsers();
  //         } else {
  //           return of(null);
  //         }
  //       })
  //       , flatMap(blockedUsers => {

  //         this.blockedUsers = blockedUsers;
  //         if (this.user && this.user.partner_uid) {
  //           return this.afs.collection('users').doc(this.user.partner_uid).snapshotChanges();
  //         } else {
  //           return of(null);
  //         }
  //       })
  //       , map(partner => {
  //         return partner && partner.payload.exists ? partner.payload.data() : null;
  //       })
  //       , switchMap(partner => {
  //         if (!this.user) {
  //           return of(null);
  //         }

  //         this.partner = partner;
  //         return this.afs.collection('users').doc(this.user.uid).collection('chosenNames').valueChanges()
  //           .pipe(
  //             map(w => {
  //               return w.map(e => {
  //                 return this.getNameSubscription(e, 'me');
  //               });
  //             }),
  //             mergeMap(r => {
  //               if (this.partner) {
  //                 return this.afs.collection('users').doc(this.partner.uid).collection('chosenNames').valueChanges()
  //                   .pipe(
  //                     map(w => {
  //                       return w.map(e => {
  //                         return this.getNameSubscription(e, 'partner');
  //                       });
  //                     })
  //                     , map(x => {
  //                       return [r, x];
  //                     })
  //                   );
  //               } else {
  //                 return of([r, []]);
  //               }
  //             })
  //           );
  //       })
  //     )
  //     .subscribe(result => {
  //       if (!result || result.length < 2) {
  //         return;
  //       }
  //       let mergedNames = _.keyBy(result[0], 'id');
  //       const partnerNames = result[1];

  //       partnerNames.forEach((q: any) => {
  //         let output = q;
  //         if (typeof mergedNames[q.id] != 'undefined') {
  //           output = { ...output, votes: (parseInt(mergedNames[q.id].votes) + parseInt(output.votes)), owner: 'both' };
  //         }
  //         mergedNames[q.id] = output;
  //       });

  //       this.mergedNames = _.values(mergedNames);
  //       console.log('MERGED', this.mergedNames);

  //       // const user = res.payload.data();
  //       // if (!res.payload.exists) {
  //       //   this.logout();
  //       //   return;
  //       // }

  //       // this.user = user;
  //       // if (user.partner_uid) {
  //       //   this.afs.collection('users').doc(user.partner_uid).valueChanges()
  //       //     .subscribe(partner => {
  //       //       this.partner = partner;
  //       //       // Watch names
  //       //       this.watchMyNames();
  //       //     });
  //       // } else {
  //       //   this.partner = null;
  //       // }
  //     });
  // }

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
    return {
      id: nameChosen.id,
      votes: nameChosen.votes || 0,
      owner: owner,
      name: this.afs
        .collection("names")
        .doc(nameChosen.id)
        .valueChanges()
    };
  }

  getMyUserRef(): AngularFirestoreDocument<any> {
    return this.afs.collection("users").doc(this.user.id);
  }
  logout() {
    this.afAuth.auth.signOut();
    // try {
    //   await this.storage.set('user_uid', null)
    //   this.userUid = null;
    //   this.user = null;
    //   this.partner = null;
    //   await this.afAuth.auth.signOut();
    //   this.app.getActiveNavs()[0].setRoot('LoginPage');
    // } catch (error) {
    //   console.error(error);
    //   this.toast('Ocorreu um erro ao tentar deslogar do app.');
    // }
  }

  // Refs
  myUserRef() {
    return this.afs.collection("users").doc(this.user.id);
  }
  namesRef() {
    return this.afs.collection("names");
  }
  partnerRef(): AngularFirestoreDocument<any> {
    return this.afs.collection("users").doc(this.partner.id);
  }
  blockedUsersRef() {
    return this.myUserRef().collection("blockedUsers");
  }
  chosenNamesRef() {
    return this.afs
      .collection("partnerships")
      .doc(this.user.partnership_id)
      .collection("chosenNames");
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
        throw "Você informou o seu próprio email";
      }
      // Verifico se ele informou um usuario do sistema
      const targetUserQuery = await this.afs
        .collection("users")
        .ref.where("email", "==", email)
        .get();
      // console.log('QUERY COM EMAIL', email);
      // console.log('QUERY QUERY RESULT', targetUserQuery);
      if (targetUserQuery.empty) {
        throw "Você informou um email que não existe no sistema.";
      }
      const targetUser = targetUserQuery.docs[0];
      if (targetUser.get("partner_id")) {
        throw "O usuário que você tentou adicionar já possui um parceiro.";
      }
      const targetUserRef = this.afs.collection("users").doc(targetUser.id);
      //Verifico se o id dele está na minha lista de bloqueados
      const imBlocked = await targetUserRef
        .collection("blockedUsers")
        .doc(this.user.id)
        .ref.get();
      if (imBlocked.exists) {
        throw "Você está bloqueado por este usuário e não pode adicioná-lo como parceiro.";
      }
      // Add target uid as partner and add logged user uid on partner record too
      const partnershipResponse = await this.afs
        .collection("partnerships")
        .add({ done: true });
      await this.myUserRef().update({
        partner_id: targetUser.id,
        partnership_id: partnershipResponse.id
      });
      await targetUserRef.update({
        partner_id: this.user.id,
        partnership_id: partnershipResponse.id
      });
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
      // DELETA O PARTNER PRIMEIRO PQ DEOPIS DELE O PARTNER DO MY USER AI NAO TEM MAIS O ID DO PARTNER
      // PQ ELE FOI DELETADO KKK
      await this.partnerRef().update({
        partner_id: null,
        partnership_id: null
      });
      await this.myUserRef().update({ partner_id: null, partnership_id: null });
    } catch (error) {
      this.toast("Ocorreu um erro ao tentar remover o parceiro.");
    }
  }

  // Blocks
  async blockUser(userToBeBlocked) {
    console.log("USER TO BE BLOCKED", userToBeBlocked);
    try {
      await this.blockedUsersRef()
        .doc(userToBeBlocked.id)
        .set({ ...userToBeBlocked });
    } catch (error) {
      console.error(error);
      this.toast("Ocorreu um erro ao tentar bloquear o parceiro");
    }
  }
  /**
   *
   * @param id Id of the user that will be deleted
   */
  async unblockUser(id: string) {
    try {
      await this.blockedUsersRef()
        .doc(id)
        .delete();
    } catch (error) {
      this.toast("Ocorreu um erro ao tentar desbloquear o parceiro");
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
    return this.getMyUserRef().collection("chosenNames");
  }

  // Names
  getNamesCacheRef() {
    return this.getMyUserRef().collection("namesCache");
  }
  async choseName(name, like: boolean) {
    console.log("ESCOLHI NOME");
    console.log("LIKE?", like);
    if (like) {
      console.log("LIKED");
      if (this.partner) {
        console.log("TENHO PARTNER");
        const response = await this.afs
          .collection("partnerships")
          .doc(this.user.partnership_id)
          .collection("chosenNames")
          .doc(name.id)
          .ref.get();
        if (response.exists) {
          const tey = await this.afs
            .collection("partnerships")
            .doc(this.user.partnership_id)
            .collection("chosenNames")
            .doc(name.id)
            .update({
              owners: { ...response.data().owners, [this.user.id]: true }
            });
        } else {
          console.log("NÂO TEM NAME, ADD");
          const response = await this.afs
            .collection("partnerships")
            .doc(this.user.partnership_id)
            .collection("chosenNames")
            .doc(name.id)
            .set({ owners: { [this.user.id]: true } });
        }
      }
      await this.getChosenNamesRef()
        .doc(name.id)
        .set({ id: name.id });
    }
    await this.myUserRef()
      .collection("namesCache")
      .doc(name.id)
      .delete();
  }
  async removeChosenName(id: string) {
    console.log("Removendo nome");
    try {
      if (this.user.partnership_id) {
        console.log("tem partnership, remover nessa estrategia");
        const response = await this.afs
          .collection("partnerships")
          .doc(this.user.partnership_id)
          .collection("chosenNames")
          .doc(id)
          .ref.get();

        if (response.exists) {
          console.log("o chosen name existe");
          let data = response.data();
          const owners = data.owners;
          delete owners[this.user.id];
          data = { ...data, owners: owners };
          console.log("CARAI MANE", data.owners == {});
          if (_.isEmpty(data.owners)) {
            await this.afs
              .collection("partnerships")
              .doc(this.user.partnership_id)
              .collection("chosenNames")
              .doc(id)
              .delete();
          } else {
            await this.afs
              .collection("partnerships")
              .doc(this.user.partnership_id)
              .collection("chosenNames")
              .doc(id)
              .update(data);
          }
        } else {
          console.log("o chosen name não existe");
        }
      } else {
        await this.getChosenNamesRef()
          .doc(id)
          .delete();
      }
    } catch (error) {
      console.error(error);
      this.toast(
        "Ocorreu um erro ao tentar remover o nome da sua lista de escolhas"
      );
    }
  }
  async cacheNamesIfNeeded() {
    const namesToCache = await this.afs
      .collection("names", ref => {
        let query:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;
        if (this.user.names_cache_last_check) {
          query = query.where(
            "created_at",
            ">",
            this.user.names_cache_last_check
          );
        }
        // Somente aprovados
        query = query.where("aproved", "==", true);
        return query;
      })
      .get()
      .toPromise();

    let namesToSavePromises = [];
    namesToCache.forEach(name => {
      namesToSavePromises.push(
        this.getNamesCacheRef()
          .doc(name.id)
          .set({ ...name.data() }, { merge: true })
      );
    });

    if (namesToSavePromises.length > 0) {
      await Promise.all(namesToSavePromises);
      await this.getMyUserRef().set(
        { names_cache_last_check: new Date() },
        { merge: true }
      );
    }
  }
  async getNamesToChose(limit: number, conditions = null) {
    const namesRef = this.getMyUserRef().collection("namesCache", ref => {
      let query:
        | firebase.firestore.CollectionReference
        | firebase.firestore.Query = ref;
      if (this.user.gender) {
        query = query.where("gender", "==", this.user.gender);
      }
      if (conditions.firstLetter) {
        query = query.where("first_letter", "==", conditions.firstLetter);
      }
      if (conditions.category) {
        query = query.where(
          "categories",
          "array-contains",
          conditions.category
        );
      }
      query = query.limit(limit);
      return query;
    });

    return await namesRef.get().toPromise();
  }

  // GENDER
  async setGender(gender: string) {
    try {
      await this.myUserRef().update({ gender });
    } catch (error) {
      console.error(error);
      this.toast("Ocorreu um erro ao tentar alterar o gênero.");
    }
  }
  getGenderLabel() {
    if (!this.user.gender) {
      return "Ambos";
    }
    return this.user.gender === "m" ? "Macho Alfa" : "Fêmea";
  }

  async addCustomNameIfNeeded(name: string, gender: string) {
    // Checo se o nome já existe
    const hasName = await this.afs
      .collection("names")
      .ref.where("name", "==", name)
      .get();
    let nameId = null;
    // Se nao existe eu adiciono nos nomes como nao aprovados
    if (hasName.size < 1) {
      const newName = {
        name: name,
        gender: gender,
        first_letter: name.charAt(0),
        aproved: false
      };
      const response = await this.afs.collection("names").add(newName);
      nameId = response.id;
      // Se existe eu simplesmente pego o id do que já existe
    } else {
      nameId = hasName.docs[0].id;
    }
    // Adiciono o id do nome(criado ou que já existia) e adiciono nos chosen
    await this.chosenNamesRef()
      .doc(nameId)
      .set({ owners: { [this.user.id]: true } }, { merge: true });
  }
}
