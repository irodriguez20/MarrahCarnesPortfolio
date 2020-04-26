const { db } = require('../utils/admin');

exports.getAllProjects = (req, res) => {
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
}

exports.postProject = (req, res) => {
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
}