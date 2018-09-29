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
    this.allChosen();
  }

  allChosen() {
    // Pego os dados do meu Usuario
    this.afs.collection('users')
      .doc(this.authProvider.userUid)
      .ref
      .get()
      .then(user => {
        this.afs.collection('users')
          .doc(this.authProvider.userUid)
          .collection('namesChosen')
          .valueChanges()
          .subscribe(values => {
            console.log('Names chosen', values);
            this.namesChosen = [];
            values.forEach(value => {

              this.afs.collection('names').doc(value.uid).ref.get().then(name => {
                console.log('Result Pegando name', name);
                let nameFullData = name.data();
                nameFullData.uid = name.id;
                nameFullData.owner = user;
                this.namesChosen.push(nameFullData);
              });
            })
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
