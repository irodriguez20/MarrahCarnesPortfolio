const functions = require("firebase-functions");
const express = require('express');
const app = express();

// const firebase = require('firebase')

const FBAuth = require('./utils/fbAuth');
const { getAllProjects, postProject } = require('./handlers/projects');
const { getAllPieces, postPiece } = require('./handlers/pieces');
const { signUp, login, uploadImage } = require('./handlers/users');

//project routes
app.get('/projects', getAllProjects);
app.post('/project', FBAuth, postProject);

//pieces routes
app.get('/pieces', getAllPieces);
app.post('/piece', FBAuth, postPiece);

//users routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
exports.api = functions.region('us-central1').https.onRequest(app);