const { app, BrowserWindow, dialog, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Check if running in development mode
const isDev = !app.isPackaged;

if (isDev) {
    console.log('Starting Electron app in development mode...');
    console.log('Current directory:', __dirname);
}

let convertVideo, cancelConversion;
try {
    const converter = require('./converter');
    convertVideo = converter.convertVideo;
    cancelConversion = converter.cancelConversion;
    if (isDev) {
        console.log('Converter module loaded successfully');
    }
} catch (error) {
    console.error('Error loading converter module:', error);
    process.exit(1);
}

let mainWindow;
let isConverting = false;
let currentFFmpegProcess = null;

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    if (isDev) {
        console.log('Preload path:', preloadPath);
        console.log('Preload file exists:', fs.existsSync(preloadPath));
    }
    
    mainWindow = new BrowserWindow({
        width: 650,
        height: 700,
        minWidth: 550,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            enableRemoteModule: false,
            webSecurity: true, // Required for ads
            allowRunningInsecureContent: false
        },
        // icon: path.join(__dirname, 'icon.png'), // Use if local icon file exists
        titleBarStyle: 'default',
        resizable: true,
        skipTaskbar: false // Show in taskbar so user can restore window
    });

    mainWindow.loadFile('index.html');

    // Check preload script loading (development only)
    // Note: Developer tools are disabled even in development mode for production-like testing
    // Uncomment the lines below if you need to debug:
    /*
    if (isDev) {
        mainWindow.webContents.on('did-finish-load', () => {
            console.log('Page loaded, checking electronAPI...');
            setTimeout(() => {
                mainWindow.webContents.executeJavaScript(`
                    console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
                    if (typeof window.electronAPI !== 'undefined') {
                        console.log('electronAPI methods:', Object.keys(window.electronAPI));
                    } else {
                        console.error('electronAPI is not defined!');
                    }
                `).catch(err => console.error('Error checking electronAPI:', err));
            }, 100);
        });

        // Open developer tools in development mode only
        mainWindow.webContents.openDevTools();
    }
    */

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        // If navigating to external URL (http/https), open in default browser
        if (navigationUrl.startsWith('http://') || navigationUrl.startsWith('https://')) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Error handling
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('crashed', () => {
        console.error('Window crashed');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    try {
        createWindow();
        console.log('Window created successfully');
    } catch (error) {
        console.error('Error creating window:', error);
    }

    app.on('activate', () => {
        // Show window if it exists but is hidden
        if (mainWindow) {
            mainWindow.show();
        } else if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('ready', () => {
    if (isDev) {
        console.log('Electron app is ready');
    }
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('window-all-closed', () => {
    // Don't quit if conversion is in progress
    if (isConverting) {
        return; // Keep app running in background
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cancel conversion on app quit (only when user explicitly quits)
app.on('before-quit', (event) => {
    if (isConverting && cancelConversion) {
        // Ask user if they want to cancel conversion
        if (mainWindow && !mainWindow.isDestroyed()) {
            event.preventDefault();
            dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Conversion in Progress',
                message: 'Video conversion is currently running.',
                detail: 'Quitting the application will cancel the conversion. Do you want to quit anyway?',
                buttons: ['Cancel', 'Quit Anyway'],
                defaultId: 0,
                cancelId: 0
            }).then((result) => {
                if (result.response === 1) {
                    // User chose to quit anyway
                    cancelConversion();
                    isConverting = false;
                    app.quit();
                }
            });
        } else {
            // Window already closed, just cancel and quit
            cancelConversion();
            isConverting = false;
        }
    }
});

// File selection dialog
ipcMain.handle('select-file', async () => {
    try {
        if (!mainWindow) {
            console.error('mainWindow is not available');
            return null;
        }
        
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'WebM Files', extensions: ['webm'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    } catch (error) {
        console.error('Error in select-file:', error);
        return null;
    }
});

// Output file selection dialog
ipcMain.handle('select-output-file', async (event, defaultPath) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultPath,
        filters: [
            { name: 'MP4 Files', extensions: ['mp4'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled) {
        return result.filePath;
    }
    return null;
});

// Video conversion
ipcMain.handle('convert-video', async (event, inputPath, outputPath, options = {}) => {
    isConverting = true;
    return new Promise((resolve) => {
        convertVideo(inputPath, outputPath, {
            ...options,
            onProgress: (progress) => {
                // Send progress to renderer process
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('conversion-progress', progress);
                }
            }
        })
        .then((outputPath) => {
            isConverting = false;
            
            // Show notification when conversion completes
            if (Notification.isSupported()) {
                const notification = new Notification({
                    title: 'Conversion Complete',
                    body: `Video conversion finished: ${require('path').basename(outputPath)}`,
                    silent: false
                });
                notification.show();
                
                // Open folder when notification is clicked
                notification.on('click', () => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.show();
                        shell.showItemInFolder(outputPath);
                    } else {
                        shell.showItemInFolder(outputPath);
                    }
                });
            }
            
            // Auto-open folder if window is hidden
            if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) {
                shell.showItemInFolder(outputPath);
            }
            
            resolve({ success: true, outputPath });
        })
        .catch((error) => {
            isConverting = false;
            resolve({ success: false, error: error.message });
        });
    });
});

// Cancel conversion
ipcMain.handle('cancel-conversion', async () => {
    if (isConverting && cancelConversion) {
        const cancelled = cancelConversion();
        if (cancelled) {
            isConverting = false;
            return { success: true, message: 'Conversion cancelled' };
        }
    }
    return { success: false, message: 'No conversion in progress' };
});

// Get file information
ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            name: path.basename(filePath)
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
});

// Show item in folder (open folder containing the file)
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
    try {
        shell.showItemInFolder(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
