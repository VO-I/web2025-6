const { program } = require ('commander');
const fs = require ('fs');
const http = require ('http');
const path = require ('path');
const express = require("express");
const app = express();

program
    .option('-h, --host <address>')
    .option('-p, --port <number>')
    .option('-c, --cache <path>')


program.parse();
const options = program.opts();


if (!options.cache) {
    console.log('Please, specify a cache directory');
    return;
}

if (!options.port) {
    console.log('Please, specify port');
    return;
}

if (!options.host) {
    console.log('Please, specify host');
    return;
}


app.listen(options.port, options.host);
