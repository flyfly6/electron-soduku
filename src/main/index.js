'use strict'

import { app, BrowserWindow, Menu } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 650,
    useContentSize: true,
    width: 500
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

let mode = 1
const template = [
  {
    label: 'Game',
    submenu: [
      {
        label: 'New Game',
        click (item, window, event) {
          window.webContents.send('new-game', mode)
        }
      },
      {
        label: 'Restart',
        click (item, window, event) {
          window.webContents.send('restart')
        }
      },
      { type: 'separator' },
      {
        label: 'Easy',
        type: 'radio',
        click () {
          mode = 1
        }
      },
      {
        label: 'Medium',
        type: 'radio',
        click () {
          mode = 2
        }
      },
      {
        label: 'Hard',
        type: 'radio',
        click () {
          mode = 3
        }
      },
      {
        label: 'Expert',
        type: 'radio',
        click () {
          mode = 4
        }
      }
    ]
  }
]
