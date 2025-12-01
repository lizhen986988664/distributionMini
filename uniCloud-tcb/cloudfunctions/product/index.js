const db = uniCloud.database()
const collection = db.collection('products')

exports.main = async (event, context) => {
  const { action, ...params } = event

  try {
    switch (action) {
      case 'getList':
        return await getProductList(params)
      
      case 'getDetail':
        return await getProductDetail(params.id)
      
      case 'search':
        return await searchProducts(params.keyword)
      
      case 'create':
        return await createProduct(params)
      
      case 'update':
        return await updateProduct(params)
      
      case 'delete':
        return await deleteProduct(params.id)
      
      default:
        return {
          code: -1,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('商品服务错误:', error)
    return {
      code: -1,
      message: error.message || '操作失败'
    }
  }
}

/**
 * 获取商品列表
 */
async function getProductList(params = {}) {
  try {
    const {
      page = 1,
      pageSize = 10,
      category,
      isPromotion,
      sortBy = 'createTime',
      sortOrder = 'desc'
    } = params

    // 构建查询条件
    let query = collection.where({
      status: 'active'
    })

    // 分类筛选
    if (category) {
      query = query.where({
        category
      })
    }

    // 促销筛选
    if (isPromotion) {
      query = query.where({
        isPromotion: true
      })
    }

    // 排序
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    // 执行查询
    const countResult = await query.count()
    const total = countResult.total

    const listResult = await query
      .orderBy(orderBy)
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
    console.error('获取商品列表失败:', error)
    return {
      code: -1,
      message: '获取商品列表失败'
    }
  }
}

/**
 * 获取商品详情
 */
async function getProductDetail(id) {
  if (!id) {
    return {
      code: -1,
      message: '商品ID不能为空'
    }
  }

  try {
    const result = await collection.doc(id).get()

    if (result.data.length === 0) {
      return {
        code: -1,
        message: '商品不存在'
      }
    }

    const product = result.data[0]

    // 检查商品状态
    if (product.status !== 'active') {
      return {
        code: -1,
        message: '商品已下架'
      }
    }

    return {
      code: 0,
      message: '获取成功',
      data: product
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    return {
      code: -1,
      message: '获取商品详情失败'
    }
  }
}

/**
 * 搜索商品
 */
async function searchProducts(keyword) {
  if (!keyword) {
    return {
      code: -1,
      message: '搜索关键词不能为空'
    }
  }

  try {
    const result = await collection
      .where({
        status: 'active',
        $or: [
          {
            name: new RegExp(keyword, 'i')
          },
          {
            description: new RegExp(keyword, 'i')
          },
          {
            tags: new RegExp(keyword, 'i')
          }
        ]
      })
      .orderBy('sales', 'desc')
      .limit(20)
      .get()

    return {
      code: 0,
      message: '搜索成功',
      data: result.data
    }
  } catch (error) {
    console.error('搜索商品失败:', error)
    return {
      code: -1,
      message: '搜索失败'
    }
  }
}

/**
 * 创建商品（管理员功能）
 */
async function createProduct(params) {
  try {
    const product = {
      name: params.name,
      description: params.description,
      category: params.category,
      price: params.price,
      originalPrice: params.originalPrice || params.price,
      stock: params.stock || 999,
      sales: 0,
      images: params.images || [],
      detailHtml: params.detailHtml || '',
      attributes: params.attributes || {},
      tags: params.tags || [],
      isPromotion: params.isPromotion || false,
      promotionPrice: params.promotionPrice,
      status: 'active',
      createTime: new Date(),
      updateTime: new Date()
    }

    const result = await collection.add(product)

    return {
      code: 0,
      message: '创建成功',
      data: {
        ...product,
        _id: result.id
      }
    }
  } catch (error) {
    console.error('创建商品失败:', error)
    return {
      code: -1,
      message: '创建商品失败'
    }
  }
}

/**
 * 更新商品（管理员功能）
 */
async function updateProduct(params) {
  const { id, ...updateData } = params

  if (!id) {
    return {
      code: -1,
      message: '商品ID不能为空'
    }
  }

  try {
    updateData.updateTime = new Date()

    const result = await collection.doc(id).update(updateData)

    if (result.updated === 0) {
      return {
        code: -1,
        message: '商品不存在'
      }
    }

    // 获取更新后的商品信息
    const updatedResult = await collection.doc(id).get()

    return {
      code: 0,
      message: '更新成功',
      data: updatedResult.data[0]
    }
  } catch (error) {
    console.error('更新商品失败:', error)
    return {
      code: -1,
      message: '更新商品失败'
    }
  }
}

/**
 * 删除商品（管理员功能）
 */
async function deleteProduct(id) {
  if (!id) {
    return {
      code: -1,
      message: '商品ID不能为空'
    }
  }

  try {
    // 软删除：更新状态为deleted
    const result = await collection.doc(id).update({
      status: 'deleted',
      updateTime: new Date()
    })

    if (result.updated === 0) {
      return {
        code: -1,
        message: '商品不存在'
      }
    }

    return {
      code: 0,
      message: '删除成功'
    }
  } catch (error) {
    console.error('删除商品失败:', error)
    return {
      code: -1,
      message: '删除商品失败'
    }
  }
}