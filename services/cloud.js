/**
 * 云服务封装
 * 统一处理云函数调用和错误处理
 */

// 云函数基础配置
const CLOUD_CONFIG = {
  timeout: 10000,
  retryCount: 2
}

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {Object} data 传递给云函数的数据
 * @param {Object} options 配置选项
 * @returns {Promise} 调用结果
 */
export async function callCloudFunction(name, data = {}, options = {}) {
  const config = { ...CLOUD_CONFIG, ...options }
  
  try {
    // 显示loading
    if (config.showLoading) {
      uni.showLoading({
        title: config.loadingText || '加载中...',
        mask: true
      })
    }
    
    // 调用云函数
    const result = await uniCloud.callFunction({
      name,
      data,
      timeout: config.timeout
    })
    
    // 处理结果
    if (result.result) {
      const { code, message, data: responseData } = result.result
      
      if (code === 0) {
        return {
          success: true,
          data: responseData,
          message: message || 'success'
        }
      } else {
        // 业务错误
        throw new Error(message || '操作失败')
      }
    } else {
      throw new Error('云函数调用失败')
    }
  } catch (error) {
    console.error(`云函数调用失败 [${name}]:`, error)
    
    // 显示错误提示
    if (config.showError !== false) {
      uni.showToast({
        title: error.message || '网络错误，请重试',
        icon: 'none',
        duration: 3000
      })
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }
  } finally {
    // 隐藏loading
    if (config.showLoading) {
      uni.hideLoading()
    }
  }
}

/**
 * 带重试的云函数调用
 * @param {string} name 云函数名称
 * @param {Object} data 传递给云函数的数据
 * @param {number} retryCount 重试次数
 * @returns {Promise} 调用结果
 */
export async function callWithRetry(name, data = {}, retryCount = CLOUD_CONFIG.retryCount) {
  let lastError
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      const result = await callCloudFunction(name, data, {
        showLoading: i === 0, // 只在第一次调用时显示loading
        showError: i === retryCount // 只在最后一次调用时显示错误
      })
      
      if (result.success) {
        return result
      }
      
      lastError = result.error
    } catch (error) {
      lastError = error.message
    }
    
    // 如果不是最后一次重试，等待一段时间
    if (i < retryCount) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  return {
    success: false,
    error: lastError || '重试失败'
  }
}

/**
 * 上传文件到云存储
 * @param {string} filePath 本地文件路径
 * @param {Object} options 配置选项
 * @returns {Promise} 上传结果
 */
export async function uploadFile(filePath, options = {}) {
  try {
    const { cloudPath } = options
    
    if (!cloudPath) {
      throw new Error('cloudPath 不能为空')
    }
    
    uni.showLoading({
      title: '上传中...',
      mask: true
    })
    
    const result = await uniCloud.uploadFile({
      filePath,
      cloudPath,
      onUploadProgress: options.onProgress
    })
    
    uni.hideLoading()
    
    return {
      success: true,
      fileID: result.fileID,
      tempFileURL: result.tempFileURL
    }
  } catch (error) {
    uni.hideLoading()
    console.error('文件上传失败:', error)
    
    uni.showToast({
      title: '上传失败',
      icon: 'none'
    })
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取云存储文件临时链接
 * @param {Array} fileIDs 文件ID列表
 * @returns {Promise} 临时链接列表
 */
export async function getTempFileURL(fileIDs) {
  try {
    const result = await uniCloud.getTempFileURL({
      fileList: fileIDs.map(fileID => ({ fileID }))
    })
    
    return {
      success: true,
      fileList: result.fileList
    }
  } catch (error) {
    console.error('获取临时链接失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 删除云存储文件
 * @param {Array} fileIDs 文件ID列表
 * @returns {Promise} 删除结果
 */
export async function deleteFile(fileIDs) {
  try {
    const result = await uniCloud.deleteFile({
      fileList: fileIDs
    })
    
    return {
      success: true,
      fileList: result.fileList
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 导出常用的云函数调用方法
export const cloudApi = {
  // 用户相关
  user: {
    login: (data) => callCloudFunction('user', { action: 'wxLogin', ...data }),
    getUserInfo: () => callCloudFunction('user', { action: 'getUserInfo' }),
    updateUserInfo: (userInfo) => callCloudFunction('user', { action: 'updateUserInfo', userInfo })
  },
  
  // 商品相关
  product: {
    getList: (params) => callCloudFunction('product', { action: 'getList', ...params }),
    getDetail: (id) => callCloudFunction('product', { action: 'getDetail', id }),
    search: (keyword) => callCloudFunction('product', { action: 'search', keyword })
  },
  
  // 订单相关
  order: {
    create: (orderData) => callCloudFunction('order', { action: 'create', ...orderData }),
    getList: (params) => callCloudFunction('order', { action: 'getList', ...params }),
    getDetail: (id) => callCloudFunction('order', { action: 'getDetail', id }),
    cancel: (id) => callCloudFunction('order', { action: 'cancel', id })
  },
  
  // 海星卡相关
  starCard: {
    create: (cardData) => callCloudFunction('starCard', { action: 'createCard', ...cardData }),
    getList: () => callCloudFunction('starCard', { action: 'getMyCards' }),
    share: (cardId) => callCloudFunction('starCard', { action: 'shareCard', cardId }),
    receive: (data) => callCloudFunction('starCard', { action: 'receiveCard', ...data }),
    getStats: () => callCloudFunction('starCard', { action: 'getStats' })
  },
  
  // 配置相关
  config: {
    get: () => callCloudFunction('config', { action: 'getConfig' })
  }
}

export default {
  callCloudFunction,
  callWithRetry,
  uploadFile,
  getTempFileURL,
  deleteFile,
  cloudApi
}