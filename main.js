const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('React Old Icons Browser');

function createWindow() {
  let iconPath;
  if (process.platform === 'darwin') {

    const pngPath = path.join(__dirname, 'page/app-icon.png');
    const icnsPath = path.join(__dirname, 'page/app-icon.icns');
    
    if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    } else if (fs.existsSync(icnsPath)) {
      iconPath = icnsPath;
    }
  } else {
    iconPath = path.join(__dirname, 'page/favicon.ico');
  }

  // Verify if icon file exists
  if (iconPath && fs.existsSync(iconPath)) {
    console.log(`Using icon: ${iconPath}`);
  } else {
    console.log(`Icon file not found: ${iconPath}`);
    iconPath = undefined;
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    icon: iconPath,
    title: 'React Old Icons Browser'
  });

  mainWindow.loadFile('page/index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  
  // For macOS, explicitly set the dock icon after app is ready
  if (process.platform === 'darwin') {
    const pngPath = path.join(__dirname, 'page/app-icon.png');
    const icnsPath = path.join(__dirname, 'page/app-icon.icns');
    
    let dockIconPath;
    if (fs.existsSync(pngPath)) {
      dockIconPath = pngPath;
    } else if (fs.existsSync(icnsPath)) {
      dockIconPath = icnsPath;
    }
    
    if (dockIconPath) {
      try {
        app.dock.setIcon(dockIconPath);
        console.log(`Dock icon set successfully: ${dockIconPath}`);
      } catch (error) {
        console.log('Failed to set dock icon:', error.message);
      }
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});