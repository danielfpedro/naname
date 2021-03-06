import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import {
  AngularFirestore,
  AngularFirestoreDocument,
  CollectionReference,
  DocumentReference,
} from "@angular/fire/firestore";
import { Facebook } from "@ionic-native/facebook";
import { GooglePlus } from "@ionic-native/google-plus";
import { Storage } from "@ionic/storage";
import { AlertController, App, Platform, ToastController, LoadingOptions, LoadingController, Loading } from "ionic-angular";
import * as _ from "lodash";
import { of, Subject, Subscribable, Subscription } from "rxjs";
import { mergeMap, delay, take } from "rxjs/operators";
import { FirebaseFirestore } from "@angular/fire";
import { auth } from "firebase";
import { HttpClient } from "@angular/common/http";
import { stringify } from "@angular/core/src/util";

@Injectable()
export class AuthProvider {

  public userId: string = null;

  choicesLimit = 50;
  public userDoc: AngularFirestoreDocument;

  public user: any = null;
  public partner: any = null;
  public blockedUsers = [];

  public partnerLoaded = false;

  public isLoggedIn = false;

  // Names
  maxChosenNames = 50;

  watchFirebaseAuthState: Subject<boolean> = new Subject();
  initThingsIsDone: Subject<void> = new Subject();

  // Names Cache
  cacheNamesListen: Subject<void> = new Subject();
  namesCacheTotal = 0;
  namesCacheCurrent = 0;
  namesCacheProgress = 0;

  authStateFirstCheck: boolean;
  partnerChange = new Subject();
  // Object with two users (currentUser and partner) to easely fetch their profiles
  // across the app
  actors = {};

  userSignedIn = null;
  /**
   * Pedung names list interatinons
   */
  namesListPendingInterations = 0;
  namesChunkSize = 10;

  choiceQueue = new Subject();
  choicesWaiting = [];
  sendingChoice = false;

  userSubscription: Subscription;

  // Quando o user já está watchado a gente da um next aqui
  public readyToRock = new Subject();

  constructor(
    private platform: Platform,
    private fb: Facebook,
    private afAuth: AngularFireAuth,
    public app: App,
    public storage: Storage,
    private afs: AngularFirestore,
    private alertController: AlertController,
    private toastCtrl: ToastController,
    public gPlus: GooglePlus,
    private loadingController: LoadingController,
    private http: HttpClient
  ) {


  }

  watchUser() {
    this.userSubscription = this.afs
      .collection("users")
      .doc(this.userId)
      .snapshotChanges()
      // .pipe(take(1))
      .subscribe(user => {
        console.log('User changed');
        this.user = user.payload.data();

        this.actors[this.user.id] = this.user;
        if (this.user.partner) {
          this.actors[this.user.partner_id] = this.user.partner;
        }

        this.readyToRock.next();
      });
  }

  // old() {
  //   this.afAuth.authState
  //     .pipe(
  //       mergeMap(userSignedIn => {
  //         this.userSignedIn = userSignedIn;
  //         if (userSignedIn) {
  //           return this.createUserIfNeeded(userSignedIn);
  //         }
  //         return of(null);
  //       }),
  //       mergeMap(nothingHere => {
  //         // console.log('Is user signed in?', this.userSignedIn);

  //         if (this.userSignedIn) {
  //           // console.log('Yes it is');
  //           return this.afs
  //             .collection("users")
  //             .doc(this.userSignedIn.uid)
  //             .snapshotChanges();
  //         }
  //         this.user = null;
  //         return of(null);
  //       }),
  //       mergeMap(userDoc => {
  //         // console.log('Result of user doc', userDoc);
  //         // Se for undefined ele estava logado mas o usuário foi deletado, então a gente signout ele
  //         if (userDoc === null) {
  //           this.user = null;
  //           return of(null);
  //         } else if (!userDoc.payload.exists) {
  //           // console.log('User does not exists, we are signing out here');
  //           this.user = null;
  //           this.afAuth.auth.signOut();
  //         }

  //         this.user = userDoc.payload.data();
  //         // console.log('Now the value of authProvider.user is', this.user);
  //         if (this.user) {
  //           // populate actors object with user doc, this variable will be thourgh the app
  //           // so we tech user and partner(if has it) only this time
  //           this.actors[this.user.id] = this.user;
  //         }
  //         // Se tem partner pego ele
  //         if (this.user && this.user.partner_id) {
  //           // console.log('Has partner_id, fetch partner profile');
  //           return this.afs
  //             .collection("users")
  //             .doc(this.user.partner_id)
  //             .ref.get();
  //         } else {
  //           // console.log('Has NOT partner_id, fetch partner profile');
  //         }
  //         return of(null);
  //       })
  //     )
  //     .subscribe(partner => {
  //       // IMPORTANTE!!!!!!!!!!!!!!!!
  //       // Se o partner_id for de um user que não existe(fluxo normal nunca vai acontecer mas estamos antecipando um bug)
  //       // transformamos partner_id para nul... pois o bug ocorreria do usuario ficar com partner_id de um user que não existe
  //       // e o parceiro querendo adicionar mas não consegue que iria dizer que o cara já tem parceiro.. porem o parceiro não existe
  //       // ele nem conseguiria remover... então resultaria em um bug impossivel de resolver para o usuario
  //       if (partner && !partner.exists) {
  //         this.myUserRef().set({ partner_id: null }, { merge: true });
  //       }
  //       this.partner = partner && partner.exists ? partner.data() : null;
  //       if (this.partner) {
  //         this.actors[this.user.partner_id] = this.partner;
  //       }

  //       // console.log('this.user value', this.user);
  //       // console.log('this.isLoggedIn value', this.isLoggedIn);
  //       // console.log('Next no watch firebase State is', (this.isLoggedIn && this.user));
  //       // console.log('THIS PARTNER', this.partner);
  //       // console.log('PARTNER', partner);
  //       // console.log('THIS AUTH PROVIDER', this);

  //       this.watchFirebaseAuthState.next(this.user);
  //       // this.initThingsIsDone.complete();
  //     });
  // }

  // initThings(): void {

  // }

  async signIn(providerName: string): Promise<void> {
    try {
      let authResponse = null;
      // await this.afs.collection('logs').add({ error: 'Is cordova?' });
      if (this.platform.is("cordova")) {
        // await this.afs.collection('logs').add({ error: 'É cordova' });
        switch (providerName) {
          case "google":
            // await this.afs.collection('logs').add({ error: 'É google' });
            authResponse = await this.sigInGoogleNative();
            // await this.afs.collection('logs').add({ error: 'Logou finese no google' });
            break;
          case "facebook":
            authResponse = await this.signInWithFacebookNative();
            break;
        }
      } else {
        console.log('Sign in browser popup with provider', providerName);
        authResponse = await this.signInBrowser(this.getBrowserProvider(providerName));
      }

      // await this.afs.collection('logs').add({ error: 'Auth response ok, agora salva ou edita' });

      await this.createUserIfNeeded(authResponse);

      // await this.afs.collection('logs').add({ error: 'Salvou editou fino' });

      await this.storage.set('first_time', true);

      // await this.afs.collection('logs').add({ error: 'setou first time... fim' });

      console.log('Sign in response', authResponse);

    } catch (error) {
      console.error('Login error: ', error);
      // Se já existir uma conta com provider A e email X e ele tentar logar com provider B e email X
      // eu jogo um alert explicando pq ele nao pode fazer isso
      if (error.code === "auth/account-exists-with-different-credential") {
        this.providerCollisionAlert(providerName);
      } else if (error.code === 'auth/popup-closed-by-user') {
        this.toast('Você cancelou o Login.');
      } else {
        this.toast('Ocorreu um erro ao fazer o login.');
        // await this.afs.collection('logs').add({ error: error });
        throw error;
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
        return new auth.GoogleAuthProvider()
      case "facebook":
        return new auth.FacebookAuthProvider();
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
      auth.FacebookAuthProvider.credential(
        response.authResponse.accessToken
      )
    );
  }
  async sigInGoogleNative() {
    try {
      const loginResponse = await this.gPlus.login({
        webClientId: '423286092881-nqmi0kad7tcnfm314ev9evq3uehb96ho.apps.googleusercontent.com',
        scopes: 'profile email',
        offline: true
      });

      // await this.afs.collection('logs').add({ error: 'Native response' });
      // await this.afs.collection('logs').add({ error: JSON.stringify(loginResponse) });

      console.log("GOOGLE LOGUN NATIVE RESPONSE", loginResponse);
      return await this.afAuth.auth.signInWithCredential(
        auth.GoogleAuthProvider.credential(loginResponse.idToken)
      );
    } catch (error) {
      console.error("Error login google native", error);
      throw error;
    }
  }

  async createUserIfNeeded(userData) {
    console.log('USER TO UPDATE OR CREATE', userData);

    try {
      const userToAdd = {
        id: userData.uid,
        name: userData.displayName,
        email: userData.email,
        profilePhotoURL: userData.photoURL,
        provider_name: userData.providerData[0].providerId == 'google.com' ? 'Google' : 'Facebook'
      };
      await this.afs.collection("users").doc(userToAdd.id).set(userToAdd, { merge: true });
    } catch (error) {
      throw error;
    }
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

  async logout() {
    console.log('Loggin out');
    const loader = this.customLoading('Saindo, aguarde...');
    loader.present();
    console.log('Apresentou loader');
    await this.afAuth.auth.signOut();
    console.log('Logout firebase');
    await this.userSubscription.unsubscribe();
    console.log('Unsubscribe users');
    loader.dismiss();
    console.log('Loader dismiss');
    this.app.getRootNav().setRoot('LoginPage');
    console.log('Setou root');
  }
  // Refs
  myUserRef(raw = false) {
    return this.afs.collection("users").doc(this.user.id);
  }
  myUserRawRef(): DocumentReference {
    return this.afs.firestore.collection("users").doc(this.user.id);
  }
  namesRef() {
    return this.afs.collection("names");
  }
  partnerRef(): AngularFirestoreDocument<any> {
    return this.afs.collection("users").doc(this.user.partner.id);
  }
  blockedUsersRef() {
    return this.myUserRef().collection("blockedUsers");
  }
  chosenNamesRawRef(): CollectionReference {
    if (this.user.partnership_id) {
      return this.afs.firestore
        .collection("partnerships")
        .doc(this.user.partnership_id)
        .collection("chosenNames");
    } else {
      return this.afs.firestore.collection('users').doc(this.user.id)
        .collection("chosenNames");
    }
  }
  chosenNamesRef() {
    if (this.user.partnership_id) {
      return this.afs
        .collection("partnerships")
        .doc(this.user.partnership_id)
        .collection("chosenNames");
    } else {
      return this.myUserRef()
        .collection("chosenNames");
    }
  }

  firestoreRef(raw): FirebaseFirestore | AngularFirestore {
    if (raw) {
      return this.afs.firestore;
    }

    return this.afs;
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
      const jwt = await auth().currentUser.getIdToken(true);
      await this.http.post('https://us-central1-nename-d08b1.cloudfunctions.net/add_partner ', { email: email, jwt: jwt }).toPromise();
    } catch (error) {
      if (error.status == 400) {
        const alert = this.alertController.create({
          title: "Ops, algo deu errado!",
          message: error.error.message,
          buttons: ["ok"]
        });
        alert.present();

        throw error;
        
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
      const jwt = await auth().currentUser.getIdToken(true);
      await this.http.post('https://us-central1-nename-d08b1.cloudfunctions.net/remove_partner', { jwt: jwt }).toPromise();

      /**
      const chosenNames = await this.chosenNamesRef().ref.get();

      const partnershipId = this.user.partnership_id;
      const partnerId = this.user.partner.id

      const batch = this.afs.firestore.batch();
      chosenNames.forEach(chosenName => {
        let chosenNameData: any = { ...chosenName.data(), id: chosenName.id };
        if (typeof chosenNameData.owners[this.user.id] != 'undefined') {

          const chosenNamesRef = this.afs.firestore.collection('users').doc(this.user.id).collection('chosenNames').doc(chosenName.id);
          batch.set(chosenNamesRef, { ...chosenNameData, owners: { [this.user.id]: true } });
          // myNames.push({ ...chosenNameData, owners: { [this.user.id]: true } });
        }
        if (typeof chosenNameData.owners[partnerId] != 'undefined') {
          const chosenNamesRef = this.afs.firestore.collection('users').doc(partnerId).collection('chosenNames').doc(chosenName.id);
          batch.set(chosenNamesRef, { ...chosenNameData, owners: { [partnerId]: true } });
          // partnerNames.push({ ...chosenNameData, owners: { [this.partner.id]: true } });
        }
      });

      // Set null my
      batch.update(this.afs.firestore.collection('users').doc(this.user.id), { partner_id: null, partnership_id: null });
      // Set null partner
      batch.update(this.afs.firestore.collection('users').doc(partnerId), { partner_id: null, partnership_id: null });
      // await this.myUserRef().update({ partner_id: null, partnership_id: null });
      batch.delete(this.afs.firestore.collection('partnerships').doc(partnershipId));

      await batch.commit();
      **/
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
        .set({ name: userToBeBlocked.name, email: userToBeBlocked.email, profilePhotoURL: userToBeBlocked.profilePhotoURL });
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
      console.error(error);
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

  async chooseNameDesespero(name: any, like: boolean) {
    try {

      let batch = this.afs.firestore.batch();
      if (like) {
        // Marco a escolha
        batch.set(this.chosenNamesRawRef().doc(name.id), { ...name, owners: { [this.user.id]: true } }, { merge: true });

        // const me = await this.myUserRawRef().get();
        batch.update(this.myUserRawRef(), { total_choices: ((this.user.total_choices || 0) + 1) });
      }
      // Delet o nome do cache dele
      batch.delete(this.myUserRawRef().collection("namesCache").doc(name.id));
      // batch.commit();

      await batch.commit();

    } catch (error) {
      console.error(error);
      this.toast('Ocorreu um erro ao tentar escolher o nome');
    } finally {
    }
  }

  async chooseName(name: any, like: boolean) {
    this.namesListPendingInterations += 1;
    try {

      let batch = this.afs.firestore.batch();
      if (like) {
        // Marco a escolha
        batch.set(this.chosenNamesRawRef().doc(name.id), { ...name, owners: { [this.user.id]: true } }, { merge: true });

        // const me = await this.myUserRawRef().get();
        batch.update(this.myUserRawRef(), { total_choices: ((this.user.total_choices || 0) + 1) });
      }
      // Delet o nome do cache dele
      batch.delete(this.myUserRawRef().collection("namesCache").doc(name.id));
      // batch.commit();

      this.choicesWaiting.push(batch);
      this.sendChoice();
    } catch (error) {
      console.error(error);
      this.toast('Ocorreu um erro ao tentar escolher o nome');
    } finally {
      this.namesListPendingInterations -= 1;
    }
  }

  async sendChoice() {
    if (!this.sendingChoice) {
      this.sendingChoice = true;
      const toSend = this.choicesWaiting.pop();
      await toSend.commit();

      this.sendingChoice = false;
    } else {
      setTimeout(() => {
        this.sendChoice();
      }, 500);
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
        const me = await this.myUserRawRef().get();
        await me.ref.update({ total_choices: ((me.get('total_choices') || 0) - 1) });
      }
    } catch (error) {
      this.toast("Ocorreu um erro ao tentar remover o nome da sua lista de escolhas");
    }
  }
  async allNames() {
    try {
      const names = await this.afs
        .collection("names", ref => {
          let query:
            | firebase.firestore.CollectionReference
            | firebase.firestore.Query = ref;
          if (this.user.names_cache_last_update) {
            query = query.where(
              "created_at",
              ">",
              this.user.names_cache_last_update
            );
          }
          // Somente aprovados
          query = query.where("approved", "==", true);
          return query;
        })
        .get()
        .toPromise();

      const output = [];
      names.docs.forEach(name => {
        output.push({ ...name.data(), id: name.id });
      });

      console.log('Output', output);
      console.log('Output length', output.length);
      this.namesCacheTotal = output.length;
      this.namesCacheCurrent = 0;
      return output;

    } catch (error) {
      console.error(error);
    }
  }
  async waiting(waitTime: number): Promise<void> {
    return await of(null).pipe(delay(waitTime)).toPromise();
  }

  async tey(names) {
    const limit = 250;
    const chunk = _.chunk(names, limit);

    if (chunk.length < 1) {
      await this.myUserRef().set({ names_cache_last_update: new Date() }, { merge: true });
      this.cacheNamesListen.complete();
      return;
    }

    let output = chunk.slice(0);
    output.shift();
    output = _.flatten(output);

    const batch = this.afs.firestore.batch();
    chunk[0].map(name => {
      batch.set(this.afs.firestore.collection('users').doc(this.user.id).collection('namesCache').doc(name.id), name);
    });
    console.log('Waitnig batch commit', chunk[0]);
    await batch.commit();


    // this.waiting(5000);

    // console.log('Delay here... not doing nothing.. thats wwhat i think its happening lol');
    // await this.waiting(500);
    this.namesCacheCurrent = this.namesCacheCurrent + chunk[0].length;
    this.namesCacheProgress = parseInt(((100 * this.namesCacheCurrent) / this.namesCacheTotal).toFixed(0));

    this.cacheNamesListen.next();
    this.tey(output);
  }
  isChoicesLimitReached(): boolean {
    return (parseInt(this.user.total_choices || 0) >= this.choicesLimit);
  }

  async getNamesToChoose(conditions = null) {

    try {
      let limit = this.choicesLimit - this.user.total_choices;
      limit = limit < this.namesChunkSize ? limit : this.namesChunkSize;

      const namesRef = this.getMyUserRef().collection("namesCache", ref => {
        let query:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;
        if (this.user.gender) {
          query = query.where("gender", "==", this.user.gender);
        }
        if (conditions && conditions.firstLetter) {
          query = query.where("first_letter", "==", conditions.firstLetter);
        }
        if (conditions.categoryId) {
          query = query.where(
            "category_id", '==', conditions.categoryId
          );
        }
        query = query.limit(limit);
        return query;
      });

      return await namesRef.get().toPromise();

    } catch (error) {
      console.log('eRROR', error instanceof ChoicesLimitReached);
      if (error instanceof ChoicesLimitReached) {
        throw error;
      } else {
        this.toast('Ocorreu um erro ao carregar os nomes.');
      }
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

  alertChoicesReached(): void {
    const alert = this.alertController.create({
      title: 'Limite excedido',
      message: `Você pode escolher no máximo ${this.choicesLimit}. Caso você queira escolher mas nomes você deve remover alguns da sua lista`,
      buttons: ['Ok']
    });
    alert.present();
  }

  async addCustomNameIfNeeded(nameString: string, gender: string) {
    if ((this.user.total_choices || 0) >= this.choicesLimit) {
      this.alertChoicesReached();
      return;
    }
    try {
      nameString = this.sanitazeName(nameString);
      // Checo se o nome já existe
      const hasName = await this.afs
        .collection("names")
        .ref.where("name", "==", nameString)
        .get();

      console.log('Leu nome joia');

      let nameData = null;
      let nameId = null;

      // Se nao existe eu adiciono nos nomes como nao aprovados
      const batch = this.afs.firestore.batch();
      if (hasName.size < 1) {
        const newName = {
          name: nameString,
          gender: gender,
          first_letter: nameString.charAt(0).toLowerCase(),
          approved: false
        };
        const response = await this.afs.collection("names").add(newName);
        nameData = newName;
        nameId = response.id;
        // Se existe eu simplesmente pego o id do que já existe
      } else {
        const name = hasName.docs[0];
        nameId = name.id;
        nameData = name.data();
      }

      // GAMBIIII ALERT!!!!!!!!!!!
      // Gambi add o id depois que ja adicionei ali em cima
      // Adiciono o id do nome(criado ou que já existia) e adiciono nos chosen
      // const responsenameToAddId = await this.afs.collection("names").doc(nameId).ref.get();
      // if (responsenameToAddId.exists) {
      //   await this.afs.collection("names").doc(nameId).set({ id: nameId }, { merge: true });
      // }

      // await this.afs.collection("names").doc(nameId).set({ id: nameId }, { merge: true });
      await this.chosenNamesRef()
        .doc(nameId)
        .set({ ...nameData, owners: { [this.user.id]: true } }, { merge: true });

      const me = await this.myUserRawRef().get();
      await me.ref.update({ total_choices: ((me.get('total_choices') || 0) + 1) });

    } catch (error) {
      console.error(error);
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

  async blockedUsersLimited() {
    try {
      return await this.blockedUsersRef().ref.limit(50).get();
      // console.log('Response', response.docs);
    } catch (error) {
      console.log(error);
      this.toast('Ocorreu um erro ao tentar mostrar os seus usuários bloqueados.');
    }
  }

  async isCacheNamesNeeded(): Promise<boolean> {
    const response = await this.afs.collection('settings').doc('names').ref.get();
    const userData = await this.afs.collection('users').doc(this.userId).ref.get();
    console.log('Caralho');
    if (typeof userData.data().names_cache_last_update == 'undefined' || !userData.data().names_cache_last_update || userData.data().names_cache_last_update < response.data().last_update) {
      return true;
    }
    return false;
  }

  customLoading(message = 'Carregando, aguarde...'): Loading {
    const loader = this.loadingController.create({
      spinner: 'hide',
      content: `<div class="text-center"><img src="/assets/imgs/bebe.png" class="nename-img-loader-ionic teeter"><h3 style="padding:0;margin:0;" class="margin-top">${message}</h3></div>`
    });

    return loader;
  }

}

export class ChoicesLimitReached {
  constructor() {
    console.error('Máximo de nomes para escolher atingido');
  }
}
export class PartnerError {
  message: string;
  constructor(message: string) {
    this.message = message;
    console.error(this.message);
  }


}