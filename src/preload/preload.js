const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    convertVideo: (options) => ipcRenderer.invoke('convert-video', options),
    getVideoMetadata: (path) => ipcRenderer.invoke('get-video-metadata', path),
    onProgress: (callback) => ipcRenderer.on('conversion-progress', callback),
    onError: (callback) => ipcRenderer.on('conversion-error', callback),
    selectOutputPath: () => ipcRenderer.invoke('select-output-path'),
    getDefaultOutputPath: () => ipcRenderer.invoke('get-default-output-path'),
    openFile: (path) => ipcRenderer.invoke('open-file', path),
    openFolder: (path) => ipcRenderer.invoke('open-folder', path),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
});

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    close: () => ipcRenderer.invoke('close-window'),
}); 