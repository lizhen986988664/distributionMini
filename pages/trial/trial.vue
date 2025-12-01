<template>
  <view class="trial-page">
    <!-- 头部banner -->
    <view class="trial-banner">
      <image src="/static/banners/trial-banner.png" mode="aspectFill" class="banner-image" />
      <view class="banner-content">
        <text class="banner-title">免费试用</text>
        <text class="banner-subtitle">品质生活，从体验开始</text>
      </view>
    </view>

    <!-- 试用规则说明 -->
    <view class="rules-section">
      <view class="section-title">
        <text class="title-text">试用规则</text>
      </view>
      <view class="rules-content">
        <view class="rule-item">
          <text class="rule-number">1</text>
          <text class="rule-text">新用户可免费领取试用装一份</text>
        </view>
        <view class="rule-item">
          <text class="rule-number">2</text>
          <text class="rule-text">试用装规格为100ml，运费自理</text>
        </view>
        <view class="rule-item">
          <text class="rule-number">3</text>
          <text class="rule-text">每户限领一次，不得重复领取</text>
        </view>
        <view class="rule-item">
          <text class="rule-number">4</text>
          <text class="rule-text">试用后欢迎分享体验感受</text>
        </view>
      </view>
    </view>

    <!-- 试用产品展示 -->
    <view class="products-section">
      <view class="section-title">
        <text class="title-text">可选试用产品</text>
      </view>
      
      <view class="product-list">
        <view class="product-card" v-for="product in trialProducts" :key="product.id">
          <image :src="product.image" mode="aspectFill" class="product-image" />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-desc">{{ product.description }}</text>
            <view class="product-spec">
              <text class="spec-text">{{ product.spec }}</text>
              <text class="spec-label">（试用装）</text>
            </view>
            <button 
              :type="selectedProductId === product.id ? 'primary' : 'default'"
              size="mini"
              @click="selectProduct(product)"
              :disabled="product.stock <= 0"
            >
              {{ product.stock <= 0 ? '已选完' : (selectedProductId === product.id ? '已选择' : '选择此款') }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 试用申请表单 -->
    <view class="form-section" v-if="selectedProductId">
      <view class="section-title">
        <text class="title-text">申请信息</text>
      </view>
      
      <view class="form-content">
        <view class="form-item">
          <text class="form-label">收货人</text>
          <input
            v-model="form.receiverName"
            placeholder="请输入收货人姓名"
            clearable
          / class="input">
        </view>
        
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input
            v-model="form.phoneNumber"
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
            clearable
          / class="input">
        </view>
        
        <view class="form-item">
          <text class="form-label">收货地址</text>
          <input
            v-model="form.address"
            placeholder="请输入详细收货地址"
            clearable
          / class="input">
        </view>
        
        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea
            v-model="form.remark"
            placeholder="请输入备注信息（选填）"
            :maxlength="200"
          / class="textarea">
        </view>
      </view>
    </view>

    <!-- 试用记录 -->
    <view class="records-section" v-if="trialRecords.length > 0">
      <view class="section-title">
        <text class="title-text">我的试用记录</text>
      </view>
      
      <view class="record-list">
        <view class="record-item" v-for="record in trialRecords" :key="record.id">
          <image :src="record.productImage" mode="aspectFill" class="record-image" />
          <view class="record-info">
            <text class="record-name">{{ record.productName }}</text>
            <text class="record-time">申请时间：{{ formatDate(record.createTime) }}</text>
            <view class="record-status" :class="record.status">
              {{ getStatusText(record.status) }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="selectedProductId">
      <view class="price-info">
        <text class="price-label">运费：</text>
        <text class="price">¥{{ shippingFee.toFixed(2) }}</text>
      </view>
      <button
        type="primary"
        size="default"
        :loading="submitting"
        @click="submitTrial"
        :disabled="!canSubmit"
      >
        {{ submitting ? '提交中...' : '立即申请' }}
      </button>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { formatDate, validatePhone } from '@/utils/index'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      trialProducts: [],
      selectedProductId: '',
      trialRecords: [],
      shippingFee: 10.00, // 运费
      submitting: false,
      form: {
        receiverName: '',
        phoneNumber: '',
        address: '',
        remark: ''
      }
    }
  },
  
  computed: {
    ...mapGetters({
      userInfo: 'user/userInfo',
      isLogin: 'user/isLogin'
    }),
    
    // 选中的产品
    selectedProduct() {
      return this.trialProducts.find(p => p.id === this.selectedProductId)
    },
    
    // 是否可以提交
    canSubmit() {
      return (
        this.selectedProductId &&
        this.form.receiverName.trim() &&
        validatePhone(this.form.phoneNumber) &&
        this.form.address.trim() &&
        !this.submitting
      )
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
    ...mapActions({
      addToCart: 'cart/addToCart'
    }),
    
    // 格式化日期
    formatDate(date) {
      return formatDate(date, 'YYYY-MM-DD HH:mm')
    },
    
    // 加载数据
    async loadData() {
      await Promise.all([
        this.loadTrialProducts(),
        this.loadTrialRecords()
      ])
    },
    
    // 加载试用产品
    async loadTrialProducts() {
      try {
        // 这里应该调用试用产品接口，暂时使用模拟数据
        this.trialProducts = [
          {
            id: 'trial_001',
            name: '深层洁净洗衣液试用装',
            description: '深层去污，温和不伤手',
            spec: '100ml',
            image: '/static/products/trial-1.jpg',
            stock: 100
          },
          {
            id: 'trial_002',
            name: '柔顺护衣洗衣液试用装',
            description: '让衣物更柔软舒适',
            spec: '100ml',
            image: '/static/products/trial-2.jpg',
            stock: 50
          },
          {
            id: 'trial_003',
            name: '婴儿专用洗衣液试用装',
            description: '温和无刺激，适合宝宝衣物',
            spec: '100ml',
            image: '/static/products/trial-3.jpg',
            stock: 0
          }
        ]
      } catch (error) {
        console.error('加载试用产品失败:', error)
      }
    },
    
    // 加载试用记录
    async loadTrialRecords() {
      if (!this.isLogin) return
      
      try {
        // 这里应该调用试用记录接口，暂时使用模拟数据
        this.trialRecords = [
          {
            id: 'record_001',
            productName: '深层洁净洗衣液试用装',
            productImage: '/static/products/trial-1.jpg',
            status: 'pending',
            createTime: new Date('2024-01-10 10:30:00')
          },
          {
            id: 'record_002',
            productName: '柔顺护衣洗衣液试用装',
            productImage: '/static/products/trial-2.jpg',
            status: 'shipped',
            createTime: new Date('2024-01-08 14:20:00')
          }
        ]
      } catch (error) {
        console.error('加载试用记录失败:', error)
      }
    },
    
    // 选择产品
    selectProduct(product) {
      if (product.stock <= 0) return
      
      this.selectedProductId = product.id
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待处理',
        approved: '已通过',
        shipped: '已发货',
        completed: '已完成',
        rejected: '已拒绝'
      }
      return statusMap[status] || status
    },
    
    // 提交试用申请
    async submitTrial() {
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
      
      if (!this.canSubmit) {
        uni.showToast({
          title: '请完善申请信息',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        // 调用云函数提交试用申请
        const result = await uniCloud.callFunction({
          name: 'trial',
          data: {
            action: 'applyTrial',
            productId: this.selectedProductId,
            shippingFee: this.shippingFee,
            ...this.form
          }
        })
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '申请提交成功',
            icon: 'success'
          })
          
          // 清空表单
          this.form = {
            receiverName: '',
            phoneNumber: '',
            address: '',
            remark: ''
          }
          this.selectedProductId = ''
          
          // 重新加载试用记录
          await this.loadTrialRecords()
        } else {
          throw new Error(result.result.message || '申请失败')
        }
      } catch (error) {
        console.error('提交试用申请失败:', error)
        uni.showToast({
          title: error.message || '申请失败，请重试',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.trial-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.trial-banner {
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

.rules-section, .products-section, .form-section, .records-section {
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

.rules-content {
  .rule-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .rule-number {
      width: 40rpx;
      height: 40rpx;
      background-color: #ff6b35;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      margin-right: 20rpx;
      flex-shrink: 0;
    }
    
    .rule-text {
      font-size: 28rpx;
      color: #666;
      line-height: 1.5;
      flex: 1;
    }
  }
}

.product-list {
  .product-card {
    display: flex;
    padding: 20rpx;
    border-radius: 8rpx;
    background-color: #fafafa;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .product-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }
    
    .product-info {
      flex: 1;
      
      .product-name {
        display: block;
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .product-desc {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .product-spec {
        display: flex;
        align-items: baseline;
        margin-bottom: 15rpx;
        
        .spec-text {
          font-size: 26rpx;
          color: #ff6b35;
          font-weight: bold;
        }
        
        .spec-label {
          font-size: 22rpx;
          color: #999;
          margin-left: 6rpx;
        }
      }
    }
  }
}

.form-content {
  .form-item {
    margin-bottom: 30rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .form-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 15rpx;
    }
  }
}

.record-list {
  .record-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    border-radius: 8rpx;
    background-color: #fafafa;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .record-image {
      width: 80rpx;
      height: 80rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }
    
    .record-info {
      flex: 1;
      
      .record-name {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .record-time {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      
      .record-status {
        display: inline-block;
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        
        &.pending {
          background-color: #e6f7ff;
          color: #1890ff;
        }
        
        &.approved {
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
        
        &.rejected {
          background-color: #fff2f0;
          color: #ff4d4f;
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
  
  .price-info {
    display: flex;
    align-items: baseline;
    
    .price-label {
      font-size: 26rpx;
      color: #666;
    }
    
    .price {
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