<template>
  <view id="app">
    <!-- uni-app 应用入口 -->
  </view>
</template>

<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查登录状态
    this.checkLogin()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    async checkLogin() {
      const token = uni.getStorageSync('token')
      if (token) {
        try {
          // 验证token有效性
          const res = await this.$store.dispatch('user/getUserInfo')
          if (!res) {
            // token失效，清除登录信息
            this.$store.commit('user/LOGOUT')
          }
        } catch (error) {
          console.error('Token验证失败:', error)
          this.$store.commit('user/LOGOUT')
        }
      }
    }
  }
}
</script>

<style lang="scss">
/* 引入全局样式 */
@import "@/static/styles/index.scss";

/* 项目通用样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.container {
  padding: 20rpx;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-center {
  text-align: center;
}

.text-primary {
  color: #ff6b35;
}

.text-success {
  color: #52c41a;
}

.text-warning {
  color: #faad14;
}

.text-danger {
  color: #f5222d;
}

.text-muted {
  color: #999;
}

.bg-primary {
  background-color: #ff6b35;
}

.bg-success {
  background-color: #52c41a;
}

.bg-warning {
  background-color: #faad14;
}

.bg-danger {
  background-color: #f5222d;
}

.mt-10 {
  margin-top: 10rpx;
}

.mt-20 {
  margin-top: 20rpx;
}

.mb-10 {
  margin-bottom: 10rpx;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.ml-10 {
  margin-left: 10rpx;
}

.mr-10 {
  margin-right: 10rpx;
}

.p-10 {
  padding: 10rpx;
}

.p-20 {
  padding: 20rpx;
}

.border-radius {
  border-radius: 8rpx;
}

.shadow {
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
</style>