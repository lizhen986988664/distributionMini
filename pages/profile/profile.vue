<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card" v-if="isLogin">
      <view class="user-info">
        <image :src="userInfo.avatar || '/static/avatars/default.png'" class="avatar" />
        <view class="user-details">
          <text class="nickname">{{ userInfo.nickname || '用户' }}</text>
          <text class="user-level">{{ getLevelText(userInfo.level) }}</text>
        </view>
        <view class="user-actions">
          <button size="mini" @click="editProfile">编辑资料</button>
        </view>
      </view>
      
      <!-- 余额和积分 -->
      <view class="balance-section">
        <view class="balance-item" @click="viewBalance">
          <text class="balance-value">¥{{ (userInfo.balance || 0).toFixed(2) }}</text>
          <text class="balance-label">账户余额</text>
        </view>
        <view class="balance-divider"></view>
        <view class="balance-item" @click="viewPoints">
          <text class="balance-value">{{ userInfo.points || 0 }}</text>
          <text class="balance-label">积分</text>
        </view>
      </view>
    </view>

    <!-- 未登录状态 -->
    <view class="login-card" v-else>
      <image src="/static/avatars/default.png" class="default-avatar" />
      <text class="login-text">登录后享受更多服务</text>
      <button type="primary" @click="goToLogin" class="login-btn">立即登录</button>
    </view>

    <!-- 订单状态 -->
    <view class="order-section" v-if="isLogin">
      <view class="section-title">
        <text class="title-text">我的订单</text>
        <text class="more-text" @click="viewAllOrders">全部订单 ></text>
      </view>
      
      <view class="order-stats">
        <view class="order-item" @click="viewOrders('pending')">
          <view class="order-icon-wrapper">
            <image src="/static/icons/order-pending.png" class="order-icon" />
            <view class="badge" v-if="orderStats.pending > 0">{{ orderStats.pending }}</view>
          </view>
          <text class="order-text">待付款</text>
        </view>
        <view class="order-item" @click="viewOrders('paid')">
          <view class="order-icon-wrapper">
            <image src="/static/icons/order-paid.png" class="order-icon" />
            <view class="badge" v-if="orderStats.paid > 0">{{ orderStats.paid }}</view>
          </view>
          <text class="order-text">待发货</text>
        </view>
        <view class="order-item" @click="viewOrders('shipped')">
          <view class="order-icon-wrapper">
            <image src="/static/icons/order-shipped.png" class="order-icon" />
            <view class="badge" v-if="orderStats.shipped > 0">{{ orderStats.shipped }}</view>
          </view>
          <text class="order-text">待收货</text>
        </view>
        <view class="order-item" @click="viewOrders('completed')">
          <view class="order-icon-wrapper">
            <image src="/static/icons/order-completed.png" class="order-icon" />
          </view>
          <text class="order-text">已完成</text>
        </view>
      </view>
    </view>

    <!-- 海星卡统计 -->
    <view class="star-section" v-if="isLogin">
      <view class="section-title">
        <text class="title-text">海星卡统计</text>
        <text class="more-text" @click="goToStarCard">查看详情 ></text>
      </view>
      
      <view class="star-stats">
        <view class="star-item">
          <text class="star-number">{{ starStats.totalShared || 0 }}</text>
          <text class="star-label">累计分享</text>
        </view>
        <view class="star-divider"></view>
        <view class="star-item">
          <text class="star-number">{{ starStats.totalReceived || 0 }}</text>
          <text class="star-label">累计接收</text>
        </view>
        <view class="star-divider"></view>
        <view class="star-item">
          <text class="star-number">{{ starStats.totalReward || 0 }}</text>
          <text class="star-label">累计奖励(元)</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="navigateTo('/pages/trial/trial')">
          <view class="menu-left">
            <image src="/static/icons/trial.png" class="menu-icon" />
            <text class="menu-text">免费试用</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/stored-value/stored-value')">
          <view class="menu-left">
            <image src="/static/icons/stored-value.png" class="menu-icon" />
            <text class="menu-text">储值卡</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/coupon/coupon')">
          <view class="menu-left">
            <image src="/static/icons/coupon.png" class="menu-icon" />
            <text class="menu-text">优惠券</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>
      
      <view class="menu-group" v-if="isLogin">
        <view class="menu-item" @click="navigateTo('/pages/address/address')">
          <view class="menu-left">
            <image src="/static/icons/address.png" class="menu-icon" />
            <text class="menu-text">收货地址</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/balance/balance')">
          <view class="menu-left">
            <image src="/static/icons/balance.png" class="menu-icon" />
            <text class="menu-text">余额明细</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/points/points')">
          <view class="menu-left">
            <image src="/static/icons/points.png" class="menu-icon" />
            <text class="menu-text">积分商城</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>
      
      <view class="menu-group">
        <view class="menu-item" @click="contactService">
          <view class="menu-left">
            <image src="/static/icons/service.png" class="menu-icon" />
            <text class="menu-text">联系客服</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="viewAbout">
          <view class="menu-left">
            <image src="/static/icons/about.png" class="menu-icon" />
            <text class="menu-text">关于我们</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLogin">
      <button type="default" @click="logout" class="logout-btn">退出登录</button>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      orderStats: {
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0
      },
      starStats: {
        totalShared: 0,
        totalReceived: 0,
        totalReward: 0
      }
    }
  },
  
  computed: {
    ...mapGetters({
      userInfo: 'user/userInfo',
      isLogin: 'user/isLogin'
    })
  },
  
  onLoad() {
    this.loadData()
  },
  
  onShow() {
    this.loadData()
  },
  
  onPullDownRefresh() {
    this.loadData()
    uni.stopPullDownRefresh()
  },
  
  methods: {
    ...mapActions({
      logoutAction: 'user/logout',
      updateUserInfo: 'user/updateUserInfo',
      getStarCardStats: 'starCard/getStarCardStats'
    }),
    
    // 加载数据
    async loadData() {
      if (this.isLogin) {
        await Promise.all([
          this.loadOrderStats(),
          this.loadStarStats()
        ])
      }
    },
    
    // 获取等级文本
    getLevelText(level) {
      const levelMap = {
        bronze: '青铜会员',
        silver: '白银会员',
        gold: '黄金会员',
        platinum: '铂金会员',
        diamond: '钻石会员'
      }
      return levelMap[level] || '普通会员'
    },
    
    // 加载订单统计
    async loadOrderStats() {
      try {
        // 这里应该调用订单统计接口，暂时使用模拟数据
        this.orderStats = {
          pending: 2,
          paid: 1,
          shipped: 3,
          completed: 10
        }
      } catch (error) {
        console.error('加载订单统计失败:', error)
      }
    },
    
    // 加载海星卡统计
    async loadStarStats() {
      try {
        const stats = await this.getStarCardStats()
        if (stats) {
          this.starStats = stats
        }
      } catch (error) {
        console.error('加载海星卡统计失败:', error)
      }
    },
    
    // 编辑资料
    editProfile() {
      uni.navigateTo({
        url: '/pages/profile/edit'
      })
    },
    
    // 查看余额
    viewBalance() {
      uni.navigateTo({
        url: '/pages/balance/balance'
      })
    },
    
    // 查看积分
    viewPoints() {
      uni.navigateTo({
        url: '/pages/points/points'
      })
    },
    
    // 查看订单
    viewOrders(status) {
      uni.navigateTo({
        url: `/pages/order/order?status=${status}`
      })
    },
    
    // 查看所有订单
    viewAllOrders() {
      uni.navigateTo({
        url: '/pages/order/order'
      })
    },
    
    // 去海星卡页面
    goToStarCard() {
      uni.switchTab({
        url: '/pages/star-card/star-card'
      })
    },
    
    // 去登录
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      })
    },
    
    // 页面导航
    navigateTo(url) {
      if (!this.isLogin && !url.includes('/pages/trial/')) {
        // 免费试用页面可以不登录访问
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
      
      uni.navigateTo({ url })
    },
    
    // 联系客服
    contactService() {
      uni.showActionSheet({
        itemList: ['电话客服', '在线客服'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.makePhoneCall({
              phoneNumber: '400-123-4567'
            })
          } else {
            // 在线客服功能
            uni.showToast({
              title: '客服功能开发中',
              icon: 'none'
            })
          }
        }
      })
    },
    
    // 关于我们
    viewAbout() {
      uni.navigateTo({
        url: '/pages/about/about'
      })
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            this.logoutAction()
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.user-card {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  padding: 60rpx 30rpx;
  margin-bottom: 20rpx;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      border: 4rpx solid rgba(255, 255, 255, 0.3);
      margin-right: 30rpx;
    }
    
    .user-details {
      flex: 1;
      
      .nickname {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 10rpx;
      }
      
      .user-level {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        background-color: rgba(255, 255, 255, 0.2);
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        display: inline-block;
      }
    }
    
    .user-actions {
      .button {
        background-color: rgba(255, 255, 255, 0.2);
        color: #fff;
        border: 1rpx solid rgba(255, 255, 255, 0.3);
      }
    }
  }
  
  .balance-section {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 16rpx;
    padding: 30rpx 20rpx;
    
    .balance-item {
      text-align: center;
      flex: 1;
      
      .balance-value {
        display: block;
        font-size: 40rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 8rpx;
      }
      
      .balance-label {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .balance-divider {
      width: 1rpx;
      height: 60rpx;
      background-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.login-card {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  padding: 60rpx 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
  
  .default-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    margin-bottom: 20rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
  }
  
  .login-text {
    display: block;
    font-size: 28rpx;
    margin-bottom: 40rpx;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .login-btn {
    background-color: #fff;
    color: #ff6b35;
    border: none;
  }
}

.order-section, .star-section {
  background-color: #fff;
  margin: 20rpx 20rpx 0;
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
      color: #999;
    }
  }
}

.order-stats {
  display: flex;
  justify-content: space-around;
  
  .order-item {
    text-align: center;
    
    .order-icon-wrapper {
      position: relative;
      margin-bottom: 15rpx;
      
      .order-icon {
        width: 64rpx;
        height: 64rpx;
      }
      
      .badge {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
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
    
    .order-text {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.star-stats {
  display: flex;
  align-items: center;
  
  .star-item {
    text-align: center;
    flex: 1;
    
    .star-number {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #ff6b35;
      margin-bottom: 8rpx;
    }
    
    .star-label {
      font-size: 24rpx;
      color: #666;
    }
  }
  
  .star-divider {
    width: 1rpx;
    height: 60rpx;
    background-color: #f0f0f0;
  }
}

.menu-section {
  margin: 20rpx 20rpx 0;
  
  .menu-group {
    background-color: #fff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
    
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background-color: #f8f8f8;
      }
      
      .menu-left {
        display: flex;
        align-items: center;
        
        .menu-icon {
          width: 48rpx;
          height: 48rpx;
          margin-right: 24rpx;
        }
        
        .menu-text {
          font-size: 28rpx;
          color: #333;
        }
      }
      
      .menu-arrow {
        font-size: 24rpx;
        color: #ccc;
      }
    }
  }
}

.logout-section {
  margin: 40rpx 20rpx 0;
  
  .logout-btn {
    width: 100%;
    background-color: #f8f8f8;
    color: #666;
    border: none;
    
    &:active {
      background-color: #f0f0f0;
    }
  }
}
</style>