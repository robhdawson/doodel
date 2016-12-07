'use strict';

const $ = require('jquery');
const _ = require('lodash');

const BasicBrush = require('./brushes/basic');
const WobblyBrush = require('./brushes/wobbly');

/**
 * A little drwaing widget. Pass in a canvas and call `startDrawing`, and it will work,
 * as long as there are some brush images in a [data-brushes] element somewhere.
 */
class Scribbler {
    /**
     * Initialization logic.
     *
     * @param {jQuery} $canvas - The canvas to draw on, as a jQuery object.
     */
    constructor($canvas) {
        this.$canvas = $canvas;
        this.canvas = this.$canvas[0];

        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;

        this.$body = $('body');
        this.$window = $(window);

        this.$window.on('resize', _.bind(this.resizeCanvas, this));
        this.resizeCanvas();

        this.mouse = {x: 0, y: 0};
        this.lastMouse = {x: 0, y: 0};

        this.drawSpacing = 2;
        this.brushAlpha = 0.8;

        this.points = [];

        this.isPaused = false;
        this.frameDelay = 110;
        this.frameCount = 60;
        this.frame = 0;
    }

    /**
     * Resizes the canvas to cover the entire body.
     */
    resizeCanvas() {
        this.height = this.$body.outerHeight();
        this.width = this.$body.outerWidth();

        // Canvases erase themselves on resize, which is dumb.
        // So we save it to a canvas in memory, resize, then draw it back.
        const saveCanvas = document.createElement('canvas');
        const saveCtx = saveCanvas.getContext('2d');

        saveCanvas.width = this.canvas.width;
        saveCanvas.height = this.canvas.height;
        saveCtx.drawImage(this.canvas, 0, 0);

        this.$canvas.prop('width', this.width);
        this.$canvas.prop('height', this.height);

        this.$canvas.css({
            width: this.width,
            height: this.height,
        });

        this.ctx.drawImage(saveCanvas, 0, 0);
    }

    /**
     * A random brush!
     */
    randomBrush() {
        const width = (Math.random() * 18) + 2;
        // const opacity = (Math.random() * 0.7) + 0.2;
        const opacity = 1;

        return new WobblyBrush(width, '#000000', opacity);
    }

    /**
     * Sets up events to start drawing.
     */
    startDrawing() {
        this.setNewBrush();

        this.$body.on('mouseenter', _.bind(this.mouseEnter, this));

        this.$body.on('mousedown', _.bind(this.mouseDown, this));
        this.$body.on('touchstart', _.bind(this.touchDown, this));

        this.$body.on('mousemove', _.bind(this.mouseMove, this));
        this.$body.on('touchmove', _.bind(this.touchMove, this));

        this.$body.on('mouseup', _.bind(this.mouseUp, this));
        this.$body.on('touchend', _.bind(this.mouseUp, this));
        this.$body.on('touchcancel', _.bind(this.mouseUp, this));

        $('[data-pause]').on('click', _.bind(this.pause, this));
        $('[data-unpause]').on('click', _.bind(this.unpause, this));

        this.tick();
    }

    /**
     * Ticks the animation forward. Will set a timer to call itself again unless paused.
     * Assumes a 60-frame max loop
     */
    tick() {
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        this.points.forEach(_.bind(function(point) {
            point.brush.draw(
                this.ctx,
                point.x,
                point.y,
                this.frame
            );
        }, this));

        if (!this.isPaused) {
            this.frame += 1;
            if (this.frame >= this.frameCount) {
                this.frame = 0;
            }

            window.setTimeout(_.bind(this.tick, this), this.frameDelay);
        }
    }


    /**
     *
     */
    pause() {
        this.isPaused = true;
    }

    unpause() {
        this.isPaused = false;
        this.tick();
    }

    /**
     * Mouse enter event handler for the body. Just updates mouse location.
     *
     * @param {Event} e - The mouse event.
     */
    mouseEnter(e) {
        this.setMouse(e, true);
    }

    /**
     * Mouse down event handler. Starts drawing, unless it's in a text box
     * the user may want to select. Also called on touchstart.
     *
     * @param {Event} e - The mouse event.
     */
    mouseDown(e) {
        this.setMouse(e, true);

        if ($(e.target).is('p, h2, h3, h4, li')) {
            return;
        }

        this.$body.css({
            userSelect: 'none',
        });

        this.isDrawing = true;
        this.draw();
    }

    /**
     * Handles the touchdown event, pulling out the relevant event
     * and calling mouseDown with it.
     *
     * @param  {Event} e - The jQuery touch event.
     */
    touchDown(e) {
        const touchEvent = e.originalEvent.targetTouches[0];
        this.mouseDown(touchEvent);
    }

    /**
     * Mouse up event handler. Stops drawing, and allows user selection of
     * text again. Also called on touchend and touchcancel.
     *
     * @param {Event} e - The mouse event.
     */
    mouseUp(e) {
        this.isDrawing = false;
        this.setNewBrush();

        this.$body.css({
            userSelect: 'auto',
        });
    }

    /**
     * Mouse move event handler. Actually draws, and updates the mouse position.
     * Also called on touchmove.
     *
     * @param {Event} e - The mouse event.
     */
    mouseMove(e) {
        this.setMouse(e);
        this.draw();
        this.lastMouse = this.mouse;
    }

    /**
     * Handles the touchmove event, pulling out the relevant event
     * and calling mouseMove with it.
     *
     * @param  {Event} e - The jQuery touch event.
     */
    touchMove(e) {
        const touchEvent = e.originalEvent.targetTouches[0];
        this.mouseMove(touchEvent);
    }

    /**
     * Sets the mouse location according to a new mouse event.
     *
     * @param {Event} e - The mouse event.
     * @param {boolean} reset - Whether or not to overwrite the previous lastMouse value.
     */
    setMouse(e, reset = false) {
        this.mouse = {x: e.pageX, y: e.pageY};

        if (reset) {
            this.lastMouse = this.mouse;
        }
    }

    /**
     * Calculates the distance between two points.
     *
     * @param  {Object} a - A coordinate object, with keys x and y.
     * @param  {Object} b - Another coordinate object, with keys x and y.
     * @return {number} - The distance between the points.
     */
    distBetween(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }

    /**
     * Calculates the angle between two points.
     *
     * @param  {Object} a - A coordinate object, with keys x and y.
     * @param  {Object} b - Another coordinate object, with keys x and y.
     * @return {number} - The angle between the points.
     */
    angleBetween(a, b) {
        return Math.atan2(b.x - a.x, b.y - a.y);
    }

    /**
     * Gets a new random brush
     */
    setNewBrush() {
        this.currentBrush = this.randomBrush();
    }

    /**
     * Draws! Looks at last known mouse position and current mouse position,
     * figures out a line between them, and then stores points along that line
     * to be drawn.
     */
    draw() {
        if (!this.isDrawing) {
            return;
        }

        const dist = this.distBetween(this.lastMouse, this.mouse);
        const angle = this.angleBetween(this.lastMouse, this.mouse);

        for (let i = 0; i <= dist; i += this.drawSpacing) {
            this.points.push({
                x: this.lastMouse.x + (Math.sin(angle) * i),
                y: this.lastMouse.y + (Math.cos(angle) * i),
                brush: this.currentBrush,
            });
        }
    }
}

module.exports = Scribbler;
