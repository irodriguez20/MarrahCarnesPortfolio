const { admin, db } = require('../utils/admin');

const config = require('../utils/config');


exports.getAllPieces = (req, res) => {
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
}

exports.postPiece = (req, res) => {
    const newPiece = {
        pieceName: req.body.pieceName,
        description: req.body.description,
        projectId: req.body.projectId,
        userHandle: req.user.handle
        // pieceImageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
    }

    db
        .collection('pieces')
        .add(newPiece)
        .then(doc => {
            res.json({ message: `document ${doc.id} created succesfully` })
        })
        .catch(err => {
            res.status(500).json({ general: 'Something went wrong. Please try again' })
            console.error(err);
        })
}

// exports.getPiece = (req, res) => {
//     let pieceData = {};
//     db.doc(`/pieces/${req.params.pieceId}`)
//         .get()
//         .then((doc) => {
//             if (!doc.exists) {
//                 return res.status(404).json({ error: 'Piece not found' });
//             }
//             pieceData = doc.data();
//             pieceData.pieceId = doc.id;
//             return db
//                 .collection('comments')
//                 .orderBy('createdAt', 'desc')
//                 .where('pieceId', '==', req.params.pieceId)
//                 .get()
//         })
//         .then((data) => {
//             console.log(data);
//             pieceData.comments = [];
//             data.forEach((doc) => {
//                 pieceData.comments.push(doc.data());
//             });
//             return res.json(pieceData);
//         })
//         .catch(err => {
//             console.error(err);
//             res.status(500).json({ error: err.code });
//         });
// };

exports.uploadPieceImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' });
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 100000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
    })
    busboy.on('finish', () => {
        admin.storage().bucket(config.storageBucket).upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.doc(`/pieces/${req.params.pieceId}`).update({ pieceImageUrl: imageUrl });
            })
            .then(() => {
                return res.json({ message: 'Piece Image uploaded successfully' });
            })
            .catch(err => {
                console.error(err)
                return res.status(500).json({ general: 'Something went wrong. Please try again' });
            })
    })
    busboy.end(req.rawBody);
}

exports.deletePiece = (req, res) => {
    const document = db.doc(`/pieces/${req.params.pieceId}`);
    document.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Piece not found' });
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' });
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Piece deleted successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ general: 'Something went wrong. Please try again' });
        })
}