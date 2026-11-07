const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  setWindowWidth: (width) => ipcRenderer.send('set-window-width', width),
});
