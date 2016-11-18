'use strict';

/**
 * Just draws circles at the specified width in the specified color.
 */
class BasicBrush {
    constructor(width, color = '#000000') {
        this.radius = width / 2;
        this.color = color;
    }

    draw(ctx, x, y, frame) {
        const oldFillStyle = ctx.fillStyle;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(
            x - this.radius,
            y - this.radius,
            this.radius,
            0,
            2 * Math.PI
        );

        ctx.fill();

        ctx.fillStyle = oldFillStyle;
    }
}