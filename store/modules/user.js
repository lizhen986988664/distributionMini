const state = {
  userInfo: null,
  token: '',
  isLogin: false
}

const mutations = {
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
    state.isLogin = !!userInfo
  },
  SET_TOKEN(state, token) {
    state.token = token
    if (token) {
      uni.setStorageSync('token', token)
    } else {
      uni.removeStorageSync('token')
    }
  },
  LOGOUT(state) {
    state.userInfo = null
    state.token = ''
    state.isLogin = false
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }
}

const actions = {
  // 微信登录
  async wxLogin({ commit, dispatch }) {
    try {
      // 1. 获取微信登录code
      const loginRes = await uni.login({
        provider: 'weixin'
      })
      
      if (!loginRes.code) {
        throw new Error('获取微信登录code失败')
      }
      
      // 2. 调用云函数登录
      const res = await uniCloud.callFunction({
        name: 'user',
        data: {
          action: 'wxLogin',
          code: loginRes.code
        }
      })
      
      if (res.result.code === 0) {
        const { token, userInfo } = res.result.data
        
        // 3. 保存认证信息
        commit('SET_TOKEN', token)
        commit('SET_USER_INFO', userInfo)
        uni.setStorageSync('userInfo', userInfo)
        
        return { success: true, userInfo }
      } else {
        throw new Error(res.result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    }
  },
  
  // 获取用户信息
  async getUserInfo({ commit, state }) {
    try {
      if (!state.token) {
        throw new Error('未登录')
      }
      
      const res = await uniCloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserInfo'
        }
      })
      
      if (res.result.code === 0) {
        const userInfo = res.result.data
        commit('SET_USER_INFO', userInfo)
        uni.setStorageSync('userInfo', userInfo)
        return userInfo
      } else {
        // token可能失效
        commit('LOGOUT')
        throw new Error(res.result.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },
  
  // 更新用户信息
  async updateUserInfo({ commit }, userInfo) {
    try {
      const res = await uniCloud.callFunction({
        name: 'user',
        data: {
          action: 'updateUserInfo',
          userInfo
        }
      })
      
      if (res.result.code === 0) {
        const updatedUserInfo = res.result.data
        commit('SET_USER_INFO', updatedUserInfo)
        uni.setStorageSync('userInfo', updatedUserInfo)
        return { success: true }
      } else {
        throw new Error(res.result.message || '更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, error: error.message }
    }
  },
  
  // 退出登录
  logout({ commit }) {
    commit('LOGOUT')
  }
}

const getters = {
  userInfo: state => state.userInfo,
  isLogin: state => state.isLogin,
  token: state => state.token
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}