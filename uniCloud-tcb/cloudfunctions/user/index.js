const db = uniCloud.database()
const collection = db.collection('users')

exports.main = async (event, context) => {
  const { action, ...params } = event
  const { OPENID } = context // 微信用户openid

  try {
    switch (action) {
      case 'wxLogin':
        return await wxLogin(params, context)
      
      case 'getUserInfo':
        return await getUserInfo(OPENID)
      
      case 'updateUserInfo':
        return await updateUserInfo(OPENID, params.userInfo)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('用户服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 微信登录
 */
async function wxLogin(params, context) {
  const { code } = params
  const { OPENID, APPID, UNIONID } = context

  if (!code) {
    return {
      code: -1,
      message: '登录code不能为空'
    }
  }

  try {
    // 查找用户是否存在
    const userRecord = await collection.where({
      openid: OPENID
    }).get()

    let userInfo
    if (userRecord.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        openid: OPENID,
        appid: APPID,
        unionid: UNIONID,
        createTime: new Date(),
        updateTime: new Date(),
        status: 'active',
        balance: 0, // 账户余额
        totalSpent: 0, // 累计消费
        orderCount: 0, // 订单数量
        avatar: '', // 头像
        nickname: '用户' + OPENID.slice(-6), // 昵称
        phone: '', // 手机号
        address: '', // 地址
        level: 'bronze', // 用户等级
        points: 0 // 积分
      }

      const result = await collection.add(newUser)
      userInfo = { ...newUser, _id: result.id }
    } else {
      // 老用户，更新最后登录时间
      userInfo = userRecord.data[0]
      await collection.doc(userInfo._id).update({
        lastLoginTime: new Date(),
        updateTime: new Date()
      })
    }

    // 生成token（这里简单使用openid作为token）
    const token = generateToken(OPENID)

    return {
      code: 0,
      message: '登录成功',
      data: {
        token,
        userInfo
      }
    }
  } catch (error) {
    console.error('微信登录失败:', error)
    return {
      code: -1,
      message: '登录失败'
    }
  }
}

/**
 * 获取用户信息
 */
async function getUserInfo(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    const userRecord = await collection.where({
      openid
    }).get()

    if (userRecord.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    return {
      code: 0,
      message: '获取成功',
      data: userRecord.data[0]
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      code: -1,
      message: '获取用户信息失败'
    }
  }
}

/**
 * 更新用户信息
 */
async function updateUserInfo(openid, userInfo) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 过滤允许更新的字段
    const allowedFields = ['nickname', 'avatar', 'phone', 'address']
    const updateData = {}
    
    allowedFields.forEach(field => {
      if (userInfo[field] !== undefined) {
        updateData[field] = userInfo[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return {
        code: -1,
        message: '没有可更新的字段'
      }
    }

    updateData.updateTime = new Date()

    const result = await collection.where({
      openid
    }).update(updateData)

    if (result.updated === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    // 获取更新后的用户信息
    const userRecord = await collection.where({
      openid
    }).get()

    return {
      code: 0,
      message: '更新成功',
      data: userRecord.data[0]
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      code: -1,
      message: '更新失败'
    }
  }
}

/**
 * 生成简单token
 */
function generateToken(openid) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2)
  return Buffer.from(`${openid}:${timestamp}:${random}`).toString('base64')
}