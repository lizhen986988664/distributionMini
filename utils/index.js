/**
 * 格式化日期
 * @param {Date|string|number} date 日期
 * @param {string} format 格式
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化价格
 * @param {number} price 价格
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的价格
 */
export function formatPrice(price, decimals = 2) {
  if (typeof price !== 'number') {
    price = parseFloat(price) || 0
  }
  return '¥' + price.toFixed(decimals)
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深拷贝
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string} 扩展名
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 检查是否为空值
 * @param {any} value 值
 * @returns {boolean} 是否为空
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 手机号掩码
 * @param {string} phone 手机号
 * @returns {string} 掩码后的手机号
 */
export function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 获取小程序码
 * @param {string} path 页面路径
 * @param {Object} query 查询参数
 * @returns {Promise} 小程序码
 */
export function getQRCode(path, query = {}) {
  return new Promise((resolve, reject) => {
    uniCloud.callFunction({
      name: 'qrcode',
      data: {
        action: 'get',
        path,
        query
      }
    }).then(res => {
      if (res.result.code === 0) {
        resolve(res.result.data)
      } else {
        reject(new Error(res.result.message || '获取小程序码失败'))
      }
    }).catch(reject)
  })
}

/**
 * 分享到微信
 * @param {Object} options 分享选项
 */
export function shareToWechat(options = {}) {
  return {
    title: options.title || '洗衣液商城',
    path: options.path || '/pages/index/index',
    imageUrl: options.imageUrl || '/static/images/share-default.jpg'
  }
}

/**
 * 计算两个日期之间的天数
 * @param {Date|string} startDate 开始日期
 * @param {Date|string} endDate 结束日期
 * @returns {number} 天数
 */
export function getDaysBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const timeDiff = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * 数组去重
 * @param {Array} array 数组
 * @param {string} key 去重依据的键名
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(array, key) {
  if (!key) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}