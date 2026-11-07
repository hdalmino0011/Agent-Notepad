const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Persist user's custom window size & position across launches
function getBoundsFilePath() {
  return path.join(app.getPath('userData'), 'window-bounds.json');
}

function loadSavedBounds() {
  try {
    const file = getBoundsFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (
        typeof data.width === 'number' &&
        typeof data.height === 'number' &&
        data.width >= 240 &&
        data.height >= 280
      ) {
        return data;
      }
    }
  } catch {
    // ignore
  }
  return { width: 375, height: 760 };
}

function saveCurrentBounds() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) {
    return;
  }
  try {
    const bounds = mainWindow.getBounds();
    fs.writeFileSync(getBoundsFilePath(), JSON.stringify(bounds, null, 2));
  } catch {
    // ignore
  }
}

function createWindow() {
  const savedBounds = loadSavedBounds();

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: typeof savedBounds.x === 'number' ? savedBounds.x : undefined,
    y: typeof savedBounds.y === 'number' ? savedBounds.y : undefined,
    minWidth: 240,
    minHeight: 280,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    title: 'Call Center Notepad Pro',
    icon: path.join(__dirname, '../dist/pwa-512x512.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Save window size/position whenever resized or moved with the mouse
  mainWindow.on('resize', saveCurrentBounds);
  mainWindow.on('move', saveCurrentBounds);

  // Compact native menu with Always-on-Top and quick Window Size presets
  const menuTemplate = [
    {
      label: 'Window',
      submenu: [
        {
          label: 'Always on Top',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            if (mainWindow) {
              mainWindow.setAlwaysOnTop(menuItem.checked);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Ultra-Slim Width (300px)',
          click: () => {
            if (mainWindow) {
              const [, currentHeight] = mainWindow.getSize();
              mainWindow.setContentSize(300, currentHeight);
            }
          },
        },
        {
          label: 'Slim Width (360px)',
          click: () => {
            if (mainWindow) {
              const [, currentHeight] = mainWindow.getSize();
              mainWindow.setContentSize(360, currentHeight);
            }
          },
        },
        {
          label: 'Medium Width (480px)',
          click: () => {
            if (mainWindow) {
              const [, currentHeight] = mainWindow.getSize();
              mainWindow.setContentSize(480, currentHeight);
            }
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'togglefullscreen' },
        { role: 'minimize' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('set-window-width', (_event, targetWidth) => {
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    typeof targetWidth === 'number' &&
    targetWidth >= 240
  ) {
    const [, currentHeight] = mainWindow.getContentSize();
    mainWindow.setContentSize(Math.round(targetWidth), currentHeight);
    saveCurrentBounds();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
