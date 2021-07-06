const lib = require("./lib.js");
const spot = require("./spotify.js");
const controls = require("./controls.js");

function drawInit(contxt) {
    lastTime = Date.now();
    ctx = contxt;

    draw.animate();
}

function animate() {
    currentTime = Date.now();
    delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    spot.updatePlayback();
    lib.drawBackground(ctx);
    // may have weird errors? best to do this
    try {
        drawTopbar(ctx);
    } catch(e) {console.log(e);}

    requestAnimationFrame(animate);
}

// The max ammount of characters before the player starts scrolling
const maxNameScroll = 49;
const scrollSpeed = 1000;

function drawTopbar(ctx) {
    // Logo
    lib.drawText(ctx, "SpotiApex", new lib.Vector2(3, 3));

    // Check if we are ready to display the topbar
    if (spot.isReady()) {
        // Time Elapsed
        lib.drawTime(ctx, spot.getProgress(), new lib.Vector2(63, 3));

        // Draw buttons
        controls.buttons.forEach((e) => {
            e.draw(ctx);
        });

        // Volume Slider
        // can't use lineTo because anti-aliasing :)
        let sliderPosition = 443 + Math.floor((spot.getVolume() / 100) * 32);
        // yes i'm using the left side of the A lol
        lib.drawSprite(ctx, new lib.Rect(6, 12, 1, 6), new lib.Vector2(sliderPosition, 3));

        // Song Name
        let songName = spot.getSongName();

        // Scroll Code
        let scrolling = songName.length > maxNameScroll;
        let nameScroll = Math.floor(spot.getProgress() / scrollSpeed) % songName.length;

        let drawName = (scrolling) ? (songName + songName).slice(nameScroll, nameScroll + maxNameScroll - 4) : songName;
        lib.drawText(ctx, drawName, new lib.Vector2(165, 3));
    } else {
        // Clean up parts used while Spotify is active
        ctx.fillStyle = lib.colors[0].toHex();
        ctx.fillRect(116, 3, 358, 5);

        // Draw buttons
        controls.noSpotButtons.forEach((e) => {
            e.draw(ctx);
        });
    }
}

module.exports = {drawInit, animate, drawTopbar};
