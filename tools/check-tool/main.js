const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function openExternalHttpUrl(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return;
  }

  if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
    shell.openExternal(parsedUrl.toString());
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 800,
    minWidth: 980,
    minHeight: 759,
    alwaysOnTop: true,
    title: 'Model Check Tool',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 外部リンク（url列の参照リンク等）はブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalHttpUrl(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url === mainWindow.webContents.getURL()) return;

    event.preventDefault();
    openExternalHttpUrl(url);
  });

  // メニューバー
  const template = [
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: '最前面に表示',
          type: 'checkbox',
          checked: true,
          click(item) {
            mainWindow.setAlwaysOnTop(item.checked);
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
