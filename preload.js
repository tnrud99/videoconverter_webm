const { contextBridge, ipcRenderer } = require('electron');

// Only log in development mode
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('Preload script loaded');
}

// Path utility functions (implemented in JavaScript)
const pathUtils = {
    basename: (filePath) => {
        const parts = filePath.split(/[/\\]/);
        return parts[parts.length - 1] || filePath;
    },
    dirname: (filePath) => {
        const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        return lastSlash > 0 ? filePath.substring(0, lastSlash) : filePath;
    },
    extname: (filePath) => {
        const lastDot = filePath.lastIndexOf('.');
        const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        return lastDot > lastSlash ? filePath.substring(lastDot) : '';
    },
    join: (...paths) => {
        // Handle both forward and backslashes for cross-platform compatibility
        const joined = paths.filter(p => p).join('/').replace(/\/+/g, '/');
        // On Windows, convert to backslashes if the path contains a drive letter
        if (/^[A-Za-z]:/.test(joined)) {
            return joined.replace(/\//g, '\\');
        }
        return joined;
    }
};

try {
    contextBridge.exposeInMainWorld('electronAPI', {
        selectFile: () => ipcRenderer.invoke('select-file'),
        selectOutputFile: (defaultPath) => ipcRenderer.invoke('select-output-file', defaultPath),
        convertVideo: (inputPath, outputPath, options) => ipcRenderer.invoke('convert-video', inputPath, outputPath, options),
        cancelConversion: () => ipcRenderer.invoke('cancel-conversion'),
        getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
        showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
        onProgress: (callback) => {
            ipcRenderer.on('conversion-progress', (event, progress) => callback(progress));
        },
        path: pathUtils
    });
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        console.log('electronAPI exposed successfully');
    }
} catch (error) {
    console.error('Error exposing electronAPI:', error);
}
