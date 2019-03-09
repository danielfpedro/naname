import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ActionSheetController,
  LoadingController,
  ModalController,
  AlertController
} from "ionic-angular";
import { NamesProvider } from "../../providers/names/names";

import {
  AngularFirestore,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { AuthProvider } from "../../providers/auth/auth";
import { SocialSharing } from "@ionic-native/social-sharing";
import { Subject, of } from "rxjs";
import { m } from "@angular/core/src/render3";
import { mergeMap, map } from "rxjs/operators";
import { mergeNsAndName } from "@angular/compiler";
import _ from "lodash";

/**
 * Generated class for the ChosenListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-chosen-list",
  templateUrl: "chosen-list.html"
})
export class ChosenListPage {
  term = "";
  gender = "m";
  names = [];
  pingo = {};
  myNames = {};
  partnerNames = {};
  totalVotes = { m: 0, f: 0 };

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public namesProvider: NamesProvider,
    public authProvider: AuthProvider,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController,
    public socialSharing: SocialSharing,
    public afs: AngularFirestore,
    public modalController: ModalController,
    public alertController: AlertController
  ) {}

  ionViewDidLoad() {
    this.afs
      .collection("users")
      .doc(this.authProvider.user.id)
      .snapshotChanges()
      .subscribe(res => {
        console.log("RESPONSE", res);
      });

    this.authProvider
      .myUserRef()
      .snapshotChanges()
      .pipe(
        mergeMap(user => {
          if (this.authProvider.user.partnership_id) {
            return this.afs
              .collection("partnerships")
              .doc(this.authProvider.user.partnership_id)
              .collection("chosenNames")
              .snapshotChanges();
          }
          return this.authProvider
            .myUserRef()
            .collection("chosenNames")
            .snapshotChanges();
        }),
        mergeMap(chosenNames => {
          const promises = chosenNames.map(chosenName => {
            return this.afs
              .collection("names")
              .doc(chosenName.payload.doc.id)
              .get()
              .pipe(
                map(name => {
                  return {
                    ...name.data(),
                    votes: chosenName.payload.doc.data().total_votes,
                    owners: chosenName.payload.doc.data().owners || null
                  };
                })
              )
              .toPromise();
          });
          return Promise.all(promises);
        })
      )
      .subscribe(res => {
        this.totalVotes = { m: 0, f: 0 };
        const names = res.map((name: any) => {
          console.log("Name to insert to this.names", name.votes);

          name.ownersProfiles = _.map(name.owners, (owner, key) => {
            return this.authProvider.actors[key];
          });

          this.totalVotes[name.gender] += parseInt(name.votes);
          return name;
        });

        this.names = names.map(name => {
          return {
            ...name,
            porcentage: (
              ((name.votes | 0) * 100) /
              this.totalVotes[name.gender]
            ).toFixed(1)
          };
        });

        console.log("NAMES", this.names);
      });
  }

  getOwners(owners) {
    return _.map(owners, (owner, key) => {
      return this.authProvider.actors[key];
    });
  }

  mergeNames(ownerId, name) {
    if (typeof this.pingo[name.id] == "undefined") {
      this.pingo[name.id] = { owners: [ownerId], ...name };
    } else {
      if (this.pingo[name.id].owners.indexOf(ownerId) == -1) {
        this.pingo[name.id].owners.push(ownerId);
      }
    }
  }
  getNames() {
    return _.values(this.pingo);
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
      "http://naname.com.br./enquete/123456789"
    );
  }

  getPorcentage(name) {
    console.log("PIRN");
    return ((name.votes * 100) / this.totalVotes[name.gender]).toFixed(0);
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
