const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('qeAPI', {
  // Electron 32+ では File.path が削除されたので webUtils.getPathForFile を使う。
  // 取得したパスは即座に main 側の承認リストに登録（IPC のパス検証で必要）。
  getPathForFile: (file) => {
    try {
      const p = webUtils.getPathForFile(file);
      if (p) ipcRenderer.invoke('paths:registerDropped', [p]);
      return p;
    } catch {
      return '';
    }
  },
  pickProjectJson: () => ipcRenderer.invoke('dialog:pickProjectJson'),
  saveProjectJson: (data, currentPath) =>
    ipcRenderer.invoke('dialog:saveProjectJson', { data, currentPath }),
  pickFolder: (title) => ipcRenderer.invoke('dialog:pickFolder', title),
  pickImages: () => ipcRenderer.invoke('dialog:pickImages'),
  readFileAsDataUrl: (absPath) => ipcRenderer.invoke('fs:readFileAsDataUrl', absPath),
  fileExists: (absPath) => ipcRenderer.invoke('fs:fileExists', absPath),
  importCsvFolder: () => ipcRenderer.invoke('project:importCsvFolder'),
  exportProject: (payload) => ipcRenderer.invoke('project:export', payload),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  showItemInFolder: (fullPath) => ipcRenderer.invoke('shell:showItemInFolder', fullPath),
});
