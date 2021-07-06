const { ipcRenderer } = require("electron");

const lib = require("./lib.js");
const spot = require("./spotify.js");

const windowHeights = [140, 12];
const snapLength = 8;
const windowBorder = 5;

let screenSize = new lib.Vector2(
    window.innerWidth - windowBorder,
    window.innerHeight - windowBorder
);

let windowRect = new lib.Rect(5, 5, 512, 140);
let mousePos = new lib.Vector2(0, 0);
let inWindow = true;
let snappedToBottom = false;

let windowOpen = true;
let alwaysOnTop = false;

let grabbingWindow = false;
let grabPos = new lib.Vector2(0, 0);
let grabAreas = [
    new lib.Rect(0, 0, 58, 12),
    new lib.Rect(156, 0, 276, 12)
];

class Button {
    constructor(rect, sprFunc, callback) {
        this.rect = rect;
        this.sprFunc = sprFunc;
        this.callback = callback;
    }

    vector2Hit(v2) {
        return this.rect.offsetPos(windowRect).vector2Hit(v2);
    }

    testForClick(v2) {
        if (this.vector2Hit(v2)) {
            this.callback(v2);
        }
    }

    draw(ctx) {
        // Draw select box behind the sprite
        if (this.vector2Hit(mousePos)) {
            ctx.fillStyle = lib.colors[1].toHex();
            ctx.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
        }

        // Draw the sprite
        let sprData = this.sprFunc();
        lib.drawSprite(ctx, sprData.r, sprData.v, this.vector2Hit(mousePos));
    }
}

const repeatStates = ["off", "context", "track"];

function toggleSize() {
    windowOpen = windowOpen ? false : true;

    windowRect.h = windowHeights[windowOpen ? 0 : 1];
    $("#main-canvas")[0].height = windowRect.h;

    // Check if the new height will go off bounds or if it's snapped to the bottom
    if (windowRect.y + windowRect.h > window.innerHeight - snapLength || snappedToBottom) {
        windowRect.y = window.innerHeight - windowRect.h;
        snappedToBottom = true;
        $("#main-canvas").css("top", `${windowRect.y}px`);
    }
}

let buttons = [
    // Back
    new Button(new lib.Rect(86, 0, 10, 12),
    () => {return {r: new lib.Rect(16, 36, 8, 8), v: new lib.Vector2(88, 2)};},
    () => {spot.sapi.skipToPrevious();}),
    // Pause/Play
    new Button(new lib.Rect(96, 0, 10, 12),
    () => {return {r: new lib.Rect((spot.getPlaying()) ? 8 : 0, 36, 8, 8), v: new lib.Vector2(98, 2)};},
    () => {
        if (spot.getPlaying()) {
            spot.sapi.pause();
        } else spot.sapi.play();
    }),
    // Forward
    new Button(new lib.Rect(106, 0, 10, 12),
    () => {return {r: new lib.Rect(24, 36, 8, 8), v: new lib.Vector2(108, 2)};},
    () => {
        spot.sapi.skipToNext();
    }),
    // Repeat
    new Button(new lib.Rect(123, 0, 16, 12),
    () => {return {r: new lib.Rect(repeatStates.indexOf(spot.getRepeatState()) * 16, 44, 16, 8), v: new lib.Vector2(123, 2)};},
    () => {spot.sapi.setRepeat(repeatStates[(repeatStates.indexOf(spot.getRepeatState()) + 1) % repeatStates.length]);}),
    // Shuffle
    new Button(new lib.Rect(139, 0, 16, 12),
    () => {return {r: new lib.Rect((spot.getShuffleState()) ? 64 : 48, 44, 16, 8), v: new lib.Vector2(139, 2)};},
    () => {spot.sapi.setShuffle(spot.getShuffleState() ? false : true);}),
    // Minimize
    new Button(new lib.Rect(480, 0, 9, 12),
    () => {return {r: new lib.Rect(32, 36, 8, 8), v: new lib.Vector2(481, 2)};},
    () => {ipcRenderer.send("minimize");}),
    // Change Size
    new Button(new lib.Rect(490, 0, 9, 12),
    () => {return {r: new lib.Rect(40, 36, 8, 8), v: new lib.Vector2(491, 2)};},
    () => {toggleSize();}),
    // Close
    new Button(new lib.Rect(500, 0, 9, 12),
    () => {return {r: new lib.Rect(48, 36, 8, 8), v: new lib.Vector2(501, 2)};},
    () => {ipcRenderer.send("close");})
];

let noSpotButtons = [
    // Minimize
    new Button(new lib.Rect(480, 0, 9, 12),
    () => {return {r: new lib.Rect(32, 36, 8, 8), v: new lib.Vector2(481, 2)};},
    () => {ipcRenderer.send("minimize");}),
    // Change Size
    new Button(new lib.Rect(490, 0, 9, 12),
    () => {return {r: new lib.Rect(40, 36, 8, 8), v: new lib.Vector2(491, 2)};},
    () => {toggleSize();}),
    // Close
    new Button(new lib.Rect(500, 0, 9, 12),
    () => {return {r: new lib.Rect(48, 36, 8, 8), v: new lib.Vector2(501, 2)};},
    () => {ipcRenderer.send("close");})
];

$(document)
.mousemove(() => {
    mousePos = new lib.Vector2(event.pageX, event.pageY);
    console.log(mousePos);

    // Move the window if it's being grabbed
    if (grabbingWindow) {
        windowRect.x = mousePos.x - grabPos.x;
        windowRect.y = mousePos.y - grabPos.y;

        // Snap to the edges of the window
        snappedToBottom = false;
        if (windowRect.x < windowBorder + snapLength) windowRect.x = windowBorder; // Left
        if (windowRect.x + windowRect.w > screenSize.x - snapLength) windowRect.x = screenSize.x - windowRect.w; // Right
        if (windowRect.y < windowBorder + snapLength) windowRect.y = windowBorder; // Top
        if (windowRect.y + windowRect.h > screenSize.y - snapLength) { // Bottom
            windowRect.y = screenSize.y - windowRect.h;
            snappedToBottom = true;
        }

        // Set the position of the window
        $("#main-canvas").css("left", `${windowRect.x}px`);
        $("#main-canvas").css("top", `${windowRect.y}px`);
    }

    // Check if this new position is inside of the main window
    if ((windowRect.vector2Hit(mousePos) && !inWindow) || grabbingWindow) {
        inWindow = true;
        ipcRenderer.send("ignore-mouse-false");
    // Check if this new position is outside of the main window
    // Also make sure not to trigger this if the window is being grabbed
    } else if (!windowRect.vector2Hit(mousePos) && inWindow) {
        inWindow = false;
        ipcRenderer.send("ignore-mouse-true");
    }
})
.mousedown(() => {
    // Check if the window is currently in focus
    if (document.hasFocus()) {
        // Check if the window is being grabbed
        grabbingWindow = false;
        grabAreas.forEach((e) => {
            if (e.offsetPos(windowRect).vector2Hit(mousePos)) {
                grabbingWindow = true;
            }
        });

        if (grabbingWindow) {
            grabPos = lib.subV2(mousePos, windowRect);
            return;
        }

        // Check if a button is being pressed
        if (spot.isReady()) {
            buttons.forEach((e) => {
                e.testForClick(mousePos);
            });
        } else {
            noSpotButtons.forEach((e) => {
                e.testForClick(mousePos);
            });
        }
    }
})
.mouseup(() => {
    grabbingWindow = false;
});

module.exports = {buttons, noSpotButtons};
