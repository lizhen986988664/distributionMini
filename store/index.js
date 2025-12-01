import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import cart from './modules/cart'
import starCard from './modules/star-card'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    user,
    cart,
    starCard
  },
  state: {
    // 全局配置
    config: {
      pricePerJin: 1.00, // 每斤价格，可从后台配置
      freeTrialLimit: 1, // 免费试用限制
      starCardReward: 0.1, // 海星卡奖励比例
      minOrderAmount: 9.9 // 最低起送金额
    },
    loading: false
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    UPDATE_CONFIG(state, config) {
      state.config = { ...state.config, ...config }
    }
  },
  actions: {
    // 显示loading
    showLoading({ commit }) {
      commit('SET_LOADING', true)
    },
    // 隐藏loading
    hideLoading({ commit }) {
      commit('SET_LOADING', false)
    },
    // 获取系统配置
    async getConfig({ commit }) {
      try {
        const res = await uniCloud.callFunction({
          name: 'config',
          data: { action: 'getConfig' }
        })
        
        if (res.result.code === 0) {
          commit('UPDATE_CONFIG', res.result.data)
          return res.result.data
        }
        return null
      } catch (error) {
        console.error('获取配置失败:', error)
        return null
      }
    }
  },
  getters: {
    isLoading: state => state.loading,
    config: state => state.config
  }
})

export default store