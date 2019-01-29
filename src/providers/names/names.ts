import { Injectable } from "@angular/core";

import {
  AngularFirestore,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { AuthProvider } from "../auth/auth";
import { Observable } from "rxjs/Observable";
import { forkJoin } from "rxjs";

import { map } from "rxjs/operators";

/*
  Generated class for the NamesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NamesProvider {
  namesChosen = [];
  myNamesChosen = [];
  partnerNamesChosen = [];

  constructor(
    private afs: AngularFirestore,
    private authProvider: AuthProvider
  ) {
    console.log("Hello NamesProvider");

    console.log("AQUIIIIII");
    this.listenNames(this.authProvider.userUid, this.myNamesChosen);
    this.listenNames(
      this.authProvider.user.partner_uid,
      this.partnerNamesChosen
    );
  }
  listenNames(userId, arrayToAdd) {
    this.afs
      .collection("users")
      .doc(userId)
      .collection("namesChosen")
      .stateChanges()
      .subscribe(values => {
        let allNamesPromises = [];
        values.forEach(value => {
          if (value.type == "added") {
            allNamesPromises.push(
              this.afs
                .collection("names")
                .doc(value.payload.doc.id)
                .ref.get()
            );
          } else if(value.type == "removed") {
            
            let indexToDelete = -1;
            arrayToAdd.forEach((v, index) => {
                if (v.id == value.payload.doc.id) {
                    indexToDelete = index;
                }
            });
            if (indexToDelete > -1) {
                arrayToAdd.splice(indexToDelete, 1);
            }
            console.log('depois', arrayToAdd);
          }
        });

        if (allNamesPromises.length < 1) {
            console.log('Cartiga', arrayToAdd);
            this.mergeChoices();
        }
            

        forkJoin(allNamesPromises)
          .pipe(
            map(data => {
              let tey = [];
              data.map(d => {
                console.log("OI GENTE", d.id);
                const id = d.id;
                tey.push({ id, ...d.data() });
              });
              return tey;
            })
          )
          .subscribe(finalData => {
            finalData.map(data => {
              arrayToAdd.push(data);
            });
            this.mergeChoices();
          });
      });
  }

  mergeChoices() {
    console.log("MY NAMES", this.myNamesChosen);
    console.log("PARTNER NAMES", this.partnerNamesChosen);

    let cache = [];
    let cachePartner = [];

    let idsFound = [];

    cache = this.myNamesChosen.map((name, index) => {
      let found = false;
      cachePartner = this.partnerNamesChosen.map((n, i) => {
        if (name.id === n.id) {
          found = true;
          idsFound.push(n.id);
        }

        return n;
      });
      name.isEqual = found;
      name.owner = name.isEqual ? "both" : "me";
      return name;
    });

    cachePartner = cachePartner.map(partnerName => {
      const isEqual = idsFound.indexOf(partnerName.id) > -1;
      // pode colocar tudo owner partner pq se tiver alguma que seja
      // both ele vai sair nas proximas linhas e o both ja foi colocado myNames
      // que no fim das contas vai ser concatenado e vai entrar
      return { isEqual: isEqual, owner: "partner", ...partnerName };
    });
    cachePartner = cachePartner.filter(partnerName => {
      return !partnerName.isEqual;
    });

    console.log("CATAPIMBA", cache);
    console.log("CATAPIMBA cachePartner", cachePartner);
    this.namesChosen = cache.concat(cachePartner);
    console.log("NAMES AFTER MERGE", this.namesChosen);
  }

  chose(name: any, like: boolean): Promise<any> {
    const choice = like ? "namesChosen" : "namesReject";
    return new Promise<any>((resolve, reject) => {
      console.log("Executando Chose");
      this.afs
        .collection("users")
        .doc(this.authProvider.userUid)
        .collection(choice)
        .doc(name.uid)
        .ref.set({
          uid: name.uid
        })
        .then(() => {
          console.log("Adicionou name", name.uid);
          resolve();
        })
        .catch(error => {
          console.error("Ocorreu um erro ao salvar a escolha do nome:", error);
          reject();
        });
    });
  }

  removeName(uid: string): void {
    this.afs.collection("users").doc(this.authProvider.userUid).collection("namesChosen").doc(uid).delete();
  }
}
