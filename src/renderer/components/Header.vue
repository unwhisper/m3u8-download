<template>
  <!-- nav 非首页显示header-->
  <div class="nav" v-if="thisPath  != 'index'" @dblclick="max" style="-webkit-app-region: drag;">
    <div class="logo_img" @click="toIndexPage" title="首页" style="-webkit-app-region: no-drag;">
      <img src="../assets/icons/48x48.png"/>
      <span class="ltitle">m3u8 downloader</span>
    </div>
    <!-- <div class="go-back">
      <Icon type="ios-arrow-back" size="18" class="bar" style="-webkit-app-region: no-drag;" @click="prev" />
      <Icon type="ios-arrow-forward" size="18" class="bar right-bar" style="-webkit-app-region: no-drag;" @click="next" />
    </div> -->    
    <Icon type="md-settings" size="18" class="bar" title="设置" style="-webkit-app-region: no-drag;"  @click="toSetting"/>
    <i class="fenge" style="-webkit-app-region: no-drag;"></i>
    <Icon type="md-remove" size="18" class="bar" title="最小化" style="-webkit-app-region: no-drag;"  @click="min"/>
    <Icon type="ios-browsers-outline" size="18" class="bar" style="font-weight:bold;-webkit-app-region: no-drag;" title="缩小" @click="max" v-if="is_max" />
    <Icon type="md-square-outline" size="18" class="bar" title="最大化" style="-webkit-app-region: no-drag;" @click="max" v-else />
    <Icon type="md-close" size="18" class="bar right-bar" title="关闭" style="-webkit-app-region: no-drag;" @click="close"/>
  </div>
</template>
<script type="text/javascript">
const { shell,ipcRenderer } = require('electron')
export default {
  props: {
    //当前页面名称
    thisPath: {
      type: String
    },
    isIndex: {
      type: Boolean
    }
  },
  //格式化日期
  filters: {
    formatDate(dateStr) {
      let timer = parseInt(dateStr) * 1000;
      let timeNumber = new Date(timer);
      let year = timeNumber.getFullYear();
      let month = timeNumber.getMonth() + 1;
      let date = timeNumber.getDate();
      return (
        year +
        "-" +
        (month < 10 ? "0" + month : month) +
        "-" +
        (date < 10 ? "0" + date : date)
      );
    }
  },
  data() {
    return {
      //登录需要的key
      event_key: "",
      //定时器
      loginTimer: "",
      //价格列表
      localProductList: {},
      //窗口是否最大化
      is_max: ''
    };
  },
  components: {
  },
  computed: {
  },
  created() {
    ipcRenderer.on('isMax', (event, arg) => {
      //console.log(arg)
      this.is_max = arg
    })
  },
  mounted() {
  },
  methods: {
    // 最小化窗口
    min() {
      ipcRenderer.send('min')
    },
    // 最大化窗口
    max() {
      ipcRenderer.send('max')
    },
    // 关闭窗口
    close() {
      ipcRenderer.send('close')
    },
    // 返回上一层
    prev() {  
      this.$router.go(-1)
    },
    // 返回下一层
    next() { 
      this.$router.go(1)
    },
    //点击跳转主页
    toSetting() {
      this.$router.push({
        name: "setting"
      });
    },
    toIndexPage(res) {
      this.$router.push({
        name: "Index"
      });
    },
    //点击跳转主页
    toIndex() {
      this.$router.push({
        name: "Index"
      });
    }
  }
};
</script>
<style scoped lang="less">
.logo_img {
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 5px;
  z-index: 1000;
  img {
    width: 30px;
  }
}
.ltitle{
  color: #1296db;
  font-size: 17px;
  font-weight: 600;
  padding-left: 5px;
}
.go-back{
  height: 40px;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 150px;
  z-index: 1000;
}
.fenge{
  width: 2px;
  height: 18px;
  margin: 0 12px;
  background: rgba(255,255,255,.5);
}
.bar{
  line-height:40px;
  cursor: pointer;
  margin: 0 3px;
  color: rgba(255,255,255,.5);
  &:hover {
    color: rgb(255,255,255);
  }
}
.right-bar{
  width: 19px;
  margin-right:10px;
}
.nav {
  position: fixed;
  right: 0;
  top: 0;
  height: 40px;
  width: 100%;
  background: linear-gradient(to right,#E69A59,#852AB5);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 999;
  .click_item {
    color: rgba(255,255,255,0.6);
    font-size: 18px;
    height: 36px;
    line-height: 36px;
    padding: 0 10px;
    cursor: pointer;
    transition: all 0.5s;
    &:hover {
      color: rgb(255,255,255);
    }
  }
}
</style>