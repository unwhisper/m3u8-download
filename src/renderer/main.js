import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import clipboard from 'clipboard';

import iView from 'iview' // 引入iview依赖
import 'iview/dist/styles/iview.css' // 引入iview css样式
import layer from 'vue-layer'
import 'vue-layer/lib/vue-layer.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.prototype.$layer = layer(Vue)
Vue.use(iView) //使用iview组件 
//注册到vue原型上
Vue.prototype.ClipboardJS = clipboard;
/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
