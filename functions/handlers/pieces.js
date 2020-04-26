const { db } = require('../utils/admin');

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
}