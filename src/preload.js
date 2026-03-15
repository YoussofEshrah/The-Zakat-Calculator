const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zakatAPI', {
  fetchPrices: () => ipcRenderer.invoke('fetch-prices'),
  calculateZakat: (params) => ipcRenderer.invoke('calculate-zakat', params),
});
