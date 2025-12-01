<template>
  <view class="star-card-page">
    <!-- 统计信息 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-item">
          <text class="stats-number">{{ starStats.totalShared || 0 }}</text>
          <text class="stats-label">累计分享</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-number">{{ starStats.totalReceived || 0 }}</text>
          <text class="stats-label">累计接收</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-number">{{ starStats.totalReward || 0 }}</text>
          <text class="stats-label">累计奖励</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button type="primary" size="default" @click="createStarCard" class="create-btn">
        创建海星分享卡
      </button>
      <button type="default" size="default" @click="receiveStarCard" class="receive-btn">
        接收海星卡
      </button>
    </view>

    <!-- 我的海星卡列表 -->
    <view class="cards-section">
      <view class="section-header">
        <text class="section-title">我的海星卡</text>
        <text class="section-desc">分享给好友，双方获得奖励</text>
      </view>
      
      <view class="card-list" v-if="myStarCards.length > 0">
        <view class="card-item" v-for="card in myStarCards" :key="card.id">
          <view class="card-header">
            <text class="card-title">{{ card.title || '海星分享卡' }}</text>
            <view class="card-status" :class="card.status">
              {{ getStatusText(card.status) }}
            </view>
          </view>
          
          <view class="card-content">
            <view class="reward-info">
              <text class="reward-label">奖励金额:</text>
              <text class="reward-amount">¥{{ card.rewardAmount }}</text>
            </view>
            <view class="card-info">
              <text class="info-item">分享码: {{ card.shareCode }}</text>
              <text class="info-item">创建时间: {{ formatDate(card.createTime) }}</text>
              <text class="info-item">有效期: {{ formatDate(card.expireTime) }}</text>
            </view>
          </view>
          
          <view class="card-actions">
            <button size="mini" @click="shareCard(card)" :disabled="card.status !== 'active'">
              分享给好友
            </button>
            <button size="mini" type="default" @click="viewCardDetail(card)">
              查看详情
            </button>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <image src="/static/images/empty-star.png" class="empty-image" />
        <text class="empty-text">暂无海星卡</text>
        <text class="empty-desc">创建海星卡分享给好友获得奖励</text>
      </view>
    </view>

    <!-- 海星卡说明 -->
    <view class="help-section">
      <view class="section-header">
        <text class="section-title">海星卡说明</text>
      </view>
      <view class="help-content">
        <view class="help-item">
          <text class="help-title">1. 什么是海星分享卡？</text>
          <text class="help-desc">海星分享卡是一种分享奖励机制，您创建卡片后分享给好友，好友接收后双方都可以获得奖励。</text>
        </view>
        <view class="help-item">
          <text class="help-title">2. 如何获得奖励？</text>
          <text class="help-desc">创建海星卡并分享给好友，好友接收并完成首次购买后，您和好友都可以获得相应的现金奖励。</text>
        </view>
        <view class="help-item">
          <text class="help-title">3. 奖励规则</text>
          <text class="help-desc">• 每张海星卡的有效期为30天\n• 奖励金额根据当前活动确定\n• 奖励将直接发放到您的账户余额\n• 每人最多可同时拥有10张有效海星卡</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { formatDate } from '@/utils/index'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      starStats: {
        totalShared: 0,
        totalReceived: 0,
        totalReward: 0
      }
    }
  },
  
  computed: {
    ...mapGetters({
      myStarCards: 'starCard/myStarCards',
      isLogin: 'user/isLogin'
    })
  },
  
  onLoad() {
    this.initPage()
  },
  
  onShow() {
    this.refreshData()
  },
  
  onPullDownRefresh() {
    this.refreshData()
  },
  
  methods: {
    ...mapActions({
      createStarCardAction: 'starCard/createStarCard',
      shareStarCardAction: 'starCard/shareStarCard',
      receiveStarCardAction: 'starCard/receiveStarCard',
      getMyStarCards: 'starCard/getMyStarCards',
      getStarCardStats: 'starCard/getStarCardStats'
    }),
    
    // 格式化日期
    formatDate(date) {
      return formatDate(date, 'YYYY-MM-DD')
    },
    
    // 初始化页面
    async initPage() {
      await this.refreshData()
    },
    
    // 刷新数据
    async refreshData() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        // 并行加载数据
        await Promise.all([
          this.getMyStarCards(),
          this.loadStats()
        ])
      } catch (error) {
        console.error('页面数据加载失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        const stats = await this.getStarCardStats()
        if (stats) {
          this.starStats = stats
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },
    
    // 创建海星卡
    async createStarCard() {
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
      
      // 显示创建选项
      uni.showActionSheet({
        itemList: ['创建免费试用卡', '创建优惠券卡', '创建储值卡'],
        success: async (res) => {
          const types = ['trial', 'coupon', 'stored']
          const type = types[res.tapIndex]
          
          await this.doCreateStarCard(type)
        }
      })
    },
    
    // 执行创建海星卡
    async doCreateStarCard(type) {
      try {
        const result = await this.createStarCardAction({
          type,
          title: this.getCardTitle(type),
          rewardAmount: this.getDefaultReward(type)
        })
        
        if (result.success) {
          // 刷新数据
          await this.refreshData()
        }
      } catch (error) {
        console.error('创建海星卡失败:', error)
      }
    },
    
    // 获取卡片标题
    getCardTitle(type) {
      const titles = {
        trial: '免费试用分享卡',
        coupon: '优惠券分享卡',
        stored: '储值卡分享卡'
      }
      return titles[type] || '海星分享卡'
    },
    
    // 获取默认奖励金额
    getDefaultReward(type) {
      const rewards = {
        trial: 5.00,
        coupon: 3.00,
        stored: 10.00
      }
      return rewards[type] || 5.00
    },
    
    // 接收海星卡
    async receiveStarCard() {
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
      
      uni.showModal({
        title: '输入分享码',
        content: '请输入好友分享的海星卡分享码',
        editable: true,
        placeholderText: '请输入分享码',
        success: async (res) => {
          if (res.confirm && res.content) {
            await this.doReceiveStarCard(res.content.trim())
          }
        }
      })
    },
    
    // 执行接收海星卡
    async doReceiveStarCard(shareCode) {
      try {
        const result = await this.receiveStarCardAction({ shareCode })
        
        if (result.success) {
          // 刷新数据
          await this.refreshData()
          
          // 显示接收成功信息
          uni.showModal({
            title: '接收成功',
            content: `您已成功接收海星卡，获得${result.data.rewardAmount}元奖励`,
            showCancel: false
          })
        }
      } catch (error) {
        console.error('接收海星卡失败:', error)
      }
    },
    
    // 分享卡片
    async shareCard(card) {
      try {
        // 先调用分享接口
        const result = await this.shareStarCardAction(card.id)
        
        if (result.success) {
          // 生成分享内容
          const shareContent = {
            title: card.title,
            path: `/pages/star-card/receive?shareCode=${card.shareCode}`,
            imageUrl: '/static/images/star-share.png'
          }
          
          // 调用微信分享
          uni.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          })
        }
      } catch (error) {
        console.error('分享失败:', error)
      }
    },
    
    // 查看卡片详情
    viewCardDetail(card) {
      uni.navigateTo({
        url: `/pages/star-card/detail?id=${card.id}`
      })
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        active: '有效',
        expired: '已过期',
        used: '已使用'
      }
      return statusMap[status] || status
    }
  },
  
  // 分享给好友
  onShareAppMessage() {
    return {
      title: '快来领取海星分享卡，获得现金奖励！',
      path: '/pages/star-card/star-card',
      imageUrl: '/static/images/star-share.png'
    }
  }
}
</script>

<style lang="scss" scoped>
.star-card-page {
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

.action-section {
  padding: 30rpx 20rpx;
  display: flex;
  gap: 20rpx;
  
  .create-btn,
  .receive-btn {
    flex: 1;
  }
}

.cards-section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .section-header {
    margin-bottom: 30rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .section-desc {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .card-list {
    .card-item {
      background-color: #fafafa;
      border-radius: 8rpx;
      padding: 24rpx;
      margin-bottom: 20rpx;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .card-title {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
        }
        
        .card-status {
          padding: 6rpx 16rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          
          &.active {
            background-color: #e6f7ff;
            color: #1890ff;
          }
          
          &.expired {
            background-color: #f6f6f6;
            color: #999;
          }
          
          &.used {
            background-color: #f6f6f6;
            color: #999;
          }
        }
      }
      
      .card-content {
        margin-bottom: 20rpx;
        
        .reward-info {
          display: flex;
          align-items: center;
          margin-bottom: 15rpx;
          
          .reward-label {
            font-size: 26rpx;
            color: #666;
            margin-right: 10rpx;
          }
          
          .reward-amount {
            font-size: 32rpx;
            color: #ff6b35;
            font-weight: bold;
          }
        }
        
        .card-info {
          .info-item {
            display: block;
            font-size: 26rpx;
            color: #666;
            margin-bottom: 8rpx;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
      
      .card-actions {
        display: flex;
        gap: 20rpx;
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 80rpx 0;
    
    .empty-image {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
    }
    
    .empty-text {
      display: block;
      font-size: 32rpx;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .empty-desc {
      font-size: 26rpx;
      color: #666;
    }
  }
}

.help-section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .section-header {
    margin-bottom: 30rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .help-content {
    .help-item {
      margin-bottom: 30rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .help-title {
        display: block;
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .help-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.6;
        white-space: pre-line;
      }
    }
  }
}
</style>