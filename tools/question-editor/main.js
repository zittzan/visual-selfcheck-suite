const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

let mainWindow;
const isDev = !app.isPackaged;

// ===== パス許可リスト（IPC からの任意ファイルアクセス防止） =====
// ダイアログまたは DnD でユーザーが明示的に選んだパスのみ操作対象にする。
const approvedFiles = new Set();
const approvedFolders = new Set();

function approveFile(p) {
  if (!p) return;
  approvedFiles.add(path.resolve(p));
}
function approveFolder(p) {
  if (!p) return;
  approvedFolders.add(path.resolve(p));
}

// project.json 内で参照されている画像パスを承認リストに追加する。
// JSON 自体はユーザーがダイアログで明示的に選んだファイルなので、その中身が指す画像パスも
// 同じ操作の一部として信頼する（CSV+フォルダ取込時に approveFolder するのと同じ考え方）。
// 拡張子を画像系に限定し、無関係なパスまで不用意に承認しないようにする。
const APPROVABLE_IMG_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
function approveProjectImagePaths(data) {
  if (!data || !Array.isArray(data.questions)) return;
  for (const q of data.questions) {
    for (const p of [...(q.goodImages || []), ...(q.badImages || [])]) {
      if (typeof p !== 'string' || !p) continue;
      const ext = path.extname(p).toLowerCase().slice(1);
      if (APPROVABLE_IMG_EXTS.has(ext)) approveFile(p);
    }
  }
}

// 指定パスが許可ファイル、または許可フォルダ配下にあるか
function isApprovedPath(p) {
  if (!p) return false;
  let normP;
  try { normP = path.resolve(p); } catch { return false; }
  if (approvedFiles.has(normP)) return true;
  for (const folder of approvedFolders) {
    const rel = path.relative(folder, normP);
    if (rel === '' || (rel && !rel.startsWith('..') && !path.isAbsolute(rel))) return true;
  }
  return false;
}

function isApprovedTarget(p) {
  // 書き込み先は許可フォルダ「そのもの」または配下のみ。任意親フォルダにファイル新規作成は不可。
  if (!p) return false;
  let normP;
  try { normP = path.resolve(p); } catch { return false; }
  if (approvedFolders.has(normP)) return true;
  for (const folder of approvedFolders) {
    const rel = path.relative(folder, normP);
    if (rel === '' || (rel && !rel.startsWith('..') && !path.isAbsolute(rel))) return true;
  }
  return false;
}

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
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: 'Question Editor',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // sandbox: true は OS からのファイル DnD と相性が悪い（Chromium のサンドボックス境界で
      // 阻害される）ため無効化。contextIsolation + nodeIntegration:false + IPC パス検証 +
      // 厳格 CSP で十分なセキュリティを担保している。
      sandbox: false,
      devTools: isDev,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalHttpUrl(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url === mainWindow.webContents.getURL()) return;
    event.preventDefault();
    openExternalHttpUrl(url);
  });

  const viewSubmenu = [{ role: 'reload' }];
  if (isDev) {
    viewSubmenu.push({ role: 'toggleDevTools' }, { type: 'separator' });
  }
  viewSubmenu.push({ role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' });

  const template = [
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { label: 'View', submenu: viewSubmenu },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ===== IPC ハンドラ =====

// DnD で renderer 側 webUtils.getPathForFile が取得したパスを登録
ipcMain.handle('paths:registerDropped', (_evt, paths) => {
  if (!Array.isArray(paths)) return;
  for (const p of paths) approveFile(p);
});

ipcMain.handle('dialog:pickProjectJson', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'プロジェクトファイルを開く',
    filters: [{ name: 'Question Editor Project', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  approveFile(filePath);
  const text = await fs.readFile(filePath, 'utf8');
  try {
    const data = JSON.parse(text);
    approveProjectImagePaths(data);
    return { filePath, data };
  } catch (err) {
    return { filePath, error: String(err) };
  }
});

ipcMain.handle('dialog:saveProjectJson', async (_evt, { data, currentPath }) => {
  let filePath = currentPath;
  if (filePath) {
    // 既存パスは事前承認済みでなければ拒否
    if (!isApprovedPath(filePath)) {
      return { error: '保存先パスが未承認です。再度「開く」または「保存」ダイアログから選択してください。' };
    }
  } else {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'プロジェクトを保存',
      defaultPath: 'project.json',
      filters: [{ name: 'Question Editor Project', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return null;
    filePath = result.filePath;
    approveFile(filePath);
  }
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { filePath };
});

ipcMain.handle('dialog:pickFolder', async (_evt, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || 'フォルダを選択',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folder = result.filePaths[0];
  approveFolder(folder);
  return folder;
});

ipcMain.handle('dialog:pickImages', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '画像を選択',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled) return [];
  for (const p of result.filePaths) approveFile(p);
  return result.filePaths;
});

ipcMain.handle('fs:readFileAsDataUrl', async (_evt, absPath) => {
  if (!isApprovedPath(absPath)) return null;
  try {
    const data = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase().slice(1) || 'png';
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
});

ipcMain.handle('fs:fileExists', async (_evt, absPath) => {
  if (!isApprovedPath(absPath)) return false;
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
});

// CSV + 画像フォルダのインポート（既存 check-tool フォルダ）
ipcMain.handle('project:importCsvFolder', async () => {
  const pick = await dialog.showOpenDialog(mainWindow, {
    title: 'Visual SelfCheck 用フォルダを選択',
    properties: ['openDirectory'],
  });
  if (pick.canceled || pick.filePaths.length === 0) return null;
  const folder = pick.filePaths[0];
  approveFolder(folder);

  const entries = await fs.readdir(folder, { withFileTypes: true });
  const csvEntry = entries.find((e) => e.isFile() && e.name.toLowerCase().endsWith('.csv'));
  if (!csvEntry) return { error: 'ルート直下に CSV が見つからない' };
  const csvPath = path.join(folder, csvEntry.name);
  const csvText = await fs.readFile(csvPath, 'utf8');
  return { folder, csvPath, csvText };
});

// エクスポート: CSV + images/ 書き出し
ipcMain.handle('project:export', async (_evt, payload) => {
  const { targetDir, csvText, images } = payload || {};
  if (!isApprovedTarget(targetDir)) {
    return { error: 'エクスポート先が未承認です。再度「エクスポート」からフォルダを選んでください。' };
  }
  if (!fsSync.existsSync(targetDir)) {
    await fs.mkdir(targetDir, { recursive: true });
  }
  const imagesDir = path.join(targetDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });

  const BOM = '﻿';
  await fs.writeFile(path.join(targetDir, 'checklist.csv'), BOM + (csvText || ''), 'utf8');

  const copied = [];
  const failed = [];
  for (const img of (images || [])) {
    if (!isApprovedPath(img.src)) {
      failed.push({ src: img.src, error: 'unapproved source path' });
      continue;
    }
    // destName は basename のみ許容（パストラバーサル防止）
    const safeName = path.basename(img.destName || '');
    if (!safeName) {
      failed.push({ src: img.src, error: 'invalid destName' });
      continue;
    }
    try {
      await fs.copyFile(img.src, path.join(imagesDir, safeName));
      copied.push(safeName);
    } catch (err) {
      failed.push({ src: img.src, error: String(err) });
    }
  }
  return { targetDir, copied, failed };
});

ipcMain.handle('shell:openExternal', async (_evt, url) => {
  openExternalHttpUrl(url);
});

ipcMain.handle('shell:showItemInFolder', async (_evt, fullPath) => {
  if (!isApprovedTarget(fullPath) && !isApprovedPath(fullPath)) return;
  shell.showItemInFolder(fullPath);
});
