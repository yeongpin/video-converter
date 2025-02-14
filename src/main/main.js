const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { convertVideo } = require('./ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const os = require('os');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/preload.js')
        },
        frame: false,
    });

    win.loadFile(path.join(__dirname, '../../public/index.html'));
    
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// get default output path
async function getDefaultOutputPath() {
    const downloadsPath = path.join(os.homedir(), 'Downloads', 'output');
    try {
        await fs.access(downloadsPath);
    } catch {
        await fs.mkdir(downloadsPath, { recursive: true });
    }
    return downloadsPath;
}

// add new IPC handler
ipcMain.handle('select-output-path', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('get-default-output-path', async () => {
    return await getDefaultOutputPath();
});

// modify existing conversion handler
ipcMain.handle('convert-video', async (event, { inputPath, outputPath, options }) => {
    console.log('Starting conversion:', { inputPath, outputPath, options });
    try {
        // if no output path provided, use default path
        const defaultOutputDir = await getDefaultOutputPath();
        const finalOutputPath = outputPath || defaultOutputDir;
        
        await convertVideo(inputPath, finalOutputPath, options);
        console.log('Conversion completed');
        return { success: true, outputPath: finalOutputPath };
    } catch (error) {
        console.error('Conversion failed:', error);
        throw error;
    }
});

// add new IPC handler
ipcMain.handle('get-video-metadata', async (event, path) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata);
        });
    });
});

// add window control handlers
ipcMain.handle('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.handle('maximize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.handle('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});

// add open file and folder handler
ipcMain.handle('open-file', async (event, path) => {
    shell.openPath(path);
});

ipcMain.handle('open-folder', async (event, path) => {
    shell.showItemInFolder(path);
});

// add external link handler
ipcMain.handle('open-external-link', async (event, url) => {
    shell.openExternal(url);
}); 