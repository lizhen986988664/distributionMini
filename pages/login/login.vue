<template>
  <view class="login-page">
    <!-- 顶部装饰 -->
    <view class="top-decoration">
      <image src="/static/images/login-bg.png" mode="aspectFill" class="bg-image" />
    </view>

    <!-- 登录表单区域 -->
    <view class="login-content">
      <!-- Logo和标题 -->
      <view class="logo-section">
        <image src="/static/images/logo.png" class="logo" />
        <text class="app-title">洗衣液商城</text>
        <text class="app-subtitle">品质生活，从洗护开始</text>
      </view>

      <!-- 登录表单 -->
      <view class="login-form">
        <view class="form-item">
          <input
            v-model="phoneNumber"
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
            class="input"
          />
        </view>

        <view class="form-item">
          <view class="code-input-group">
            <input
              v-model="verificationCode"
              placeholder="请输入验证码"
              type="number"
              maxlength="6"
              class="input"
            />
            <button
              :disabled="!canSendCode || countdown > 0"
              @click="sendCode"
              class="code-btn"
              size="mini"
            >
              {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
            </button>
          </view>
        </view>

        <button
          type="primary"
          size="default"
          :loading="loginLoading"
          :disabled="!canLogin"
          @click="handleLogin"
          class="login-btn"
        >
          {{ loginLoading ? '登录中...' : '立即登录' }}
        </button>

        <!-- 微信授权登录 -->
        <view class="wechat-login">
          <view class="divider">
            <text class="divider-text">或</text>
          </view>
          <button
            type="default"
            size="default"
            open-type="getUserInfo"
            @getuserinfo="handleWechatLogin"
            class="wechat-btn"
          >
            <image src="/static/icons/wechat.png" class="wechat-icon" />
            微信快速登录
          </button>
        </view>
      </view>

      <!-- 服务协议 -->
      <view class="agreement">
        <view class="agreement-checkbox" @click="toggleAgreement">
          <view class="checkbox" :class="{ checked: agreedToTerms }">
            <text v-if="agreedToTerms">✓</text>
          </view>
          <text class="agreement-text">我已阅读并同意</text>
        </view>
        <text class="agreement-link" @click="viewUserAgreement">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @click="viewPrivacyPolicy">《隐私政策》</text>
      </view>
    </view>

    <!-- 功能介绍 -->
    <view class="features-section">
      <view class="feature-item">
        <image src="/static/icons/quality.png" class="feature-icon" />
        <text class="feature-text">正品保证</text>
      </view>
      <view class="feature-item">
        <image src="/static/icons/delivery.png" class="feature-icon" />
        <text class="feature-text">快速配送</text>
      </view>
      <view class="feature-item">
        <image src="/static/icons/service.png" class="feature-icon" />
        <text class="feature-text">贴心服务</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex'
import { validatePhone } from '@/utils/index'

export default {
  data() {
    return {
      phoneNumber: '',
      verificationCode: '',
      loginLoading: false,
      countdown: 0,
      agreedToTerms: false,
      loginType: 'phone' // phone | wechat
    }
  },
  
  computed: {
    // 是否可以发送验证码
    canSendCode() {
      return validatePhone(this.phoneNumber)
    },
    
    // 是否可以登录
    canLogin() {
      return (
        validatePhone(this.phoneNumber) &&
        this.verificationCode.length === 6 &&
        this.agreedToTerms &&
        !this.loginLoading
      )
    }
  },
  
  onLoad(options) {
    // 检查是否从其他页面跳转过来需要登录
    if (options.redirect) {
      uni.setStorageSync('loginRedirect', options.redirect)
    }
  },
  
  methods: {
    ...mapActions({
      wxLogin: 'user/wxLogin'
    }),
    
    // 发送验证码
    async sendCode() {
      if (!this.canSendCode) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        })
        return
      }
      
      try {
        // 调用云函数发送验证码
        const result = await uniCloud.callFunction({
          name: 'sms',
          data: {
            action: 'sendCode',
            phoneNumber: this.phoneNumber
          }
        })
        
        if (result.result.code === 0) {
          // 开始倒计时
          this.startCountdown()
          
          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          })
        } else {
          throw new Error(result.result.message || '发送失败')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        uni.showToast({
          title: error.message || '发送失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 开始倒计时
    startCountdown() {
      this.countdown = 60
      const timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    },
    
    // 手机号登录
    async handleLogin() {
      if (!this.canLogin) return
      
      this.loginLoading = true
      
      try {
        // 调用云函数验证验证码并登录
        const result = await uniCloud.callFunction({
          name: 'user',
          data: {
            action: 'phoneLogin',
            phoneNumber: this.phoneNumber,
            verificationCode: this.verificationCode
          }
        })
        
        if (result.result.code === 0) {
          const { token, userInfo } = result.result.data
          
          // 保存认证信息
          await this.$store.dispatch('user/updateUserInfo', userInfo)
          this.$store.commit('user/SET_TOKEN', token)
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转到目标页面
          this.redirectToTarget()
        } else {
          throw new Error(result.result.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.loginLoading = false
      }
    },
    
    // 微信登录
    async handleWechatLogin(e) {
      if (!this.agreedToTerms) {
        uni.showToast({
          title: '请先同意用户协议',
          icon: 'none'
        })
        return
      }
      
      if (e.detail.userInfo) {
        this.loginLoading = true
        
        try {
          const result = await this.wxLogin()
          
          if (result.success) {
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            })
            
            // 跳转到目标页面
            this.redirectToTarget()
          } else {
            throw new Error(result.error || '登录失败')
          }
        } catch (error) {
          console.error('微信登录失败:', error)
          uni.showToast({
            title: error.message || '登录失败',
            icon: 'none'
          })
        } finally {
          this.loginLoading = false
        }
      } else {
        uni.showToast({
          title: '需要授权才能登录',
          icon: 'none'
        })
      }
    },
    
    // 跳转到目标页面
    redirectToTarget() {
      const redirectUrl = uni.getStorageSync('loginRedirect')
      
      if (redirectUrl) {
        // 清除重定向URL
        uni.removeStorageSync('loginRedirect')
        
        // 跳转到目标页面
        if (redirectUrl.startsWith('/pages/tabbar/')) {
          uni.switchTab({ url: redirectUrl })
        } else {
          uni.redirectTo({ url: redirectUrl })
        }
      } else {
        // 默认跳转到首页
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    },
    
    // 切换协议同意状态
    toggleAgreement() {
      this.agreedToTerms = !this.agreedToTerms
    },
    
    // 查看用户协议
    viewUserAgreement() {
      uni.navigateTo({
        url: '/pages/webview/webview?title=用户协议&url=https://example.com/user-agreement'
      })
    },
    
    // 查看隐私政策
    viewPrivacyPolicy() {
      uni.navigateTo({
        url: '/pages/webview/webview?title=隐私政策&url=https://example.com/privacy-policy'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  position: relative;
}

.top-decoration {
  position: relative;
  height: 400rpx;
  overflow: hidden;
  
  .bg-image {
    width: 100%;
    height: 100%;
  }
}

.login-content {
  position: relative;
  margin-top: -60rpx;
  background-color: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 60rpx 40rpx 40rpx;
  min-height: calc(100vh - 340rpx);
}

.logo-section {
  text-align: center;
  margin-bottom: 60rpx;
  
  .logo {
    width: 120rpx;
    height: 120rpx;
    border-radius: 24rpx;
    margin-bottom: 20rpx;
  }
  
  .app-title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .app-subtitle {
    font-size: 26rpx;
    color: #999;
  }
}

.login-form {
  .form-item {
    margin-bottom: 30rpx;
    
    .code-input-group {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      .code-btn {
        flex-shrink: 0;
        width: 200rpx;
      }
    }
  }
  
  .login-btn {
    width: 100%;
    margin: 40rpx 0 30rpx;
  }
  
  .wechat-login {
    .divider {
      position: relative;
      text-align: center;
      margin: 30rpx 0;
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1rpx;
        background-color: #e8e8e8;
      }
      
      .divider-text {
        position: relative;
        background-color: #fff;
        padding: 0 20rpx;
        color: #999;
        font-size: 24rpx;
      }
    }
    
    .wechat-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #09bb07;
      color: #fff;
      border: none;
      
      &:active {
        opacity: 0.8;
      }
      
      .wechat-icon {
        width: 32rpx;
        height: 32rpx;
        margin-right: 15rpx;
      }
    }
  }
}

.agreement {
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 24rpx;
  color: #666;
  
  .agreement-checkbox {
    display: flex;
    align-items: center;
    margin-right: 10rpx;
    
    .checkbox {
      width: 32rpx;
      height: 32rpx;
      border: 2rpx solid #ddd;
      border-radius: 6rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10rpx;
      
      &.checked {
        background-color: #ff6b35;
        border-color: #ff6b35;
        color: #fff;
        font-size: 20rpx;
      }
    }
    
    .agreement-text {
      color: #666;
    }
  }
  
  .agreement-link {
    color: #ff6b35;
    margin: 0 8rpx;
  }
}

.features-section {
  margin-top: 60rpx;
  display: flex;
  justify-content: space-around;
  padding: 0 40rpx;
  
  .feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .feature-icon {
      width: 64rpx;
      height: 64rpx;
      margin-bottom: 15rpx;
    }
    
    .feature-text {
      font-size: 24rpx;
      color: #666;
    }
  }
}
</style>