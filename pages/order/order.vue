<template>
  <view class="order-page">
    <!-- 选项卡 -->
    <view class="tab-section">
      <view class="tab-list">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === tab.key }"
          v-for="tab in tabs" 
          :key="tab.key"
          @click="switchTab(tab.key)"
        >
          {{ tab.name }}
        </view>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view class="order-item" v-for="order in orderList" :key="order._id">
        <!-- 订单头部 -->
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
          <view class="order-status" :class="order.status">
            {{ getStatusText(order.status) }}
          </view>
        </view>

        <!-- 商品列表 -->
        <view class="order-goods">
          <view 
            class="goods-item" 
            v-for="item in order.items" 
            :key="item.id"
            @click="viewProduct(item.id)"
          >
            <image :src="item.image" mode="aspectFill" class="goods-image" />
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <view class="goods-bottom">
                <text class="goods-price">¥{{ item.price }}</text>
                <text class="goods-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="order-info">
          <view class="info-row">
            <text class="info-label">收货人：</text>
            <text class="info-value">{{ order.receiverInfo.receiverName }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">联系电话：</text>
            <text class="info-value">{{ order.receiverInfo.phoneNumber }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">收货地址：</text>
            <text class="info-value">{{ order.receiverInfo.fullAddress }}</text>
          </view>
        </view>

        <!-- �金额和操作 -->
        <view class="order-footer">
          <view class="price-info">
            <text class="total-label">共{{ order.totalQuantity }}件商品 合计：</text>
            <text class="total-price">¥{{ order.finalAmount.toFixed(2) }}</text>
          </view>
          
          <view class="order-actions">
            <button 
              size="mini" 
              type="default" 
              @click="viewOrderDetail(order._id)"
              class="action-btn"
            >
              查看详情
            </button>
            
            <button 
              size="mini" 
              type="primary" 
              @click="payOrder(order)"
              v-if="order.status === 'pending'"
              class="action-btn"
            >
              立即支付
            </button>
            
            <button 
              size="mini" 
              type="default" 
              @click="cancelOrder(order._id)"
              v-if="order.status === 'pending'"
              class="action-btn"
            >
              取消订单
            </button>
            
            <button 
              size="mini" 
              type="primary" 
              @click="confirmReceive(order._id)"
              v-if="order.status === 'shipped'"
              class="action-btn"
            >
              确认收货
            </button>
            
            <button 
              size="mini" 
              type="default" 
              @click="buyAgain(order)"
              v-if="order.status === 'completed'"
              class="action-btn"
            >
              再次购买
            </button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="orderList.length === 0 && !loading">
        <image src="/static/images/empty-order.png" class="empty-image" />
        <text class="empty-text">{{ getEmptyText() }}</text>
        <button type="primary" @click="goToHome" class="go-home-btn">去逛逛</button>
      </view>

      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <view class="loading"function require(path) {
      // When no policy manifest, the original prototype.require is sustained
      return mod.require(path);
    }>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && !loading">
        <button type="default" @click="loadMore" :loading="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters } from 'vuex'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      activeTab: 'all',
      tabs: [
        { key: 'all', name: '全部' },
        { key: 'pending', name: '待付款' },
        { key: 'paid', name: '待发货' },
        { key: 'shipped', name: '待收货' },
        { key: 'completed', name: '已完成' }
      ],
      orderList: [],
      loading: false,
      loadingMore: false,
      page: 1,
      pageSize: 10,
      hasMore: true
    }
  },
  
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    })
  },
  
  onLoad(options) {
    // 如果有指定状态，切换到对应选项卡
    if (options.status && this.tabs.find(tab => tab.key === options.status)) {
      this.activeTab = options.status
    }
    
    this.loadOrders()
  },
  
  onPullDownRefresh() {
    this.refreshOrders()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  methods: {
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待付款',
        paid: '待发货',
        shipped: '待收货',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },
    
    // 获取空状态文本
    getEmptyText() {
      const emptyTextMap = {
        all: '暂无订单',
        pending: '暂无待付款订单',
        paid: '暂无待发货订单',
        shipped: '暂无待收货订单',
        completed: '暂无已完成订单'
      }
      return emptyTextMap[this.activeTab] || '暂无订单'
    },
    
    // 切换选项卡
    switchTab(key) {
      if (this.activeTab === key) return
      
      this.activeTab = key
      this.page = 1
      this.hasMore = true
      this.orderList = []
      this.loadOrders()
    },
    
    // 加载订单列表
    async loadOrders() {
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
      
      this.loading = true
      
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize
        }
        
        // 如果不是全部订单，添加状态筛选
        if (this.activeTab !== 'all') {
          params.status = this.activeTab
        }
        
        const result = await cloudApi.order.getList(params)
        
        if (result.success) {
          if (this.page === 1) {
            this.orderList = result.data.list
          } else {
            this.orderList.push(...result.data.list)
          }
          
          this.hasMore = result.data.hasMore
        }
      } catch (error) {
        console.error('加载订单列表失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 刷新订单
    async refreshOrders() {
      this.page = 1
      this.hasMore = true
      await this.loadOrders()
      uni.stopPullDownRefresh()
    },
    
    // 加载更多
    async loadMore() {
      if (!this.hasMore || this.loading || this.loadingMore) return
      
      this.loadingMore = true
      this.page++
      
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize
        }
        
        if (this.activeTab !== 'all') {
          params.status = this.activeTab
        }
        
        const result = await cloudApi.order.getList(params)
        
        if (result.success) {
          this.orderList.push(...result.data.list)
          this.hasMore = result.data.hasMore
        }
      } catch (error) {
        console.error('加载更多订单失败:', error)
      } finally {
        this.loadingMore = false
      }
    },
    
    // 查看商品详情
    viewProduct(productId) {
      uni.navigateTo({
        url: `/pages/product/detail?id=${productId}`
      })
    },
    
    // 查看订单详情
    viewOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pages/order/detail?id=${orderId}`
      })
    },
    
    // 支付订单
    async payOrder(order) {
      try {
        // 跳转到支付页面
        uni.navigateTo({
          url: `/pages/payment/payment?orderId=${order._id}&amount=${order.finalAmount}`
        })
      } catch (error) {
        console.error('支付订单失败:', error)
      }
    },
    
    // 取消订单
    async cancelOrder(orderId) {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消这个订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await cloudApi.order.cancel(orderId)
              
              if (result.success) {
                uni.showToast({
                  title: '订单已取消',
                  icon: 'success'
                })
                
                // 刷新订单列表
                await this.refreshOrders()
              } else {
                throw new Error(result.error || '取消失败')
              }
            } catch (error) {
              console.error('取消订单失败:', error)
              uni.showToast({
                title: error.message || '取消失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 确认收货
    async confirmReceive(orderId) {
      uni.showModal({
        title: '确认收货',
        content: '确认已收到商品吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await cloudApi.order.confirm(orderId)
              
              if (result.success) {
                uni.showToast({
                  title: '确认收货成功',
                  icon: 'success'
                })
                
                // 刷新订单列表
                await this.refreshOrders()
              } else {
                throw new Error(result.error || '确认失败')
              }
            } catch (error) {
              console.error('确认收货失败:', error)
              uni.showToast({
                title: error.message || '确认失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 再次购买
    async buyAgain(order) {
      try {
        // 将商品添加到购物车
        for (const item of order.items) {
          await this.$store.dispatch('cart/addToCart', {
            ...item,
            quantity: item.quantity
          })
        }
        
        // 跳转到购物车
        uni.switchTab({
          url: '/pages/cart/cart'
        })
        
        uni.showToast({
          title: '已添加到购物车',
          icon: 'success'
        })
      } catch (error) {
        console.error('再次购买失败:', error)
      }
    },
    
    // 去首页
    goToHome() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.order-page {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.tab-section {
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  
  .tab-list {
    display: flex;
    
    .tab-item {
      flex: 1;
      text-align: center;
      padding: 30rpx 0;
      font-size: 28rpx;
      color: #666;
      position: relative;
      
      &.active {
        color: #ff6b35;
        font-weight: bold;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60rpx;
          height: 4rpx;
          background-color: #ff6b35;
          border-radius: 2rpx;
        }
      }
    }
  }
}

.order-list {
  padding: 20rpx;
  
  .order-item {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .order-no {
        font-size: 26rpx;
        color: #666;
      }
      
      .order-status {
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        
        &.pending {
          background-color: #e6f7ff;
          color: #1890ff;
        }
        
        &.paid {
          background-color: #f6ffed;
          color: #52c41a;
        }
        
        &.shipped {
          background-color: #fff7e6;
          color: #faad14;
        }
        
        &.completed {
          background-color: #f6f6f6;
          color: #666;
        }
        
        &.cancelled {
          background-color: #fff2f0;
          color: #ff4d4f;
        }
      }
    }
    
    .order-goods {
      margin-bottom: 20rpx;
      
      .goods-item {
        display: flex;
        padding: 20rpx 0;
        border-bottom: 1rpx solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .goods-image {
          width: 120rpx;
          height: 120rpx;
          border-radius: 8rpx;
          margin-right: 20rpx;
        }
        
        .goods-info {
          flex: 1;
          
          .goods-name {
            display: block;
            font-size: 28rpx;
            color: #333;
            margin-bottom: 15rpx;
            line-height: 1.4;
          }
          
          .goods-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .goods-price {
              font-size: 28rpx;
              color: #ff6b35;
              font-weight: bold;
            }
            
            .goods-quantity {
              font-size: 26rpx;
              color: #666;
            }
          }
        }
      }
    }
    
    .order-info {
      background-color: #fafafa;
      padding: 20rpx;
      border-radius: 8rpx;
      margin-bottom: 20rpx;
      
      .info-row {
        display: flex;
        margin-bottom: 8rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-size: 24rpx;
          color: #666;
          margin-right: 10rpx;
          flex-shrink: 0;
        }
        
        .info-value {
          font-size: 24rpx;
          color: #333;
          flex: 1;
        }
      }
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .price-info {
        .total-label {
          font-size: 26rpx;
          color: #666;
        }
        
        .total-price {
          font-size: 32rpx;
          color: #ff6b35;
          font-weight: bold;
        }
      }
      
      .order-actions {
        display: flex;
        gap: 15rpx;
        
        .action-btn {
          min-width: 140rpx;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    display: block;
    font-size: 28rpx;
    color: #999;
    margin-bottom: 40rpx;
  }
  
  .go-home-btn {
    width: 300rpx;
  }
}

.loading-state {
  text-align: center;
  padding: 100rpx 0;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  
  .button {
    width: 300rpx;
  }
}
</style>