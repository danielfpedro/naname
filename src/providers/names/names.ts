import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthProvider } from '../auth/auth';

/*
  Generated class for the NamesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NamesProvider {

  namesChosen = [];

  constructor(
    private afs: AngularFirestore,
    private authProvider: AuthProvider
  ) {
    console.log('Hello NamesProvider');
    this.allChosen()
      .then(() => {
        if (this.authProvider.partner) {
          this.authProvider.partner.subscribe
          this.afs.collection('users')
            .doc(this.authProvider.user.partner_uid)
            .collection('namesChosen')
            .valueChanges()
            .subscribe(values => {
              values.forEach(value => {
                let checkIfExists = this.namesChosen.map(e => e.uid).indexOf(value.uid);
                if (checkIfExists > -1) {
                  this.namesChosen[checkIfExists].origin = 'both';
                } else {
                  console.log('Não Ja tem');
                  this.afs.collection('names').doc(value.uid).ref.get().then(name => {
                    let nameToGo = name.data();
                    nameToGo.uid = name.id;
                    nameToGo.fromPartner = true;
                    nameToGo.origin = 'partner';
                    this.namesChosen.push(nameToGo);
                  });
                }
              });
            });
        }
      });
  }

  allChosen() {
    return new Promise((resolve, reject) => {
      this.afs.collection('users')
        .doc(this.authProvider.userUid)
        .collection('namesChosen')
        .valueChanges()
        .subscribe(values => {

          let all = [];
          values.forEach(value => {
            all.push(this.getName(value.uid));
          });

          Promise.all(all).then(res => resolve());

        });
    });


      // if (this.authProvider.partner) {
      //   this.afs.collection('users')
      //     .doc(this.authProvider.user.partner_uid)
      //     .collection('namesChosen')
      //     .valueChanges()
      //     .subscribe(values => {
      //       values.forEach(value => {
      //         console.log('Bata duro misera', this.namesChosen);
      //         let achou = false
      //         this.namesChosen.forEach(name => {
      //           console.log('Name', name.uid);
      //           console.log('Value', value.uid);
      //           if (name.uid == value.uid) {
      //             achou = true
      //           }
      //         });
      //         // Já tem
      //         if (achou) {
      //           console.log('Ja tem');
      //         } else {
      //           console.log('Não Ja tem');
      //           this.afs.collection('names').doc(value.uid).ref.get().then(name => {
      //             let nameToGo = name.data();
      //             nameToGo.uid = name.id;
      //             nameToGo.owners = [];
      //             nameToGo.owners.push(this.authProvider.partner);
      //             this.namesChosen.push(nameToGo);
      //           });
      //         }
      //       });
      //     });
      // }

  }

  getName(uid) {
    return new Promise((resolve, reject) => {
      this.afs.collection('names').doc(uid).ref.get().then(name => {
        let nameToGo = name.data();
        nameToGo.uid = name.id;
        nameToGo.origin = 'mine';
        this.namesChosen.push(nameToGo);
        resolve();
      });
    });
  }

  chose(name:any, like: boolean):Promise<any> {
    const choice = (like) ? 'namesChosen' : 'namesReject';
    return new Promise<any>((resolve, reject) => {
      console.log('Executando Chose');
      this.afs.collection('users')
        .doc(this.authProvider.userUid)
        .collection(choice)
        .doc(name.uid)
        .ref
        .set({
          uid: name.uid
        })
        .then(() => {
          console.log('Adicionou name', name.uid);
          resolve();
        })
        .catch(error => {
          console.error('Ocorreu um erro ao salvar a escolha do nome:', error);
          reject();
        });
    })
  }

}
