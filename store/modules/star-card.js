const state = {
  myStarCards: [], // 我的海星卡
  sharedCards: [], // 我分享的卡片
  receivedCards: [], // 我收到的卡片
  starCardStats: {
    totalShared: 0, // 总分享数
    totalReceived: 0, // 总接收数
    totalReward: 0 // 总奖励
  }
}

const mutations = {
  SET_STAR_CARDS(state, cards) {
    state.myStarCards = cards
  },
  
  SET_SHARED_CARDS(state, cards) {
    state.sharedCards = cards
  },
  
  SET_RECEIVED_CARDS(state, cards) {
    state.receivedCards = cards
  },
  
  SET_STAR_STATS(state, stats) {
    state.starCardStats = stats
  },
  
  ADD_STAR_CARD(state, card) {
    state.myStarCards.unshift(card)
  },
  
  UPDATE_STAR_CARD(state, { id, updates }) {
    const card = state.myStarCards.find(c => c.id === id)
    if (card) {
      Object.assign(card, updates)
    }
  }
}

const actions = {
  // 创建海星分享卡
  async createStarCard({ commit, rootGetters }, cardData) {
    try {
      const res = await uniCloud.callFunction({
        name: 'starCard',
        data: {
          action: 'createCard',
          ...cardData
        }
      })
      
      if (res.result.code === 0) {
        const card = res.result.data
        commit('ADD_STAR_CARD', card)
        
        uni.showToast({
          title: '海星卡创建成功',
          icon: 'success'
        })
        
        return { success: true, card }
      } else {
        throw new Error(res.result.message || '创建海星卡失败')
      }
    } catch (error) {
      console.error('创建海星卡失败:', error)
      uni.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      })
      return { success: false, error: error.message }
    }
  },
  
  // 获取我的海星卡列表
  async getMyStarCards({ commit }) {
    try {
      const res = await uniCloud.callFunction({
        name: 'starCard',
        data: {
          action: 'getMyCards'
        }
      })
      
      if (res.result.code === 0) {
        commit('SET_STAR_CARDS', res.result.data)
        return res.result.data
      }
      return []
    } catch (error) {
      console.error('获取海星卡列表失败:', error)
      return []
    }
  },
  
  // 获取海星卡统计
  async getStarCardStats({ commit }) {
    try {
      const res = await uniCloud.callFunction({
        name: 'starCard',
        data: {
          action: 'getStats'
        }
      })
      
      if (res.result.code === 0) {
        commit('SET_STAR_STATS', res.result.data)
        return res.result.data
      }
      return null
    } catch (error) {
      console.error('获取海星卡统计失败:', error)
      return null
    }
  },
  
  // 分享海星卡
  async shareStarCard({ commit }, cardId) {
    try {
      const res = await uniCloud.callFunction({
        name: 'starCard',
        data: {
          action: 'shareCard',
          cardId
        }
      })
      
      if (res.result.code === 0) {
        uni.showToast({
          title: '分享成功',
          icon: 'success'
        })
        return { success: true }
      } else {
        throw new Error(res.result.message || '分享失败')
      }
    } catch (error) {
      console.error('分享海星卡失败:', error)
      uni.showToast({
        title: error.message || '分享失败',
        icon: 'none'
      })
      return { success: false, error: error.message }
    }
  },
  
  // 接收海星卡
  async receiveStarCard({ commit }, { cardId, shareCode }) {
    try {
      const res = await uniCloud.callFunction({
        name: 'starCard',
        data: {
          action: 'receiveCard',
          cardId,
          shareCode
        }
      })
      
      if (res.result.code === 0) {
        uni.showToast({
          title: '接收成功',
          icon: 'success'
        })
        return { success: true, data: res.result.data }
      } else {
        throw new Error(res.result.message || '接收失败')
      }
    } catch (error) {
      console.error('接收海星卡失败:', error)
      uni.showToast({
        title: error.message || '接收失败',
        icon: 'none'
      })
      return { success: false, error: error.message }
    }
  }
}

const getters = {
  myStarCards: state => state.myStarCards,
  sharedCards: state => state.sharedCards,
  receivedCards: state => state.receivedCards,
  starCardStats: state => state.starCardStats,
  activeStarCards: state => state.myStarCards.filter(card => card.status === 'active'),
  totalReward: state => state.starCardStats.totalReward
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}