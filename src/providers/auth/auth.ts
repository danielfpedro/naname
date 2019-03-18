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
import { of, Subject } from "rxjs";
import { mergeMap } from "rxjs/operators";

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {
  public userDoc: AngularFirestoreDocument;

  public userUid: string = null;
  public user: any = null;
  public partner: any = null;
  public blockedUsers = [];

  public partnerLoaded = false;

  public isLoggedIn = false;

  // Names
  maxChosenNames = 100;

  watchFirebaseAuthState: Subject<boolean> = new Subject();
  initThingsIsDone: Subject<void> = new Subject();

  authStateFirstCheck: boolean;
  partnerChange = new Subject();
  // Object with two users (currentUser and partner) to easely fetch their profiles
  // across the app
  actors = {};

  userSignedIn = null;

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
          this.userSignedIn = userSignedIn;
          if (userSignedIn) {
            return this.createUserIfNeeded(userSignedIn);
          }
          return of(null);
        }),
        mergeMap(nothingHere => {
          console.log('Is user signed in?', this.userSignedIn);

          if (this.userSignedIn) {
            console.log('Yes it is');
            return this.afs
              .collection("users")
              .doc(this.userSignedIn.uid)
              .snapshotChanges();
          }
          this.user = null;
          return of(null);
        }),
        mergeMap(userDoc => {
          console.log('Result of user doc', userDoc);
          // Se for undefined ele estava logado mas o usuário foi deletado, então a gente signout ele
          if (userDoc === null) {
            this.user = null;
            return of(null);
          } else if (!userDoc.payload.exists) {
            console.log('User does not exists, we are signing out here');
            this.user = null;
            this.afAuth.auth.signOut();
          }

          this.user = userDoc.payload.data();
          console.log('Now the value of authProvider.user is', this.user);
          if (this.user) {
            // populate actors object with user doc, this variable will be thourgh the app
            // so we tech user and partner(if has it) only this time
            this.actors[this.user.id] = this.user;
          }
          // Se tem partner pego ele
          if (this.user && this.user.partner_id) {
            console.log('Has partner_id, fetch partner profile');
            return this.afs
              .collection("users")
              .doc(this.user.partner_id)
              .ref.get();
          } else {
            console.log('Has NOT partner_id, fetch partner profile');
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
        console.log('this.user value', this.user);
        console.log('this.isLoggedIn value', this.isLoggedIn);
        console.log('Next no watch firebase State is', (this.isLoggedIn && this.user));
        console.log('THIS PARTNER', this.partner);
        console.log('PARTNER', partner);
        console.log('THIS AUTH PROVIDER', this);
        this.watchFirebaseAuthState.next(this.user);
        // this.initThingsIsDone.complete();
      });
  }

  initThings(): void {

  }

  async signIn(providerName: string): Promise<void> {
    try {
      let authResponse = null;
      if (this.platform.is("cordova")) {
        switch (providerName) {
          case "google":
            authResponse = await this.sigInGoogleNative();
            break;
          case "facebook":
            authResponse = await this.signInWithFacebookNative();
            break;
        }
      } else {
        console.log('Sign in browser popup with provider', providerName);
        authResponse = await this.signInBrowser(this.getBrowserProvider(providerName));
        console.log('Sign in response', authResponse);
      }
    } catch (error) {
      // Se já existir uma conta com provider A e email X e ele tentar logar com provider B e email X
      // eu jogo um alert explicando pq ele nao pode fazer isso
      if (error.code === "auth/account-exists-with-different-credential") {
        this.providerCollisionAlert(providerName);
      } else {
        this.toast(
          "Ocorreu um erro ao fazer o login. Por favor tente novamente."
        );
      }
    }
  }

  providerCollisionAlert(providerName: string): void {
    const alert = this.alertController.create({
      title: "Email associado a outra conta no Naname",
      message: `O seu email do ${providerName} já está em uso no nosso sistema. Você deve logar usando ${this.getProviderOpositeName(
        providerName
      )}.`,
      buttons: ["Ok"]
    });
    alert.present();
  }

  getProviderOpositeName(providerName: string) {
    if (providerName == "google") {
      return "facebook";
    }
    return "google";
  }
  getBrowserProvider = providerName => {
    switch (providerName) {
      case "google":
        return new firebase.auth.GoogleAuthProvider();
      case "facebook":
        return new firebase.auth.FacebookAuthProvider();
    }
  };

  async signInBrowser(ProviderInstance) {
    try {

      const authResponse = await this.afAuth.auth.signInWithPopup(
        ProviderInstance
      );
      return authResponse.user;
    } catch (error) {
      console.error("Error login google browser", error);
      throw error;
    }
  }
  async signInWithFacebookNative() {
    const response = await this.fb.login(["email", "public_profile"]);
    return await this.afAuth.auth.signInWithCredential(
      firebase.auth.FacebookAuthProvider.credential(
        response.authResponse.accessToken
      )
    );
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

  createUserIfNeeded(userData) {
    const userToAdd = {
      id: userData.uid,
      name: userData.displayName,
      email: userData.email,
      profilePhotoURL: userData.photoURL
    };
    return this.afs.collection("users").doc(userToAdd.id).set(userToAdd, { merge: true });
  }
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
    console.log('Loggin out');
    this.afAuth.auth.signOut();
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
    if (this.user.partnership_id) {
      return this.afs
        .collection("partnerships")
        .doc(this.user.partnership_id)
        .collection("chosenNames");
    } else {
      return this.getMyUserRef()
        .collection("chosenNames");
    }
  }

  // Partnership

  /**
   * Add partner
   * @param email Email address to be added as partner
   */
  async addPartner(email: string): Promise<void> {
    try {
      if (!email) {
        throw new PartnerError("Você não informou nenhum email");
      }
      // Verifico se ele não informou o próprio email
      if (email == this.user.email) {
        throw new PartnerError("Você informou o seu próprio email");
      }
      // Verifico se ele informou um usuario do sistema
      const targetUserQuery = await this.afs
        .collection("users")
        .ref.where("email", "==", email)
        .get();
      // console.log('QUERY COM EMAIL', email);
      // console.log('QUERY QUERY RESULT', targetUserQuery);
      if (targetUserQuery.empty) {
        throw new PartnerError("Você informou um email que não existe no sistema.");
      }
      const targetUser = targetUserQuery.docs[0];
      if (targetUser.get("partner_id")) {
        throw new PartnerError("O usuário que você tentou adicionar já possui um parceiro.");
      }
      const targetUserRef = this.afs.collection("users").doc(targetUser.id);
      //Verifico se o id dele está na minha lista de bloqueados
      const imBlocked = await targetUserRef
        .collection("blockedUsers")
        .doc(this.user.id)
        .ref.get();
      if (imBlocked.exists) {
        throw new PartnerError("Você está bloqueado por este usuário e não pode adicioná-lo como parceiro.");
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

      const promises = [];
      const userChosenNames = await this.myUserRef().collection('chosenNames').ref.get();
      userChosenNames.forEach(chosenName => {
        promises.push(this.chosenNamesRef().doc(chosenName.id).set({ owners: { [this.user.id]: true }, }, { merge: true }));
      });
      const targetChosenNames = await targetUserRef.collection('chosenNames').ref.get();
      targetChosenNames.forEach(chosenName => {
        promises.push(this.chosenNamesRef().doc(chosenName.id).set({ owners: { [this.user.partner_id]: true } }, { merge: true }));
      });
      await Promise.all(promises);
      // DONE!
    } catch (error) {
      console.log(error);
      console.log(typeof error);
      if (error instanceof PartnerError) {
        const alert = this.alertController.create({
          title: "Ops, algo deu errado!",
          message: error.message,
          buttons: ["ok"]
        });
        alert.present();

      } else {
        this.toast('Ocorreu um erro ao tentar adicionar o seu parceiro.');
      }
    }
  }
  /**
   * Remove partner
   */
  async removePartner(partner: any): Promise<void> {
    try {
      const chosenNames = await this.chosenNamesRef().ref.get();

      const promises = [];
      const myNames = [];
      const partnerNames = [];
      const partnershipId = this.user.partnership_id;

      chosenNames.forEach(chosenName => {

        let chosenNameData: any = { ...chosenName.data(), id: chosenName.id };

        if (typeof chosenNameData.owners[this.user.id] != 'undefined') {
          myNames.push({ ...chosenNameData, owners: { [this.user.id]: true } });
        }
        if (typeof chosenNameData.owners[this.partner.id] != 'undefined') {
          partnerNames.push({ ...chosenNameData, owners: { [this.partner.id]: true } });
        }
      });

      myNames.forEach(name => {
        promises.push(this.myUserRef().collection('chosenNames').doc(name.id).set(name));
      });
      partnerNames.forEach(name => {
        promises.push(this.partnerRef().collection('chosenNames').doc(name.id).set(name));
      });

      console.log('My names', myNames);
      console.log('Partner names', partnerNames);
      console.log('GEt my ref', this.myUserRef());
      console.log('GEt partner ref', this.partnerRef());
      Promise.all(promises);

      // DELETA O PARTNER PRIMEIRO PQ DEOPIS DELE O PARTNER DO MY USER AI NAO TEM MAIS O ID DO PARTNER
      // PQ ELE FOI DELETADO KKK
      await this.partnerRef().update({ partner_id: null, partnership_id: null });
      await this.myUserRef().update({ partner_id: null, partnership_id: null });
      await this.afs.collection('partnerships').doc(partnershipId).delete();
    } catch (error) {
      console.error(error);
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

  // Names
  getNamesCacheRef() {
    return this.getMyUserRef().collection("namesCache");
  }
  async choseName(name: any, like: boolean) {
    console.log("ESCOLHI NOME");
    console.log("LIKE?", like);
    try {
      if (like) {
        await this.chosenNamesRef()
          .doc(name.id)
          .set({ owners: { [this.user.id]: true } }, { merge: true });
      }
      await this.myUserRef()
        .collection("namesCache")
        .doc(name.id)
        .delete();
    } catch (error) {
      this.toast('Ocorreu um erro ao tentar escolher o nome');
    }

  }
  async removeChosenName(id: string) {
    console.log("Removendo nome", id);
    try {
      const chosenName = await this.chosenNamesRef().doc(id).ref.get();
      if (chosenName.exists) {
        let name = chosenName.data();
        console.log('name before remove owner', name);
        delete name.owners[this.user.id];
        if (_.isEmpty(name.owners)) {
          await this.chosenNamesRef().doc(id).delete();
        } else {
          console.log('Update name removendo o owners meu', name);
          await this.chosenNamesRef().doc(id).update(name);
        }
      }
    } catch (error) {
      this.toast("Ocorreu um erro ao tentar remover o nome da sua lista de escolhas");
    }
  }
  async cacheNamesIfNeeded() {
    try {
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
    } catch (error) {
      console.error(error);
      this.toast('Ocorreu um erro ao fazer o cache dos nomes.');
    }
  }
  async getNamesToChose(limit: number, conditions = null) {
    try {
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
    } catch (error) {
      this.toast('Ocorreu um erro ao carregar os nomes.');
    }
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
      return "Menino e Menina";
    }
    return this.user.gender === "m" ? "Menino" : "Menina";
  }

  async addCustomNameIfNeeded(name: string, gender: string) {
    try {
      name = this.sanitazeName(name);
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
          first_letter: name.charAt(0).toLowerCase(),
          aproved: false
        };
        const response = await this.afs.collection("names").add(newName);
        nameId = response.id;
        // Se existe eu simplesmente pego o id do que já existe
      } else {
        nameId = hasName.docs[0].id;
      }

      // GAMBIIII ALERT!!!!!!!!!!!
      // Gambi add o id depois que ja adicionei ali em cima
      // Adiciono o id do nome(criado ou que já existia) e adiciono nos chosen
      const responsenameToAddId = await this.afs.collection("names").doc(nameId).ref.get();
      if (responsenameToAddId.exists) {
        await this.afs.collection("names").doc(nameId).set({ id: nameId }, { merge: true });
      }

      await this.chosenNamesRef()
        .doc(nameId)
        .set({ id: nameId, owners: { [this.user.id]: true } }, { merge: true });
    } catch (error) {
      this.toast('Erro ao tentar adicionar o nome.');
    }
  }
  sanitazeName(name: string): string {
    let nameArray = name.split(' ');
    nameArray = nameArray.map(name => {
      name = name.toLowerCase();
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    return nameArray.join(' ');
  }
}

export class PartnerError {
  message: string;
  constructor(message: string) {
    this.message = message;
    console.error(this.message);
  }
}