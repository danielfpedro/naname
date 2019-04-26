import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import * as cors from 'cors';
const corsHandler = cors({ origin: true });


const db = admin.firestore();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const addPartner = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const id1 = req.body.id1;

            // Verifico se ele informou um usuario do sistema
            const targetUserQuery = await db
                .collection("users")
                .where("email", "==", req.body.email)
                .get();

            // console.log('QUERY COM EMAIL', email);
            // console.log('QUERY QUERY RESULT', targetUserQuery);

            console.log('Query por email é empty?', targetUserQuery.empty);
            if (targetUserQuery.empty) {
                throw new Error("Você informou um email que não existe no sistema.");
            }
            const targetUser = targetUserQuery.docs[0];
            console.log('My user ja tem partnet?', targetUser.get('partner_id'));
            if (targetUser.get("partner_id")) {
                throw new Error("O usuário que você tentou adicionar já possui um parceiro.");
            }
            // const targetUserRef = db.collection("users").doc(targetUser.id);
            //Verifico se o id dele está na minha lista de bloqueados
            const imBlocked = await db.collection('users')
                .doc(targetUser.id)
                .collection("blockedUsers")
                .doc(id1)
                .get();

            console.log('Am I blocked?', imBlocked.exists);
            if (imBlocked.exists) {
                throw new Error("Você está bloqueado por este usuário e não pode adicioná-lo como parceiro.");
            }

            const myUserRef = db.collection('users').doc(id1);
            const myUser = await myUserRef.get();
            console.log('My user exists?', myUser.exists);
            if (!myUser.exists) {
                throw new Error("Usuário não existe");
            }
            // Add target uid as partner and add logged user uid on partner record too

            // Crio o partnership
            // const partnershipResponse = await db.collection("partnerships").add({ done: true });

            const batch = db.batch();

            const myUserDataToAdd = {
                partner_id: targetUser.id,
                partnership_id: 'lalala',
                partner: {
                    id: targetUser.data().id,
                    name: targetUser.data().name,
                    email: targetUser.data().email,
                    profilePhotoURL: targetUser.data().profilePhotoURL
                }
            };
            console.log('My user data to add', myUserDataToAdd);
            // batch.update(myUserRef, myUserDataToAdd, { merge: true });
            batch.set(myUserRef, myUserDataToAdd, { merge: true });

            //Salvo o partnership id no target
            const targetRef = db.collection('users').doc(targetUser.id);
            const targetUserDataToAdd = {
                partner_id: id1,
                partnership_id: 'lala',
                partner: {
                    id: myUser.id,
                    name: myUser.get('name'),
                    email: myUser.get('email'),
                    profilePhotoURL: myUser.get('profilePhotoURL')
                }
            };
            console.log('target use data to add', targetUserDataToAdd);
            batch.set(targetRef, targetUserDataToAdd, { merge: true });

            // Unificando nomes
            //console.log('Unificando nomes');
            // const promises = [];
            const userChosenNames = await myUserRef.collection('chosenNames').get();

            //console.log('Total chosen names user', userChosenNames.size);
            userChosenNames.forEach(chosenName => {
                const chosenNamesRef = db.collection('partnerships').doc(partnershipResponse.id).collection('chosenNames').doc(chosenName.id);
                batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [myUser.id]: true } }, { merge: true });
            });

            const targetChosenNames = await targetUserRef.collection('chosenNames').get();
            // console.log('Total chosen names partner', targetChosenNames.size);
            // console.log('TARGET USER', targetUser);
            // console.log('TARGET USER ID', targetUser.id);
            targetChosenNames.forEach(chosenName => {
                const chosenNamesRef = db.collection('partnerships').doc(partnershipResponse.id).collection('chosenNames').doc(chosenName.id);
                batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [targetUser.id]: true } }, { merge: true });
                //promises.push(this.chosenNamesRef().doc(chosenName.id).set({ ...chosenName.data(), owners: { [this.user.partner_id]: true } }, { merge: true }));
            });

            await batch.commit();

            res.status(200).send({ msg: 'Salvou o fino' });

        } catch (error) {
            console.error('Error', error);
            res.status(500).send({ error: error });
        }
    })
});