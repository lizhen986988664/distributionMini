<template>
  <view class="stored-value-page">
    <!-- 顶部banner -->
    <view class="banner-section">
      <image src="/static/banners/stored-value-banner.png" mode="aspectFill" class="banner-image" />
      <view class="banner-content">
        <text class="banner-title">储值卡</text>
        <text class="banner-subtitle">预存优惠，实惠多多</text>
      </view>
    </view>

    <!-- 储值卡套餐 -->
    <view class="packages-section">
      <view class="section-title">
        <text class="title-text">选择套餐</text>
      </view>
      
      <view class="package-list">
        <view 
          class="package-card" 
          v-for="pkg in packages" 
          :key="pkg.id"
          :class="{ selected: selectedPackageId === pkg.id }"
          @click="selectPackage(pkg)"
        >
          <!-- 推荐标签 -->
          <view class="recommend-tag" v-if="pkg.isRecommend">推荐</view>
          
          <!-- 套餐内容 -->
          <view class="package-content">
            <view class="package-header">
              <text class="package-name">{{ pkg.name }}</text>
              <view class="package-price">
                <text class="price">¥{{ pkg.price }}</text>
                <text class="original-price" v-if="pkg.originalPrice > pkg.price">原价¥{{ pkg.originalPrice }}</text>
              </view>
            </view>
            
            <view class="package-benefits">
              <view class="benefit-item" v-for="benefit in pkg.benefits" :key="benefit">
                <text class="benefit-text">• {{ benefit }}</text>
              </view>
            </view>
            
            <view class="package-extra" v-if="pkg.extraInfo">
              <text class="extra-text">{{ pkg.extraInfo }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 购买说明 -->
    <view class="instructions-section">
      <view class="section-title">
        <text class="title-text">购买说明</text>
      </view>
      
      <view class="instruction-list">
        <view class="instruction-item">
          <text class="instruction-title">1. 储值金额</text>
          <text class="instruction-text">购买储值卡后，相应金额将直接存入您的账户余额</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-title">2. 使用方式</text>
          <text class="instruction-text">账户余额可用于购买商品，余额不足时可继续充值</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-title">3. 有效期</text>
          <text class="instruction-text">储值卡永久有效，无使用时间限制</text>
        </view>
        <view class="instruction-item">
          <text class="instruction-title">4. 退款政策</text>
          <text class="instruction-text">储值卡购买后不支持退款，请谨慎购买</text>
        </view>
      </view>
    </view>

    <!-- 我的储值卡 -->
    <view class="my-cards-section" v-if="isLogin && myStoredCards.length > 0">
      <view class="section-title">
        <text class="title-text">我的储值卡</text>
      </view>
      
      <view class="card-list">
        <view class="card-item" v-for="card in myStoredCards" :key="card.id">
          <view class="card-header">
            <text class="card-name">{{ card.packageName }}</text>
            <view class="card-status" :class="card.status">
              {{ getStatusText(card.status) }}
            </view>
          </view>
          
          <view class="card-info">
            <view class="info-row">
              <text class="info-label">购买金额：</text>
              <text class="info-value">¥{{ card.amount }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">购买时间：</text>
              <text class="info-value">{{ formatDate(card.createTime) }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">使用情况：</text>
              <text class="info-value">已使用¥{{ card.usedAmount }}，剩余¥{{ card.remainingAmount }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部购买栏 -->
    <view class="bottom-bar" v-if="selectedPackage">
      <view class="package-info">
        <text class="selected-name">已选择：{{ selectedPackage.name }}</text>
        <text class="selected-price">¥{{ selectedPackage.price }}</text>
      </view>
      <button
        type="primary"
        size="default"
        :loading="purchasing"
        @click="purchasePackage"
      >
        {{ purchasing ? '购买中...' : '立即购买' }}
      </button>
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
      packages: [],
      selectedPackageId: '',
      myStoredCards: [],
      purchasing: false
    }
  },
  
  computed: {
    ...mapGetters({
      userInfo: 'user/userInfo',
      isLogin: 'user/isLogin'
    }),
    
    // 选中的套餐
    selectedPackage() {
      return this.packages.find(pkg => pkg.id === this.selectedPackageId)
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
      return formatDate(date, 'YYYY-MM-DD HH:mm')
    },
    
    // 加载数据
    async loadData() {
      await Promise.all([
        this.loadPackages(),
        this.loadMyStoredCards()
      ])
    },
    
    // 加载储值卡套餐
    async loadPackages() {
      try {
        // 这里应该调用套餐接口，暂时使用模拟数据
        this.packages = [
          {
            id: 'package_001',
            name: '体验套餐',
            price: 50,
            originalPrice: 50,
            benefits: [
              '存50元得50元',
              '无门槛使用',
              '永久有效'
            ],
            isRecommend: false
          },
          {
            id: 'package_002',
            name: '经济套餐',
            price: 100,
            originalPrice: 100,
            benefits: [
              '存100元得110元',
              '额外赠送10元',
              '永久有效'
            ],
            isRecommend: false
          },
          {
            id: 'package_003',
            name: '超值套餐',
            price: 200,
            originalPrice: 200,
            benefits: [
              '存200元得230元',
              '额外赠送30元',
              '永久有效',
              '送洗衣液试用装'
            ],
            isRecommend: true,
            extraInfo: '最受欢迎，性价比最高'
          },
          {
            id: 'package_004',
            name: '豪华套餐',
            price: 500,
            originalPrice: 500,
            benefits: [
              '存500元得600元',
              '额外赠送100元',
              '永久有效',
              '送洗衣液正装一套',
              '专属客服服务'
            ],
            isRecommend: false,
            extraInfo: '大额充值优惠多'
          }
        ]
      } catch (error) {
        console.error('加载储值卡套餐失败:', error)
      }
    },
    
    // 加载我的储值卡
    async loadMyStoredCards() {
      if (!this.isLogin) return
      
      try {
        // 这里应该调用我的储值卡接口，暂时使用模拟数据
        this.myStoredCards = [
          {
            id: 'card_001',
            packageName: '经济套餐',
            amount: 100,
            usedAmount: 25.50,
            remainingAmount: 74.50,
            status: 'active',
            createTime: new Date('2024-01-05 10:30:00')
          },
          {
            id: 'card_002',
            packageName: '体验套餐',
            amount: 50,
            usedAmount: 50,
            remainingAmount: 0,
            status: 'used',
            createTime: new Date('2023-12-15 14:20:00')
          }
        ]
      } catch (error) {
        console.error('加载我的储值卡失败:', error)
      }
    },
    
    // 选择套餐
    selectPackage(pkg) {
      this.selectedPackageId = pkg.id
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        active: '使用中',
        used: '已用完',
        expired: '已过期'
      }
      return statusMap[status] || status
    },
    
    // 购买套餐
    async purchasePackage() {
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
      
      if (!this.selectedPackage) {
        uni.showToast({
          title: '请选择套餐',
          icon: 'none'
        })
        return
      }
      
      this.purchasing = true
      
      try {
        // 调用云函数购买储值卡
        const result = await uniCloud.callFunction({
          name: 'storedValue',
          data: {
            action: 'purchase',
            packageId: this.selectedPackageId,
            packageName: this.selectedPackage.name,
            amount: this.selectedPackage.price
          }
        })
        
        if (result.result.code === 0) {
          uni.showModal({
            title: '购买成功',
            content: `成功购买${this.selectedPackage.name}，¥${this.selectedPackage.price}已存入您的账户余额`,
            showCancel: false,
            success: () => {
              // 重新加载数据
              this.loadMyStoredCards()
              this.selectedPackageId = ''
            }
          })
        } else {
          throw new Error(result.result.message || '购买失败')
        }
      } catch (error) {
        console.error('购买储值卡失败:', error)
        uni.showToast({
          title: error.message || '购买失败，请重试',
          icon: 'none'
        })
      } finally {
        this.purchasing = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.stored-value-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.banner-section {
  position: relative;
  height: 400rpx;
  
  .banner-image {
    width: 100%;
    height: 100%;
  }
  
  .banner-content {
    position: absolute;
    bottom: 60rpx;
    left: 40rpx;
    
    .banner-title {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #fff;
      margin-bottom: 10rpx;
    }
    
    .banner-subtitle {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.packages-section, .instructions-section, .my-cards-section {
  margin: 20rpx 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .section-title {
    margin-bottom: 30rpx;
    
    .title-text {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.package-list {
  .package-card {
    position: relative;
    border: 2rpx solid #f0f0f0;
    border-radius: 12rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    transition: all 0.3s ease;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.selected {
      border-color: #ff6b35;
      background-color: #fff8f5;
      
      .package-content {
        .package-header {
          .package-name {
            color: #ff6b35;
          }
        }
      }
    }
    
    .recommend-tag {
      position: absolute;
      top: -10rpx;
      right: 30rpx;
      background: linear-gradient(135deg, #ff6b35, #ff8c42);
      color: #fff;
      padding: 6rpx 20rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.3);
    }
    
    .package-content {
      .package-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .package-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
        
        .package-price {
          text-align: right;
          
          .price {
            font-size: 36rpx;
            color: #ff6b35;
            font-weight: bold;
          }
          
          .original-price {
            display: block;
            font-size: 22rpx;
            color: #999;
            text-decoration: line-through;
          }
        }
      }
      
      .package-benefits {
        margin-bottom: 15rpx;
        
        .benefit-item {
          margin-bottom: 8rpx;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .benefit-text {
            font-size: 26rpx;
            color: #666;
            line-height: 1.4;
          }
        }
      }
      
      .package-extra {
        .extra-text {
          font-size: 24rpx;
          color: #ff6b35;
          font-weight: 500;
        }
      }
    }
  }
}

.instruction-list {
  .instruction-item {
    margin-bottom: 25rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .instruction-title {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .instruction-text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
    }
  }
}

.card-list {
  .card-item {
    background-color: #fafafa;
    border-radius: 8rpx;
    padding: 25rpx;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .card-name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
      }
      
      .card-status {
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        
        &.active {
          background-color: #f6ffed;
          color: #52c41a;
        }
        
        &.used {
          background-color: #f6f6f6;
          color: #666;
        }
        
        &.expired {
          background-color: #fff2f0;
          color: #ff4d4f;
        }
      }
    }
    
    .card-info {
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
  
  .package-info {
    flex: 1;
    
    .selected-name {
      display: block;
      font-size: 26rpx;
      color: #666;
      margin-bottom: 5rpx;
    }
    
    .selected-price {
      font-size: 32rpx;
      color: #ff6b35;
      font-weight: bold;
    }
  }
  
  .button {
    width: 240rpx;
  }
}
</style>