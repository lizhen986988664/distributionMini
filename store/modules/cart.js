const state = {
  items: [], // 购物车商品列表
  totalAmount: 0, // 总金额
  totalCount: 0 // 总数量
}

const mutations = {
  SET_CART_ITEMS(state, items) {
    state.items = items
    // 计算总价和总数
    state.totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
    state.totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    // 保存到本地存储
    uni.setStorageSync('cartItems', items)
  },
  
  ADD_TO_CART(state, product) {
    const existingItem = state.items.find(item => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += product.quantity || 1
    } else {
      state.items.push({
        ...product,
        quantity: product.quantity || 1,
        addedTime: Date.now()
      })
    }
    
    // 重新计算总价和总数
    state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    // 保存到本地存储
    uni.setStorageSync('cartItems', state.items)
  },
  
  UPDATE_CART_ITEM(state, { id, quantity }) {
    const item = state.items.find(item => item.id === id)
    if (item) {
      item.quantity = quantity
      // 重新计算总价和总数
      state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      // 保存到本地存储
      uni.setStorageSync('cartItems', state.items)
    }
  },
  
  REMOVE_FROM_CART(state, id) {
    state.items = state.items.filter(item => item.id !== id)
    // 重新计算总价和总数
    state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    // 保存到本地存储
    uni.setStorageSync('cartItems', state.items)
  },
  
  CLEAR_CART(state) {
    state.items = []
    state.totalAmount = 0
    state.totalCount = 0
    uni.removeStorageSync('cartItems')
  }
}

const actions = {
  // 从本地存储加载购物车
  loadCartFromStorage({ commit }) {
    const cartItems = uni.getStorageSync('cartItems') || []
    commit('SET_CART_ITEMS', cartItems)
  },
  
  // 添加到购物车
  addToCart({ commit }, product) {
    commit('ADD_TO_CART', product)
    uni.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
  },
  
  // 更新购物车商品数量
  updateCartItem({ commit }, payload) {
    commit('UPDATE_CART_ITEM', payload)
  },
  
  // 删除购物车商品
  removeFromCart({ commit }, id) {
    commit('REMOVE_FROM_CART', id)
    uni.showToast({
      title: '已删除',
      icon: 'success'
    })
  },
  
  // 清空购物车
  clearCart({ commit }) {
    commit('CLEAR_CART')
  }
}

const getters = {
  cartItems: state => state.items,
  cartTotalAmount: state => state.totalAmount,
  cartTotalCount: state => state.totalCount,
  isEmpty: state => state.items.length === 0
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}