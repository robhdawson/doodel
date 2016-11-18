'use strict';

const $ = require('jquery');

const Scribbler = require('./scribbler');

$(document).ready(function() {
    const scribbler = new Scribbler($('canvas'));
    scribbler.startDrawing();
    window.scribbler = scribbler;
});



