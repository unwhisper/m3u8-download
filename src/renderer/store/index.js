import Vue from 'vue'
import Vuex from 'vuex'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

import modules from './modules'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 充值弹窗
    storeRecharge:false,
    // 充值列表
    storeRechargeList:[],
    //登录弹窗
    storeLogin:false,
    //支付成功弹窗
    storePay:false,
    //loading弹窗
    storeLoading:false,
    //任务ID
    storeTaskId:'',
    //是否更新个人信息
    storeUpdateInfo:false,
    storeQrcodeTxt:"登录后转换文件",
    //个人信息
    storeUserInfo:localStorage.userinfo?JSON.parse(localStorage.userinfo):'',
    //个人信息token
    storeUserToken:localStorage.token?localStorage.token:'',
    //游客个人信息token
    storetravelerToken:localStorage.travelerToken?localStorage.travelerToken:''
  },
  mutations: {
    // 登录弹窗文案
    qrcodeStatus(state,status) {
      state.storeQrcodeTxt  = status; 
    },
    // 充值弹窗处理
    rechargeStatus(state,status) {
      state.storeRecharge  = status; 
    },
    // 充值列表
    rechargeListStatus(state,status) {
      state.storeRechargeList  = status; 
    },
    // 登录弹窗处理
    loginStatus(state,status) {
      state.storeLogin  = status; 
    },
    // 任务ID
    taskidStatus(state,status) {
      state.storeTaskId  = status; 
    },
    // 登录弹窗处理
    userinfoStatus(state,status) {
      state.storeUserInfo  = status; 
    },
    // 登录token
    userTokenStatus(state,status) {
      state.storeUserToken  = status; 
    },
    // 游客登录token
    travelerTokenStatus(state,status) {
      state.storetravelerToken  = status; 
    },
    // 支付成功弹窗处理
    payStatus(state,status) {
      state.storePay  = status; 
    },
    // 支付成功弹窗处理
    updateStatus(state,status) {
      state.storeUpdateInfo  = status; 
    },
    
  },
  modules,
  plugins: [
    createPersistedState(),
    //createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})
