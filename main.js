import Vue from 'vue'
import App from './App.vue'
import store from './store'

// 引入全局样式
import './uni.scss'

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount()