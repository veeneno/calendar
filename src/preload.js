const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveDayNotes: (date, notes) => ipcRenderer.send('save-day-notes', { date, notes }),
  saveGeneralNotes: (content) =>
    ipcRenderer.invoke('save-general-notes', content),
  saveMeanings: (content) =>
    ipcRenderer.invoke('save-meanings', content),
  deleteDayNotes: (date) =>
    ipcRenderer.invoke('delete-day-notes', date),
  loadDays: () => ipcRenderer.invoke('load-days'),
  loadGeneralNotes: () => ipcRenderer.invoke('load-general-notes'),
  loadMeanings: () => ipcRenderer.invoke('load-meanings'),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  loadBackup: () => ipcRenderer.invoke('load-backup'),
});