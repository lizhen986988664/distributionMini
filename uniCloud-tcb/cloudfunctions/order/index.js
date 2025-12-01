const db = uniCloud.database()
const collection = db.collection('orders')

exports.main = async (event, context) => {
  const { action, ...params } = event
  const { OPENID } = context

  try {
    switch (action) {
      case 'create':
        return await createOrder(params, OPENID)
      
      case 'getList':
        return await getOrderList(params, OPENID)
      
      case 'getDetail':
        return await getOrderDetail(params.id, OPENID)
      
      case 'cancel':
        return await cancelOrder(params.id, OPENID)
      
      case 'confirm':
        return await confirmOrder(params.id, OPENID)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('订单服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 创建订单
 */
async function createOrder(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  const {
    items,
    receiverInfo,
    paymentMethod = 'balance',
    couponId,
    remark = ''
  } = params

  if (!items || items.length === 0) {
    return {
      code: -1,
      message: '商品不能为空'
    }
  }

  if (!receiverInfo) {
    return {
      code: -1,
      message: '收货信息不能为空'
    }
  }

  try {
    // 获取用户信息
    const userCollection = db.collection('users')
    const userRecord = await userCollection.where({ openid }).get()
    
    if (userRecord.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    const user = userRecord.data[0]

    // 计算订单金额
    let totalAmount = 0
    let totalQuantity = 0

    for (const item of items) {
      totalAmount += item.price * item.quantity
      totalQuantity += item.quantity
    }

    // 应用优惠券折扣
    let discountAmount = 0
    if (couponId) {
      const couponResult = await applyCoupon(couponId, totalAmount)
      if (couponResult.success) {
        discountAmount = couponResult.discountAmount
      }
    }

    const finalAmount = totalAmount - discountAmount

    // 检查余额是否足够（如果使用余额支付）
    if (paymentMethod === 'balance' && user.balance < finalAmount) {
      return {
        code: -1,
        message: '余额不足'
      }
    }

    // 生成订单号
    const orderNo = generateOrderNo()

    // 创建订单
    const order = {
      orderNo,
      openid,
      items,
      receiverInfo,
      paymentMethod,
      couponId,
      discountAmount,
      totalAmount,
      finalAmount,
      totalQuantity,
      status: 'pending', // 待付款
      remark,
      createTime: new Date(),
      updateTime: new Date()
    }

    const result = await collection.add(order)

    // 如果使用余额支付，直接扣款并更新订单状态
    if (paymentMethod === 'balance') {
      await processBalancePayment(user, finalAmount, orderNo, result.id)
      
      // 更新订单状态为已付款
      await collection.doc(result.id).update({
        status: 'paid',
        paymentTime: new Date(),
        updateTime: new Date()
      })
    }

    // 使用优惠券
    if (couponId && discountAmount > 0) {
      await useCoupon(couponId, result.id)
    }

    // 扣减商品库存
    await updateProductStock(items)

    return {
      code: 0,
      message: '订单创建成功',
      data: {
        ...order,
        _id: result.id
      }
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return {
      code: -1,
      message: '创建订单失败'
    }
  }
}

/**
 * 获取订单列表
 */
async function getOrderList(params = {}, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    const {
      page = 1,
      pageSize = 10,
      status
    } = params

    let query = collection.where({ openid })

    if (status) {
      query = query.where({ status })
    }

    const countResult = await query.count()
    const total = countResult.total

    const listResult = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: listResult.data,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return {
      code: -1,
      message: '获取订单列表失败'
    }
  }
}

/**
 * 获取订单详情
 */
async function getOrderDetail(id, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  if (!id) {
    return {
      code: -1,
      message: '订单ID不能为空'
    }
  }

  try {
    const result = await collection.doc(id).get()

    if (result.data.length === 0) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    const order = result.data[0]

    // 检查订单归属
    if (order.openid !== openid) {
      return {
        code: -1,
        message: '无权限访问此订单'
      }
    }

    return {
      code: 0,
      message: '获取成功',
      data: order
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return {
      code: -1,
      message: '获取订单详情失败'
    }
  }
}

/**
 * 取消订单
 */
async function cancelOrder(id, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  if (!id) {
    return {
      code: -1,
      message: '订单ID不能为空'
    }
  }

  try {
    // 获取订单信息
    const orderResult = await collection.doc(id).get()
    
    if (orderResult.data.length === 0) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    const order = orderResult.data[0]

    // 检查订单归属
    if (order.openid !== openid) {
      return {
        code: -1,
        message: '无权限操作此订单'
      }
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return {
        code: -1,
        message: '只有待付款的订单可以取消'
      }
    }

    // 更新订单状态
    await collection.doc(id).update({
      status: 'cancelled',
      cancelTime: new Date(),
      updateTime: new Date()
    })

    // 恢复商品库存
    await restoreProductStock(order.items)

    // 退还优惠券
    if (order.couponId) {
      await restoreCoupon(order.couponId)
    }

    return {
      code: 0,
      message: '订单已取消'
    }
  } catch (error) {
    console.error('取消订单失败:', error)
    return {
      code: -1,
      message: '取消订单失败'
    }
  }
}

/**
 * 确认收货
 */
async function confirmOrder(id, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  if (!id) {
    return {
      code: -1,
      message: '订单ID不能为空'
    }
  }

  try {
    // 获取订单信息
    const orderResult = await collection.doc(id).get()
    
    if (orderResult.data.length === 0) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    const order = orderResult.data[0]

    // 检查订单归属
    if (order.openid !== openid) {
      return {
        code: -1,
        message: '无权限操作此订单'
      }
    }

    // 检查订单状态
    if (order.status !== 'shipped') {
      return {
        code: -1,
        message: '只有已发货的订单可以确认收货'
      }
    }

    // 更新订单状态
    await collection.doc(id).update({
      status: 'completed',
      completeTime: new Date(),
      updateTime: new Date()
    })

    // 增加用户积分
    const points = Math.floor(order.finalAmount)
    await addUserPoints(openid, points, 'order_complete', '完成订单获得积分')

    return {
      code: 0,
      message: '确认收货成功'
    }
  } catch (error) {
    console.error('确认收货失败:', error)
    return {
      code: -1,
      message: '确认收货失败'
    }
  }
}

/**
 * 生成订单号
 */
function generateOrderNo() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `ORD${timestamp}${random}`
}

/**
 * 处理余额支付
 */
async function processBalancePayment(user, amount, orderNo, orderId) {
  try {
    const newBalance = parseFloat(user.balance || 0) - parseFloat(amount)
    
    // 更新用户余额
    await db.collection('users').doc(user._id).update({
      balance: newBalance,
      updateTime: new Date()
    })

    // 记录余额变动日志
    await db.collection('balance_logs').add({
      openid: user.openid,
      amount: -amount,
      type: 'order_payment',
      description: `订单支付：${orderNo}`,
      balanceBefore: parseFloat(user.balance || 0),
      balanceAfter: newBalance,
      orderId,
      createTime: new Date()
    })

    return true
  } catch (error) {
    console.error('处理余额支付失败:', error)
    throw error
  }
}

/**
 * 应用优惠券
 */
async function applyCoupon(couponId, orderAmount) {
  try {
    const couponCollection = db.collection('coupons')
    const couponRecord = await couponCollection.doc(couponId).get()
    
    if (couponRecord.data.length === 0) {
      return { success: false, message: '优惠券不存在' }
    }

    const coupon = couponRecord.data[0]

    // 检查优惠券是否可用
    if (coupon.status !== 'available') {
      return { success: false, message: '优惠券不可用' }
    }

    if (new Date(coupon.expireTime) < new Date()) {
      return { success: false, message: '优惠券已过期' }
    }

    // 检查使用条件
    if (orderAmount < coupon.minAmount) {
      return { success: false, message: '未达到使用条件' }
    }

    let discountAmount = coupon.amount

    // 如果是折扣券，计算折扣金额
    if (coupon.type === 'discount') {
      discountAmount = orderAmount * (1 - coupon.discount / 100)
      discountAmount = Math.min(discountAmount, coupon.maxDiscount || Infinity)
    }

    return { success: true, discountAmount }
  } catch (error) {
    console.error('应用优惠券失败:', error)
    return { success: false, message: '应用优惠券失败' }
  }
}

/**
 * 使用优惠券
 */
async function useCoupon(couponId, orderId) {
  try {
    await db.collection('coupons').doc(couponId).update({
      status: 'used',
      orderId,
      useTime: new Date(),
      updateTime: new Date()
    })
    return true
  } catch (error) {
    console.error('使用优惠券失败:', error)
    return false
  }
}

/**
 * 更新商品库存
 */
async function updateProductStock(items) {
  try {
    const productCollection = db.collection('products')
    
    for (const item of items) {
      await productCollection.doc(item.id).update({
        stock: db.command.inc(-item.quantity),
        sales: db.command.inc(item.quantity),
        updateTime: new Date()
      })
    }
    return true
  } catch (error) {
    console.error('更新商品库存失败:', error)
    return false
  }
}

/**
 * 恢复商品库存
 */
async function restoreProductStock(items) {
  try {
    const productCollection = db.collection('products')
    
    for (const item of items) {
      await productCollection.doc(item.id).update({
        stock: db.command.inc(item.quantity),
        sales: db.command.inc(-item.quantity),
        updateTime: new Date()
      })
    }
    return true
  } catch (error) {
    console.error('恢复商品库存失败:', error)
    return false
  }
}

/**
 * 恢复优惠券
 */
async function restoreCoupon(couponId) {
  try {
    await db.collection('coupons').doc(couponId).update({
      status: 'available',
      orderId: null,
      useTime: null,
      updateTime: new Date()
    })
    return true
  } catch (error) {
    console.error('恢复优惠券失败:', error)
    return false
  }
}

/**
 * 增加用户积分
 */
async function addUserPoints(openid, points, type, description) {
  try {
    const userCollection = db.collection('users')
    const userRecord = await userCollection.where({ openid }).get()
    
    if (userRecord.data.length === 0) {
      return false
    }

    const user = userRecord.data[0]
    const newPoints = parseInt(user.points || 0) + points

    await userCollection.doc(user._id).update({
      points: newPoints,
      updateTime: new Date()
    })

    // 记录积分变动日志
    await db.collection('points_logs').add({
      openid,
      points,
      type,
      description,
      balanceBefore: parseInt(user.points || 0),
      balanceAfter: newPoints,
      createTime: new Date()
    })

    return true
  } catch (error) {
    console.error('增加用户积分失败:', error)
    return false
  }
}