const db = uniCloud.database()
const starCardCollection = db.collection('star_cards')
const userCollection = db.collection('users')

exports.main = async (event, context) => {
  const { action, ...params } = event
  const { OPENID } = context

  try {
    switch (action) {
      case 'createCard':
        return await createStarCard(params, OPENID)
      
      case 'getMyCards':
        return await getMyCards(OPENID)
      
      case 'shareCard':
        return await shareCard(params.cardId, OPENID)
      
      case 'receiveCard':
        return await receiveCard(params, OPENID)
      
      case 'getStats':
        return await getStarCardStats(OPENID)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('海星卡服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 创建海星卡
 */
async function createStarCard(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 检查用户是否有权限创建海星卡
    const userRecord = await userCollection.where({ openid }).get()
    if (userRecord.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }

    // 检查用户现有的有效海星卡数量
    const activeCardsCount = await starCardCollection
      .where({
        creatorOpenid: openid,
        status: 'active',
        expireTime: db.command.gte(new Date())
      })
      .count()

    if (activeCardsCount.total >= 10) {
      return {
        code: -1,
        message: '最多只能同时拥有10张有效海星卡'
      }
    }

    // 生成分享码
    const shareCode = generateShareCode()
    
    // 设置过期时间（30天后）
    const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const starCard = {
      creatorOpenid: openid,
      creatorId: userRecord.data[0]._id,
      title: params.title || '海星分享卡',
      type: params.type || 'trial',
      rewardAmount: params.rewardAmount || 5.00,
      shareCode,
      status: 'active',
      receiveCount: 0,
      maxReceiveCount: 100, // 最大接收次数
      createTime: new Date(),
      expireTime,
      updateTime: new Date()
    }

    const result = await starCardCollection.add(starCard)

    return {
      code: 0,
      message: '创建成功',
      data: {
        ...starCard,
        _id: result.id
      }
    }
  } catch (error) {
    console.error('创建海星卡失败:', error)
    return {
      code: -1,
      message: '创建海星卡失败'
    }
  }
}

/**
 * 获取我的海星卡
 */
async function getMyCards(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    const result = await starCardCollection
      .where({
        creatorOpenid: openid
      })
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      message: '获取成功',
      data: result.data
    }
  } catch (error) {
    console.error('获取海星卡列表失败:', error)
    return {
      code: -1,
      message: '获取海星卡列表失败'
    }
  }
}

/**
 * 分享海星卡
 */
async function shareCard(cardId, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  if (!cardId) {
    return {
      code: -1,
      message: '卡片ID不能为空'
    }
  }

  try {
    // 验证卡片归属和状态
    const cardRecord = await starCardCollection
      .where({
        _id: cardId,
        creatorOpenid: openid,
        status: 'active'
      })
      .get()

    if (cardRecord.data.length === 0) {
      return {
        code: -1,
        message: '卡片不存在或无权限'
      }
    }

    const card = cardRecord.data[0]

    // 检查是否过期
    if (new Date(card.expireTime) < new Date()) {
      // 更新状态为过期
      await starCardCollection.doc(cardId).update({
        status: 'expired',
        updateTime: new Date()
      })
      
      return {
        code: -1,
        message: '卡片已过期'
      }
    }

    // 检查是否达到最大分享次数
    if (card.receiveCount >= card.maxReceiveCount) {
      // 更新状态为已用完
      await starCardCollection.doc(cardId).update({
        status: 'used',
        updateTime: new Date()
      })
      
      return {
        code: -1,
        message: '卡片已达到最大分享次数'
      }
    }

    // 更新分享次数（这里只是记录分享行为，实际接收时才计数）
    // 可以记录分享日志等

    return {
      code: 0,
      message: '分享成功',
      data: {
        shareCode: card.shareCode,
        shareUrl: `/pages/star-card/receive?shareCode=${card.shareCode}`
      }
    }
  } catch (error) {
    console.error('分享海星卡失败:', error)
    return {
      code: -1,
      message: '分享失败'
    }
  }
}

/**
 * 接收海星卡
 */
async function receiveCard(params, openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  const { shareCode } = params

  if (!shareCode) {
    return {
      code: -1,
      message: '分享码不能为空'
    }
  }

  try {
    // 查找对应的海星卡
    const cardRecord = await starCardCollection
      .where({
        shareCode,
        status: 'active'
      })
      .get()

    if (cardRecord.data.length === 0) {
      return {
        code: -1,
        message: '分享码无效或卡片不存在'
      }
    }

    const card = cardRecord.data[0]

    // 检查是否过期
    if (new Date(card.expireTime) < new Date()) {
      return {
        code: -1,
        message: '卡片已过期'
      }
    }

    // 检查是否达到最大接收次数
    if (card.receiveCount >= card.maxReceiveCount) {
      return {
        code: -1,
        message: '卡片已被领完'
      }
    }

    // 检查是否是自己创建的卡片
    if (card.creatorOpenid === openid) {
      return {
        code: -1,
        message: '不能接收自己创建的卡片'
      }
    }

    // 检查是否已经接收过
    const receiveRecordCollection = db.collection('star_card_receives')
    const existingReceive = await receiveRecordCollection
      .where({
        cardId: card._id,
        receiverOpenid: openid
      })
      .get()

    if (existingReceive.data.length > 0) {
      return {
        code: -1,
        message: '您已经接收过这张卡片'
      }
    }

    // 创建接收记录
    await receiveRecordCollection.add({
      cardId: card._id,
      cardShareCode: shareCode,
      creatorOpenid: card.creatorOpenid,
      receiverOpenid: openid,
      receiveTime: new Date(),
      rewardAmount: card.rewardAmount,
      status: 'pending' // 待处理状态
    })

    // 更新卡片接收次数
    await starCardCollection.doc(card._id).update({
      receiveCount: card.receiveCount + 1,
      updateTime: new Date()
    })

    // 发放奖励给接收者
    await updateUserBalance(openid, card.rewardAmount, 'receive_star_card', `接收海星卡奖励`)

    // 发放奖励给创建者
    await updateUserBalance(card.creatorOpenid, card.rewardAmount, 'share_star_card', `海星卡分享奖励`)

    // 更新接收记录状态
    await receiveRecordCollection
      .where({
        cardId: card._id,
        receiverOpenid: openid
      })
      .update({
        status: 'completed',
        processTime: new Date()
      })

    return {
      code: 0,
      message: '接收成功',
      data: {
        rewardAmount: card.rewardAmount,
        cardTitle: card.title
      }
    }
  } catch (error) {
    console.error('接收海星卡失败:', error)
    return {
      code: -1,
      message: '接收失败'
    }
  }
}

/**
 * 获取海星卡统计
 */
async function getStarCardStats(openid) {
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    }
  }

  try {
    // 获取我创建的卡片统计
    const myCardsResult = await starCardCollection
      .where({
        creatorOpenid: openid
      })
      .get()

    const myCards = myCardsResult.data

    // 获取我接收的记录
    const receiveRecordCollection = db.collection('star_card_receives')
    const myReceivesResult = await receiveRecordCollection
      .where({
        receiverOpenid: openid,
        status: 'completed'
      })
      .get()

    const myReceives = myReceivesResult.data

    // 计算统计数据
    const totalShared = myCards.length
    const totalReceived = myReceives.length
    const totalReward = myReceives.reduce((sum, receive) => sum + receive.rewardAmount, 0)

    return {
      code: 0,
      message: '获取成功',
      data: {
        totalShared,
        totalReceived,
        totalReward: parseFloat(totalReward.toFixed(2))
      }
    }
  } catch (error) {
    console.error('获取海星卡统计失败:', error)
    return {
      code: -1,
      message: '获取统计数据失败'
    }
  }
}

/**
 * 生成分享码
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 更新用户余额
 */
async function updateUserBalance(openid, amount, type, description) {
  try {
    const userRecord = await userCollection.where({ openid }).get()
    if (userRecord.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userRecord.data[0]
    const newBalance = parseFloat(user.balance || 0) + parseFloat(amount)

    await userCollection.doc(user._id).update({
      balance: newBalance,
      updateTime: new Date()
    })

    // 记录余额变动日志
    const balanceLogCollection = db.collection('balance_logs')
    await balanceLogCollection.add({
      openid,
      amount,
      type,
      description,
      balanceBefore: parseFloat(user.balance || 0),
      balanceAfter: newBalance,
      createTime: new Date()
    })

    return true
  } catch (error) {
    console.error('更新用户余额失败:', error)
    throw error
  }
}