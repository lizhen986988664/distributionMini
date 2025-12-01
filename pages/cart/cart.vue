<template>
  <view class="cart-page">
    <!-- 购物车为空 -->
    <view class="empty-cart" v-if="cartItems.length === 0">
      <image src="/static/images/empty-cart.png" class="empty-image" />
      <text class="empty-text">购物车还是空的</text>
      <button type="primary" @click="goToHome" class="go-shop-btn">去逛逛</button>
    </view>

    <!-- 购物车商品列表 -->
    <view class="cart-content" v-else>
      <!-- 全选和操作栏 -->
      <view class="cart-header">
        <view class="select-all" @click="toggleSelectAll">
          <view class="checkbox" :class="{ checked: allSelected }">
            <text v-if="allSelected">✓</text>
          </view>
          <text class="select-text">全选</text>
        </view>
        <button type="default" @click="clearCart" class="clear-btn" :disabled="cartItems.length === 0">
          清空
        </button>
      </view>

      <!-- 商品列表 -->
      <view class="cart-list">
        <view class="cart-item" v-for="item in cartItems" :key="item.id">
          <view class="item-checkbox" @click="toggleItemSelect(item)">
            <view class="checkbox" :class="{ checked: item.selected }">
              <text v-if="item.selected">✓</text>
            </view>
          </view>
          
          <image :src="item.image" mode="aspectFill" class="item-image" @click="viewProduct(item)" />
          
          <view class="item-info">
            <text class="item-name" @click="viewProduct(item)">{{ item.name }}</text>
            <text class="item-desc" v-if="item.description">{{ item.description }}</text>
            
            <view class="item-bottom">
              <view class="price-row">
                <text class="price">¥{{ item.price }}</text>
                <text class="unit">/斤</text>
              </view>
              
              <view class="quantity-control">
                <button size="mini" @click="decreaseQuantity(item)" :disabled="item.quantity <= 1">-</button>
                <text class="quantity">{{ item.quantity }}</text>
                <button size="mini" @click="increaseQuantity(item)">+</button>
              </view>
            </view>
          </view>
          
          <view class="item-delete" @click="removeItem(item)">
            <text class="delete-icon">×</text>
          </view>
        </view>
      </view>

      <!-- 推荐商品 -->
      <view class="recommend-section" v-if="recommendProducts.length > 0">
        <view class="section-title">
          <text class="title-text">猜你喜欢</text>
        </view>
        <view class="recommend-grid">
          <view class="recommend-item" v-for="product in recommendProducts" :key="product.id" @click="viewProduct(product)">
            <image :src="product.image" mode="aspectFill" class="recommend-image" />
            <text class="recommend-name">{{ product.name }}</text>
            <view class="recommend-price">
              <text class="price">¥{{ product.price }}</text>
              <text class="unit">/斤</text>
            </view>
            <button size="mini" type="primary" @click.stop="addToCart(product)" class="add-btn">
              加入购物车
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view class="bottom-bar" v-if="cartItems.length > 0">
      <view class="left-info">
        <view class="select-all" @click="toggleSelectAll">
          <view class="checkbox" :class="{ checked: allSelected }">
            <text v-if="allSelected">✓</text>
          </view>
          <text class="select-text">全选</text>
        </view>
        <text class="total-info">
          合计: <text class="total-amount">¥{{ selectedTotalAmount.toFixed(2) }}</text>
        </text>
      </view>
      <button 
        type="primary" 
        @click="goToCheckout" 
        :disabled="selectedCount === 0"
        class="checkout-btn"
      >
        结算({{ selectedCount }})
      </button>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      recommendProducts: []
    }
  },
  
  computed: {
    ...mapGetters({
      cartItems: 'cart/cartItems',
      cartTotalAmount: 'cart/cartTotalAmount',
      cartTotalCount: 'cart/cartTotalCount',
      isLogin: 'user/isLogin'
    }),
    
    // 已选择的商品
    selectedItems() {
      return this.cartItems.filter(item => item.selected)
    },
    
    // 已选择商品数量
    selectedCount() {
      return this.selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    },
    
    // 已选择商品总价
    selectedTotalAmount() {
      return this.selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    
    // 是否全选
    allSelected() {
      return this.cartItems.length > 0 && this.cartItems.every(item => item.selected)
    }
  },
  
  onLoad() {
    this.loadCartFromStorage()
    this.loadRecommendProducts()
  },
  
  onShow() {
    // 每次显示页面时刷新购物车数据
    this.loadCartFromStorage()
  },
  
  onPullDownRefresh() {
    this.loadRecommendProducts()
    uni.stopPullDownRefresh()
  },
  
  methods: {
    ...mapActions({
      loadCartFromStorage: 'cart/loadCartFromStorage',
      updateCartItem: 'cart/updateCartItem',
      removeFromCart: 'cart/removeFromCart',
      clearCart: 'cart/clearCart',
      addToCart: 'cart/addToCart'
    }),
    
    // 去首页
    goToHome() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },
    
    // 查看商品详情
    viewProduct(product) {
      uni.navigateTo({
        url: `/pages/product/detail?id=${product.id}`
      })
    },
    
    // 切换商品选择状态
    toggleItemSelect(item) {
      this.$store.commit('cart/UPDATE_CART_ITEM', {
        id: item.id,
        selected: !item.selected
      })
    },
    
    // 全选/取消全选
    toggleSelectAll() {
      const selected = !this.allSelected
      this.cartItems.forEach(item => {
        this.$store.commit('cart/UPDATE_CART_ITEM', {
          id: item.id,
          selected
        })
      })
    },
    
    // 增加数量
    increaseQuantity(item) {
      this.updateCartItem({
        id: item.id,
        quantity: item.quantity + 1
      })
    },
    
    // 减少数量
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        this.updateCartItem({
          id: item.id,
          quantity: item.quantity - 1
        })
      }
    },
    
    // 删除商品
    removeItem(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个商品吗？',
        success: (res) => {
          if (res.confirm) {
            this.removeFromCart(item.id)
          }
        }
      })
    },
    
    // 清空购物车
    clearCart() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空购物车吗？',
        success: (res) => {
          if (res.confirm) {
            this.clearCart()
          }
        }
      })
    },
    
    // 去结算
    goToCheckout() {
      if (this.selectedItems.length === 0) {
        uni.showToast({
          title: '请选择商品',
          icon: 'none'
        })
        return
      }
      
      // 检查登录状态
      if (!this.isLogin) {
        uni.showModal({
          title: '提示',
          content: '请先登录',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }
          }
        })
        return
      }
      
      // 跳转到订单确认页
      const selectedIds = this.selectedItems.map(item => item.id).join(',')
      const selectedQuantities = this.selectedItems.map(item => item.quantity).join(',')
      
      uni.navigateTo({
        url: `/pages/order/confirm?selectedIds=${selectedIds}&selectedQuantities=${selectedQuantities}`
      })
    },
    
    // 加载推荐商品
    async loadRecommendProducts() {
      try {
        const result = await cloudApi.product.getList({
          pageSize: 6,
          sortBy: 'sales',
          sortOrder: 'desc'
        })
        
        if (result.success) {
          this.recommendProducts = result.data.list
        }
      } catch (error) {
        console.error('加载推荐商品失败:', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cart-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 0;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #999;
    margin-bottom: 40rpx;
  }
  
  .go-shop-btn {
    width: 300rpx;
  }
}

.cart-content {
  .cart-header {
    background-color: #fff;
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .select-all {
      display: flex;
      align-items: center;
      
      .checkbox {
        width: 40rpx;
        height: 40rpx;
        border: 2rpx solid #ddd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
        
        &.checked {
          background-color: #ff6b35;
          border-color: #ff6b35;
          color: #fff;
          font-size: 24rpx;
        }
      }
      
      .select-text {
        font-size: 28rpx;
        color: #333;
      }
    }
    
    .clear-btn {
      color: #999;
    }
  }
  
  .cart-list {
    background-color: #fff;
    
    .cart-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-checkbox {
        margin-right: 20rpx;
        
        .checkbox {
          width: 40rpx;
          height: 40rpx;
          border: 2rpx solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &.checked {
            background-color: #ff6b35;
            border-color: #ff6b35;
            color: #fff;
            font-size: 24rpx;
          }
        }
      }
      
      .item-image {
        width: 160rpx;
        height: 160rpx;
        border-radius: 8rpx;
        margin-right: 20rpx;
      }
      
      .item-info {
        flex: 1;
        
        .item-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 10rpx;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .item-desc {
          display: block;
          font-size: 24rpx;
          color: #999;
          margin-bottom: 20rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .item-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .price-row {
            display: flex;
            align-items: baseline;
            
            .price {
              font-size: 32rpx;
              color: #ff6b35;
              font-weight: bold;
            }
            
            .unit {
              font-size: 24rpx;
              color: #999;
              margin-left: 4rpx;
            }
          }
          
          .quantity-control {
            display: flex;
            align-items: center;
            
            .quantity {
              margin: 0 20rpx;
              font-size: 28rpx;
              font-weight: bold;
              min-width: 50rpx;
              text-align: center;
            }
          }
        }
      }
      
      .item-delete {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 20rpx;
        
        .delete-icon {
          font-size: 40rpx;
          color: #999;
        }
      }
    }
  }
  
  .recommend-section {
    margin-top: 20rpx;
    background-color: #fff;
    padding: 30rpx;
    
    .section-title {
      margin-bottom: 30rpx;
      
      .title-text {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .recommend-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      
      .recommend-item {
        width: 320rpx;
        margin-bottom: 30rpx;
        
        .recommend-image {
          width: 100%;
          height: 200rpx;
          border-radius: 8rpx;
          margin-bottom: 15rpx;
        }
        
        .recommend-name {
          display: block;
          font-size: 26rpx;
          color: #333;
          margin-bottom: 10rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .recommend-price {
          display: flex;
          align-items: baseline;
          margin-bottom: 15rpx;
          
          .price {
            font-size: 28rpx;
            color: #ff6b35;
            font-weight: bold;
          }
          
          .unit {
            font-size: 22rpx;
            color: #999;
            margin-left: 4rpx;
          }
        }
        
        .add-btn {
          width: 100%;
        }
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  z-index: 100;
  
  .left-info {
    display: flex;
    align-items: center;
    flex: 1;
    
    .select-all {
      display: flex;
      align-items: center;
      margin-right: 30rpx;
      
      .checkbox {
        width: 40rpx;
        height: 40rpx;
        border: 2rpx solid #ddd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15rpx;
        
        &.checked {
          background-color: #ff6b35;
          border-color: #ff6b35;
          color: #fff;
          font-size: 24rpx;
        }
      }
      
      .select-text {
        font-size: 26rpx;
        color: #333;
      }
    }
    
    .total-info {
      font-size: 28rpx;
      color: #333;
      
      .total-amount {
        font-size: 32rpx;
        color: #ff6b35;
        font-weight: bold;
      }
    }
  }
  
  .checkout-btn {
    width: 200rpx;
  }
}
</style>