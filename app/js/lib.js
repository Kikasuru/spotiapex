let sprCache, sprCacheInv, backCache, sprImg, backImg;

function libInit() {
    sprCache    = $("#spr-normal")[0];
    sprCacheInv = $("#spr-invert")[0];
    backCache   = $("#bck-normal")[0];

    sprImg      = $("#spr-img")[0];
    backImg     = $("#back-img")[0];

    changeColor(colors[0], colors[1]);
}

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    offset(i) {
        return new Vector2(this.x + i, this.y + i);
    }
}

function addV2(v0, v1) {
    return new Vector2(v0.x + v1.x, v0.y + v1.y);
}

function subV2(v0, v1) {
    return new Vector2(v0.x - v1.x, v0.y - v1.y);
}

class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    vector2Hit(v2) {
        return (v2.x > this.x && v2.x < this.x + this.w) && (v2.y > this.y && v2.y < this.y + this.h);
    }

    offsetPos(v2) {
        return new Rect(this.x + v2.x, this.y + v2.y, this.w, this.h);
    }
}

function componentToHex(c) {
    return c.toString(16).padStart(2, "0");
}

class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toHex() {
        return "#" + componentToHex(this.r) + componentToHex(this.g) + componentToHex(this.b);
    }
}

let colors = [new Color(0, 0, 0), new Color(255, 255, 255)];

function changeColor(color0, color1) {
    colors = [color0, color1];

    changeImgColor(sprCache,     sprImg,  color0, color1);
    changeImgColor(sprCacheInv,  sprImg,  color1, color0);

    changeImgColor(backCache,    backImg, color0, color1);
}

// This function assumes img is already loaded
function changeImgColor(canvas, img, color0, color1) {
    // Get the context of the canvas and draw the image
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Go through each pixel, replacing each color
    for (let i = 0; i < data.length; i += 4) {
        // We only really need to check the red value, due to the sprites being black and white
        // If this pixel is white
        if (data[i] > 0) {
            // Change it to color 1
            data[i]     = color1.r;
            data[i + 1] = color1.g;
            data[i + 2] = color1.b;
        } else {
            // Otherwise change it to color 0
            data[i]     = color0.r;
            data[i + 1] = color0.g;
            data[i + 2] = color0.b;
        }
    }

    // Finalise the data
    ctx.putImageData(imageData, 0, 0);
}

// Basically drawImage but streamlined to make it WAY easier to read
function drawSprite(ctx, spriteRect, pos, inverted = false) {
    ctx.drawImage(
        (inverted) ? sprCacheInv : sprCache,
        spriteRect.x, spriteRect.y,
        spriteRect.w, spriteRect.h,
        pos.x, pos.y,
        spriteRect.w, spriteRect.h
    );
}

bigCharSize = new Vector2(6, 6);
bigCharPos  = new Vector2(0, 0);
numCharSize = new Vector2(4, 6);
numCharPos  = new Vector2(0, 46);

function getLetterPos(charCode, charSize = bigCharSize) {
    return new Vector2(
        (charCode % 16) * charSize.x,
        Math.floor(charCode / 16) * charSize.y
    );
}

function drawText(ctx, text, pos, inverted = false, charSize = bigCharSize, charPos = bigCharPos) {
    // Loop through each letter in the string
    for (let i = 0; i < text.length; i++) {
        // Get the letter code
        let charCode = text.charCodeAt(i) - 0x20;

        // If the character is in the range of compatible letters
        if (charCode < 96 && charCode > 1) {
            // Get the letter position
            let letterpos = getLetterPos(charCode, charSize);

            // Draw the letter
            drawSprite(ctx, new Rect(
                letterpos.x + charPos.x,
                letterpos.y + charPos.y,
                charSize.x, charSize.y
            ),
            new Vector2(pos.x + (i * charSize.x), pos.y));
        }
    }
}

function drawTime(ctx, time, pos, inverted = false, colon = true) {
    let timeString = Math.floor(time / 60000).toString().padStart(2, "0") + ((colon)?":":" ") + (Math.floor(time / 1000) % 60).toString().padStart(2, "0");
    drawText(ctx, timeString, pos, inverted, numCharSize, numCharPos);
}

function drawSongID(ctx, id, pos, inverted = false) {
    let idString = id.toString().padStart(4, "0");
    drawText(ctx, idString, pos, inverted, numCharSize, numCharPos);
}

function drawBackground(ctx) {
    ctx.drawImage(backCache, 0, 0);
}

module.exports = {libInit, Vector2, addV2, subV2, Rect, colors, changeColor, drawSprite, drawText, drawTime, drawSongID, drawBackground};
