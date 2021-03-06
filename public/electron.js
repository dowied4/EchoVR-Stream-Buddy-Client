const electron = require('electron');
const { autoUpdater } = require('electron-updater')
const app = electron.app;
const ipcMain = electron.ipcMain
const BrowserWindow = electron.BrowserWindow;
const TwitchClient = require('twitch')
const ElectronAuthProvider = require('twitch-electron-auth-provider')


const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');

autoUpdater.on('checking-for-update', () =>{
  console.log("Checking for updates...")
  ipcMain.send('update-check')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available');
  console.log('Version', info.version);
  console.log('Release date', info.releaseData)
  ipcMain.send('update-available')
})

autoUpdater.on('update-not-available', () => {
  console.log('Update not available');
  autoUpdater.send('update-complete')
});

autoUpdater.on('download-progress', (progress) => {
  console.log('Downloading Update');
  ipcMain.send('downloading-update', progress)
  
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update Downloaded');
  ipcMain.send('udpate-complete')
  autoUpdater.quitAndInstall();
})

autoUpdater.on('error',  (error) => {
  console.log(error)
});

let mainWindow;

function createWindow() {
  if(!isDev){
    autoUpdater.checkForUpdates()
  }
  mainWindow = new BrowserWindow({frame: false,center: true, width: 800, height: 600, webPreferences: {nodeIntegration:true, devTools: true}, transparent: true});
  mainWindow.setResizable(false);
  mainWindow.setFullScreen(false)
  console.log("MAIN THREAD STARTED")

  ipcMain.on('request-twitch-auth', (event, arg) => {
    var code
    authWindow = new BrowserWindow({frame: false, center: true, width: 801, height: 600, webPreferences: {nodeIntegration:true, devTools: true}, transparent: true})
    let authUrl = "https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&scope=user_read&client_id=fdgijoff4in7exrow7etltv2vpaa2z&redirect_uri=http://localhost:3000/record/"
    authWindow.loadURL(authUrl)
    authWindow.show();

    authWindow.webContents.on('will-redirect', function (newEvent, url) {
      code = handleCallback(url);
      if(code){
        event.sender.send('twitch-success', code)
        console.log("CODE " + code)
      }
      
    });
    
    authWindow.on('closed', () => {
      authWindow = null;
    })
    
  })

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => mainWindow = null);
}
function handleCallback(url){
  console.log(url)
  let raw_code = /code=([^&]*)/.exec(url) || null;
  let code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
  let error = /\?error=(.+)$/.exec(url);
  if (code || error) {
    // Close the browser if code found or error
    authWindow.destroy();
  }
  if (code) {
    return code
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});