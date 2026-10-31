import path from 'node:path'
import { app, BrowserWindow, Menu, session } from 'electron'
import { registerAppScheme, serveRenderer } from './protocol'
import { lockDownSession, lockDownWebContents } from './security'
import { APP_ENTRY_URL } from './urls'

const devServerUrl = app.isPackaged ? undefined : process.env['ELECTRON_RENDERER_URL']

registerAppScheme()
app.enableSandbox()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: 'Utility App',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  })
  lockDownWebContents(win.webContents, devServerUrl)
  win.once('ready-to-show', () => win.show())
  void win.loadURL(devServerUrl ?? APP_ENTRY_URL)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  app.whenReady().then(() => {
    if (app.isPackaged) Menu.setApplicationMenu(null)
    serveRenderer(path.join(import.meta.dirname, '../renderer'))
    // The window uses the default session; lock it down before any page loads.
    lockDownSession(session.defaultSession, devServerUrl)
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => app.quit())
}
