const electron = require("electron");
const app = electron.app;
const ipcMain = electron.ipcMain;

let mainWindow;

// Window border needs to be there to fix a strange deadzone bug
const windowBorder = 5;

function createWindow () {
    let windowSize = electron.screen.getPrimaryDisplay().workArea;

    mainWindow = new electron.BrowserWindow({
        enableLargerThanScreen: true,
        x: windowSize.x - windowBorder,
        y: windowSize.y - windowBorder,
        transparent: true,
        frame: false,
        backgroundColor: '#00000000',
        hasShadow: false,
        show: false,
        resizable: false,
        movable: false,
        fullscreenable: false,
        roundedCorners: false,
        nodeIntegration: true
    });

    mainWindow.setAlwaysOnTop(true);
    // Can't create a window with a size bigger than the window, so we set the size here.
    mainWindow.setSize(windowSize.width + (windowBorder * 2), windowSize.height + (windowBorder * 2));

    mainWindow.loadFile("app/index.html");

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    ipcMain.on("ignore-mouse-true", () => {
        mainWindow.setIgnoreMouseEvents(true, {forward:true});
    });

    ipcMain.on("ignore-mouse-false", () => {
        mainWindow.setIgnoreMouseEvents(false, {forward:true});
    });

    ipcMain.on("minimize", () => {
        mainWindow.minimize();
    });

    ipcMain.on("close", () => {
        mainWindow.close();
    });
}

app.on('ready', () => setTimeout(createWindow, 500));
