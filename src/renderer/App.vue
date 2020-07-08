<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron')
const Store = require('electron-store');
const store = new Store();
  export default {
    name: 'myelectron',
    data(){
      return {
        update_type: ''
      }
    },
    mounted() {
      let updateType = store.get('updateType')
      if(updateType) {
          this.update_type = updateType
      }

      if(navigator.onLine){
        ipcRenderer.send("checkForUpdate");
      }

      if(this.update_type == 'auto') {
        ipcRenderer.send('update',"update");
      }else if(this.update_type == 'tips') {
        ipcRenderer.send('update',"autoCheckUpdate");
      }
      // 收到消息
      ipcRenderer.on("message", (event, text) => {
        this.$Modal.info({
          title: '检测更新',
          content: text ,
          width: 270 
        });
      });

      // 下载进度
      ipcRenderer.on("downloadProgress", (event, progressObj)=> {
        let progress = progressObj.percent | 0;
        this.$Modal.info({
          title: '检测更新',
          content: '下载进度：' + progress + '%',
          width: 270 
        });
      }); 

      // 安装
      ipcRenderer.on("isUpdateNow", () => {
          // 是否更新
          this.$Modal.confirm({
            title: '检测更新',
            content: '下载完成，是否立即安装？(安装需要重启应用)',
            okText: '更新',
            cancelText: '取消',
            onOk: () => {
              ipcRenderer.send("isUpdateNow");
              this.$Message.info('Clicked ok');
            },
            onCancel: () => {
              this.$Message.info('Clicked cancel');
            }
        });
      });

      // 检测到新版本
      ipcRenderer.on("updateAvailable", (event, message) => {
        this.$Modal.confirm({
          title: '检测更新',
          content: message,
          okText: '更新',
          cancelText: '取消',
          onOk: () => {
            ipcRenderer.send('isDownload');
            this.$Message.info('Clicked ok');
          },
          onCancel: () => {
            this.$Message.info('Clicked cancel');
          }
        });
      });

      ipcRenderer.on("autoUpdateAvailable", (event, message) => {
        this.$Modal.info({
          title: '检测更新',
          content: message,
          width: 270 
        });
        ipcRenderer.send('isDownload');
      });
    },
    methods:{
      
    }
    
  }
</script>

<style>
  /* CSS */
</style>
