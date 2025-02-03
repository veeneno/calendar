const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const sqlite3 = require('sqlite3').verbose();
const { dialog } = require('electron');

const dbPath = path.resolve(__dirname, '../db/database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      notes TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS general_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS meanings (
      id INTEGER PRIMARY KEY,
      content TEXT
    )
  `);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1800, 
    height: 1200, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('create-backup', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Salvar Backup',
    defaultPath: path.join(app.getPath('documents'), 'backup.zip'),
    filters: [{ name: 'Arquivo ZIP', extensions: ['zip'] }],
  });

  if (!result.canceled && result.filePath) {
    const zip = new AdmZip();
    zip.addLocalFile(dbPath); 
    zip.writeZip(result.filePath); 
    return { success: true, message: 'Backup criado com sucesso!' };
  }
  return { success: false, message: 'Operação cancelada pelo usuário.' };
});

ipcMain.handle('load-backup', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Carregar Backup',
    filters: [{ name: 'Arquivo ZIP', extensions: ['zip'] }],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const backupPath = result.filePaths[0];
    try {
      const zip = new AdmZip(backupPath);
      const extractPath = path.dirname(dbPath);
      zip.extractAllTo(extractPath, true);

      if (fs.existsSync(dbPath)) {
        return { success: true, message: 'Backup carregado com sucesso!' };
      } else {
        throw new Error('Falha ao restaurar o banco de dados.');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  return { success: false, message: 'Operação cancelada pelo usuário.' };
});

ipcMain.handle('delete-day-notes', async (event, date) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM days WHERE date = ?', [date], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

ipcMain.on('save-day-notes', (event, { date, notes }) => {
  db.run('INSERT INTO days (date, notes) VALUES (?, ?)', [date, notes], (err) => {
    if (err) {
      console.error('Erro ao salvar nota:', err);
      event.reply('save-day-notes-error', err.message);
    } else {
      event.reply('save-day-notes-success');
    }
  });
});

ipcMain.handle('save-general-notes', async (event, content) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT OR REPLACE INTO general_notes (id, content) VALUES (1, ?)', [content || ''], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

ipcMain.handle('save-meanings', async (event, content) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT OR REPLACE INTO meanings (id, content) VALUES (1, ?)', [content || ''], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

ipcMain.handle('load-days', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM days', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle('load-general-notes', async () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT content FROM general_notes LIMIT 1', (err, row) => {
      if (err) return reject(err);
      resolve(row?.content || '');
    });
  });
});

ipcMain.handle('load-meanings', async () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT content FROM meanings LIMIT 1', (err, row) => {
      if (err) return reject(err);
      resolve(row?.content || '');
    });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});