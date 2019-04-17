import { Component, ViewChild } from "@angular/core";
import {
  IonicPage,
  ActionSheetController,
  LoadingController,
  ModalController,
  Content,
  AlertController,
} from "ionic-angular";

import {
  AngularFirestore,
} from "@angular/fire/firestore";
import { AuthProvider } from "../../providers/auth/auth";
import { SocialSharing } from "@ionic-native/social-sharing";
import { mergeMap, map, switchMap } from "rxjs/operators";
import _ from "lodash";
import { Subscription } from "rxjs";

@IonicPage()
@Component({
  selector: "page-chosen-list",
  templateUrl: "chosen-list.html"
})
export class ChosenListPage {

  @ViewChild(Content) content: Content;

  poolBaseUrl = 'https://nename.app/enquete';

  term = "";
  gender = "";
  names = [];
  totalVotes = { m: { total: 0, total_votes: 0 }, f: { total: 0, total_votes: 0 } };
  hasMultiGender = false;
  loadingChoices: boolean;

  namesSubscription: Subscription;

  constructor(
    public authProvider: AuthProvider,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController,
    public socialSharing: SocialSharing,
    public afs: AngularFirestore,
    public modalController: ModalController,
    private alertController: AlertController
  ) { }

  ionViewDidLoad() {


    this.loadingChoices = true;
    this.authProvider
      .myUserRef()
      .snapshotChanges()
      .pipe(
        switchMap(user => {
          return this.authProvider
            .chosenNamesRef()
            .snapshotChanges()
            .pipe(map(res => {
              return res.map(name => {
                return { ...name.payload.doc.data(), total_votes: name.payload.doc.data().total_votes || 0, id: name.payload.doc.id };
              });
            }));
        })
      )
      .subscribe(res => {
        console.log('Chosen names snapshot', res);
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
        console.log(`Names length`, this.names.length);
        console.log(`Fuckign names`, this.names);
        console.log(`Loading choices`, this.loadingChoices);
        this.content.resize();

      });
  }
  getOwners(owners) {
    return _.map(owners, (owner, key) => {
      console.log('ACTORS', this.authProvider.actors);
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
      console.log("Name after ownersProfile", name);
      console.log('Total votes', this.totalVotes);

      if (typeof name.gender != 'undefined' && (name.gender == 'f' || name.gender == 'm')) {
        this.totalVotes[name.gender].total += 1;
        this.totalVotes[name.gender].total_votes += parseInt(name.total_votes) || 0;
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
    console.log('Name to send', name);
    const loader = this.authProvider.customLoading("Removendo nome da sua lista, por favor aguarde...");
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
    if (this.authProvider.isChoicesLimitReached()) {
      const alert = this.alertController.create({
        title: 'Limite atingido',
        message: `Você atingiu o limite de nomes que é de ${this.authProvider.choicesLimit}. Você pode deletar alguns nomes para liberar espaço.`,
        buttons: ['Ok']
      });
      alert.present();
      return;
    }
    const modal = this.modalController.create("AddNamePage");
    modal.present();
  }

  swipeEvent(event) {
    if (event.direction === 2) {
      this.gender = 'f';
    } else {
      this.gender = 'm';
    }
  }

}
