import { contextBridge, ipcRenderer } from 'electron'

/**
 * 渲染进程唯一的数据通道。
 * 页面里没有 Node 权限，所有读写都走这里 → 主进程。
 */
contextBridge.exposeInMainWorld('fishpond', {
  load: () => ipcRenderer.invoke('store:load'),

  saveSettings: (patch) => ipcRenderer.invoke('settings:save', patch),

  saveEntry: (entry) => ipcRenderer.invoke('entry:save', entry),
  deleteEntry: (id) => ipcRenderer.invoke('entry:delete', id),
  toggleTodo: (payload) => ipcRenderer.invoke('entry:toggle-todo', payload),

  saveMaterial: (material) => ipcRenderer.invoke('material:save', material),
  deleteMaterials: (ids) => ipcRenderer.invoke('material:delete', ids),

  saveWeekly: (weekly) => ipcRenderer.invoke('weekly:save', weekly),
  deleteWeekly: (id) => ipcRenderer.invoke('weekly:delete', id),

  analyze: (payload) => ipcRenderer.invoke('ai:analyze', payload),
  generateWeekly: (payload) => ipcRenderer.invoke('ai:weekly', payload),
  testApi: () => ipcRenderer.invoke('ai:test'),

  exportBackup: () => ipcRenderer.invoke('backup:export'),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  openDataFolder: () => ipcRenderer.invoke('app:data-folder'),
  getSystemPrompt: () => ipcRenderer.invoke('app:prompt'),

  /** 订阅流式增量，返回取消函数 */
  onChunk: (cb) => {
    const handler = (_e, payload) => cb(payload)
    ipcRenderer.on('ai:chunk', handler)
    return () => ipcRenderer.removeListener('ai:chunk', handler)
  }
})
