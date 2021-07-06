const SpotifyWebApi = require("spotify-web-api-node");
const PKCE = require("js-pkce").default;

const pkce = new PKCE({
  client_id: "93c095dad9b44d3a9a62574a276928a3",
  redirect_uri: "https://kikasuru.github.io/SpotiApexAuthSite",
  authorization_endpoint: "https://accounts.spotify.com/authorize",
  token_endpoint: "https://accounts.spotify.com/api/token",
  requested_scopes: "user-read-playback-state user-modify-playback-state",
});
const sapi = new SpotifyWebApi();

let timeAtExpire = localStorage.getItem("timeAtExpire") || 0;

const webPrefs = "frame=yes,nodeIntegration=no,movable=yes,roundedCorners=yes";

let authWind = null;
let authProm = null;
function requestAuthPromise() {
    // Check if there's a token that was previously saved
    if (timeAtExpire > Date.now() && localStorage.getItem("token") != null) {
        // Simply set the parameters
        sapi.setClientId(pkce.config.client_id);
        setToken(localStorage.getItem("token"), localStorage.getItem("rtoken"), timeAtExpire);

        return;
    }

    // Check if there is no promise
    if (authProm == null) {
        authProm = new Promise((res, rej) => {
            // Check if there is no window
            if (authWind == null || authWind.closed) {
                // Create a window
                authWind = window.open(pkce.authorizeUrl(), "Spotify Authorization", webPrefs);
                authWind.focus();

                // Wait for a message from the window
                window.addEventListener("message", (e) => {
                    // this is a little dumb but whatever
                    pkce.exchangeForAccessToken("https://kikasuru.github.io/SpotiApexAuthSite" + e.data).then((resp) => {
                        // Set the access token on the API object to use it in later calls
                        sapi.setClientId(pkce.config.client_id);
                        setToken(resp.access_token, resp.refresh_token, Date.now() + (resp.expires_in * 1000));

                        res();
                        authProm = null;
                        authWind.close();
                    });
                }, {once: true});
            } else {
                rej("window already open");
            }
        });
    } else {
        // Focus the window
        authWind.focus();
    }
}

function isReady() {
    return sapi.getClientId() != null;
}

const expireOffset = 60;
function checkForRefresh() {
    // Check if this account is logged in
    if (isReady()) {
        // Check if the expire time has gone past the limit
        if (Date.now() >= timeAtExpire - (expireOffset * 1000)) {
            // Refresh the token
            $.post("https://accounts.spotify.com/api/token", $.param({
                grant_type: "refresh_token",
                refresh_token: sapi.getRefreshToken(),
                client_id: sapi.getClientId()
            }))
            .done((resp) => {
                setToken(resp.access_token, resp.refresh_token, Date.now() + (resp.expires_in * 1000));
            });
        }
    }
}

function setToken(token, rtoken, expire) {
    sapi.setAccessToken(token);
    sapi.setRefreshToken(rtoken);
    timeAtExpire = expire;

    localStorage.setItem("token", token);
    localStorage.setItem("rtoken", rtoken);
    localStorage.setItem("timeAtExpire", timeAtExpire);
}

let currentTime, lastTime, delta, ctx;
let playback = null;

let checkingPlayback = false;

function updatePlayback() {
    // Get Spotify playback data
    if (isReady() && !checkingPlayback) {
        checkingPlayback = true;
        checkForRefresh();
        sapi.getMyCurrentPlaybackState()
        .then((data) => {
            // Set the current playback to the new data
            playback = data.body;

            // Get ready for the next call
            checkingPlayback = false;
        });
    }
}

function getProgress() {
    return playback.progress_ms;
}

function getPlaying() {
    return playback.is_playing;
}

function getRepeatState() {
    return playback.repeat_state;
}

function getShuffleState() {
    return playback.shuffle_state;
}

function getVolume() {
    return playback.device.volume_percent;
}

function getSongName() {
    return playback.item.artists[0].name + " - " + playback.item.name + "    ";
}

module.exports = {requestAuthPromise, checkForRefresh, sapi, isReady, updatePlayback,
    // Get functions
    getProgress, getPlaying, getRepeatState, getShuffleState, getVolume, getSongName};
