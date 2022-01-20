"use strict";

class Shape extends PIXI.Graphics {
    constructor(x, y, column, row, width, height, gravityAmt) {
        super();
        this.x = x;
        this.y = y;
        this.column = column;
        this.row = row;

        // gridX and gridY use to store shape's location in grid
        this.gridX = x;
        this.gridY = y;

        this.w = width;
        this.h = height;
        this.Alive = true;
        this.gravity = gravityAmt;
        this.vel = 0;
        this.falling = true;

        this.Up = null;
        this.Right = null;
        this.Down = null;
        this.Left = null;
    }

    // Check if this shape collides with another using AABB
    CollidesWith(other) {
        if (!other) return false;
        if (other.x < this.x + this.w && other.x + other.w > this.x && other.y < this.y + this.h && other.y + other.h > this.y) {
            this.falling = false;
            this.vel = 0; // reset velocity
            return true;
        }
        return false;
    }

    CollidesWithPoint(point) {
        return point.x < this.gridX + this.w && point.x > this.gridX && point.y < this.gridY + this.h && point.y > this.gridY;
    }

    // Object falls via gravity velocity, should be called every update
    Fall() {
        if (this.falling) {
            this.vel += this.gravity;
            this.y += this.vel;
        }
        else {
            this.vel = 0;
            this.y = this.Down ? this.Down.y - this.Down.h : this.y;
        }
    }
}


class Circle extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        this.radius = width * .45;

        this.beginFill(0xFF0000);
        this.pivot.x = (this.width / 2);
        this.drawCircle(this.radius, this.radius, this.radius);
        this.endFill();
    }
}

class Square extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        
        this.beginFill(0x00FF00);
        this.drawRect(0, 0, this.w * .9, this.w * .9);
        this.endFill();
    }
}

class Triangle extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        
        this.beginFill(0x0000FF);
        this.lineStyle(0, 0x0000FF, 1);
        this.moveTo(this.w / 2, this.h * .1);
        this.lineTo(this.w / 2 + Math.sin(Math.PI / 6) * this.w * .9, Math.cos(Math.PI / 6) * this.w* .9);
        this.lineTo(this.w / 2 - Math.sin(Math.PI / 6) * this.w* .9, Math.cos(Math.PI / 6) * this.w* .9);
        this.lineTo(this.w / 2, this.h * .1);
        this.endFill();
    }
}

class Diamond extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        
        this.beginFill(0xFFFF00);
        this.lineStyle(0, 0xFFFF00, 1);
        this.moveTo(this.w / 2, this.h * .1);
        this.lineTo(this.w * .1, this.h / 2);
        this.lineTo(this.w / 2, this.h * .9);
        this.lineTo(this.w * .9, this.h / 2);
        this.lineTo(this.w / 2, this.h * .1);
        this.endFill();
    }
}

class Pentagon extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        // 2 r sin(PI/n) = side length
        // ((n - 2) * 180) / n = side interior angle
        this.radius = width * .45;
        this.numSides = 5;
        this.sideLength = 2 * this.radius * Math.sin(Math.PI / this.numSides);

        this.beginFill(0x00FFFF);
        this.lineStyle(0, 0x00FFFF, 1);
        this.pivot.x = -this.w / 2;
        this.pivot.y = -this.h / 2;

        let angle = -Math.PI / 10;

        this.moveTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
        for (let i = 0; i < 5; i++) {
            this.lineTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
            angle -= Math.PI / 2.5;
        }
        
        this.endFill();
    }
}

class Hexagon extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        this.radius = width * .45;
        this.numSides = 6;
        this.sideLength = 2 * this.radius * Math.sin(Math.PI / this.numSides);

        this.beginFill(0xFF00FF);
        this.lineStyle(0, 0xFF00FF, 1);
        this.pivot.x = -this.w / 2;
        this.pivot.y = -this.h / 2;

        let angle = 0;

        this.moveTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
        for (let i = 0; i < 6; i++) {
            this.lineTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
            angle -= Math.PI / (this.numSides / 2);
        }
        
        this.endFill();
    }
}

class Octogon extends Shape {
    constructor(x, y, row, column, width, height, gravityAmt) {
        super(x, y, row, column, width, height, gravityAmt);
        this.radius = width * .6;
        this.numSides = 8;
        this.sideLength = 2 * this.radius * Math.sin(Math.PI / this.numSides);

        this.beginFill(0xFFA500);
        this.lineStyle(0, 0xFFA500, 1);
        this.pivot.x = -this.w / 2;
        this.pivot.y = -this.h / 2;

        let angle = Math.PI / 8;

        this.moveTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
        for (let i = 0; i < 8; i++) {
            this.lineTo(Math.cos(angle) * this.sideLength, Math.sin(angle) * this.sideLength);
            angle -= Math.PI / (this.numSides / 2);
        }
        
        this.endFill();
    }
}

class Container extends PIXI.Graphics {
    constructor(x, y, width, height) {
        super();

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.beginFill(0x000000);
        this.lineStyle(3, 0xFFFFFF, 1);
        this.drawRect(0, 0, width, height);
        this.endFill();
    }
}