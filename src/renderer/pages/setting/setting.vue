<template>
<div>
    <div>
      <MyHeader></MyHeader>
    </div>
    <div id="setting">
        <div id="setContent">
            <div class="setLeft">
                <div :class="itemIndex == 0? 'leftItemSelect' : 'leftItem'" @click="checkIndex(0)">下载设置</div>
                <div :class="itemIndex == 1? 'leftItemSelect' : 'leftItem'" @click="checkIndex(1)">关于</div>
                <!-- <div :class="itemIndex == 2? 'leftItemSelect' : 'leftItem'" @click="checkIndex(2)">代理设置</div> -->
            </div>
            <div class="setRight">
                <div class="rightItemSet" v-if="itemIndex == 0">
                    <div class="title">下载设置</div>
                    <div class="top">下载目录：<span>默认将文件下载在该文件夹中</span></div>
                    <div class="bottom">
                        <span>{{savePath}}</span>
                        <div class="btn" @click="choosePath">更改目录</div>
                    </div>
                </div>
                <div class="rightItemAbout" v-else-if="itemIndex == 1">
                    <div class="title">关于</div>
                    <div class="top">
                        <span>当前版本{{version}} (Build:{{author}})</span>
                        <div class="btn" @click="handCheckUpdate">检查更新</div>
                        <!-- <div class="btn">意见反馈</div> -->
                    </div>
                    <div class="bottom">
                        <div class="chooseItem">
                            <div class="selected" @click="chooseAutomatic(true)"><div :class="isAutomatic? 'selectTrue':''"></div></div>
                            <div class="txt" @click="chooseAutomatic(true)">自动更新</div>
                        </div>
                        <div class="chooseItem">
                            <div class="selected" @click="chooseAutomatic(false)"><div :class="!isAutomatic? 'selectTrue':''"></div></div>
                            <div class="txt" @click="chooseAutomatic(false)">有新版本时提醒我</div>
                        </div>
                    </div>
                </div>
                <!-- <div class="rightItemSet" v-if="itemIndex == 2">
                    <div class="title">代理设置</div>
                    <div class="top">代理设置：<span>将本地代理配置到app(例：http://127.0.0.1:10809)</span></div>
                    <div class="bottom">
                        <input type="text" :value="proxy" id="proxy"> <Button size="small" class="button" type="primary" @click="saveProxy()">保存</Button>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</div>
</template>

<script>
import MyHeader from "@/components/Header";
const { dialog } = require('electron').remote
const { ipcRenderer } = require('electron')
const json_package = require("../../../../package.json");
const Store = require('electron-store');
const store = new Store();
export default {
    data() {
        return {
            itemIndex: 0, // 切换左边菜单索引
            isAutomatic: true, // 自动更新、有新版本时提醒我切换
            savePath: '',//保存目录
            version: json_package.version,
            author: json_package.author,
            proxy: ''
        }
    },
    components: {
        MyHeader
    },
    mounted() {
        let updateType = store.get('updateType')
        if(updateType) {
            this.update_type = updateType
            if(this.update_type == 'auto'){
                this.isAutomatic = true
            }else if(this.update_type == 'tips'){
                this.isAutomatic = false
            }
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

        let downloadPath = store.get('downloadPath')
        if(downloadPath) {
            this.savePath = downloadPath
        }
        let proxy = store.get('proxy')
        if (proxy) {
            this.proxy = proxy
        }
    },
    beforeDestroy() {ipcRenderer.removeAllListeners(['message','downloadProgress','isUpdateNow','updateAvailable'])},
    methods: {
        /**
         * 检查更新
         */
        handCheckUpdate() {
            if(navigator.onLine){
                ipcRenderer.send("checkForUpdate");
            }
            ipcRenderer.send('update',"handCheckUpdate");
        },
        checkIndex:function(index){
            this.itemIndex = index;
        },
        chooseAutomatic:function(isTrue){
            if(isTrue){
                store.set('updateType','auto')
            }else{
                store.set('updateType','tips')
            }
            this.isAutomatic = isTrue;
        },
        /**
       * 选择文件夹
       */
        choosePath() {
            let that = this
            dialog.showOpenDialog({
            properties: [
                'openDirectory',
            ],
            //过滤条件
            filters: [
                { name: 'All', extensions: ['*'] },
            ]
            }).then(result => {
                if (result.canceled === false) {
                    that.savePath = result.filePaths[0]
                    store.set('downloadPath',result.filePaths[0])
                }
            }).catch(err => {
                console.log(err)
            })
        },
        saveProxy () {
            let proxy = document.querySelector('#proxy')
            this.proxy = proxy.value
            store.set('proxy', proxy.value)
        }
    },
}
</script>

<style lang="less" scoped>
#setting{
    .ivu-modal-header {
        background-color: #cde;
    }
    .ivu-modal-body{
        background-color: #cde;
    }
    .ivu-modal-footer{
        background-color: #cde;
    }
    margin-top: 40px;
    height: 100%;
    // 头部
    #headers{
        height: 40px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        box-shadow: 1px 1px 3px rgba(0, 0, 0, .1);
        img{
            width: 20px;
            height: 20px;
        }
        span{
            font-size: 18px;
            line-height: 18px;
            padding-left: 5px;
        }
    }

    // 内容
    #setContent{
        width: 100%;
        height: calc(100% - 40px);
        display: flex;
        background: #edeef5;
        .setLeft{
            background: #FFFFFF;
            margin: 20px;
            width: calc(25% - 40px);
            height: calc(100% - 40px);
            .leftItem{
                width: 100%;
                height: 40px;
                color: #000000;
                font-size: 16px;
                line-height: 40px;
                text-align: center;
                cursor: pointer;
            }
            .leftItemSelect{
                width: 100%;
                height: 40px;
                background: #852AB5;
                color: #FFFFFF;
                font-size: 16px;
                line-height: 40px;
                text-align: center;
                cursor: pointer;
            }
        }
        .setRight{
            background: #FFFFFF;
            margin: 20px 20px 20px 0;
            width: calc(75% - 20px);
            height: calc(100% - 40px);
            .rightItemSet{
                padding: 20px;
                .title{
                    font-size: 20px;
                }
                .top{
                    padding-top: 40px;
                    font-size: 14px;
                    span{
                        font-size: 14px;
                        color: #BBBBBB;
                    }
                }
                .bottom{
                    padding-top: 10px;
                    display: flex;
                    align-items: center;
                    span{
                        font-size: 16px;
                        padding-right: 20px;
                    }
                    .btn{
                        font-size: 14px;
                        background: #852AB5;
                        color: #FFFFFF;
                        display: inline-block;
                        padding: 3px 5px;
                        cursor: pointer;
                    }
                }
            }
            .rightItemAbout{
                padding: 20px;
                .title{
                    font-size: 20px;
                }
                .top{
                    padding-top: 40px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    .btn{
                        margin-left: 10px;
                        background: #852AB5;
                        color: #FFFFFF;
                        display: inline-block;
                        padding: 3px 5px;
                        cursor: pointer;
                        &:first-of-type{
                            margin-left: 20px;
                        }
                    }
                }
                .bottom{
                    padding-top: 10px;
                    .chooseItem{
                        display: flex;
                        align-items: center;
                        padding-top: 10px;
                        .selected{
                            width: 13px;
                            height: 13px;
                            // background: #3fb086;
                            border: 2px solid #C2C2C2;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            .selectTrue{
                                width: 7px;
                                height: 7px;
                                // margin: 3px;
                                background: #852AB5;
                                border-radius: 50%;
                            }
                        }
                        .txt{
                            font-size: 14px;
                            line-height: 14px;
                            padding-left: 5px;
                            cursor: pointer;
                        }
                    }
                }
            }
        }
    }
}
</style>