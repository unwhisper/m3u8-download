import Vue from 'vue'
import Router from 'vue-router'

import index from '@/pages/index/index'
import setting from '@/pages/setting/setting'

const routerPush = Router.prototype.push
Router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(error=> error)
}
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Index',
      component: index
    },
    {
      path: 'setting',
      name: 'setting',
      component: setting
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
