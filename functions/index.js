const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
const app = express();
admin.initializeApp();
const firebase = require('firebase')



const config = {

    apiKey: "AIzaSyC4r8TIfIrEugBPY7QTY6BShDqBZ1Z4zfw",
    authDomain: "marrahngelo.firebaseapp.com",
    databaseURL: "https://marrahngelo.firebaseio.com",
    projectId: "marrahngelo",
    storageBucket: "marrahngelo.appspot.com",
    messagingSenderId: "340161469963",
    appId: "1:340161469963:web:5c31036b5b0600bcafb10e",
    measurementId: "G-G9GSTF86QN"

};

firebase.initializeApp(config);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const db = admin.firestore();

app.get('/projects', (req, res) => {
    db
        .collection('projects')
        .orderBy('projectName', 'asc')
        .get()
        .then(data => {
            let projects = [];
            data.forEach(doc => {
                projects.push({
                    projectId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(projects);
        })
        .catch(error => console.error(error));
})

app.post('/project', (req, res) => {
    const newProject = {
        projectName: req.body.projectName,
        projectDescription: req.body.projectDescription
    }

    db
        .collection('projects')
        .add(newProject)
        .then(doc => {
            res.json({ message: `document ${doc.id} created succesfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong.' })
            console.error(err);
        })
})

app.get('/pieces', (req, res) => {
    db
        .collection('pieces')
        .orderBy('pieceName', 'asc')
        .get()
        .then(data => {
            let pieces = [];
            data.forEach(doc => {
                pieces.push({
                    pieceId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(pieces);
        })
        .catch(error => console.error(error));
})

app.post('/piece', (req, res) => {
    const newPiece = {
        pieceName: req.body.pieceName,
        Astronomy: req.body.Astronomy,
        description: req.body.description
    }

    db
        .collection('pieces')
        .add(newPiece)
        .then(doc => {
            res.json({ message: `document ${doc.id} created succesfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong.' })
            console.error(err);
        })
})


//sign-up
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    //validate
    let token;
    let userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken' });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
            // return res.status(201).json({ message: `user ${data.user.uid} signed up successfully` });
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(data => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use' });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });

})
exports.api = functions.region('us-central1').https.onRequest(app);