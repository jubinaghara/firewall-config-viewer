import { app, BrowserWindow } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow

// ✅ ADD THIS: Set App User Model ID for Windows taskbar icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.firewallconfigviewer.app') // Use your actual appId
}

function getIconPath() {
  if (process.platform !== 'win32') return undefined

  // 1. First try: inside resources folder (works for portable + NSIS)
  const resourcesPath = process.resourcesPath
  const fromResources = join(resourcesPath, 'icon.ico')
  if (existsSync(fromResources)) return fromResources

  // 2. Second try: inside ASAR root (if someone extracts or uses different packing)
  const fromAsarRoot = join(__dirname, 'icon.ico')
  if (existsSync(fromAsarRoot)) return fromAsarRoot

  // 3. Dev fallback only
  if (process.env.NODE_ENV === 'development') {
    const devPath = join(__dirname, '../build/icon.ico')
    if (existsSync(devPath)) return devPath
  }

  return null
}

function createWindow() {
  // Get icon path - use direct path.join approach as suggested
  const iconPath = getIconPath()

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    // Direct icon path in BrowserWindow constructor (as per solution found)
    ...(iconPath && { icon: iconPath }),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    backgroundColor: '#000',
    title: "Sophos Firewall Config Viewer" // Ensure title matches
  })

  // Also explicitly set icon after window creation (helps with Windows taskbar)
  if (iconPath) {
    mainWindow.setIcon(iconPath)
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})