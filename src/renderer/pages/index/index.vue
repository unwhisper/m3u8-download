<template>
  <div id="wrapper">
    <main>
      <div>
        <MyHeader></MyHeader>
      </div>
      <div>
        <div>
          <Select v-model="select" style="width:120px">
            <Option value="online">在线地址下载</Option>
            <Option value="local">本地文件下载</Option>
          </Select>
        </div>
        <div style="margin-top:10px;">
          <Input search enter-button="在线下载" v-if="select == 'online'" v-model="inputValue" placeholder="输入m3u8文件地址" @on-search="download()" />
          <Input search enter-button="本地下载" v-else icon="md-document" v-model="filepath" readonly placeholder="点击右侧图标选择m3u8文件" @on-click="chooseFile()" @on-search="localDownload()" />
        </div>
      </div>
      <div class="content">
        <div id="info"></div>
        <div class="TaskList">
          <div class="item template" style="display: none;">
            <div class="m3u8"></div>
            <div class="time"><span >时间：</span><span class="value">2019-12-16 15:06:00</span></div>
            <div class="status">
              <span >状态：</span><span class="value">正在下载</span>
            </div>
            <div class="opt top">
              <input class="opendir" type="button" value="打开文件夹">
            </div>
            <div class="opt bottom">
              <input class="del" type="button" value="删除">
              <input class="play" type="button" value="播放">
              <input class="StartStop" type="button" value="停止">
            </div>
          </div>
          <div class="empty">
            <span>当前还没有下载视频，请先添加下载任务</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
  import MyHeader from '@/components/Header'
  const { remote, ipcRenderer } = require('electron')
  const { dialog, shell, app } = remote
  const crypto = require('crypto')
  const fs = require('fs')
  export default {
    name: 'index',
    data() {
      return {
        tips: '输入m3u8文件地址',
        inputValue: '',
        filepath: '',
        select: 'online'
      }
    },
    components: { MyHeader },
    mounted() {
      /* // 读取md5
      var path = 'D:\\down\\1594366403628\\test.mp4';
      var start = new Date().getTime();
      var fsHash = crypto.createHash('md5');
      var buffer = fs.readFileSync(path)
      fsHash.update(buffer)
      var md5 = fsHash.digest('hex')
      console.log('文件:'+path+',MD5签名为:'+md5);

      fs.appendFile(path," " , (error)  => {
        if (error) return console.log("追加文件失败" + error.message);
        console.log("追加成功");
      }); */

      let info = document.querySelector('#info')
      ipcRenderer.on('task-add-reply', (event, data) => {
        info.innerHTML = `<span class="${data.code == 0 ?'success':'fail'}">${data.message}</span>`;
      });

      ipcRenderer.on('task-notify-create', (event, data) => {
        this.addVideo(data)
      });

      ipcRenderer.on('task-notify-update', (event, data) =>{
        var newItem = document.querySelector('#_'+data.id);
        newItem.querySelector('.status .value').innerHTML = data.status;
      });

      ipcRenderer.on('task-notify-end', (event, data) => {
        var newItem = document.querySelector('#_'+data.id);
        newItem.querySelector('.play').setAttribute('data',data.videopath);
        newItem.querySelector('.status .value').innerHTML = data.status;
        newItem.querySelector('.del').style.display='';
        newItem.querySelector('.play').style.display='';
      });

      ipcRenderer.on('delvideo-reply',function(event,data){
        var newItem = document.querySelector('#_'+data.id);
        newItem.remove();
        
        var taskList = document.querySelector('.TaskList');
        if(taskList.children.length <= 2)
        {
          var empty = document.querySelector('.TaskList .empty');
          empty.style.display="table";
        }
      });
    },
    methods: {
      chooseFile() {
        dialog.showOpenDialog({
          //默认路径
          //defaultPath :'D:/Documents/Downloads',
          //选择操作，此处是打开文件夹
          properties: [
            'openFile'
          ],
          //过滤条件
          filters: [
            { name: 'All', extensions: ['m3u8','txt'] },
          ]
        }).then(result => {
          if (result.canceled === false) {
            this.filepath = result.filePaths[0]
          }
        }).catch(err => {
          console.log(err)
        })
      },
      download() {
        let url = this.inputValue
        let reg = /^(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi
        this.$layer.closeAll()
        if(url == ''){
          this.$layer.msg('请先输入链接地址!')
          return
        }else if(!reg.test(url)){
          this.$layer.msg('链接格式不正确!')
          return
        }
        ipcRenderer.send('task-add', url, '')
      },
      localDownload() {
        let path = this.filepath
        this.$layer.closeAll()
        if(path == ''){
          this.$layer.msg('请先选择文件!')
          return
        }else if(!fs.existsSync(path)){
          this.$layer.msg('文件不存在!')
          return
        }
        ipcRenderer.send('local-task-add', path)
      },
      addVideo(data) {
        let that = this;
        var taskList = document.querySelector('.TaskList');
        var item = document.querySelector('.TaskList .item.template');
        var newItem = item.cloneNode(true);
        newItem.className = "item";
        newItem.style.display = '';
        newItem.id = "_" + data.id;
        newItem.querySelector('.time .value').innerHTML = data.time;
        newItem.querySelector('.status .value').innerHTML = data.status;
        newItem.querySelector('.opendir').setAttribute('opt', "opendir");
        newItem.querySelector('.opendir').setAttribute('data', data.dir);
        newItem.querySelector('.opendir').onclick = function() {
          let endThis = this;
          that.click_callback(endThis)
        }
        newItem.querySelector('.del').setAttribute('opt', 'delvideo');
        newItem.querySelector('.del').setAttribute('data', data.id);
        newItem.querySelector('.del').onclick = function() {
          let endThis = this;
          that.click_callback(endThis)
        }
        
        newItem.querySelector('.StartStop').setAttribute('opt', 'StartOrStop');
        newItem.querySelector('.StartStop').setAttribute('data', data.id);
        newItem.querySelector('.StartStop').onclick = function() {
          let endThis = this;
          that.click_callback(endThis)
        }

        newItem.querySelector('.play').setAttribute('opt','playvideo');
        newItem.querySelector('.play').onclick = function() {
          let endThis = this;
          that.click_callback(endThis)
        }
        if(data.status != "已完成")
        {
          newItem.querySelector('.del').style.display='none';
          newItem.querySelector('.play').style.display='none';
        }else{   
          newItem.querySelector('.play').setAttribute('data',data.videopath);
        }

        taskList.insertBefore(newItem, null);
        
        var empty = document.querySelector('.TaskList .empty');
        empty.style.display = "none";
      },
      click_callback(endThis) {
        var opt = endThis.getAttribute('opt');
        if(opt == "StartOrStop")
        {
          endThis.value = endThis.value == "停止"?"重新开始":"停止";
        }
        ipcRenderer.send(endThis.getAttribute('opt'),endThis.getAttribute('data'));
      }
    }
  }
</script>

<style>

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    overflow-y:hidden;
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  .content{
    margin: 20px auto;
    min-height: 200px;
    text-align: center;
  }

  .success{
    color: mediumseagreen;
    margin-top: 5px;
  }
  .fail{
    color: red;
    margin-top: 5px;
  }

  .TaskList{
    width: 95%;
    margin: 5px auto;
    overflow-y: auto;
    border-radius: 20px;
  }

  .TaskList .item{
    width: 100%;
    height: 60px;
    position: relative;
    background: #fff;
    border-radius: 2px;
    padding: 5px;
    text-align: left;
    margin: 0 0 10px 0;
  }

  .TaskList .item .m3u8{
    width: 50px;
    height:100%;
    background-image: url(../../assets/icons/m3u8.png);
    background-size: contain;
    background-repeat: no-repeat;
    display: inline-block;
  }

  .TaskList .item .link{
    position: absolute;
    left: 64px;
    top: 5px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 80%;
  }

  .TaskList .item .link input{
    width: 100%;
    height: 100%;
    border: solid 0px ;
  }


  .TaskList .item .time{
    position: absolute;
    left: 64px;
    bottom: 5px;
  }

  .TaskList .item .status{
    position: absolute;
    left: 220px;
    bottom: 5px;
  }

  .TaskList .item .opt{
    position: absolute;
    font-size: 15px;
  }

  .TaskList .item .opt.bottom{
    right: 10px;
    bottom: 5px;
  }

  .TaskList .item .opt.top{
    right: 10px;
    top: 5px;
  }

  .TaskList .item input[type=button]{
    color: #fff;
    background: #3385ff;
    letter-spacing: 0px;
    border-radius: 2px;
    cursor: pointer;
    border: 0px solid transparent;
    padding: 1px 5px;
  }

  .TaskList .empty{
    width: 100%;
    height: 100%;
    color: white;
    text-align: center;
    box-sizing: border-box;
    background: #2D8CF0;
    font-size: xx-large;
    display: table;
  }

  .TaskList .empty span{
    display: table-cell;
    vertical-align: middle;
  }
</style>
