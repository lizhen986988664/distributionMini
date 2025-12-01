const db = uniCloud.database()
const collection = db.collection('system_config')

exports.main = async (event, context) => {
  const { action, ...params } = event

  try {
    switch (action) {
      case 'getConfig':
        return await getConfig()
      
      case 'updateConfig':
        return await updateConfig(params)
      
      case 'getPriceConfig':
        return await getPriceConfig()
      
      case 'updatePriceConfig':
        return await updatePriceConfig(params)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('配置服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 获取系统配置
 */
async function getConfig() {
  try {
    const result = await collection.get()
    
    if (result.data.length === 0) {
      // 初始化默认配置
      const defaultConfig = {
        pricePerJin: 1.00, // 每斤价格
        freeTrialLimit: 1, // 免费试用限制
        starCardRewardRate: 0.1, // 海星卡奖励比例
        minOrderAmount: 9.9, // 最低起送金额
        freeShippingAmount: 99.0, // 包邮金额
        shippingFee: 10.0, // 运费
        systemName: '洗衣液商城',
        systemLogo: '/static/images/logo.png',
        contactPhone: '400-123-4567',
        contactEmail: 'service@example.com',
        companyAddress: '广东省深圳市南山区科技园',
        businessLicense: '4403001234567890',
        icpNumber: '粤ICP备12345678号',
        createTime: new Date(),
        updateTime: new Date()
      }
      
      await collection.add(defaultConfig)
      return {
        code: 0,
        message: '获取成功',
        data: defaultConfig
      }
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: result.data[0]
    }
  } catch (error) {
    console.error('获取配置失败:', error)
    return {
      code: -1,
      message: '获取配置失败'
    }
  }
}

/**
 * 更新系统配置
 */
async function updateConfig(params) {
  try {
    // 获取现有配置
    const existingConfig = await collection.get()
    
    if (existingConfig.data.length === 0) {
      return {
        code: -1,
        message: '配置不存在'
      }
    }
    
    const configId = existingConfig.data[0]._id
    
    // 更新配置
    const updateData = {
      ...params,
      updateTime: new Date()
    }
    
    await collection.doc(configId).update(updateData)
    
    // 获取更新后的配置
    const updatedResult = await collection.doc(configId).get()
    
    return {
      code: 0,
      message: '更新成功',
      data: updatedResult.data[0]
    }
  } catch (error) {
    console.error('更新配置失败:', error)
    return {
      code: -1,
      message: '更新配置失败'
    }
  }
}

/**
 * 获取价格配置
 */
async function getPriceConfig() {
  try {
    const result = await collection.get()
    
    if (result.data.length === 0) {
      return {
        code: -1,
        message: '价格配置不存在'
      }
    }
    
    const config = result.data[0]
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        pricePerJin: config.pricePerJin || 1.00,
        freeTrialLimit: config.freeTrialLimit || 1,
        starCardRewardRate: config.starCardRewardRate || 0.1,
        minOrderAmount: config.minOrderAmount || 9.9,
        freeShippingAmount: config.freeShippingAmount || 99.0,
        shippingFee: config.shippingFee || 10.0
      }
    }
  } catch (error) {
    console.error('获取价格配置失败:', error)
    return {
      code: -1,
      message: '获取价格配置失败'
    }
  }
}

/**
 * 更新价格配置
 */
async function updatePriceConfig(params) {
  try {
    // 验证参数
    const {
      pricePerJin,
      freeTrialLimit,
      starCardRewardRate,
      minOrderAmount,
      freeShippingAmount,
      shippingFee
    } = params
    
    if (pricePerJin !== undefined && (isNaN(pricePerJin) || pricePerJin <= 0)) {
      return {
        code: -1,
        message: '每斤价格必须大于0'
      }
    }
    
    if (freeTrialLimit !== undefined && (isNaN(freeTrialLimit) || freeTrialLimit < 0)) {
      return {
        code: -1,
        message: '免费试用限制不能小于0'
      }
    }
    
    if (starCardRewardRate !== undefined && (isNaN(starCardRewardRate) || starCardRewardRate < 0 || starCardRewardRate > 1)) {
      return {
        code: -1,
        message: '海星卡奖励比例必须在0-1之间'
      }
    }
    
    // 获取现有配置
    const existingConfig = await collection.get()
    
    if (existingConfig.data.length === 0) {
      return {
        code: -1,
        message: '配置不存在'
      }
    }
    
    const configId = existingConfig.data[0]._id
    
    // 构建更新数据
    const updateData = {}
    
    if (pricePerJin !== undefined) updateData.pricePerJin = parseFloat(pricePerJin)
    if (freeTrialLimit !== undefined) updateData.freeTrialLimit = parseInt(freeTrialLimit)
    if (starCardRewardRate !== undefined) updateData.starCardRewardRate = parseFloat(starCardRewardRate)
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount)
    if (freeShippingAmount !== undefined) updateData.freeShippingAmount = parseFloat(freeShippingAmount)
    if (shippingFee !== undefined) updateData.shippingFee = parseFloat(shippingFee)
    
    updateData.updateTime = new Date()
    
    await collection.doc(configId).update(updateData)
    
    return {
      code: 0,
      message: '价格配置更新成功'
    }
  } catch (error) {
    console.error('更新价格配置失败:', error)
    return {
      code: -1,
      message: '更新价格配置失败'
    }
  }
}