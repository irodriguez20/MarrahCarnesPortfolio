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

const FBAuth = (req, res, next) => {
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized' });
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            console.log(decodedToken);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch(err => {
            console.error('Error while verifying toke', err);
            return res.status(403).json({ err });
        })
}

app.post('/project', FBAuth, (req, res) => {
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

app.post('/piece', FBAuth, (req, res) => {
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

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) {
        return true;
    } else {
        return false;
    }
}

const isEmpty = (string) => {
    if (string.trim() === "") {
        return true;
    } else {
        return false;
    }
}

//sign-up
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(newUser.password)) {
        errors.password = 'Must not be empty';
    }
    if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if (isEmpty(newUser.handle)) {
        errors.handle = 'Must not be empty';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

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

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if (isEmpty(user.email)) errors.email = 'Must not be empty';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
})
exports.api = functions.region('us-central1').https.onRequest(app);