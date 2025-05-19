const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require("express");
const multer = require("multer");

const app = express();

program
    .option('-h, --host <address>')
    .option('-p, --port <number>')
    .option('-c, --cache <path>');

program.parse();
const options = program.opts();


app.use('/notes/:noteName', express.text());
app.use(express.urlencoded({ extended: true }));
app.use('/write', multer().none());
app.use('/', express.static('public'));

app.get('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }

    const noteContent = fs.readFileSync(notePath);
    res.send(noteContent);
});

app.put('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }

    fs.writeFileSync(notePath, req.body);
    res.send();
});

app.delete('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }
    fs.unlinkSync(notePath);
    res.send();
});

app.get('/notes',(req, res) => {
    const notes = fs.readdirSync(options.cache)
        .filter((name) => name.endsWith('.txt'))
        .map((file) => {
            const noteName = file.replace('.txt', '');
            const noteText = fs.readFileSync(path.join(options.cache, file), 'utf8');
            return {name: noteName, text: noteText}
        });
    res.status(200).json(notes);
});

app.post('/write',(req, res) => {
    const name = req.body.note_name;
    const note = req.body.note;
    const filePath = path.join(options.cache, `${name}.txt`);
    if(fs.existsSync(filePath)){
        return res.status(400).send();
    }
    fs.writeFileSync(filePath, note);
    res.status(201).send();
});

app.listen(options.port, options.host); {}