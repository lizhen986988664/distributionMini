<template>
  <view class="coupon-page">
    <!-- 顶部统计 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-item">
          <text class="stats-number">{{ availableCoupons.length }}</text>
          <text class="stats-label">可用优惠券</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-number">{{ usedCoupons.length }}</text>
          <text class="stats-label">已使用</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-number">{{ expiredCoupons.length }}</text>
          <text class="stats-label">已过期</text>
        </view>
      </view>
    </view>

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
          <view class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</view>
        </view>
      </view>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list">
      <!-- 可用优惠券 -->
      <view v-if="activeTab === 'available'">
        <view class="coupon-item" v-for="coupon in availableCoupons" :key="coupon.id">
          <view class="coupon-content">
            <view class="coupon-left">
              <view class="coupon-amount">
                <text class="currency">¥</text>
                <text class="amount">{{ coupon.amount }}</text>
              </view>
              <text class="coupon-condition">{{ coupon.condition }}</text>
            </view>
            
            <view class="coupon-divider"></view>
            
            <view class="coupon-right">
              <text class="coupon-name">{{ coupon.name }}</text>
              <text class="coupon-desc">{{ coupon.description }}</text>
              <text class="coupon-time">有效期至：{{ formatDate(coupon.expireTime) }}</text>
            </view>
          </view>
          
          <view class="coupon-actions">
            <button size="mini" type="primary" @click="useCoupon(coupon)">立即使用</button>
          </view>
        </view>
      </view>

      <!-- 已使用优惠券 -->
      <view v-if="activeTab === 'used'">
        <view class="coupon-item used" v-for="coupon in usedCoupons" :key="coupon.id">
          <view class="coupon-content">
            <view class="coupon-left">
              <view class="coupon-amount">
                <text class="currency">¥</text>
                <text class="amount">{{ coupon.amount }}</text>
              </view>
              <text class="coupon-condition">{{ coupon.condition }}</text>
            </view>
            
            <view class="coupon-divider"></view>
            
            <view class="coupon-right">
              <text class="coupon-name">{{ coupon.name }}</text>
              <text class="coupon-desc">{{ coupon.description }}</text>
              <text class="coupon-time">使用时间：{{ formatDate(coupon.useTime) }}</text>
            </view>
          </view>
          
          <view class="used-mark">已使用</view>
        </view>
      </view>

      <!-- 已过期优惠券 -->
      <view v-if="activeTab === 'expired'">
        <view class="coupon-item expired" v-for="coupon in expiredCoupons" :key="coupon.id">
          <view class="coupon-content">
            <view class="coupon-left">
              <view class="coupon-amount">
                <text class="currency">¥</text>
                <text class="amount">{{ coupon.amount }}</text>
              </view>
              <text class="coupon-condition">{{ coupon.condition }}</text>
            </view>
            
            <view class="coupon-divider"></view>
            
            <view class="coupon-right">
              <text class="coupon-name">{{ coupon.name }}</text>
              <text class="coupon-desc">{{ coupon.description }}</text>
              <text class="coupon-time">过期时间：{{ formatDate(coupon.expireTime) }}</text>
            </view>
          </view>
          
          <view class="expired-mark">已过期</view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="currentCoupons.length === 0">
        <image src="/static/images/empty-coupon.png" class="empty-image" />
        <text class="empty-text">{{ getEmptyText() }}</text>
      </view>
    </view>

    <!-- 领券中心 -->
    <view class="receive-section" v-if="activeTab === 'available'">
      <view class="section-title">
        <text class="title-text">领券中心</text>
        <text class="more-text" @click="viewMoreCoupons">更多优惠券 ></text>
      </view>
      
      <view class="receive-list">
        <view class="receive-item" v-for="coupon in availableToReceive" :key="coupon.id">
          <view class="coupon-content">
            <view class="coupon-left">
              <view class="coupon-amount">
                <text class="currency">¥</text>
                <text class="amount">{{ coupon.amount }}</text>
              </view>
              <text class="coupon-condition">{{ coupon.condition }}</text>
            </view>
            
            <view class="coupon-divider"></view>
            
            <view class="coupon-right">
              <text class="coupon-name">{{ coupon.name }}</text>
              <text class="coupon-desc">{{ coupon.description }}</text>
              <text class="coupon-time">有效期：领取后{{ coupon.validDays }}天</text>
            </view>
          </view>
          
          <view class="coupon-actions">
            <button 
              size="mini" 
              type="primary" 
              @click="receiveCoupon(coupon)"
              :loading="coupon.receiving"
              :disabled="coupon.received || coupon.stock <= 0"
            >
              {{ coupon.stock <= 0 ? '已领完' : (coupon.received ? '已领取' : '立即领取') }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatDate } from '@/utils/index'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      activeTab: 'available',
      tabs: [
        { key: 'available', name: '可用', count: 0 },
        { key: 'used', name: '已使用', count: 0 },
        { key: 'expired', name: '已过期', count: 0 }
      ],
      allCoupons: [],
      availableToReceive: []
    }
  },
  
  computed: {
    ...mapGetters({
      userInfo: 'user/userInfo',
      isLogin: 'user/isLogin'
    }),
    
    // 可用优惠券
    availableCoupons() {
      return this.allCoupons.filter(coupon => 
        coupon.status === 'available' && 
        new Date(coupon.expireTime) > new Date()
      )
    },
    
    // 已使用优惠券
    usedCoupons() {
      return this.allCoupons.filter(coupon => coupon.status === 'used')
    },
    
    // 已过期优惠券
    expiredCoupons() {
      return this.allCoupons.filter(coupon => 
        coupon.status === 'available' && 
        new Date(coupon.expireTime) <= new Date()
      )
    },
    
    // 当前显示的优惠券
    currentCoupons() {
      switch (this.activeTab) {
        case 'available':
          return this.availableCoupons
        case 'used':
          return this.usedCoupons
        case 'expired':
          return this.expiredCoupons
        default:
          return []
      }
    }
  },
  
  watch: {
    availableCoupons(newVal) {
      this.tabs[0].count = newVal.length
    },
    usedCoupons(newVal) {
      this.tabs[1].count = newVal.length
    },
    expiredCoupons(newVal) {
      this.tabs[2].count = newVal.length
    }
  },
  
  onLoad() {
    this.loadData()
  },
  
  onPullDownRefresh() {
    this.loadData()
    uni.stopPullDownRefresh()
  },
  
  methods: {
    // 格式化日期
    formatDate(date) {
      return formatDate(date, 'YYYY-MM-DD')
    },
    
    // 加载数据
    async loadData() {
      await Promise.all([
        this.loadMyCoupons(),
        this.loadAvailableToReceive()
      ])
    },
    
    // 加载我的优惠券
    async loadMyCoupons() {
      if (!this.isLogin) return
      
      try {
        // 这里应该调用我的优惠券接口，暂时使用模拟数据
        this.allCoupons = [
          {
            id: 'coupon_001',
            name: '新用户专享券',
            description: '首次下单立减',
            amount: 10,
            condition: '满50元可用',
            status: 'available',
            expireTime: new Date('2024-02-15'),
            createTime: new Date('2024-01-01')
          },
          {
            id: 'coupon_002',
            name: '满减优惠券',
            description: '购物满减优惠',
            amount: 20,
            condition: '满100元可用',
            status: 'used',
            useTime: new Date('2024-01-10'),
            expireTime: new Date('2024-02-01'),
            createTime: new Date('2024-01-01')
          },
          {
            id: 'coupon_003',
            name: '过期优惠券',
            description: '已过期的优惠券',
            amount: 15,
            condition: '满80元可用',
            status: 'available',
            expireTime: new Date('2024-01-01'),
            createTime: new Date('2023-12-01')
          }
        ]
      } catch (error) {
        console.error('加载优惠券失败:', error)
      }
    },
    
    // 加载可领取的优惠券
    async loadAvailableToReceive() {
      try {
        // 这里应该调用可领取优惠券接口，暂时使用模拟数据
        this.availableToReceive = [
          {
            id: 'receive_001',
            name: '周末专享券',
            description: '周末购物专享优惠',
            amount: 5,
            condition: '满30元可用',
            validDays: 7,
            stock: 100,
            received: false,
            receiving: false
          },
          {
            id: 'receive_002',
            name: '限时优惠券',
            description: '限时限量优惠券',
            amount: 15,
            condition: '满80元可用',
            validDays: 30,
            stock: 0,
            received: false,
            receiving: false
          }
        ]
      } catch (error) {
        console.error('加载可领取优惠券失败:', error)
      }
    },
    
    // 切换选项卡
    switchTab(key) {
      this.activeTab = key
    },
    
    // 获取空状态文本
    getEmptyText() {
      switch (this.activeTab) {
        case 'available':
          return '暂无可用优惠券'
        case 'used':
          return '暂无已使用优惠券'
        case 'expired':
          return '暂无已过期优惠券'
        default:
          return '暂无优惠券'
      }
    },
    
    // 使用优惠券
    useCoupon(coupon) {
      // 跳转到商品页面，并选择优惠券
      uni.switchTab({
        url: '/pages/index/index'
      })
      
      // 可以通过全局状态或路由参数传递选中的优惠券
      this.$store.commit('coupon/SET_SELECTED_COUPON', coupon)
      
      uni.showToast({
        title: '已选择优惠券',
        icon: 'success'
      })
    },
    
    // 领取优惠券
    async receiveCoupon(coupon) {
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
      
      if (coupon.received || coupon.stock <= 0) return
      
      coupon.receiving = true
      
      try {
        // 调用云函数领取优惠券
        const result = await uniCloud.callFunction({
          name: 'coupon',
          data: {
            action: 'receive',
            couponId: coupon.id
          }
        })
        
        if (result.result.code === 0) {
          coupon.received = true
          coupon.stock--
          
          uni.showToast({
            title: '领取成功',
            icon: 'success'
          })
          
          // 重新加载我的优惠券
          await this.loadMyCoupons()
        } else {
          throw new Error(result.result.message || '领取失败')
        }
      } catch (error) {
        console.error('领取优惠券失败:', error)
        uni.showToast({
          title: error.message || '领取失败，请重试',
          icon: 'none'
        })
      } finally {
        coupon.receiving = false
      }
    },
    
    // 查看更多优惠券
    viewMoreCoupons() {
      uni.showToast({
        title: '更多优惠券功能开发中',
        icon: 'none'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.coupon-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.stats-section {
  padding: 30rpx 20rpx;
  
  .stats-card {
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
    border-radius: 16rpx;
    padding: 40rpx 30rpx;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.3);
    
    .stats-item {
      text-align: center;
      flex: 1;
      
      .stats-number {
        display: block;
        font-size: 48rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 8rpx;
      }
      
      .stats-label {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .stats-divider {
      width: 1rpx;
      height: 60rpx;
      background-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.tab-section {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 0 20rpx;
  
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
      
      .tab-badge {
        position: absolute;
        top: 20rpx;
        right: 50%;
        transform: translateX(20rpx);
        min-width: 32rpx;
        height: 32rpx;
        background-color: #ff6b35;
        color: #fff;
        border-radius: 16rpx;
        font-size: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8rpx;
      }
    }
  }
}

.coupon-list {
  margin: 20rpx 20rpx 0;
  
  .coupon-item {
    background-color: #fff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
    position: relative;
    
    &.used,
    &.expired {
      opacity: 0.6;
      
      .coupon-content {
        .coupon-left {
          .coupon-amount {
            color: #999;
          }
        }
        
        .coupon-right {
          color: #999;
        }
      }
    }
    
    .coupon-content {
      display: flex;
      padding: 30rpx;
      
      .coupon-left {
        flex-shrink: 0;
        text-align: center;
        padding-right: 30rpx;
        
        .coupon-amount {
          margin-bottom: 10rpx;
          
          .currency {
            font-size: 24rpx;
            color: #ff6b35;
          }
          
          .amount {
            font-size: 48rpx;
            font-weight: bold;
            color: #ff6b35;
          }
        }
        
        .coupon-condition {
          font-size: 22rpx;
          color: #666;
        }
      }
      
      .coupon-divider {
        width: 2rpx;
        background-color: #f0f0f0;
        margin: 0 30rpx;
      }
      
      .coupon-right {
        flex: 1;
        
        .coupon-name {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .coupon-desc {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 8rpx;
        }
        
        .coupon-time {
          font-size: 22rpx;
          color: #999;
        }
      }
    }
    
    .coupon-actions {
      position: absolute;
      right: 30rpx;
      bottom: 30rpx;
    }
    
    .used-mark,
    .expired-mark {
      position: absolute;
      right: 60rpx;
      top: 50%;
      transform: translateY(-50%) rotate(-45deg);
      font-size: 24rpx;
      color: #999;
      opacity: 0.8;
    }
  }
}

.receive-section {
  margin: 40rpx 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .title-text {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .more-text {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .receive-list {
    .coupon-item {
      background-color: #fafafa;
      
      .coupon-content {
        .coupon-left {
          .coupon-amount {
            .currency,
            .amount {
              color: #ff6b35;
            }
          }
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>