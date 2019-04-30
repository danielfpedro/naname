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

class BadRequestError extends Error {
    constructor(message = 'BadRequest') {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(message);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BadRequestError);
        }

        this.name = 'BadRequestError';
    }
}

export const remove_partner = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const jwt = req.body.jwt;
            const jwtVerification = await admin.auth().verifyIdToken(jwt);

            const me = await db.collection('users').doc(jwtVerification.uid).get();


            const partnershipId = me.get('partnership_id');
            const partnerId = me.get('partner_id');

            const chosenNames = await db.collection('partnerships').doc(partnershipId).collection('chosenNames').get();

            const batch = db.batch();

            chosenNames.forEach(chosenName => {
                console.log('Chosenname data', chosenName.data());
                // const chosenNameData: any = { ...chosenName.data(), id: chosenName.id };
                if (typeof chosenName.data().owners[me.id] !== 'undefined') {
                    const chosenNamesRef = db.collection('users').doc(me.id).collection('chosenNames').doc(chosenName.id);
                    batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [me.id]: true } });
                }
                if (typeof chosenName.data().owners[partnerId] !== 'undefined') {
                    const chosenNamesRef = db.collection('users').doc(partnerId).collection('chosenNames').doc(chosenName.id);
                    batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [partnerId]: true } });
                }
            });

            // Set null my
            batch.update(db.collection('users').doc(me.id), { partner: null, partner_id: null, partnership_id: null });
            // Set null partner
            batch.update(db.collection('users').doc(partnerId), { partner: null, partner_id: null, partnership_id: null });
            batch.delete(db.collection('partnerships').doc(partnershipId));

            await batch.commit();

            res.status(200).json({ message: 'Parceiro removido com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'error' });
        }
    })
});

export const add_partner = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const jwt = req.body.jwt;
            const jwtVerification = await admin.auth().verifyIdToken(jwt);

            console.log('Response verification', jwtVerification);

            if (jwtVerification.email === req.body.email) {
                throw new BadRequestError("Você informou o seu próprio email");
            }

            const id1 = jwtVerification.uid;

            // Verifico se ele informou um usuario do sistema
            const targetUserQuery = await db
                .collection("users")
                .where("email", "==", req.body.email)
                .get();

            // console.log('QUERY COM EMAIL', email);
            // console.log('QUERY QUERY RESULT', targetUserQuery);

            console.log('Query por email é empty?', targetUserQuery.empty);
            if (targetUserQuery.empty) {
                throw new BadRequestError("Você informou um email que não existe no sistema.");
            }
            const targetUser = targetUserQuery.docs[0];
            console.log('My user ja tem partnet?', targetUser.get('partner_id'));
            if (targetUser.get("partner_id")) {
                throw new BadRequestError("O usuário que você tentou adicionar já possui um parceiro.");
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
                throw new BadRequestError("Você está bloqueado por este usuário e não pode adicioná-lo como parceiro.");
            }

            const myUserRef = db.collection('users').doc(id1);
            const myUser = await myUserRef.get();
            console.log('My user exists?', myUser.exists);
            if (!myUser.exists) {
                throw new Error("Usuário não existe");
            }


            // AQUI jÁ GARANTI QUE AMBOS OS USERS EXISTEM

            // Crio partnership

            const partnershipResponse = await db.collection('partnerships').add({
                id_1: targetUser.id,
                id_2: myUser.id
            });

            // Add target uid as partner and add logged user uid on partner record too

            // Crio o partnership
            // const partnershipResponse = await db.collection("partnerships").add({ done: true });

            const targetRef = db.collection('users').doc(targetUser.id);

            const batch = db.batch();

            const myUserDataToAdd = {
                partner_id: targetUser.id,
                partnership_id: partnershipResponse.id,
                partner: {
                    id: targetUser.data().id,
                    name: targetUser.data().name,
                    email: targetUser.data().email,
                    profilePhotoURL: targetUser.data().profilePhotoURL
                }
            };
            console.log('My user data to add', myUserDataToAdd);

            // const myUserTotalChoices = myUser.get('total_choices') || 0;
            // const partnerTotalChoices = targetUser.get('total_choices') || 0;

            // batch.update(myUserRef, myUserDataToAdd, { merge: true });
            batch.set(myUserRef, myUserDataToAdd, { merge: true });

            //Salvo o partnership id no target

            const targetUserDataToAdd = {
                partner_id: id1,
                partnership_id: partnershipResponse.id,
                partner: {
                    id: myUser.id,
                    name: myUser.get('name'),
                    email: myUser.get('email'),
                    profilePhotoURL: myUser.get('profilePhotoURL')
                }
            };
            console.log('target use data to add', targetUserDataToAdd);
            batch.set(targetRef, targetUserDataToAdd, { merge: true });

            const userChosenNames = await myUserRef.collection('chosenNames').get();

            userChosenNames.forEach(chosenName => {
                const chosenNamesRef = db.collection('partnerships').doc(partnershipResponse.id).collection('chosenNames').doc(chosenName.id);
                batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [myUser.id]: true } }, { merge: true });
            });

            const targetUserRef = db.collection('users').doc(targetUser.id);

            const targetChosenNames = await targetUserRef.collection('chosenNames').get();
            targetChosenNames.forEach(chosenName => {
                const chosenNamesRef = db.collection('partnerships').doc(partnershipResponse.id).collection('chosenNames').doc(chosenName.id);
                batch.set(chosenNamesRef, { ...chosenName.data(), owners: { [targetUser.id]: true } }, { merge: true });
            });

            await batch.commit();

            res.status(200).send({ message: 'Parceiro adicionado' });

        } catch (error) {
            console.error(error);
            if (error instanceof BadRequestError) {
                res.status(400).json({
                    message: error.message
                });
            } else {
                res.status(500).json({
                    message: 'Error'
                });
            }

        }
    })
});


export const publicProfile = functions.firestore.document('/users/{userId}')
    .onWrite(async (change, context) => {
        try {
            // Se foi deletado
            if (!change.after.exists) {
                return db.collection('users_public').doc(change.after.id).delete();
            }

            if (change.before.get('name') === change.after.get('name') && change.before.get('profilePhotoURL') === change.after.get('profilePhotoURL')) {
                return null;
            }

            return db.collection('users_public').doc(change.after.id).set({
                name: change.after.get('name'),
                profilePhotoURL: change.after.get('profilePhotoURL'),
            }, { merge: true });
        } catch (error) {
            throw error;
        }
    });

export const totalVotesCache = functions.firestore.document('/users/{userId}/chosenNames/{chosenNameId}/votes/{voteId}')
    .onCreate(async (snap, context) => {

        try {
            const chosenNameRef = db.collection('users').doc(context.params.userId).collection('chosenNames').doc(context.params.chosenNameId);
            const chosenName = await chosenNameRef.get();

            if (!chosenName.exists) {
                throw new Error("Usuário não existe");
            }

            const newTotalVotes = (chosenName.get('total_votes') || 0) + 1;

            return chosenNameRef.update({ total_votes: newTotalVotes });
        } catch (error) {
            throw error;
        }
    });

// export const totalChoices = functions.firestore.document('/users/{userId}/chosenNames/{chosenNameId}')
//     .onWrite(async (change, context) => {

//         try {

//             const user = await db.collection('users').doc(context.params.userId).get();

//             if (!user.exists) {
//                 throw new Error("Usuário não existe");
//             }

//             let newTotalChoices = (user.get('total_choices') || 0) + 1;
//             // Se foi deletado
//             if (!change.after.exists) {
//                 newTotalChoices = newTotalChoices - 2;
//             }
//             if (newTotalChoices < 0) {
//                 newTotalChoices = 0;
//             }

//             return user.ref.update({ total_choices: newTotalChoices });
//         } catch (error) {
//             throw error;
//         }
//     });

// export const totalChoicesFromPartnership = functions.firestore.document('/partnerships/{partnershipId}/chosenNames/{chosenNameId}')
//     .onWrite(async (change, context) => {

//         try {

//             const user = await db.collection('users').doc(context.auth!.uid).get();

//             if (!user.exists) {
//                 throw new Error("Usuário não existe");
//             }

//             let newTotalChoices = (user.get('total_choices') || 0) + 1;
//             // Se foi deletado
//             if (!change.after.exists) {
//                 newTotalChoices = newTotalChoices - 2;
//             }
//             if (newTotalChoices < 0) {
//                 newTotalChoices = 0;
//             }

//             return user.ref.update({ total_choices: newTotalChoices });
//         } catch (error) {
//             throw error;
//         }
//     });

export const vote = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const name = req.body.name;

            const jwt = req.body.jwt;
            const jwtVerification = await admin.auth().verifyIdToken(jwt);

            const me = await db.collection('users').doc(jwtVerification.uid).get();

            const batch = db.batch();
            console.log('like? ', req.body.like);
            if (req.body.like) {
                // Marco a escolha
                let chosenNamesRef = me.ref.collection('chosenNames');
                console.log('partnet?');
                if (me.get('partner_id')) {
                    console.log('SIM TEM partnet');
                    chosenNamesRef = db.collection('partnerships').doc(me.get('partnership_id')).collection('chosenNames');
                }

                batch.set(chosenNamesRef.doc(name.id), { ...name, owners: { [me.id]: true } }, { merge: true });
            }
            // Delet o nome do cache dele
            batch.delete(me.ref.collection("namesCache").doc(name.id));

            await batch.commit();
            await me.ref.update({ total_choices: (me.get('total_choices') || 0) + 1 });

            res.status(200).json({
                message: 'Votou o fino'
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error'
            });
        }
    })
});