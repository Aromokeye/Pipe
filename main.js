const electron = require('electron')
const url = require('url')
const path = require('path')


const {app, BrowserWindow, Menu, ipcMain} = electron

process.env.NODE_ENV = 'production'

let mainWindow
let addWindow

//Listen for app to be ready
app.on('ready', function(){
    //create new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    //Load html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }))
    //close windows on close
    mainWindow.on('close', function(){
        app.quit()
    })

    //build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

//create the making of new window
function createNewWindow(){
    addWindow = new BrowserWindow({
        width: 340,
        height:530,
        title: 'Add A Pipe Parameters',
        webPreferences: {
            nodeIntegration: true
        }
    })
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true,
        
    }))
   
    //garbage collection
    addWindow.on('close', function(){
        addWindow = null
    })
} 

//catch piping from addWindow
ipcMain.on('torender', function(e, container){
    mainWindow.webContents.send('torender', container)
    addWindow.close()
})

//create Menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add Loop',
                click(){
                    createNewWindow()
                }
            },
            {
                label: 'Remove Loop',
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q'
                : 'Ctrl+Q',
                click(){
                    app.quit()
                }
            }
        ],
    }
]

//add developer tool when not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}