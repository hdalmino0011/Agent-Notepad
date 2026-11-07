const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 375,
    height: 760,
    minWidth: 310,
    minHeight: 420,
    title: 'Call Center Notepad Pro',
    icon: path.join(__dirname, '../dist/pwa-512x512.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Compact native menu with Always-on-Top and quick Window Width presets
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
          label: 'Slim Width (375px)',
          click: () => {
            if (mainWindow) {
              const [, currentHeight] = mainWindow.getSize();
              mainWindow.setSize(375, currentHeight);
            }
          },
        },
        {
          label: 'Medium Width (495px)',
          click: () => {
            if (mainWindow) {
              const [, currentHeight] = mainWindow.getSize();
              mainWindow.setSize(495, currentHeight);
            }
          },
        },
        { type: 'separator' },
        { role: 'reload' },
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
