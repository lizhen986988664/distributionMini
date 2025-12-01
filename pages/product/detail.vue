<template>
  <view class="product-detail">
    <!-- 商品图片轮播 -->
    <swiper class="product-swiper" :indicator-dots="true" :autoplay="false" v-if="product.images">
      <swiper-item v-for="(image, index) in product.images" :key="index">
        <image :src="image" mode="aspectFit" class="product-image" @click="previewImage(index)" />
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text class="unit">/斤</text>
        <view class="tag" v-if="product.isPromotion">特价</view>
      </view>
      
      <text class="product-name">{{ product.name }}</text>
      <text class="product-desc">{{ product.description }}</text>
      
      <!-- 商品属性 -->
      <view class="product-attrs" v-if="product.attributes">
        <view class="attr-item" v-for="(value, key) in product.attributes" :key="key">
          <text class="attr-key">{{ key }}:</text>
          <text class="attr-value">{{ value }}</text>
        </view>
      </view>
    </view>

    <!-- 购买数量 -->
    <view class="quantity-section">
      <text class="section-title">购买数量</text>
      <view class="quantity-control">
        <button size="mini" @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
        <text class="quantity">{{ quantity }}</text>
        <button size="mini" @click="increaseQuantity">+</button>
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <text class="section-title">商品详情</text>
      <view class="detail-content">
        <rich-text :nodes="product.detailHtml" v-if="product.detailHtml"></rich-text>
        <text v-else class="no-detail">暂无详细描述</text>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="review-section">
      <view class="section-header">
        <text class="section-title">用户评价</text>
        <text class="review-count">({{ reviews.length }})</text>
      </view>
      
      <view class="review-list" v-if="reviews.length > 0">
        <view class="review-item" v-for="review in reviews" :key="review.id">
          <view class="review-user">
            <image :src="review.userAvatar" class="user-avatar" />
            <text class="user-name">{{ review.userName }}</text>
            <view class="rating">
              <text class="star" v-for="n in 5" :key="n" :class="{ active: n <= review.rating }">★</text>
            </view>
          </view>
          <text class="review-content">{{ review.content }}</text>
          <text class="review-time">{{ review.createTime }}</text>
        </view>
      </view>
      
      <view class="no-review" v-else>
        <text>暂无评价</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="left-actions">
        <view class="action-item" @click="addToCart">
          <image src="/static/icons/cart.png" class="action-icon" />
          <text class="action-text">购物车</text>
          <view class="cart-badge" v-if="cartTotalCount > 0">{{ cartTotalCount }}</view>
        </view>
        <view class="action-item" @click="contactService">
          <image src="/static/icons/service.png" class="action-icon" />
          <text class="action-text">客服</text>
        </view>
      </view>
      <view class="right-actions">
        <button type="default" @click="buyNow" class="buy-btn">立即购买</button>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { cloudApi } from '@/services/cloud'

export default {
  data() {
    return {
      productId: '',
      product: {},
      quantity: 1,
      reviews: [],
      loading: true
    }
  },
  
  computed: {
    ...mapGetters({
      cartTotalCount: 'cart/cartTotalCount',
      isLogin: 'user/isLogin'
    })
  },
  
  onLoad(options) {
    this.productId = options.id
    if (this.productId) {
      this.loadProductDetail()
      this.loadReviews()
    }
  },
  
  onShareAppMessage() {
    return {
      title: this.product.name,
      path: `/pages/product/detail?id=${this.productId}`,
      imageUrl: this.product.image
    }
  },
  
  methods: {
    ...mapActions({
      addToCartAction: 'cart/addToCart'
    }),
    
    // 加载商品详情
    async loadProductDetail() {
      try {
        this.loading = true
        const result = await cloudApi.product.getDetail(this.productId)
        
        if (result.success) {
          this.product = result.data
          // 设置导航栏标题
          uni.setNavigationBarTitle({
            title: this.product.name
          })
        } else {
          throw new Error(result.error || '加载失败')
        }
      } catch (error) {
        console.error('加载商品详情失败:', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载评价
    async loadReviews() {
      try {
        // 这里应该调用评价接口，暂时使用模拟数据
        this.reviews = [
          {
            id: 1,
            userName: '张三',
            userAvatar: '/static/avatars/default.png',
            rating: 5,
            content: '产品质量很好，洗衣服很干净！',
            createTime: '2024-01-15'
          },
          {
            id: 2,
            userName: '李四',
            userAvatar: '/static/avatars/default.png',
            rating: 4,
            content: '价格实惠，效果不错',
            createTime: '2024-01-14'
          }
        ]
      } catch (error) {
        console.error('加载评价失败:', error)
      }
    },
    
    // 预览图片
    previewImage(current) {
      if (!this.product.images) return
      
      uni.previewImage({
        current,
        urls: this.product.images
      })
    },
    
    // 增加数量
    increaseQuantity() {
      this.quantity++
    },
    
    // 减少数量
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    
    // 添加到购物车
    async addToCart() {
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
      
      // 添加到购物车
      await this.addToCartAction({
        ...this.product,
        quantity: this.quantity
      })
    },
    
    // 立即购买
    async buyNow() {
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
      
      // 直接跳转到订单确认页面
      uni.navigateTo({
        url: `/pages/order/confirm?productId=${this.productId}&quantity=${this.quantity}`
      })
    },
    
    // 联系客服
    contactService() {
      uni.makePhoneCall({
        phoneNumber: '400-123-4567'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.product-detail {
  padding-bottom: 120rpx;
  background-color: #f8f8f8;
}

.product-swiper {
  width: 100%;
  height: 750rpx;
  background-color: #fff;
  
  .product-image {
    width: 100%;
    height: 100%;
  }
}

.product-info {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  
  .price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 20rpx;
    
    .price {
      font-size: 48rpx;
      color: #ff6b35;
      font-weight: bold;
    }
    
    .unit {
      font-size: 28rpx;
      color: #999;
      margin-left: 8rpx;
    }
    
    .tag {
      margin-left: 20rpx;
      padding: 4rpx 12rpx;
      background-color: #ff6b35;
      color: #fff;
      font-size: 24rpx;
      border-radius: 4rpx;
    }
  }
  
  .product-name {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 15rpx;
    line-height: 1.4;
  }
  
  .product-desc {
    display: block;
    font-size: 28rpx;
    color: #666;
    line-height: 1.5;
    margin-bottom: 20rpx;
  }
  
  .product-attrs {
    .attr-item {
      display: flex;
      margin-bottom: 10rpx;
      
      .attr-key {
        font-size: 28rpx;
        color: #666;
        margin-right: 10rpx;
      }
      
      .attr-value {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

.quantity-section {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .quantity-control {
    display: flex;
    align-items: center;
    
    .quantity {
      margin: 0 30rpx;
      font-size: 32rpx;
      font-weight: bold;
      min-width: 60rpx;
      text-align: center;
    }
  }
}

.detail-section {
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  
  .detail-content {
    margin-top: 20rpx;
    line-height: 1.6;
    
    .no-detail {
      color: #999;
      font-size: 28rpx;
    }
  }
}

.review-section {
  padding: 30rpx;
  background-color: #fff;
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .review-count {
      font-size: 28rpx;
      color: #999;
      margin-left: 10rpx;
    }
  }
  
  .review-list {
    .review-item {
      margin-bottom: 30rpx;
      padding-bottom: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .review-user {
        display: flex;
        align-items: center;
        margin-bottom: 15rpx;
        
        .user-avatar {
          width: 60rpx;
          height: 60rpx;
          border-radius: 50%;
          margin-right: 15rpx;
        }
        
        .user-name {
          flex: 1;
          font-size: 28rpx;
          color: #333;
        }
        
        .rating {
          .star {
            color: #ddd;
            font-size: 24rpx;
            
            &.active {
              color: #ff6b35;
            }
          }
        }
      }
      
      .review-content {
        display: block;
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
        margin-bottom: 10rpx;
      }
      
      .review-time {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .no-review {
    text-align: center;
    padding: 50rpx 0;
    color: #999;
    font-size: 28rpx;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
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
  padding: 0 30rpx;
  z-index: 100;
  
  .left-actions {
    display: flex;
    flex: 1;
    
    .action-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 40rpx;
      
      .action-icon {
        width: 48rpx;
        height: 48rpx;
        margin-bottom: 6rpx;
      }
      
      .action-text {
        font-size: 24rpx;
        color: #666;
      }
      
      .cart-badge {
        position: absolute;
        top: -8rpx;
        right: -12rpx;
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
  
  .right-actions {
    .buy-btn {
      width: 240rpx;
    }
  }
}
</style>