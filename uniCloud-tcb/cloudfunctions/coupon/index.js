const db = uniCloud.database()
const collection = db.collection('coupons')

exports.main = async (event, context) => {
  const { action, ...params } = event
  const { OPENID } = context

  try {
    switch (action) {
      case 'receive':
        return await receiveCoupon(params, OPENID)
      
      case 'getUserCoupons':
        return await getUserCoupons(OPENID)
      
      case 'getAvailableCoupons':
        return await getAvailableCoupons(params, OPENID)
      
      case 'useCoupon':
        return await useCoupon(params, OPENID)
      
      case 'createCoupon':
        return await createCoupon(params)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('优惠券服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 领取优惠券
 */
async function receiveCoupon(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  const { couponId } = params

  if (!couponId) {
    return {
      code: -1,
      message: '优惠券ID不能为空'
    }
  }

  try {
    // 获取优惠券信息
    const couponRecord = await collection.doc(couponId).get()
    
    if (couponRecord.data.length === 0) {
      return {
        code: -1,
        message: '优惠券不存在'
      }
    }

    const coupon = couponRecord.data[0]

    // 检查优惠券状态
    if (coupon.status !== 'available') {
      return {
        code: -1,
        message: '优惠券不可领取'
      }
    }

    // 检查库存
    if (coupon.stock <= 0) {
      return {
        code: -1,
        message: '优惠券已领完'
      }
    }

    // 检查领取时间
    if (coupon.receiveStartTime && new Date(coupon.receiveStartTime) > new Date()) {
      return {
        code: -1,
        message: '领取时间未开始'
      }
    }

    if (coupon.receiveEndTime && new Date(coupon.receiveEndTime) < new Date()) {
      return {
        code: -1,
        message: '领取时间已结束'
      }
    }

    // 检查用户是否已领取
    if (coupon.limitPerUser && coupon.limitPerUser > 0) {
      const userReceiveCount = await db.collection('user_coupons')
        .where({
          openid,
          couponId,
          status: 'received'
        })
        .count()

      if (userReceiveCount.total >= coupon.limitPerUser) {
        return {
          code: -1,
          message: '已达到领取上限'
        }
      }
    }

    // 创建用户优惠券记录
    const userCoupon = {
      openid,
      couponId,
      name: coupon.name,
      description: coupon.description,
      amount: coupon.amount,
      type: coupon.type,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      discount: coupon.discount,
      validDays: coupon.validDays,
      expireTime: new Date(Date.now() + (coupon.validDays || 30) * 24 * 60 * 60 * 1000),
      status: 'received',
      receiveTime: new Date(),
      createTime: new Date()
    }

    const userCouponResult = await db.collection('user_coupons').add(userCoupon)

    // 更新优惠券库存
    await collection.doc(couponId).update({
      stock: db.command.inc(-1),
      updateTime: new Date()
    })

    return {
      code: 0,
      message: '领取成功',
      data: {
        ...userCoupon,
        _id: userCouponResult.id
      }
    }
  } catch (error) {
    console.error('领取优惠券失败:', error)
    return {
      code: -1,
      message: '领取失败'
    }
  }
}

/**
 * 获取用户优惠券
 */
async function getUserCoupons(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    const result = await db.collection('user_coupons')
      .where({
        openid
      })
      .orderBy('receiveTime', 'desc')
      .get()

    return {
      code: 0,
      message: '获取成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取用户优惠券失败:', error)
    return {
      code: -1,
      message: '获取失败'
    }
  }
}

/**
 * 获取可用优惠券
 */
async function getAvailableCoupons(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  const { orderAmount } = params

  try {
    let query = db.collection('user_coupons')
      .where({
        openid,
        status: 'received'
      })

    // 如果有订单金额，筛选可用优惠券
    if (orderAmount) {
      query = query.where({
        minAmount: db.command.lte(parseFloat(orderAmount)),
        expireTime: db.command.gte(new Date())
      })
    } else {
      query = query.where({
        expireTime: db.command.gte(new Date())
      })
    }

    const result = await query.orderBy('expireTime', 'asc').get()

    return {
      code: 0,
      message: '获取成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取可用优惠券失败:', error)
    return {
      code: -1,
      message: '获取失败'
    }
  }
}

/**
 * 使用优惠券
 */
async function useCoupon(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  const { userCouponId, orderId } = params

  if (!userCouponId) {
    return {
      code: -1,
      message: '用户优惠券ID不能为空'
    }
  }

  try {
    // 获取用户优惠券信息
    const userCouponRecord = await db.collection('user_coupons')
      .where({
        _id: userCouponId,
        openid
      })
      .get()

    if (userCouponRecord.data.length === 0) {
      return {
        code: -1,
        message: '优惠券不存在'
      }
    }

    const userCoupon = userCouponRecord.data[0]

    // 检查优惠券状态
    if (userCoupon.status !== 'received') {
      return {
        code: -1,
        message: '优惠券不可用'
      }
    }

    // 检查是否过期
    if (new Date(userCoupon.expireTime) < new Date()) {
      return {
        code: -1,
        message: '优惠券已过期'
      }
    }

    // 更新优惠券状态
    await db.collection('user_coupons').doc(userCouponId).update({
      status: 'used',
      orderId: orderId,
      useTime: new Date(),
      updateTime: new Date()
    })

    return {
      code: 0,
      message: '使用成功'
    }
  } catch (error) {
    console.error('使用优惠券失败:', error)
    return {
      code: -1,
      message: '使用失败'
    }
  }
}

/**
 * 创建优惠券（管理员功能）
 */
async function createCoupon(params) {
  try {
    const {
      name,
      description,
      type = 'fixed', // fixed: 固定金额, discount: 折扣
      amount,
      minAmount = 0,
      maxDiscount,
      discount,
      validDays = 30,
      stock,
      limitPerUser = 1,
      receiveStartTime,
      receiveEndTime,
      status = 'available'
    } = params

    // 参数验证
    if (!name || !description) {
      return {
        code: -1,
        message: '优惠券名称和描述不能为空'
      }
    }

    if (type === 'fixed' && (!amount || isNaN(amount) || amount <= 0)) {
      return {
        code: -1,
        message: '优惠金额必须大于0'
      }
    }

    if (type === 'discount' && (!discount || isNaN(discount) || discount <= 0 || discount > 10)) {
      return {
        code: -1,
        message: '折扣必须在0-10之间'
      }
    }

    const coupon = {
      name,
      description,
      type,
      amount: type === 'fixed' ? parseFloat(amount) : 0,
      minAmount: parseFloat(minAmount),
      maxDiscount: type === 'discount' ? parseFloat(maxDiscount || amount) : 0,
      discount: type === 'discount' ? parseFloat(discount) : 0,
      validDays: parseInt(validDays),
      stock: parseInt(stock || 999),
      limitPerUser: parseInt(limitPerUser),
      receiveStartTime: receiveStartTime ? new Date(receiveStartTime) : null,
      receiveEndTime: receiveEndTime ? new Date(receiveEndTime) : null,
      status,
      createTime: new Date(),
      updateTime: new Date()
    }

    const result = await collection.add(coupon)

    return {
      code: 0,
      message: '创建成功',
      data: {
        ...coupon,
        _id: result.id
      }
    }
  } catch (error) {
    console.error('创建优惠券失败:', error)
    return {
      code: -1,
      message: '创建失败'
    }
  }
}