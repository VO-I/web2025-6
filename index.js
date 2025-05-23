const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const express = require("express");
const multer = require("multer");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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

// Swagger конфігурація
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notes API',
            version: '1.0.0',
            description: 'Сервіс для зберігання нотаток'
        },
    },
    apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /notes/{noteName}:
 *   get:
 *     summary: Отримати вміст однієї нотатки
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успішне отримання нотатки
 *       404:
 *         description: Нотатку не знайдено
 */
app.get('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }

    const noteContent = fs.readFileSync(notePath);
    res.send(noteContent);
});

/**
 * @swagger
 * /notes/{noteName}:
 *   put:
 *     summary: Редагувати нотатку
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Нотатку оновлено
 *       404:
 *         description: Нотатку не знайдено
 */
app.put('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }

    fs.writeFileSync(notePath, req.body);
    res.send();
});

/**
 * @swagger
 * /notes/{noteName}:
 *   delete:
 *     summary: Видалити нотатку
 *     parameters:
 *       - in: path
 *         name: noteName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатку видалено
 *       404:
 *         description: Нотатку не знайдено
 */
app.delete('/notes/:noteName', (req, res) => {
    const notePath = path.join(options.cache, `${req.params.noteName}.txt`);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send();
    }
    fs.unlinkSync(notePath);
    res.send();
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати список усіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(options.cache)
        .filter((name) => name.endsWith('.txt'))
        .map((file) => {
            const noteName = file.replace('.txt', '');
            const noteText = fs.readFileSync(path.join(options.cache, file), 'utf8');
            return { name: noteName, text: noteText };
        });
    res.status(200).json(notes);
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Нотатку створено
 *       400:
 *         description: Нотатка з таким іменем вже існує
 */
app.post('/write', (req, res) => {
    const name = req.body.note_name;
    const note = req.body.note;
    const filePath = path.join(options.cache, `${name}.txt`);
    if (fs.existsSync(filePath)) {
        return res.status(400).send();
    }
    fs.writeFileSync(filePath, note);
    res.status(201).send();
});

app.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});
