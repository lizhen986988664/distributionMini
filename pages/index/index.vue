<template>
  <view class="home-page">
    <!-- 顶部轮播图 -->
    <swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000">
      <swiper-item v-for="(banner, index) in banners" :key="index">
        <image :src="banner.image" mode="aspectFill" class="banner-image" @click="onBannerClick(banner)" />
      </swiper-item>
    </swiper>

    <!-- 功能入口 -->
    <view class="feature-grid">
      <view class="feature-item" @click="navigateTo('/pages/trial/trial')">
        <image src="/static/icons/trial.png" class="feature-icon" />
        <text class="feature-text">免费试用</text>
      </view>
      <view class="feature-item" @click="navigateTo('/pages/stored-value/stored-value')">
        <image src="/static/icons/stored-value.png" class="feature-icon" />
        <text class="feature-text">储值卡</text>
      </view>
      <view class="feature-item" @click="navigateTo('/pages/star-card/star-card')">
        <image src="/static/icons/star.png" class="feature-icon" />
        <text class="feature-text">海星卡</text>
      </view>
      <view class="feature-item" @click="navigateTo('/pages/coupon/coupon')">
        <image src="/static/icons/coupon.png" class="feature-icon" />
        <text class="feature-text">优惠券</text>
      </view>
    </view>

    <!-- 促销活动 -->
    <view class="promotion-section" v-if="promotions.length > 0">
      <view class="section-title">
        <text class="title-text">热门活动</text>
        <text class="more-text" @click="viewMorePromotions">更多 ></text>
      </view>
      <scroll-view scroll-x class="promotion-scroll">
        <view class="promotion-list">
          <view class="promotion-item" v-for="promo in promotions" :key="promo.id" @click="onPromotionClick(promo)">
            <image :src="promo.image" mode="aspectFill" class="promotion-image" />
            <view class="promotion-info">
              <text class="promotion-title">{{ promo.title }}</text>
              <text class="promotion-desc">{{ promo.description }}</text>
              <text class="promotion-price">¥{{ promo.price }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 商品列表 -->
    <view class="product-section">
      <view class="section-title">
        <text class="title-text">热门商品</text>
        <text class="more-text" @click="viewAllProducts">全部商品 ></text>
      </view>
      
      <!-- 分类标签 -->
      <scroll-view scroll-x class="category-scroll">
        <view class="category-list">
          <view 
            class="category-item" 
            :class="{ active: currentCategory === category.id }"
            v-for="category in categories" 
            :key="category.id"
            @click="switchCategory(category.id)"
          >
            {{ category.name }}
          </view>
        </view>
      </scroll-view>

      <!-- 商品网格 -->
      <view class="product-grid" v-if="products.length > 0">
        <view class="product-item" v-for="product in products" :key="product.id" @click="viewProductDetail(product)">
          <image :src="product.image" mode="aspectFill" class="product-image" />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-desc">{{ product.description }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ product.price }}</text>
              <text class="product-unit">/斤</text>
            </view>
            <button size="mini" type="primary" @click.stop="addToCart(product)">加入购物车</button>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <image src="/static/images/empty-product.png" class="empty-image" />
        <text class="empty-text">暂无商品</text>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <view class="loading">加载中...</view>
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
      // 轮播图
      banners: [
        {
          id: 1,
          image: '/static/banners/banner1.jpg',
          link: '/pages/trial/trial',
          title: '新人专享免费试用'
        },
        {
          id: 2,
          image: '/static/banners/banner2.jpg',
          link: '/pages/star-card/star-card',
          title: '海星分享卡活动'
        }
      ],
      
      // 功能图标配置
      features: [
        { name: '免费试用', icon: '/static/icons/trial.png', path: '/pages/trial/trial' },
        { name: '储值卡', icon: '/static/icons/stored-value.png', path: '/pages/stored-value/stored-value' },
        { name: '海星卡', icon: '/static/icons/star.png', path: '/pages/star-card/star-card' },
        { name: '优惠券', icon: '/static/icons/coupon.png', path: '/pages/coupon/coupon' }
      ],
      
      // 分类
      categories: [
        { id: 'all', name: '全部' },
        { id: 'liquid', name: '洗衣液' },
        { id: 'detergent', name: '洗衣粉' },
        { id: 'softener', name: '柔顺剂' }
      ],
      currentCategory: 'all',
      
      // 商品数据
      products: [],
      promotions: [],
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 10
    }
  },
  
  computed: {
    ...mapGetters({
      cartTotalCount: 'cart/cartTotalCount',
      isLogin: 'user/isLogin'
    })
  },
  
  onLoad() {
    this.initPage()
  },
  
  onPullDownRefresh() {
    this.refreshData()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  methods: {
    ...mapActions({
      addToCartAction: 'cart/addToCart'
    }),
    
    // 初始化页面
    async initPage() {
      this.loading = true
      
      try {
        // 并行加载数据
        await Promise.all([
          this.loadProducts(),
          this.loadPromotions()
        ])
      } catch (error) {
        console.error('页面初始化失败:', error)
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },
    
    // 刷新数据
    async refreshData() {
      this.page = 1
      this.hasMore = true
      await this.initPage()
    },
    
    // 加载商品
    async loadProducts() {
      try {
        const result = await cloudApi.product.getList({
          category: this.currentCategory === 'all' ? undefined : this.currentCategory,
          page: this.page,
          pageSize: this.pageSize
        })
        
        if (result.success) {
          if (this.page === 1) {
            this.products = result.data.list
          } else {
            this.products.push(...result.data.list)
          }
          
          this.hasMore = result.data.hasMore
        }
      } catch (error) {
        console.error('加载商品失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },
    
    // 加载促销活动
    async loadPromotions() {
      try {
        const result = await cloudApi.product.getList({
          isPromotion: true,
          pageSize: 5
        })
        
        if (result.success) {
          this.promotions = result.data.list
        }
      } catch (error) {
        console.error('加载促销活动失败:', error)
      }
    },
    
    // 加载更多
    async loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      await this.loadProducts()
    },
    
    // 切换分类
    switchCategory(categoryId) {
      if (this.currentCategory === categoryId) return
      
      this.currentCategory = categoryId
      this.page = 1
      this.hasMore = true
      this.products = []
      this.loadProducts()
    },
    
    // 轮播图点击
    onBannerClick(banner) {
      if (banner.link) {
        this.navigateTo(banner.link)
      }
    },
    
    // 促销活动点击
    onPromotionClick(promo) {
      this.viewProductDetail(promo)
    },
    
    // 查看商品详情
    viewProductDetail(product) {
      uni.navigateTo({
        url: `/pages/product/detail?id=${product.id}`
      })
    },
    
    // 添加到购物车
    async addToCart(product) {
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
      await this.addToCartAction(product)
    },
    
    // 页面导航
    navigateTo(url) {
      uni.navigateTo({ url })
    },
    
    // 查看更多促销
    viewMorePromotions() {
      uni.navigateTo({
        url: '/pages/promotion/promotion'
      })
    },
    
    // 查看全部商品
    viewAllProducts() {
      uni.navigateTo({
        url: '/pages/product/list'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.banner-swiper {
  width: 100%;
  height: 350rpx;
  
  .banner-image {
    width: 100%;
    height: 100%;
  }
}

.feature-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 30rpx 20rpx;
  background-color: #fff;
  
  .feature-item {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20rpx;
    
    .feature-icon {
      width: 80rpx;
      height: 80rpx;
      margin-bottom: 10rpx;
    }
    
    .feature-text {
      font-size: 24rpx;
      color: #333;
    }
  }
}

.promotion-section {
  margin-top: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  
  .promotion-scroll {
    white-space: nowrap;
  }
  
  .promotion-list {
    display: inline-flex;
    padding: 10rpx 0;
    
    .promotion-item {
      width: 280rpx;
      margin-right: 20rpx;
      border-radius: 8rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
      
      .promotion-image {
        width: 100%;
        height: 140rpx;
      }
      
      .promotion-info {
        padding: 15rpx;
        background-color: #fff;
        
        .promotion-title {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .promotion-desc {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 10rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .promotion-price {
          font-size: 32rpx;
          color: #ff6b35;
          font-weight: bold;
        }
      }
    }
  }
}

.product-section {
  margin-top: 20rpx;
  background-color: #fff;
  padding: 20rpx;
  
  .category-scroll {
    white-space: nowrap;
    margin: 20rpx 0;
  }
  
  .category-list {
    display: inline-flex;
    
    .category-item {
      padding: 12rpx 24rpx;
      margin-right: 20rpx;
      border-radius: 30rpx;
      background-color: #f5f5f5;
      font-size: 28rpx;
      color: #666;
      white-space: nowrap;
      
      &.active {
        background-color: #ff6b35;
        color: #fff;
      }
    }
  }
  
  .product-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    
    .product-item {
      width: 340rpx;
      margin-bottom: 20rpx;
      background-color: #fff;
      border-radius: 8rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
      
      .product-image {
        width: 100%;
        height: 240rpx;
      }
      
      .product-info {
        padding: 15rpx;
        
        .product-name {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .product-desc {
          display: block;
          font-size: 24rpx;
          color: #666;
          margin-bottom: 10rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .product-price-row {
          display: flex;
          align-items: baseline;
          margin-bottom: 12rpx;
          
          .product-price {
            font-size: 32rpx;
            color: #ff6b35;
            font-weight: bold;
          }
          
          .product-unit {
            font-size: 24rpx;
            color: #999;
            margin-left: 4rpx;
          }
        }
      }
    }
  }
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .title-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .more-text {
    font-size: 28rpx;
    color: #666;
  }
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.loading-state {
  text-align: center;
  padding: 50rpx 0;
}
</style>