<template>
  <view class="order-confirm-page">
    <!-- 收货地址 -->
    <view class="address-section">
      <view class="section-title">
        <text class="title-text">收货地址</text>
      </view>
      
      <view class="address-card" v-if="selectedAddress" @click="selectAddress">
        <view class="address-info">
          <view class="address-header">
            <text class="receiver-name">{{ selectedAddress.receiverName }}</text>
            <text class="receiver-phone">{{ selectedAddress.phoneNumber }}</text>
          </view>
          <text class="address-detail">{{ selectedAddress.fullAddress }}</text>
        </view>
        <text class="address-arrow">></text>
      </view>
      
      <view class="no-address" v-else @click="addAddress">
        <text class="no-address-text">请添加收货地址</text>
        <text class="address-arrow">></text>
      </view>
    </view>

    <!-- 商品清单 -->
    <view class="goods-section">
      <view class="section-title">
        <text class="title-text">商品清单</text>
      </view>
      
      <view class="goods-list">
        <view class="goods-item" v-for="item in orderItems" :key="item.id">
          <image :src="item.image" mode="aspectFill" class="goods-image" />
          <view class="goods-info">
            <text class="goods-name">{{ item.name }}</text>
            <text class="goods-desc" v-if="item.description">{{ item.description }}</text>
            <view class="goods-bottom">
              <text class="goods-price">¥{{ item.price }}</text>
              <text class="goods-quantity">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-section">
      <view class="section-title">
        <text class="title-text">支付方式</text>
      </view>
      
      <view class="payment-methods">
        <view 
          class="payment-item" 
          :class="{ active: selectedPayment === 'balance' }"
          @click="selectPayment('balance')"
        >
          <image src="/static/icons/balance.png" class="payment-icon" />
          <view class="payment-info">
            <text class="payment-name">余额支付</text>
            <text class="payment-desc">当前余额：¥{{ (userInfo.balance || 0).toFixed(2) }}</text>
          </view>
          <view class="payment-radio" :class="{ checked: selectedPayment === 'balance' }">
            <text v-if="selectedPayment === 'balance'">●</text>
          </view>
        </view>
        
        <view 
          class="payment-item" 
          :class="{ active: selectedPayment === 'wechat' }"
          @click="selectPayment('wechat')"
        >
          <image src="/static/icons/wechat-pay.png" class="payment-icon" />
          <view class="payment-info">
            <text class="payment-name">微信支付</text>
            <text class="payment-desc">安全快捷的微信支付</text>
          </view>
          <view class="payment-radio" :class="{ checked: selectedPayment === 'wechat' }">
            <text v-if="selectedPayment === 'wechat'">●</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 优惠券 -->
    <view class="coupon-section">
      <view class="section-title">
        <text class="title-text">优惠券</text>
      </view>
      
      <view class="coupon-card" @click="selectCoupon">
        <view class="coupon-info" v-if="selectedCoupon">
          <text class="coupon-name">{{ selectedCoupon.name }}</text>
          <text class="coupon-desc">{{ selectedCoupon.description }}</text>
        </view>
        <text class="no-coupon" v-else>选择优惠券</text>
        <text class="coupon-arrow">></text>
      </view>
    </view>

    <!-- 订单备注 -->
    <view class="remark-section">
      <view class="section-title">
        <text class="title-text">订单备注</text>
      </view>
      
      <textarea
        v-model="orderRemark"
        placeholder="请输入备注信息（选填）"
        :maxlength="200"
        class="remark-textarea"
      / class="textarea">
    </view>

    <!-- 价格明细 -->
    <view class="price-section">
      <view class="price-item">
        <text class="price-label">商品总额</text>
        <text class="price-value">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="price-item" v-if="shippingFee > 0">
        <text class="price-label">运费</text>
        <text class="price-value">¥{{ shippingFee.toFixed(2) }}</text>
      </view>
      <view class="price-item" v-if="discountAmount > 0">
        <text class="price-label">优惠金额</text>
        <text class="price-value discount">-¥{{ discountAmount.toFixed(2) }}</text>
      </view>
      <view class="price-divider"></view>
      <view class="price-item total">
        <text class="price-label">实付金额</text>
        <text class="price-value">¥{{ finalAmount.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 底部提交栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ finalAmount.toFixed(2) }}</text>
      </view>
      <button
        type="primary"
        size="default"
        :loading="submitting"
        @click="submitOrder"
        :disabled="!canSubmit"
      >
        {{ submitting ? '提交中...' : '提交订单' }}
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
      orderItems: [],
      selectedAddress: null,
      selectedPayment: 'balance',
      selectedCoupon: null,
      orderRemark: '',
      shippingFee: 0,
      submitting: false
    }
  },
  
  computed: {
    ...mapGetters({
      userInfo: 'user/userInfo',
      isLogin: 'user/isLogin',
      cartItems: 'cart/cartItems'
    }),
    
    // 商品总额
    totalAmount() {
      return this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    
    // 优惠金额
    discountAmount() {
      return this.selectedCoupon ? this.selectedCoupon.amount : 0
    },
    
    // 最终金额
    finalAmount() {
      return Math.max(0, this.totalAmount + this.shippingFee - this.discountAmount)
    },
    
    // 是否可以提交
    canSubmit() {
      return (
        this.selectedAddress &&
        this.selectedPayment &&
        this.orderItems.length > 0 &&
        !this.submitting
      )
    }
  },
  
  onLoad(options) {
    this.initOrderData(options)
  },
  
  methods: {
    // 初始化订单数据
    async initOrderData(options) {
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
            } else {
              uni.navigateBack()
            }
          }
        })
        return
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        // 从购物车创建订单或从商品详情页直接购买
        if (options.selectedIds) {
          // 从购物车结算
          const selectedIds = options.selectedIds.split(',')
          const selectedQuantities = options.selectedQuantities.split(',')
          
          this.orderItems = selectedIds.map((id, index) => {
            const cartItem = this.cartItems.find(item => item.id === id)
            return cartItem ? {
              ...cartItem,
              quantity: parseInt(selectedQuantities[index])
            } : null
          }).filter(Boolean)
        } else if (options.productId) {
          // 直接购买
          const result = await cloudApi.product.getDetail(options.productId)
          if (result.success) {
            this.orderItems = [{
              ...result.data,
              quantity: parseInt(options.quantity) || 1
            }]
          }
        }
        
        // 加载收货地址
        await this.loadDefaultAddress()
        
        // 计算运费
        this.calculateShippingFee()
        
      } catch (error) {
        console.error('初始化订单数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 加载默认收货地址
    async loadDefaultAddress() {
      try {
        // 这里应该调用地址接口，暂时使用模拟数据
        this.selectedAddress = {
          id: 'address_001',
          receiverName: '张三',
          phoneNumber: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园南区深南大道10000号',
          fullAddress: '广东省深圳市南山区科技园南区深南大道10000号',
          isDefault: true
        }
      } catch (error) {
        console.error('加载收货地址失败:', error)
      }
    },
    
    // 计算运费
    calculateShippingFee() {
      // 满99元包邮
      if (this.totalAmount >= 99) {
        this.shippingFee = 0
      } else {
        this.shippingFee = 10
      }
    },
    
    // 选择收货地址
    selectAddress() {
      uni.navigateTo({
        url: '/pages/address/address?select=true'
      })
    },
    
    // 添加收货地址
    addAddress() {
      uni.navigateTo({
        url: '/pages/address/edit?select=true'
      })
    },
    
    // 选择支付方式
    selectPayment(method) {
      // 检查余额是否足够
      if (method === 'balance') {
        const balance = parseFloat(this.userInfo.balance || 0)
        if (balance < this.finalAmount) {
          uni.showModal({
            title: '余额不足',
            content: '当前余额不足，请选择其他支付方式或先充值',
            showCancel: false
          })
          return
        }
      }
      
      this.selectedPayment = method
    },
    
    // 选择优惠券
    selectCoupon() {
      uni.navigateTo({
        url: '/pages/coupon/select?amount=' + this.totalAmount
      })
    },
    
    // 提交订单
    async submitOrder() {
      if (!this.canSubmit) {
        uni.showToast({
          title: '请完善订单信息',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        const orderData = {
          items: this.orderItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          receiverInfo: this.selectedAddress,
          paymentMethod: this.selectedPayment,
          couponId: this.selectedCoupon ? this.selectedCoupon.id : null,
          shippingFee: this.shippingFee,
          remark: this.orderRemark
        }
        
        const result = await cloudApi.order.create(orderData)
        
        if (result.success) {
          // 清空购物车中的已选商品
          if (this.orderItems.some(item => this.cartItems.find(cartItem => cartItem.id === item.id))) {
            this.orderItems.forEach(item => {
              this.$store.commit('cart/REMOVE_FROM_CART', item.id)
            })
          }
          
          // 根据支付方式跳转到相应页面
          if (this.selectedPayment === 'wechat') {
            // 微信支付
            await this.processWechatPay(result.data)
          } else {
            // 余额支付，直接跳转到订单详情
            uni.redirectTo({
              url: `/pages/order/detail?id=${result.data._id}`
            })
          }
        } else {
          throw new Error(result.error || '提交订单失败')
        }
      } catch (error) {
        console.error('提交订单失败:', error)
        uni.showToast({
          title: error.message || '提交失败，请重试',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    
    // 处理微信支付
    async processWechatPay(order) {
      try {
        // 这里应该调用微信支付接口
        const payResult = await uni.requestPayment({
          timeStamp: order.paymentParams.timeStamp,
          nonceStr: order.paymentParams.nonceStr,
          package: order.paymentParams.package,
          signType: order.paymentParams.signType,
          paySign: order.paymentParams.paySign
        })
        
        // 支付成功，跳转到订单详情
        uni.redirectTo({
          url: `/pages/order/detail?id=${order._id}`
        })
      } catch (error) {
        console.error('微信支付失败:', error)
        uni.showToast({
          title: '支付失败',
          icon: 'none'
        })
        
        // 跳转到订单列表
        uni.redirectTo({
          url: '/pages/order/order'
        })
      }
    }
  },
  
  // 监听页面显示，处理地址选择结果
  onShow() {
    // 处理地址选择结果
    const selectedAddress = uni.getStorageSync('selectedAddress')
    if (selectedAddress) {
      this.selectedAddress = selectedAddress
      uni.removeStorageSync('selectedAddress')
    }
    
    // 处理优惠券选择结果
    const selectedCoupon = uni.getStorageSync('selectedCoupon')
    if (selectedCoupon) {
      this.selectedCoupon = selectedCoupon
      uni.removeStorageSync('selectedCoupon')
    }
  }
}
</script>

<style lang="scss" scoped>
.order-confirm-page {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.address-section,
.goods-section,
.payment-section,
.coupon-section,
.remark-section,
.price-section {
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

.address-card,
.no-address {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-radius: 8rpx;
  background-color: #fafafa;
  
  .address-info {
    flex: 1;
    
    .address-header {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .receiver-name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-right: 20rpx;
      }
      
      .receiver-phone {
        font-size: 26rpx;
        color: #666;
      }
    }
    
    .address-detail {
      font-size: 26rpx;
      color: #666;
      line-height: 1.4;
    }
  }
  
  .no-address-text {
    font-size: 28rpx;
    color: #999;
  }
  
  .address-arrow {
    font-size: 24rpx;
    color: #ccc;
    margin-left: 20rpx;
  }
}

.goods-list {
  .goods-item {
    display: flex;
    padding: 20rpx;
    border-radius: 8rpx;
    background-color: #fafafa;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
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
        margin-bottom: 8rpx;
        line-height: 1.4;
      }
      
      .goods-desc {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 15rpx;
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

.payment-methods {
  .payment-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    border-radius: 8rpx;
    margin-bottom: 20rpx;
    background-color: #fafafa;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.active {
      background-color: #fff8f5;
      border: 2rpx solid #ff6b35;
    }
    
    .payment-icon {
      width: 48rpx;
      height: 48rpx;
      margin-right: 20rpx;
    }
    
    .payment-info {
      flex: 1;
      
      .payment-name {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .payment-desc {
        font-size: 24rpx;
        color: #666;
      }
    }
    
    .payment-radio {
      width: 36rpx;
      height: 36rpx;
      border: 2rpx solid #ddd;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.checked {
        border-color: #ff6b35;
        color: #ff6b35;
      }
    }
  }
}

.coupon-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-radius: 8rpx;
  background-color: #fafafa;
  
  .coupon-info {
    flex: 1;
    
    .coupon-name {
      display: block;
      font-size: 28rpx;
      color: #ff6b35;
      font-weight: bold;
      margin-bottom: 8rpx;
    }
    
    .coupon-desc {
      font-size: 24rpx;
      color: #666;
    }
  }
  
  .no-coupon {
    font-size: 28rpx;
    color: #999;
  }
  
  .coupon-arrow {
    font-size: 24rpx;
    color: #ccc;
    margin-left: 20rpx;
  }
}

.remark-textarea {
  border-radius: 8rpx;
  background-color: #fafafa;
}

.price-section {
  .price-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15rpx 0;
    
    .price-label {
      font-size: 28rpx;
      color: #666;
    }
    
    .price-value {
      font-size: 28rpx;
      color: #333;
      
      &.discount {
        color: #ff6b35;
      }
    }
    
    &.total {
      padding-top: 20rpx;
      border-top: 1rpx solid #f0f0f0;
      margin-top: 15rpx;
      
      .price-label {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      
      .price-value {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff6b35;
      }
    }
  }
  
  .price-divider {
    height: 1rpx;
    background-color: #f0f0f0;
    margin: 15rpx 0;
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
    flex: 1;
    
    .total-label {
      font-size: 26rpx;
      color: #666;
    }
    
    .total-price {
      font-size: 36rpx;
      color: #ff6b35;
      font-weight: bold;
    }
  }
  
  .button {
    width: 240rpx;
  }
}
</style>