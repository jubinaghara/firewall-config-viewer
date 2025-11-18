// Preload script - runs in the renderer process but has access to Node.js APIs
import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // You can add IPC methods here if needed in the future
  platform: process.platform
})

