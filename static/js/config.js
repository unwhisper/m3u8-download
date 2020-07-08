import { app,ipcMain, ipcRenderer } from 'electron'
import Update from './update'
const Store = require('electron-store')
const fs = require('fs')
let store = new Store()

class Config {

    mainWindow

    constructor (mainWindow) {
        this.mainWindow = mainWindow
        // 初始化更新类型
        let updateType = store.get('updateType')
        if(!store.has('updateType') || !updateType) {
            store.set('updateType', 'auto')
        }
        //默认下载目录
        let downloadPath = store.get('downloadPath')
        if(!store.has('downloadPath') || !downloadPath) {
            try{
                store.set('downloadPath', app.getPath('downloads'))
            }catch(e) {
                let downPath = path.resolve(app.getAppPath(), '../../download')
                store.set('downloadPath', downPath)
            }
            downloadPath = store.get('downloadPath')
        }
        if(!fs.existsSync(downloadPath)) {
            fs.mkdir(downloadPath, () => {})
        }

        // 最小，最大化，关闭
        ipcMain.on('min', e => this.mainWindow.minimize());
        ipcMain.on('max', (event,arg) => {
            if (this.mainWindow.isMaximized()) {
                this.mainWindow.unmaximize()
                event.sender.send('isMax', false)
            } else {
                this.mainWindow.maximize()
                event.sender.send('isMax', true)
            }
        });
        ipcMain.on('close', e => this.mainWindow.close());

        /**
         * 版本更新
         */
        const update = new Update(this.mainWindow)
        ipcMain.on("checkForUpdate", () => {
            if (process.env.NODE_ENV !== 'development') {
                //执行自动检查更新
                update.checkUpdate()
            }
            //update.checkUpdate()
        })

        ipcMain.on('update',(event, arg) => {
            console.log(arg)
            if(arg == 'update') {
                update.autoUpdate()
            }else if(arg == 'autoCheckUpdate') {
                update.autoCheckUpdate()
            }else if(arg == 'handCheckUpdate') {
                update.handCheckUpdate()
            }
        })
    }
}

export default Config