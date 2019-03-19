import { Component, ViewChild } from "@angular/core";
import {
  IonicPage,
  ActionSheetController,
  LoadingController,
  ModalController,
  Content,
} from "ionic-angular";

import {
  AngularFirestore,
} from "@angular/fire/firestore";
import { AuthProvider } from "../../providers/auth/auth";
import { SocialSharing } from "@ionic-native/social-sharing";
import { mergeMap, map, switchMap } from "rxjs/operators";
import _ from "lodash";

@IonicPage()
@Component({
  selector: "page-chosen-list",
  templateUrl: "chosen-list.html"
})
export class ChosenListPage {

  @ViewChild(Content) content: Content;

  poolBaseUrl = 'https://nenem-381db.firebaseapp.com/enquete';

  term = "";
  gender = "";
  names = [];
  totalVotes = { m: { total: 0, total_votes: 0 }, f: { total: 0, total_votes: 0 } };
  hasMultiGender = false;
  loadingChoices: boolean;

  constructor(
    public authProvider: AuthProvider,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController,
    public socialSharing: SocialSharing,
    public afs: AngularFirestore,
    public modalController: ModalController,
  ) { }

  ionViewDidLoad() {


    this.loadingChoices = true;
    this.authProvider
      .myUserRef()
      .snapshotChanges()
      .pipe(
        mergeMap(user => {
          return this.authProvider
            .chosenNamesRef()
            .snapshotChanges();
        }),
        switchMap(chosenNames => {
          const promises = chosenNames.map(chosenName => {
            return this.afs
              .collection("names")
              .doc(chosenName.payload.doc.id)
              .get()
              .pipe(
                map(name => {
                  return {
                    ...name.data(),
                    id: name.id,
                    total_votes: chosenName.payload.doc.data().total_votes || 0,
                    owners: chosenName.payload.doc.data().owners || {}
                  };
                })
              )
              .toPromise();
          });
          return Promise.all(promises);
        })
      )
      .subscribe(res => {
        this.loadingChoices = false;
        this.totalVotes = { m: { total: 0, total_votes: 0 }, f: { total: 0, total_votes: 0 } };
        const names = this.countVotes(res);
        this.names = this.calculatePercentageOnNames(names);
        this.hasMultiGender = this.totalVotes.m.total > 0 && this.totalVotes.f.total > 0;
        if (this.hasMultiGender) {
          this.gender = 'm';
        } else {
          // imoprtante pq se ele estiver na aba feminino e a aba femino só tiver um nome e ele
          // deletar este nome some as abas e os nome sque estavam na aba masculino ficam invisiveis
          this.gender = '';
        }

        this.content.resize();

      });
  }
  getOwners(owners) {
    return _.map(owners, (owner, key) => {
      if (typeof this.authProvider.actors[key] != 'undefined') {
        return this.authProvider.actors[key];
      }
    });
  }
  countVotes(names): [] {
    console.log('Names to count', names);

    return names.map((name: any) => {
      console.log("Name to insert to this.names", name);
      name.ownersProfiles = this.getOwners(name.owners);
      console.log('Total votes', this.totalVotes);

      if (typeof name.gender != 'undefined' && (name.gender == 'f' || name.gender == 'm')) {
        this.totalVotes[name.gender].total += 1;
        this.totalVotes[name.gender].total_votes += parseInt(name.total_votes || 0);
      }
      return name;
    });
  }
  calculatePercentageOnNames(names): [] {
    return names.map(name => {
      return {
        ...name,
        porcentage: this.getPercentage(name)
      };
    });
  }
  presentNameActionSheetOption(chosen: any) {
    console.log("CHOSEN", chosen);
    if (
      chosen.owners &&
      typeof chosen.owners[this.authProvider.user.id] == "undefined"
    ) {
      this.authProvider.toast(
        "Você não pode remover da lista o nome que somente o seu parceiro adicionou.",
        4000
      );
      return;
    }
    const actionSheet = this.actionSheetCtrl.create({
      title: "Opções",
      buttons: [
        {
          text: "Remover nome",
          role: "destructive",
          handler: () => {
            this.removeName(chosen);
          }
        },
        {
          text: "Cancelar",
          role: "cancel",
          handler: () => {
            console.log("Cancel clicked");
          }
        }
      ]
    });
    actionSheet.present();
  }

  async removeName(name) {
    const loader = this.loadingCtrl.create({
      content: "Removendo nome da sua lista, por favor aguarde..."
    });
    loader.present();
    await this.authProvider.removeChosenName(name.id);
    loader.dismiss();
  }

  share() {
    this.socialSharing.share(
      "Escolhe o nome do filhão ai meu amigo, é divertix",
      "Aqui o assunto não sei a diferença",
      null,
      this.getPoolUrl()
    );
  }

  getPoolUrl() {
    return `${this.poolBaseUrl}/${this.authProvider.user.id}`;
  }
  getPercentage(name: any) {
    if (typeof name.gender == 'undefined' || this.totalVotes[name.gender].total_votes < 1) {
      return 0;
    }
    return ((name.total_votes * 100) / this.totalVotes[name.gender].total_votes).toFixed(0);
  }

  onNameClick(name) {
    console.log("clicou no nome");
    const modal = this.modalController.create("VotesPage", {
      name: name
    });
    modal.present();
  }
  openAddName() {
    const modal = this.modalController.create("AddNamePage");
    modal.present();
  }
}
