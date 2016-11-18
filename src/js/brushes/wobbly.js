'use strict';

const d3 = require('d3-scale');

/**
 * Draws shaky animated lines.
 */
class WobblyBrush {
    constructor(width, color = '#000000', opacity = 0.8) {
        this.radius = width / 2;
        this.color = color;
        this.opacity = opacity;

        this.jitters = [];
        this.frameCount = 60; // MUST BE A DIVISOR OF 60

        for (let i = 0; i < this.frameCount; i++) {
            this.jitters.push(this.getRandomJitter());
        }
    }

    getRandomJitter() {
        // between negative this and positive this
        const range = this.radius / 3;

        const n = Math.random() * (range * 2);
        return n - range;
    }

    draw(ctx, x, y, frame) {
        const jitter = this.jitters[frame]
        const radius = this.radius + jitter;

        // console.log('myframe: ' + myFrame);
        // console.log('radius: ' + radius);

        const oldFillStyle = ctx.fillStyle;
        const oldOpacity = ctx.globalAlpha;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;

        ctx.beginPath();
        ctx.arc(
            x,
            y,
            radius,
            0,
            2 * Math.PI
        );

        ctx.fill();

        ctx.fillStyle = oldFillStyle;
        ctx.globalAlpha = this.opacity;
    }
}

module.exports = WobblyBrush;
