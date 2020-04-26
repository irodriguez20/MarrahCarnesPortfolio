const functions = require("firebase-functions");
const express = require('express');
const app = express();

// const firebase = require('firebase')

const FBAuth = require('./utils/fbAuth');
const { getAllProjects, postProject, getProject } = require('./handlers/projects');
const { getAllPieces, postPiece, getPiece, deletePiece, uploadPieceImage } = require('./handlers/pieces');
const { signUp, login, uploadImage } = require('./handlers/users');

//project routes
app.get('/projects', getAllProjects);
app.post('/project', FBAuth, postProject);
app.get('/project/:projectId', getProject);
//TODO delete project

//pieces routes
app.get('/pieces', getAllPieces);
app.post('/piece', FBAuth, postPiece);
app.post('/piece/:pieceId', FBAuth, uploadPieceImage);
app.delete('/piece/:pieceId', FBAuth, deletePiece);
// app.post('/piece/:pieceId/image', uploadPieceImage);
//TODO delete piece

//users routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
exports.api = functions.region('us-central1').https.onRequest(app);