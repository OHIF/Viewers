const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const http = require('node:http');

const INITIAL_WINDOW_DIMENSIONS = { width: 800, height: 600 };

const createWindow = () => {
  const mainWindow = new BrowserWindow({ ...INITIAL_WINDOW_DIMENSIONS });
  mainWindow.loadURL('http://localhost:9999/local');
  if (process.env.DEBUG) mainWindow.webContents.openDevTools();
};

const listening = new Promise(resolve => {
  http
    .createServer(async (req, res) => {
      let file = await urlToFile(req.url);
      res.setHeader('Content-Type', mime(file));
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

      const fd = await fs.open(path.join(file));
      fd.createReadStream().pipe(res);
    })
    .listen(9999, () => resolve());
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await listening;

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function mime(file) {
  switch (path.extname(file)) {
    case '.js':
      return 'text/javascript';
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.wasm':
      return 'application/wasm';
    case '.json':
    case '.map':
      return 'application/json';
    default:
      console.log(path.extname(file));
  }
}

async function urlToFile(url) {
  try {
    let file = path.join(__dirname, 'build', url);
    await fs.access(file);
    return file;
  } catch {
    return path.join(__dirname, 'build', '/index.html');
  }
}
