// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { exec } = require("child_process");
const WebSocket = require("ws")
const wss = new WebSocket.Server( { port: 1040 } )

let loadingWindow;
let socket;

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, //hide menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: true
    }
  })

  wss.on('connection', function (w) {
    socket = w;
    w.on( 'message' , function (data)  {
      console.log(data)
    })
    w.on('close', function() {
      console.log("Closed")
    })
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  ipcMain.on("onMain", async function (e,data) {
    if(data) {
      var jsonData = JSON.parse(data);
      jsonData.eventName = "main";
      socket.send(JSON.stringify(jsonData))
    }
    console.log(`data in main ${data} ${JSON.stringify(data)}`);
  });
  ipcMain.on("onServer", async function (e,data) {
    if(data) {
      var jsonData = JSON.parse(data);
      jsonData.eventName = "connecting";
      socket.send(JSON.stringify(jsonData))
    }
    console.log(`data in main ${data} ${JSON.stringify(data)}`);
  })
  ipcMain.on("onCheck", async function (e,data) {
    if(data) {
      var jsonData = JSON.parse(data);
      jsonData.eventName = "check";
      socket.send(JSON.stringify(jsonData))
    }
    console.log(`data in main ${data} ${JSON.stringify(data)}`);
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

